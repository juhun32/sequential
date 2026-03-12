import type { LapSectors } from "../types/telemetry";
import type { TelemetryFrame } from "../components/telemetry/lap-methods";

export type SectorIndex = 1 | 2 | 3;

export const sampleForRender = <T>(frames: T[], maxPoints: number): T[] => {
    if (frames.length <= maxPoints) return frames;

    const sampled: T[] = [];
    const step = (frames.length - 1) / (maxPoints - 1);

    for (let i = 0; i < maxPoints; i += 1) {
        const idx = Math.round(i * step);
        sampled.push(frames[idx]);
    }

    return sampled;
};

export const normalizeSector = (value: number): SectorIndex => {
    if (value <= 1) return 1;
    if (value >= 3) return 3;
    return 2;
};

export const getCompareRange = (
    compareMetric: string,
    compareLaps: number[],
    lapSectors: LapSectors,
) => {
    if (["gas", "brake"].includes(compareMetric)) {
        return { min: 0, max: 1 };
    }
    if (["steerAngle", "chassisPitch", "chassisRoll"].includes(compareMetric)) {
        return { min: -1, max: 1 };
    }

    let minVal = Infinity;
    let maxVal = -Infinity;

    compareLaps.forEach((lapNum) => {
        [1, 2, 3].forEach((sector) => {
            const frames = lapSectors[lapNum]?.[sector] ?? [];
            frames.forEach((frame: TelemetryFrame) => {
                const val = Number(frame[compareMetric]);
                if (!Number.isFinite(val)) return;
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            });
        });
    });

    if (minVal === Infinity || maxVal === -Infinity || minVal === maxVal) {
        return { min: 0, max: 100 };
    }

    const padding = (maxVal - minVal) * 0.08;
    return {
        min: minVal - padding,
        max: maxVal + padding,
    };
};
