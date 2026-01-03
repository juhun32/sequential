package types

type TelemetryPayload struct {
	SessionID string
	Lap       int32
	Data      []SPageFilePhysics
}
