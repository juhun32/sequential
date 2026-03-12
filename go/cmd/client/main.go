package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"

	"cmd/types"
)

var (
	modkernel32          = windows.NewLazySystemDLL("kernel32.dll")
	procOpenFileMappingW = modkernel32.NewProc("OpenFileMappingW")
)

const (
	assettoSharedInfoInterval = 3000 * time.Millisecond
	assettoGraphicsInterval   = 10000 * time.Millisecond
	assettoPhysicsInterval    = 10 * time.Millisecond
)

func main() {
	// Watch for manual reset
	resetChan := make(chan struct{})
	go func() {
		fmt.Println("FTrace Client Running.")
		fmt.Println("Press [ENTER] at any time to force a memory access reset.")
		for {
			var input string
			fmt.Scanln(&input)
			resetChan <- struct{}{}
		}
	}()

	for {
		err := traceSession(resetChan)
		if err != nil {
			log.Printf("Trace session ended: %v", err)
		}
		log.Println("Re-initializing memory map in 1 second...")
		time.Sleep(1 * time.Second)
	}
}

func traceSession(resetChan <-chan struct{}) error {
	handle, err := openFileMapping(windows.FILE_MAP_READ, false, "Local\\acpmf_physics")
	if err != nil {
		return fmt.Errorf("physics memory map not found: %w", err)
	}
	defer windows.CloseHandle(handle)

	ptr, _ := windows.MapViewOfFile(handle, windows.FILE_MAP_READ, 0, 0, 0)
	defer windows.UnmapViewOfFile(ptr)

	// graphics memory map for lap data
	handleGraphics, err := openFileMapping(windows.FILE_MAP_READ, false, "Local\\acpmf_graphics")
	if err != nil {
		return fmt.Errorf("graphics memory map not found: %w", err)
	}
	defer windows.CloseHandle(handleGraphics)

	ptrGraphics, _ := windows.MapViewOfFile(handleGraphics, windows.FILE_MAP_READ, 0, 0, 0)
	defer windows.UnmapViewOfFile(ptrGraphics)

	// direct cast to the struct pointer so we can read fields directly
	physicsData := (*types.SPageFilePhysics)(unsafe.Pointer(ptr))
	graphicsData := (*types.SPageFileGraphics)(unsafe.Pointer(ptrGraphics))

	// NOTE: this is the standard pattern for memory mapped files,
	// even if go vet warns about uintptr conversion.
	// the memory is managed by the OS, not the Go GC, therefore is "pinned" and it won't move.

	batch := make([]types.SPageFilePhysics, 0, 64)
	ticker := time.NewTicker(assettoPhysicsInterval)
	defer ticker.Stop()

	// track the last packet ID to detect stale data
	// shared memory keeps updating even when the game is paused or closed
	// we need a way to avoid sending duplicate frames
	// so we use the PacketId field which increments with each new frame
	// this way we only send new data
	var lastPacketId int32 = -1

	// init current laps to avoid triggering on startup
	var lastCompletedLaps int32 = graphicsData.CompletedLaps
	var lastSectorIdx int32 = graphicsData.CurrentSectorIndex
	if lastSectorIdx < 0 {
		lastSectorIdx = 0
	}
	var sectorStartLapTime int32 = graphicsData.CurrentTimeInt

	var lastSharedInfoLog time.Time
	var lastGraphicsLog time.Time

	if physicsData.PacketId > 0 {
		log.Printf("connected. current session laps: %d", lastCompletedLaps)
	}

	for {
		select {
		case <-resetChan:
			return fmt.Errorf("manual reset requested")
		case <-ticker.C:
			// direct memory access
			data := *physicsData
			gData := *graphicsData

			now := time.Now()
			if now.Sub(lastSharedInfoLog) >= assettoSharedInfoInterval {
				log.Printf("ac shared info tick: lap=%d", gData.CompletedLaps)
				lastSharedInfoLog = now
			}
			if now.Sub(lastGraphicsLog) >= assettoGraphicsInterval {
				log.Printf("ac graphics tick: lap=%d sector=%d lapTime=%dms", gData.CompletedLaps, gData.CurrentSectorIndex+1, gData.CurrentTimeInt)
				lastGraphicsLog = now
			}

			// detect session reset (lap count dropped)
			// so this happens when you restart the session or change track
			if gData.CompletedLaps < lastCompletedLaps {
				log.Printf("session reset detected: resetting batch")
				lastCompletedLaps = gData.CompletedLaps
				lastSectorIdx = gData.CurrentSectorIndex
				if lastSectorIdx < 0 {
					lastSectorIdx = 0
				}
				sectorStartLapTime = gData.CurrentTimeInt
				batch = nil
				lastPacketId = -1
			}

			// check for lap completion
			if gData.CompletedLaps > lastCompletedLaps {
				log.Printf("lap completed - lap count: %d", gData.CompletedLaps)

				// send current batch on lap finish; belongs to previous lap
				if len(batch) > 0 {
					go sendToCloud(batch, lastCompletedLaps)
					batch = nil
				}

				lastCompletedLaps = gData.CompletedLaps
				lastSectorIdx = gData.CurrentSectorIndex
				if lastSectorIdx < 0 {
					lastSectorIdx = 0
				}
				sectorStartLapTime = gData.CurrentTimeInt
			}

			data.CurrentLapTime = float32(gData.CurrentTimeInt)
			data.Lap = lastCompletedLaps
			data.CurrentPosition = gData.Position

			currentSectorIdx := gData.CurrentSectorIndex
			if currentSectorIdx < 0 {
				currentSectorIdx = 0
			}

			if currentSectorIdx != lastSectorIdx || gData.CurrentTimeInt < sectorStartLapTime {
				sectorStartLapTime = gData.CurrentTimeInt
				lastSectorIdx = currentSectorIdx
			}

			sectorNum := currentSectorIdx + 1
			if sectorNum < 1 {
				sectorNum = 1
			}
			if sectorNum > 3 {
				sectorNum = 3
			}

			data.Sector = sectorNum
			data.SectorTime = gData.CurrentTimeInt - sectorStartLapTime
			if data.SectorTime < 0 {
				data.SectorTime = 0
			}

			fillChassisMovement(&data)

			// if the packet ID hasnt changed, the game is likely paused or closed.
			// we shouldn't send duplicate frames.
			if data.PacketId == lastPacketId {
				continue
			}
			lastPacketId = data.PacketId

			batch = append(batch, data)

			if len(batch) >= 20 {
				// logging: check the last frame of the batch
				logPhysics(batch[len(batch)-1])

				go sendToCloud(batch, lastCompletedLaps)
				batch = nil
			}
		}
	}
}

func fillChassisMovement(data *types.SPageFilePhysics) {
	data.SuspensionFL = data.SuspensionTravel[0]
	data.SuspensionFR = data.SuspensionTravel[1]
	data.SuspensionRL = data.SuspensionTravel[2]
	data.SuspensionRR = data.SuspensionTravel[3]

	data.WheelLoadFL = data.WheelLoad[0]
	data.WheelLoadFR = data.WheelLoad[1]
	data.WheelLoadRL = data.WheelLoad[2]
	data.WheelLoadRR = data.WheelLoad[3]

	data.RideHeightFront = data.RideHeight[0]
	data.RideHeightRear = data.RideHeight[1]
	data.RideHeightAvg = (data.RideHeightFront + data.RideHeightRear) / 2

	data.ChassisHeave = (data.RideHeightFront + data.RideHeightRear) / 2
	data.ChassisPitch = data.RideHeightRear - data.RideHeightFront
	data.ChassisYaw = data.Heading

	leftTravel := (data.SuspensionFL + data.SuspensionRL) / 2
	rightTravel := (data.SuspensionFR + data.SuspensionRR) / 2
	frontTravel := (data.SuspensionFL + data.SuspensionFR) / 2
	rearTravel := (data.SuspensionRL + data.SuspensionRR) / 2

	data.ChassisRoll = rightTravel - leftTravel
	data.SuspensionBalance = frontTravel - rearTravel
}

// wraps the Windows API OpenFileMappingW function
// to obtain a handle to a named file mapping object
// thus allowing access to shared memory
// in this case we are accessing "Local\acpmf_physics"
// which is Assetto Corsa's shared memory segment for physics data
func openFileMapping(desiredAccess uint32, inheritHandle bool, name string) (windows.Handle, error) {
	namePtr, err := windows.UTF16PtrFromString(name)
	if err != nil {
		return 0, err
	}
	var inherit uintptr
	if inheritHandle {
		inherit = 1
	}
	r0, _, e1 := procOpenFileMappingW.Call(
		uintptr(desiredAccess),
		inherit,
		uintptr(unsafe.Pointer(namePtr)),
	)
	if r0 == 0 {
		return 0, e1
	}
	return windows.Handle(r0), nil
}

func logPhysics(d types.SPageFilePhysics) {
	fmt.Printf("\n[BATCH SYNC @ %s]\n", time.Now().Format("15:04:05"))
	fmt.Printf("	== PacketID: 		%d\n", d.PacketId)
	fmt.Printf("	== Lap:      		%d\n", d.Lap)
	fmt.Printf("	== Sector:   		%d (%d ms)\n", d.Sector, d.SectorTime)
	fmt.Printf("	== Lap Time: 		%.0f ms\n", d.CurrentLapTime)
	fmt.Printf("	== Speed:    		%.1f km/h\n", d.SpeedKmh)
	fmt.Printf("	== RPM:      		%d\n", d.Rpms)
	fmt.Printf("	== Gear:     		%d (R:-1, N:0)\n", (d.Gear - 1))
	fmt.Printf("	== Pedals:   		G:%.3f / B:%.3f\n", d.Gas, d.Brake)
	fmt.Printf("	== Steer Angle: 	%.2f\n", d.SteerAngle)
	fmt.Printf("	== Chassis:  		Pitch %.4f | Roll %.4f | Yaw %.4f\n", d.ChassisPitch, d.ChassisRoll, d.ChassisYaw)
	fmt.Printf("	== RideHeight:		Front %.4f | Rear %.4f | Avg %.4f\n", d.RideHeightFront, d.RideHeightRear, d.RideHeightAvg)
	fmt.Printf("	== Position: 		%d\n\n", d.CurrentPosition)
}

func sendToCloud(data interface{}, lap int32) {
	// marshal the batch to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling data: %v", err)
		return
	}

	// create the POST request
	// adding a session_id query param so the server can group these records
	// might use something from assetto like track name or a hash later
	// for now using a static value (live_session_1)
	url := fmt.Sprintf("http://localhost:5000/ingest?session_id=live_session_1&lap=%d", lap)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// send with a short timeout to prevent hanging if the server is down
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to send batch: %v", err)
		return
	}
	defer resp.Body.Close()

	// check response
	if resp.StatusCode != http.StatusOK {
		log.Printf("Server returned error: %s", resp.Status)
	}
}
