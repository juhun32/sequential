import { useEffect } from "react";
import { useTelemetryStore } from "../store/store";

export const useSocket = (sessionId: string) => {
    const { addBatch, setConnection } = useTelemetryStore() as any;

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:5000/ws/${sessionId}`);

        socket.onopen = () => setConnection(true);
        socket.onclose = () => setConnection(false);

        socket.onmessage = (event) => {
            const batch = JSON.parse(event.data);
            if (batch && batch.length > 0) {
                addBatch(batch);
            }
        };

        return () => socket.close();
    }, [sessionId]);
};
