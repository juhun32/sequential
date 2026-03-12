import { create } from "zustand";

const MAX_HISTORY_FRAMES = 15000;
const INCOMING_SAMPLE_STRIDE = 3;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const toFiniteOr = (value: unknown, fallback: number) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeFrame = (frame: any) => {
    const speedKmh = Math.max(0, toFiniteOr(frame?.speedKmh, 0));
    const gas = clamp(toFiniteOr(frame?.gas, 0), 0, 1);
    const brake = clamp(toFiniteOr(frame?.brake, 0), 0, 1);
    const steerAngle = clamp(toFiniteOr(frame?.steerAngle, 0), -1, 1);
    const chassisPitch = clamp(toFiniteOr(frame?.chassisPitch, 0), -1, 1);
    const chassisRoll = clamp(toFiniteOr(frame?.chassisRoll, 0), -1, 1);
    const sector = clamp(Math.floor(toFiniteOr(frame?.sector, 1)), 1, 3);
    const sectorTime = Math.max(0, toFiniteOr(frame?.sectorTime, 0));

    return {
        ...frame,
        speedKmh,
        rpms: Math.max(0, Math.floor(toFiniteOr(frame?.rpms, 0))),
        gas,
        brake,
        steerAngle,
        gear: Math.floor(toFiniteOr(frame?.gear, 0)),
        fuel: Math.max(0, toFiniteOr(frame?.fuel, 0)),
        currentLapTime: Math.max(0, toFiniteOr(frame?.currentLapTime, 0)),
        sector,
        sectorTime,
        chassisPitch,
        chassisRoll,
        chassisYaw: toFiniteOr(frame?.chassisYaw, 0),
        chassisHeave: toFiniteOr(frame?.chassisHeave, 0),
        rideHeightFront: Math.max(0, toFiniteOr(frame?.rideHeightFront, 0)),
        rideHeightRear: Math.max(0, toFiniteOr(frame?.rideHeightRear, 0)),
        rideHeightAvg: Math.max(0, toFiniteOr(frame?.rideHeightAvg, 0)),
        suspensionBalance: toFiniteOr(frame?.suspensionBalance, 0),
    };
};

const downsampleBatch = (batch: any[]) => {
    if (!Array.isArray(batch) || batch.length === 0) return [];

    // Keep the last frame to preserve current values even with stride sampling.
    const sampled = batch.filter(
        (_, index) => index % INCOMING_SAMPLE_STRIDE === 0,
    );
    const lastFrame = batch[batch.length - 1];

    if (sampled[sampled.length - 1] !== lastFrame) {
        sampled.push(lastFrame);
    }

    return sampled;
};

export const useTelemetryStore = create((set) => ({
    latestFrame: null,
    history: [],
    isConnected: false,
    currentLap: 0,

    addBatch: (batch: any[], lap: number) =>
        set((state: any) => {
            const sampledBatch = downsampleBatch(batch);
            if (sampledBatch.length === 0) return state;

            const lapBatch = sampledBatch.map((frame) => ({
                ...normalizeFrame(frame),
                lap,
            }));
            const mergedHistory = [...state.history, ...lapBatch];
            const history =
                mergedHistory.length > MAX_HISTORY_FRAMES
                    ? mergedHistory.slice(-MAX_HISTORY_FRAMES)
                    : mergedHistory;

            return {
                history,
                latestFrame: lapBatch[lapBatch.length - 1],
                currentLap: lap,
            };
        }),

    setConnection: (status: boolean) => set({ isConnected: status }),
}));
