package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"cmd/internal/database"
	"cmd/internal/websocket"
	"cmd/types"

	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	// dual path: database + websocket broadcast

	// init persistence layer
	store := database.NewLogStore()

	// init cloud hub
	hub := websocket.NewHub(store)
	go hub.Run()

	// health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// endpoint for local -> hub ingest where local clients POST telemetry batches to the db queue
	http.HandleFunc("/ingest", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var batch []types.SPageFilePhysics
		if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// construct payload with session_id from query param
		// NOTE: temporary approach, in future might want to use auth tokens or some
		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			sessionID = "default_session"
		}

		// lap number
		var lap int32
		fmt.Sscanf(r.URL.Query().Get("lap"), "%d", &lap)

		payload := types.TelemetryPayload{
			SessionID: sessionID,
			Lap:       lap,
			Data:      batch,
		}

		// send batch to the hub
		hub.BroadcastPayload(payload)
		w.WriteHeader(http.StatusOK)
	})

	// endpoint for dashboard clients live websocket connection
	http.HandleFunc("/ws/", func(w http.ResponseWriter, r *http.Request) {
		// sessionID := strings.TrimPrefix(r.URL.Path, "/ws/")

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			return
		}

		log.Printf("new ws client connected: %s", conn.RemoteAddr())
		hub.RegisterClient(conn)
	})

	fmt.Println("cloud manage running on :5000")
	log.Fatal(http.ListenAndServe(":5000", nil))
}
