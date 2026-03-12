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

	Velocity            [3]float32 `json:"-"`
	AccG                [3]float32 `json:"-"`
	WheelSlip           [4]float32 `json:"-"`
	WheelLoad           [4]float32 `json:"-"`
	WheelsPressure      [4]float32 `json:"-"`
	WheelAngularSpeed   [4]float32 `json:"-"`
	TyreWear            [4]float32 `json:"-"`
	TyreDirtyLevel      [4]float32 `json:"-"`
	TyreCoreTemperature [4]float32 `json:"-"`
	CamberRad           [4]float32 `json:"-"`
	SuspensionTravel    [4]float32 `json:"-"`
	Drs                 float32    `json:"-"`
	Tc                  float32    `json:"-"`
	Heading             float32    `json:"-"`
	Pitch               float32    `json:"pitch"`
	Roll                float32    `json:"roll"`
	CgHeight            float32    `json:"cgHeight"`
	CarDamage           [5]float32 `json:"-"`
	NumberOfTyresOut    int32      `json:"-"`
	PitLimiterOn        int32      `json:"-"`
	Abs                 float32    `json:"-"`
	KersCharge          float32    `json:"-"`
	KersInput           float32    `json:"-"`
	AutoShifterOn       int32      `json:"-"`
	RideHeight          [2]float32 `json:"-"`

	// this field will read the next physics value from memory,
	// but we overwrite it with the actual lap time from graphics memory
	CurrentLapTime float32 `json:"currentLapTime"`
	Lap            int32   `json:"lap"`
	Sector         int32   `json:"sector"`
	SectorTime     int32   `json:"sectorTime"`

	CurrentPosition int32 `json:"currentPosition"`

	SuspensionFL float32 `json:"suspensionFL"`
	SuspensionFR float32 `json:"suspensionFR"`
	SuspensionRL float32 `json:"suspensionRL"`
	SuspensionRR float32 `json:"suspensionRR"`

	WheelLoadFL float32 `json:"wheelLoadFL"`
	WheelLoadFR float32 `json:"wheelLoadFR"`
	WheelLoadRL float32 `json:"wheelLoadRL"`
	WheelLoadRR float32 `json:"wheelLoadRR"`

	RideHeightFront float32 `json:"rideHeightFront"`
	RideHeightRear  float32 `json:"rideHeightRear"`
	RideHeightAvg   float32 `json:"rideHeightAvg"`

	ChassisHeave      float32 `json:"chassisHeave"`
	ChassisPitch      float32 `json:"chassisPitch"`
	ChassisRoll       float32 `json:"chassisRoll"`
	ChassisYaw        float32 `json:"chassisYaw"`
	SuspensionBalance float32 `json:"suspensionBalance"`
}

type SPageFileGraphics struct {
	PacketId           int32
	Status             int32
	Session            int32
	CurrentTime        [15]uint16
	LastTime           [15]uint16
	BestTime           [15]uint16
	Split              [15]uint16
	CompletedLaps      int32
	Position           int32
	CurrentTimeInt     int32
	LastTimeInt        int32
	BestTimeInt        int32
	SessionTimeLeft    float32
	DistanceTraveled   float32
	IsInPit            int32
	CurrentSectorIndex int32
	LastSectorTime     int32
}
