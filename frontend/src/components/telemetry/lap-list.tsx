import { useEffect, useMemo, useState } from "react";
import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";
import {
    formatTime,
    getSectorTimesForFrames,
    getLapTimeForLap,
    groupFramesByLap,
    groupFramesByLapAndSector,
    metricHasData,
} from "./lap-methods";
import { Button } from "../ui/button";

type MetricConfig = {
    key: string;
    label: string;
    color: string;
    minY?: number;
    maxY?: number;
};

const sampleForRender = (frames: any[], maxPoints: number) => {
    if (frames.length <= maxPoints) return frames;

    const sampled: any[] = [];
    const step = (frames.length - 1) / (maxPoints - 1);

    for (let i = 0; i < maxPoints; i += 1) {
        const idx = Math.round(i * step);
        sampled.push(frames[idx]);
    }

    return sampled;
};

const RENDER_POINTS_PER_SECTOR = 110;

const COMPARE_METRICS: MetricConfig[] = [
    { key: "speedKmh", label: "Speed", color: "#60a5fa" },
    { key: "rpms", label: "RPM", color: "#f87171" },
    { key: "gas", label: "Throttle", color: "#4ade80", minY: 0, maxY: 1 },
    { key: "brake", label: "Brake", color: "#fbbf24", minY: 0, maxY: 1 },
    {
        key: "steerAngle",
        label: "Steering",
        color: "#a855f7",
        minY: -1,
        maxY: 1,
    },
    { key: "gear", label: "Gear", color: "#0ea5e9" },
    { key: "fuel", label: "Fuel", color: "#eab308" },
    { key: "chassisHeave", label: "Heave", color: "#f472b6" },
    { key: "chassisPitch", label: "Pitch", color: "#c084fc" },
    {
        key: "chassisRoll",
        label: "Roll",
        color: "#38bdf8",
        minY: -1,
        maxY: 1,
    },
    { key: "chassisYaw", label: "Yaw", color: "#6366f1" },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        color: "#14b8a6",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        color: "#06b6d4",
    },
    { key: "suspensionBalance", label: "F/R Balance", color: "#facc15" },
];

const HISTORY_ENGINE_METRICS: MetricConfig[] = [
    { key: "speedKmh", label: "Speed", color: "rgba(96, 165, 250, 1)" },
    { key: "rpms", label: "RPM", color: "rgba(248, 113, 113, 1)" },
    {
        key: "gas",
        label: "Throttle",
        color: "rgba(74, 222, 128, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "brake",
        label: "Brake",
        color: "rgba(251, 191, 36, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "steerAngle",
        label: "Steering",
        color: "rgba(168, 85, 247, 1)",
        minY: -1,
        maxY: 1,
    },
    { key: "gear", label: "Gear", color: "rgba(14, 165, 233, 1)" },
];

const HISTORY_SUSPENSION_METRICS: MetricConfig[] = [
    {
        key: "chassisPitch",
        label: "Chassis Pitch",
        color: "rgba(192, 132, 252, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisRoll",
        label: "Chassis Roll",
        color: "rgba(56, 189, 248, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisYaw",
        label: "Chassis Yaw",
        color: "rgba(99, 102, 241, 1)",
    },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        color: "rgba(20, 184, 166, 1)",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        color: "rgba(14, 165, 233, 1)",
    },
];

const COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
];

const SAMPLE_MIN_LIVE_LAP = 12;
const SAMPLE_MIN_FINISHED_LAP = 50;

export const LapList = () => {
    const { history, currentLap } = useTelemetryStore() as any;

    const [compareMetric, setCompareMetric] = useState("speedKmh");
    const [selectedCompareLaps, setSelectedCompareLaps] = useState<number[]>(
        [],
    );
    const [selectedHistoryLaps, setSelectedHistoryLaps] = useState<number[]>(
        [],
    );

    const laps = useMemo(() => groupFramesByLap(history), [history]);
    const lapSectors = useMemo(
        () => groupFramesByLapAndSector(history),
        [history],
    );
    const metricWindow = useMemo(() => history.slice(-1800), [history]);

    const sortedLaps = useMemo(
        () =>
            Object.keys(laps)
                .map(Number)
                .sort((a, b) => b - a),
        [laps],
    );

    const availableLaps = useMemo(() => {
        return sortedLaps.filter((lapNum) => {
            const minSamples =
                lapNum === currentLap
                    ? SAMPLE_MIN_LIVE_LAP
                    : SAMPLE_MIN_FINISHED_LAP;
            return (laps[lapNum]?.length ?? 0) >= minSamples;
        });
    }, [sortedLaps, laps, currentLap]);

    const availableCompareMetrics = useMemo(() => {
        return COMPARE_METRICS.filter((metric) =>
            metricHasData(metricWindow, metric.key, 6),
        );
    }, [metricWindow]);

    useEffect(() => {
        if (availableCompareMetrics.length === 0) return;
        const exists = availableCompareMetrics.some(
            (metric) => metric.key === compareMetric,
        );
        if (!exists) {
            setCompareMetric(availableCompareMetrics[0].key);
        }
    }, [availableCompareMetrics, compareMetric]);

    useEffect(() => {
        if (availableLaps.length === 0) {
            setSelectedCompareLaps([]);
            setSelectedHistoryLaps([]);
            return;
        }

        setSelectedCompareLaps((prev) => {
            const valid = prev.filter((lap) => availableLaps.includes(lap));
            if (valid.length > 0) return valid;
            return availableLaps.slice(0, 3);
        });

        setSelectedHistoryLaps((prev) => {
            const valid = prev.filter((lap) => availableLaps.includes(lap));
            if (valid.length > 0) return valid;

            const defaults: number[] = [];
            if (availableLaps.includes(currentLap)) defaults.push(currentLap);

            availableLaps.forEach((lapNum) => {
                if (!defaults.includes(lapNum) && defaults.length < 3) {
                    defaults.push(lapNum);
                }
            });

            return defaults;
        });
    }, [availableLaps, currentLap]);

    const compareLaps = useMemo(
        () =>
            sortedLaps.filter(
                (lapNum) =>
                    availableLaps.includes(lapNum) &&
                    selectedCompareLaps.includes(lapNum),
            ),
        [sortedLaps, availableLaps, selectedCompareLaps],
    );

    const historyLaps = useMemo(
        () =>
            sortedLaps.filter(
                (lapNum) =>
                    availableLaps.includes(lapNum) &&
                    selectedHistoryLaps.includes(lapNum),
            ),
        [sortedLaps, availableLaps, selectedHistoryLaps],
    );

    const toggleCompareLap = (lapNum: number) => {
        setSelectedCompareLaps((prev) =>
            prev.includes(lapNum)
                ? prev.filter((lap) => lap !== lapNum)
                : [...prev, lapNum],
        );
    };

    const toggleHistoryLap = (lapNum: number) => {
        setSelectedHistoryLaps((prev) =>
            prev.includes(lapNum)
                ? prev.filter((lap) => lap !== lapNum)
                : [...prev, lapNum],
        );
    };

    const { min, max } = useMemo(() => {
        if (["gas", "brake"].includes(compareMetric)) {
            return { min: 0, max: 1 };
        }
        if (compareMetric === "steerAngle") {
            return { min: -1, max: 1 };
        }
        if (["chassisPitch", "chassisRoll"].includes(compareMetric)) {
            return { min: -1, max: 1 };
        }

        let minVal = Infinity;
        let maxVal = -Infinity;

        compareLaps.forEach((lapNum) => {
            [1, 2, 3].forEach((sector) => {
                const frames = lapSectors[lapNum]?.[sector] ?? [];
                frames.forEach((frame) => {
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
    }, [compareLaps, compareMetric, lapSectors]);

    const historyEngineMetrics = HISTORY_ENGINE_METRICS;

    const historySuspensionMetrics = HISTORY_SUSPENSION_METRICS;

    return (
        <div className="mt-9 gap-3">
            <div className="space-y-3">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2">
                    <h2 className="border-b">LAP COMPARISON</h2>

                    <div className="flex flex-wrap gap-1 items-center">
                        {availableCompareMetrics.map((metric) => (
                            <Button
                                size={"xs"}
                                variant={"outline"}
                                key={metric.key}
                                onClick={() => setCompareMetric(metric.key)}
                                className={`px-2 py-0.5 text-xs border transition-colors hover:cursor-pointer ${
                                    compareMetric === metric.key
                                        ? "bg-black text-white"
                                        : ""
                                }`}
                            >
                                {metric.label}
                            </Button>
                        ))}

                        {availableCompareMetrics.length === 0 && (
                            <span className="text-xs text-gray-500 font-mono px-2 py-1 border">
                                Waiting for metric data
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_5fr]">
                    <div className="max-h-[256px] overflow-y-auto space-y-1 border p-2">
                        {availableLaps.map((lapNum) => (
                            <label
                                key={`compare-${lapNum}`}
                                className="flex items-start gap-2 text-xs font-mono cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCompareLaps.includes(
                                        lapNum,
                                    )}
                                    onChange={() => toggleCompareLap(lapNum)}
                                />
                                <span>
                                    Lap {lapNum}{" "}
                                    {lapNum === currentLap && "(Live)"}
                                    <p className="text-gray-500">
                                        {formatTime(
                                            getLapTimeForLap(laps, lapNum),
                                        )}
                                    </p>
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className="relative h-64 w-full overflow-hidden bg-foreground">
                        {compareLaps.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                                Select laps from the sidebar to compare
                            </div>
                        ) : (
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="w-full h-full p-2"
                            >
                                {Array.from({ length: 11 }, (_, i) => (
                                    <line
                                        key={`grid-v-${i}`}
                                        x1={i * 10}
                                        y1={0}
                                        x2={i * 10}
                                        y2={100}
                                        stroke="rgba(148, 163, 184, 0.12)"
                                        strokeWidth="0.24"
                                    />
                                ))}
                                {Array.from({ length: 6 }, (_, i) => (
                                    <line
                                        key={`grid-h-${i}`}
                                        x1={0}
                                        y1={i * 20}
                                        x2={100}
                                        y2={i * 20}
                                        stroke="rgba(148, 163, 184, 0.12)"
                                        strokeWidth="0.24"
                                    />
                                ))}

                                {[33.333, 66.666].map((x, idx) => (
                                    <line
                                        key={`sector-boundary-${idx}`}
                                        x1={x}
                                        y1={0}
                                        x2={x}
                                        y2={100}
                                        stroke="rgba(148, 163, 184, 0.35)"
                                        strokeWidth="0.35"
                                        strokeDasharray="1 1"
                                    />
                                ))}

                                {compareLaps.map((lapNum) => {
                                    const colorIdx = sortedLaps.indexOf(lapNum);
                                    const color =
                                        COLORS[colorIdx % COLORS.length];
                                    const range = max - min || 1;
                                    const sectorWidth = 100 / 3;

                                    return [1, 2, 3].map((sector) => {
                                        const data =
                                            lapSectors[lapNum]?.[sector] ?? [];
                                        if (!data.length) return null;
                                        if (
                                            !metricHasData(
                                                data,
                                                compareMetric,
                                                2,
                                            )
                                        )
                                            return null;

                                        const sampledData = sampleForRender(
                                            data,
                                            RENDER_POINTS_PER_SECTOR,
                                        );

                                        const stepX =
                                            sampledData.length > 1
                                                ? sectorWidth /
                                                  (sampledData.length - 1)
                                                : 0;
                                        const startX =
                                            (sector - 1) * sectorWidth;

                                        const points = sampledData
                                            .map((frame: any, idx: number) => {
                                                const x = startX + idx * stepX;
                                                const val = Number(
                                                    frame[compareMetric],
                                                );
                                                const safeVal = Number.isFinite(
                                                    val,
                                                )
                                                    ? val
                                                    : min;
                                                const normalizedY =
                                                    (safeVal - min) / range;
                                                const y =
                                                    100 - normalizedY * 100;
                                                return `${x},${y}`;
                                            })
                                            .join(" ");

                                        return (
                                            <polyline
                                                key={`${lapNum}-${sector}`}
                                                points={points}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth={
                                                    lapNum === currentLap
                                                        ? "0.95"
                                                        : "0.72"
                                                }
                                                vectorEffect="non-scaling-stroke"
                                                opacity={
                                                    lapNum === currentLap
                                                        ? 1
                                                        : 0.72
                                                }
                                            />
                                        );
                                    });
                                })}
                            </svg>
                        )}
                    </div>
                </div>

                <h2 className="border-b pt-4">SESSION HISTORY</h2>

                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_5fr]">
                    <div className="max-h-[838px] overflow-y-auto space-y-1 border p-2">
                        {availableLaps.map((lapNum) => (
                            <label
                                key={`history-${lapNum}`}
                                className="flex items-start gap-2 text-xs font-mono cursor-pointer hover:bg-white/5"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedHistoryLaps.includes(
                                        lapNum,
                                    )}
                                    onChange={() => toggleHistoryLap(lapNum)}
                                />
                                <span>
                                    Lap {lapNum}{" "}
                                    {lapNum === currentLap && "(Live)"}
                                    <p className="text-gray-500">
                                        {formatTime(
                                            getLapTimeForLap(laps, lapNum),
                                        )}
                                    </p>
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col space-y-6">
                        {historyLaps.length === 0 && (
                            <div className="border p-3 text-sm text-gray-500 font-mono">
                                Select laps from the sidebar to render session
                                graphs.
                            </div>
                        )}

                        {historyLaps.map((lapNum) => {
                            const lapFrames = laps[lapNum] ?? [];
                            const lapTimeVal = getLapTimeForLap(laps, lapNum);
                            const sectorTimes =
                                getSectorTimesForFrames(lapFrames);

                            const engineMetrics = historyEngineMetrics.filter(
                                (metric) =>
                                    metricHasData(lapFrames, metric.key, 4),
                            );
                            const suspensionMetrics =
                                historySuspensionMetrics.filter((metric) =>
                                    metricHasData(lapFrames, metric.key, 4),
                                );

                            return (
                                <div
                                    key={lapNum}
                                    className="space-y-2 pl-2 border-l border-white/10"
                                >
                                    <div className="flex items-baseline gap-2 border-b pb-1">
                                        {lapNum === currentLap && (
                                            <span className="text-xs text-green-400 px-1 border border-green-400/50">
                                                LIVE
                                            </span>
                                        )}

                                        <h3 className="text-sm font-bold">
                                            LAP {lapNum}
                                        </h3>
                                        <span className="text-sm font-mono text-white/80">
                                            {formatTime(lapTimeVal)}
                                        </span>

                                        <span className="text-xs text-gray-500 font-mono ml-auto">
                                            {lapFrames.length} samples
                                        </span>

                                        <span className="text-xs text-gray-500 font-mono">
                                            S1 {formatTime(sectorTimes[1])} | S2{" "}
                                            {formatTime(sectorTimes[2])} | S3{" "}
                                            {formatTime(sectorTimes[3])}
                                        </span>
                                    </div>

                                    <div className="border p-2 bg-panel">
                                        <h4 className="text-xs font-mono text-gray-400 tracking-wide mb-2">
                                            ENGINE
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                            {engineMetrics.map((metric) => (
                                                <TelemetryGraph
                                                    key={`${lapNum}-engine-${metric.key}`}
                                                    data={lapFrames}
                                                    dataKey={metric.key}
                                                    color={metric.color}
                                                    label={metric.label}
                                                    minY={metric.minY}
                                                    maxY={metric.maxY}
                                                    maxPoints={120}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border p-2 bg-panel">
                                        <h4 className="text-xs font-mono text-gray-400 tracking-wide mb-2">
                                            SUSPENSION
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                            {suspensionMetrics.map((metric) => (
                                                <TelemetryGraph
                                                    key={`${lapNum}-susp-${metric.key}`}
                                                    data={lapFrames}
                                                    dataKey={metric.key}
                                                    color={metric.color}
                                                    label={metric.label}
                                                    minY={metric.minY}
                                                    maxY={metric.maxY}
                                                    maxPoints={120}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
