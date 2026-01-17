package websocket

import (
	"log"
	"strings"

	"cmd/internal/database"
	"cmd/types"

	"github.com/gorilla/websocket"
)

func NewHub(store database.Store) *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan types.TelemetryPayload),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		dbQueue:    make(chan types.TelemetryPayload, 100),
		store:      store,
	}
}

func (h *Hub) Run() {
	// init database worker
	go h.databaseWorker()

	// local buffer to aggregate frames before hitting the DB channel
	// this reduces pressure on the DB write path and is much cheaper
	// so instead of writing every frame individually, we batch them then flush

	// using a local variable here to keep state isolated to this goroutine
	var (
		buffer    []types.SPageFilePhysics
		sessionID string
	)

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Println("new dashboard connected")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()
			log.Println("dashboard disconnected")

		case payload := <-h.broadcast:
			// braodcast path: live to dashboards
			h.mu.RLock()

			// we cannot delete from the map while iterating with
			// only a read lock concurrently, or even a write lock safely if we modify while ranging.
			// pattern is to iterate and collect dead connections.
			var deadClients []*websocket.Conn

			for client := range h.clients {
				err := client.WriteJSON(payload)
				if err != nil {
					// filter out normal close errors & the windows specific "wsasend" error
					// which happens when the client closes the connection abruptly
					// like browser refresh/crash
					isExpectedError := websocket.IsCloseError(err,
						websocket.CloseGoingAway,
						websocket.CloseNormalClosure,
						websocket.CloseAbnormalClosure) ||
						strings.Contains(err.Error(), "wsasend") ||
						strings.Contains(err.Error(), "connection was aborted")

					if !isExpectedError {
						log.Printf("websocket write error: %v", err)
					}
					deadClients = append(deadClients, client)
				}
			}
			h.mu.RUnlock()

			// clean up dead clients outside the RLock
			if len(deadClients) > 0 {
				h.mu.Lock()
				for _, client := range deadClients {
					if _, ok := h.clients[client]; ok {
						client.Close()
						delete(h.clients, client)
					}
				}
				h.mu.Unlock()
			}

			// db queue path: persistence, analytics path
			// buffer: aggregate frames to reduce DB pressure

			// handle session switching, flush if ID changes
			if sessionID != "" && sessionID != payload.SessionID {
				if len(buffer) > 0 {
					h.flushToDB(sessionID, buffer)
					buffer = nil
				}
			}
			sessionID = payload.SessionID

			// then append to buffer
			buffer = append(buffer, payload.Data...)

			// flush if threshold reached which hardcoded to 1000 frames
			// TODO: make this flush every lap or time interval instead
			if len(buffer) >= 1000 {
				h.flushToDB(sessionID, buffer)
				buffer = nil
			}
		}
	}
}

// sends the accumulated buffer to the database worker
// maybe around 1000 writes per month with buffer instead of 180000 writes per month
func (h *Hub) flushToDB(sessionID string, data []types.SPageFilePhysics) {
	log.Printf("flushing buffer: %d items for session %s", len(data), sessionID)

	payload := types.TelemetryPayload{
		SessionID: sessionID,
		Data:      data,
	}

	select {
	case h.dbQueue <- payload:
	default:
		log.Println("DB queue full, dropping historical batch")
	}
}

func (h *Hub) BroadcastPayload(payload types.TelemetryPayload) {
	h.broadcast <- payload
}

func (h *Hub) RegisterClient(conn *websocket.Conn) {
	h.register <- conn
}
