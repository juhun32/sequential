import { useEffect } from "react";
import { useTelemetryStore } from "../store/store";

export const useSocket = (sessionId: string) => {
    const addBatch = useTelemetryStore((state: any) => state.addBatch);
    const setConnection = useTelemetryStore(
        (state: any) => state.setConnection,
    );

    useEffect(() => {
        let socket: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let reconnectAttempts = 0;
        let disposed = false;

        const maxReconnectDelayMs = 5000;
        const baseReconnectDelayMs = 300;

        const connect = () => {
            if (disposed) return;

            socket = new WebSocket(`ws://localhost:5000/ws/${sessionId}`);

            socket.onopen = () => {
                reconnectAttempts = 0;
                setConnection(true);
            };

            socket.onclose = () => {
                setConnection(false);

                if (disposed) return;

                reconnectAttempts += 1;
                const delay = Math.min(
                    maxReconnectDelayMs,
                    baseReconnectDelayMs * 2 ** (reconnectAttempts - 1),
                );

                reconnectTimer = window.setTimeout(connect, delay);
            };

            socket.onerror = () => {
                // `onclose` handles reconnect scheduling.
                setConnection(false);
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    // { SessionID: string, Lap: number, Data: [] }
                    if (
                        Array.isArray(payload?.Data) &&
                        payload.Data.length > 0
                    ) {
                        addBatch(payload.Data, Number(payload.Lap ?? 0));
                    }
                } catch {
                    // Ignore malformed packets and keep stream alive.
                }
            };
        };

        connect();

        return () => {
            disposed = true;

            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer);
            }

            if (socket) socket.close();
        };
    }, [sessionId, addBatch, setConnection]);
};
