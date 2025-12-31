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

func main() {
	handle, err := openFileMapping(windows.FILE_MAP_READ, false, "Local\\acpmf_physics")
	if err != nil {
		log.Fatal("memory map not found.")
	}
	defer windows.CloseHandle(handle)

	ptr, _ := windows.MapViewOfFile(handle, windows.FILE_MAP_READ, 0, 0, 0)
	defer windows.UnmapViewOfFile(ptr)

	// direct cast to the struct pointer so we can read fields directly
	physicsData := (*types.SPageFilePhysics)(unsafe.Pointer(ptr))
	// NOTE: this is the standard pattern for memory mapped files,
	// even if go vet warns about uintptr conversion.
	// the memory is managed by the OS, not the Go GC, therefore is "pinned" and it won't move.

	batch := make([]types.SPageFilePhysics, 0)
	ticker := time.NewTicker(100 * time.Millisecond)

	// track the last packet ID to detect stale data
	// shared memory keeps updating even when the game is paused or closed
	// we need a way to avoid sending duplicate frames
	// so we use the PacketId field which increments with each new frame
	// this way we only send new data
	var lastPacketId int32 = -1

	for range ticker.C {
		// direct memory access
		// significantly faster than binary.Read
		data := *physicsData

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

			go sendToCloud(batch)
			batch = nil
		}
	}
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
	fmt.Printf("	== Speed:    		%.1f km/h\n", d.SpeedKmh)
	fmt.Printf("	== RPM:      		%d\n", d.Rpms)
	fmt.Printf("	== Gear:     		%d (R:-1, N:0)\n", (d.Gear - 1))
	fmt.Printf("	== Pedals:   		G:%.3f / B:%.3f\n", d.Gas, d.Brake)
	fmt.Printf("	== Steer Angle: 	%.2f\n\n", d.SteerAngle)
}

func sendToCloud(data []types.SPageFilePhysics) {
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
	url := "http://localhost:5000/ingest?session_id=live_session_1"
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
