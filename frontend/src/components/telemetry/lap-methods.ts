export type TelemetryFrame = {
    lap?: number;
    currentLapTime?: number;
    [key: string]: unknown;
};

export type LapGroups = Record<number, TelemetryFrame[]>;

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

export const getLapTimeForLap = (laps: LapGroups, lapNum: number) => {
    const lapFrames = laps[lapNum];
    if (!lapFrames || lapFrames.length === 0) return 0;

    const currentLapTime = Number(
        lapFrames[lapFrames.length - 1]?.currentLapTime ?? 0,
    );
    return Number.isFinite(currentLapTime) ? currentLapTime : 0;
};
