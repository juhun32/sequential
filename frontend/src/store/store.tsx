import { create } from "zustand";

export const useTelemetryStore = create((set) => ({
    latestFrame: null,
    history: [],
    isConnected: false,

    addBatch: (batch: any[]) =>
        set((state: any) => ({
            history: [...state.history, ...batch],
            latestFrame: batch[batch.length - 1],
        })),

    setConnection: (status: boolean) => set({ isConnected: status }),
}));
