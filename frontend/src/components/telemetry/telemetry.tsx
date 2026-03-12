import { useMemo, useState } from "react";
import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";
import {
    formatTime,
    getSectorTimesForFrames,
    groupFramesByLap,
    metricHasData,
} from "./lap-methods";

interface TelemetryProps {
    currentLapTimeMs: number;
}

type MetricConfig = {
    key: string;
    label: string;
    section: "engine" | "suspension";
    optional?: boolean;
    color: string;
    minY?: number;
    maxY?: number;
};

type SectorIndex = 1 | 2 | 3;

const LIVE_METRICS: MetricConfig[] = [
    {
        key: "speedKmh",
        label: "Speed",
        section: "engine",
        color: "rgba(236, 72, 153, 1)",
    },
    {
        key: "rpms",
        label: "RPM",
        section: "engine",
        color: "rgba(59, 130, 246, 1)",
    },
    {
        key: "gas",
        label: "Throttle",
        section: "engine",
        color: "rgba(16, 185, 129, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "brake",
        label: "Brake",
        section: "engine",
        color: "rgba(239, 68, 68, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "steerAngle",
        label: "Steer",
        section: "engine",
        color: "rgba(139, 92, 246, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "gear",
        label: "Gear",
        section: "engine",
        color: "rgba(245, 158, 11, 1)",
    },
    {
        key: "fuel",
        label: "Fuel",
        section: "engine",
        optional: true,
        color: "rgba(234, 179, 8, 1)",
    },
    {
        key: "chassisPitch",
        label: "Pitch",
        section: "suspension",
        color: "rgba(192, 132, 252, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisRoll",
        label: "Roll",
        section: "suspension",
        color: "rgba(56, 189, 248, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisYaw",
        label: "Yaw",
        section: "suspension",
        color: "rgba(99, 102, 241, 1)",
    },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        section: "suspension",
        color: "rgba(14, 165, 233, 1)",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        section: "suspension",
        color: "rgba(20, 184, 166, 1)",
    },
    {
        key: "chassisHeave",
        label: "Heave",
        section: "suspension",
        optional: true,
        color: "rgba(244, 114, 182, 1)",
    },
];

const normalizeSector = (value: number): SectorIndex => {
    if (value <= 1) return 1;
    if (value >= 3) return 3;
    return 2;
};

export const Telemetry = ({ currentLapTimeMs }: TelemetryProps) => {
    const history = useTelemetryStore((state: any) => state.history);
    const latestFrame = useTelemetryStore((state: any) => state.latestFrame);
    const currentLap = useTelemetryStore((state: any) => state.currentLap);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
        "speedKmh",
        "chassisPitch",
        "chassisRoll",
        "chassisYaw",
        "rideHeightFront",
        "rideHeightRear",
    ]);

    // keep live charts lightweight and responsive
    const recentHistory = useMemo(() => history.slice(-180), [history]);

    const currentSector = normalizeSector(Number(latestFrame?.sector ?? 1));
    const currentSectorTimeMs = Number(latestFrame?.sectorTime ?? 0);

    const laps = useMemo(() => groupFramesByLap(history), [history]);

    const currentLapSectorTimes = useMemo(() => {
        const lapFrames = laps[currentLap] ?? [];
        return getSectorTimesForFrames(lapFrames);
    }, [laps, currentLap]);

    const selectableMetrics = useMemo(
        () =>
            LIVE_METRICS.filter((metric) => {
                if (metricHasData(recentHistory, metric.key, 3)) return true;
                const latestValue = Number(latestFrame?.[metric.key]);
                return Number.isFinite(latestValue);
            }),
        [recentHistory, latestFrame],
    );

    const metricMap = useMemo(
        () => new Map(LIVE_METRICS.map((metric) => [metric.key, metric])),
        [],
    );

    const toggleMetric = (key: string) => {
        setSelectedMetrics((prev) =>
            prev.includes(key)
                ? prev.filter((metricKey) => metricKey !== key)
                : [...prev, key],
        );
    };

    const selectedEngineMetrics = selectedMetrics
        .map((key) => metricMap.get(key))
        .filter(
            (metric): metric is MetricConfig =>
                metric !== undefined && metric.section === "engine",
        );

    const selectedSuspensionMetrics = selectedMetrics
        .map((key) => metricMap.get(key))
        .filter(
            (metric): metric is MetricConfig =>
                metric !== undefined && metric.section === "suspension",
        );

    return (
        <div className="w-full overflow-hidden grid grid-cols-[1fr_5fr] gap-1">
            <div className="text-xs p-3 border font-mono space-y-1 h-fit">
                <p>Total frames: {history.length}</p>
                <p>Live window: {recentHistory.length} samples</p>
                <p>Selectable metrics: {selectableMetrics.length}</p>
                <p>Visible metrics: {selectedMetrics.length}</p>
                <br />
                <p>Current sector: {currentSector}</p>
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-sm font-mono border px-2 h-fit">
                    Current Laptime: {formatTime(currentLapTimeMs)}
                </p>
                <p className="text-sm font-mono border px-2 h-fit">
                    Sector Times: S1 {formatTime(currentLapSectorTimes[1])} | S2{" "}
                    {formatTime(currentLapSectorTimes[2])} | S3{" "}
                    {formatTime(currentLapSectorTimes[3])}
                </p>
                <p className="text-sm font-mono border px-2 h-fit">
                    Active Sector {currentSector}:{" "}
                    {formatTime(currentSectorTimeMs)}
                </p>

                <div className="border p-2 space-y-2">
                    <h3 className="text-xs font-mono tracking-wide">
                        LIVE VIEW SELECT
                    </h3>
                    <div>
                        <p className="text-xs font-mono mb-1">ENGINE</p>
                        <div className="flex flex-wrap gap-1">
                            {selectableMetrics
                                .filter((metric) => metric.section === "engine")
                                .map((metric) => {
                                    const isSelected = selectedMetrics.includes(
                                        metric.key,
                                    );
                                    return (
                                        <button
                                            key={`sel-${metric.key}`}
                                            type="button"
                                            onClick={() =>
                                                toggleMetric(metric.key)
                                            }
                                            className={`text-xs font-mono border px-2 py-0.5 ${
                                                isSelected
                                                    ? "bg-black text-white"
                                                    : ""
                                            }`}
                                        >
                                            {metric.label}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-mono mb-1">SUSPENSION</p>
                        <div className="flex flex-wrap gap-1">
                            {selectableMetrics
                                .filter(
                                    (metric) => metric.section === "suspension",
                                )
                                .map((metric) => {
                                    const isSelected = selectedMetrics.includes(
                                        metric.key,
                                    );
                                    return (
                                        <button
                                            key={`sel-${metric.key}`}
                                            type="button"
                                            onClick={() =>
                                                toggleMetric(metric.key)
                                            }
                                            className={`text-xs font-mono border px-2 py-0.5 ${
                                                isSelected
                                                    ? "bg-black text-white"
                                                    : ""
                                            }`}
                                        >
                                            {metric.label}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="border p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-mono tracking-wide">
                                ENGINE
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                            {selectedEngineMetrics.map((metric) => (
                                <TelemetryGraph
                                    key={`engine-${metric.key}`}
                                    data={recentHistory}
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

                    <div className="border p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-mono tracking-wide">
                                SUSPENSION
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                            {selectedSuspensionMetrics.map((metric) => (
                                <TelemetryGraph
                                    key={`susp-${metric.key}`}
                                    data={recentHistory}
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

                    {selectedEngineMetrics.length === 0 &&
                        selectedSuspensionMetrics.length === 0 && (
                            <div className="border p-3 text-sm text-gray-400 font-mono">
                                Waiting for valid telemetry values...
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};
