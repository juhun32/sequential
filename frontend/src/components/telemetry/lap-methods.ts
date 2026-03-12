export type TelemetryFrame = {
    lap?: number;
    sector?: number;
    currentLapTime?: number;
    [key: string]: unknown;
};

export type LapGroups = Record<number, TelemetryFrame[]>;
export type SectorGroups = Record<number, TelemetryFrame[]>;
export type LapSectorGroups = Record<number, SectorGroups>;
export type SectorTimes = Record<1 | 2 | 3, number>;

export const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return "--:--.---";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const mil = Math.floor(ms % 1000);
    return `${min}:${sec.toString().padStart(2, "0")}.${mil
        .toString()
        .padStart(3, "0")}`;
};

export const groupFramesByLap = (history: TelemetryFrame[]): LapGroups => {
    const grouped: LapGroups = {};

    history.forEach((frame) => {
        const lapNum = Number(frame.lap ?? 0);
        if (!grouped[lapNum]) grouped[lapNum] = [];
        grouped[lapNum].push(frame);
    });

    return grouped;
};

const normalizeSector = (value: unknown) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric < 1) return 1;
    if (numeric > 3) return 3;
    return Math.floor(numeric);
};

export const groupFramesBySector = (frames: TelemetryFrame[]): SectorGroups => {
    const grouped: SectorGroups = { 1: [], 2: [], 3: [] };

    frames.forEach((frame, index) => {
        let sector = normalizeSector(frame.sector);

        // Fallback for missing sector metadata: split lap progression into thirds.
        if (sector === 0) {
            const progress =
                frames.length <= 1 ? 0 : index / (frames.length - 1);
            if (progress < 1 / 3) sector = 1;
            else if (progress < 2 / 3) sector = 2;
            else sector = 3;
        }

        grouped[sector].push(frame);
    });

    return grouped;
};

export const metricHasData = (
    frames: TelemetryFrame[],
    key: string,
    minSamples = 3,
) => {
    let validCount = 0;

    for (const frame of frames) {
        const value = Number(frame[key]);
        if (!Number.isFinite(value)) continue;
        validCount += 1;
        if (validCount >= minSamples) return true;
    }

    return false;
};

export const groupFramesByLapAndSector = (
    history: TelemetryFrame[],
): LapSectorGroups => {
    const lapGroups = groupFramesByLap(history);
    const grouped: LapSectorGroups = {};

    Object.entries(lapGroups).forEach(([lap, frames]) => {
        grouped[Number(lap)] = groupFramesBySector(frames);
    });

    return grouped;
};

export const getSectorTimesForFrames = (
    frames: TelemetryFrame[],
): SectorTimes => {
    const sectors = groupFramesBySector(frames);
    const sectorTimes: SectorTimes = { 1: 0, 2: 0, 3: 0 };

    ([1, 2, 3] as const).forEach((sector) => {
        sectors[sector].forEach((frame) => {
            const value = Number(frame.sectorTime);
            if (Number.isFinite(value) && value > sectorTimes[sector]) {
                sectorTimes[sector] = value;
            }
        });
    });

    return sectorTimes;
};

export const getLapTimeForLap = (laps: LapGroups, lapNum: number) => {
    const lapFrames = laps[lapNum];
    if (!lapFrames || lapFrames.length === 0) return 0;

    const currentLapTime = Number(
        lapFrames[lapFrames.length - 1]?.currentLapTime ?? 0,
    );
    return Number.isFinite(currentLapTime) ? currentLapTime : 0;
};
