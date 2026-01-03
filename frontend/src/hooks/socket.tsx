import { useEffect } from "react";
import { useTelemetryStore } from "../store/store";

export const useSocket = (sessionId: string) => {
    const { addBatch, setConnection } = useTelemetryStore() as any;

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:5000/ws/${sessionId}`);

        socket.onopen = () => setConnection(true);
        socket.onclose = () => setConnection(false);

        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            // { SessionID: string, Lap: number, Data: [] }
            if (payload.Data && payload.Data.length > 0) {
                addBatch(payload.Data, payload.Lap);
            }
        };

        return () => socket.close();
    }, [sessionId]);
};
