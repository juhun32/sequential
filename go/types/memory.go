package types

// IMPORTANT: struct MUST match the AC memory map exactly
type SPageFilePhysics struct {
	PacketId   int32   `json:"packetId"`
	Gas        float32 `json:"gas"`
	Brake      float32 `json:"brake"`
	Fuel       float32 `json:"fuel"`
	Gear       int32   `json:"gear"`
	Rpms       int32   `json:"rpms"`
	SteerAngle float32 `json:"steerAngle"`
	SpeedKmh   float32 `json:"speedKmh"`

	// this field will read the next physics value from memory,
	// but we overwrite it with the actual lap time from graphics memory
	CurrentLapTime  float32 `json:"currentLapTime"`
	CurrentPosition int32   `json:"currentPosition"`
}

type SPageFileGraphics struct {
	PacketId        int32
	Status          int32
	Session         int32
	CurrentTime     [15]uint16
	LastTime        [15]uint16
	BestTime        [15]uint16
	Split           [15]uint16
	CompletedLaps   int32
	Position        int32
	CurrentTimeInt  int32
	LastTimeInt     int32
	BestTimeInt     int32
	SessionTimeLeft float32
}
