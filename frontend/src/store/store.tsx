import { create } from "zustand";

export const useTelemetryStore = create((set) => ({
    latestFrame: null,
    history: [],
    isConnected: false,
    currentLap: 0,

    addBatch: (batch: any[], lap: number) =>
        set((state: any) => {
            const lapBatch = batch.map((frame) => ({ ...frame, lap }));

            return {
                history: [...state.history, ...lapBatch],
                latestFrame: lapBatch[lapBatch.length - 1],
                currentLap: lap,
            };
        }),

    setConnection: (status: boolean) => set({ isConnected: status }),
}));
