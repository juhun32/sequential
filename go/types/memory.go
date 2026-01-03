package types

// IMPORTANT: struct MUST match the AC memory map exactly
type SPageFilePhysics struct {
	PacketId   int32
	Gas        float32
	Brake      float32
	Fuel       float32
	Gear       int32
	Rpms       int32
	SteerAngle float32
	SpeedKmh   float32
	// and much more but we only need these for now
}

type SPageFileGraphics struct {
	PacketId      int32
	Status        int32
	Session       int32
	CurrentTime   [15]uint16
	LastTime      [15]uint16
	BestTime      [15]uint16
	Split         [15]uint16
	CompletedLaps int32
}
