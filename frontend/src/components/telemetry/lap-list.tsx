import { useMemo, useState, useEffect } from "react";
import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";

const METRICS = [
    { key: "SpeedKmh", label: "Speed" },
    { key: "Rpms", label: "RPM" },
    { key: "Gas", label: "Throttle" },
    { key: "Brake", label: "Brake" },
    { key: "SteerAngle", label: "Steering" },
    { key: "Gear", label: "Gear" },
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

export const LapList = () => {
    const { history, currentLap } = useTelemetryStore() as any;
    const [compareMetric, setCompareMetric] = useState("SpeedKmh");
    const [selectedLaps, setSelectedLaps] = useState<number[]>([]);
    const [isLapSelectOpen, setIsLapSelectOpen] = useState(false);

    const laps = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        history.forEach((frame: any) => {
            const lapNum = frame.lap ?? 0;
            if (!grouped[lapNum]) grouped[lapNum] = [];
            grouped[lapNum].push(frame);
        });
        return grouped;
    }, [history]);

    const sortedLaps = Object.keys(laps)
        .map(Number)
        .sort((a, b) => b - a);

    // filter laps that have enough data to be graphable
    // sample rate is not really reliable yet
    // so just using a fixed threshold for now
    const availableLaps = useMemo(() => {
        return sortedLaps.filter((l) => laps[l].length > 50);
    }, [sortedLaps, laps]);

    // init selection
    // select the first 3 most recent by default
    useEffect(() => {
        if (selectedLaps.length === 0 && availableLaps.length > 0) {
            setSelectedLaps(availableLaps.slice(0, 3));
        }
    }, [availableLaps.length]);

    // The laps actually shown on the comparison graph
    const compareLaps = availableLaps.filter((l) => selectedLaps.includes(l));

    const toggleLapSelection = (lapNum: number) => {
        setSelectedLaps((prev) =>
            prev.includes(lapNum)
                ? prev.filter((l) => l !== lapNum)
                : [...prev, lapNum]
        );
    };

    // calculating global minmax for the overlap graph scaling
    const { min, max } = useMemo(() => {
        if (["Gas", "Brake"].includes(compareMetric)) return { min: 0, max: 1 };
        if (compareMetric === "SteerAngle") return { min: -1, max: 1 };

        let minVal = Infinity;
        let maxVal = -Infinity;

        compareLaps.forEach((lapNum) => {
            laps[lapNum].forEach((frame) => {
                const val = Number(frame[compareMetric]);
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            });
        });

        if (minVal === Infinity || minVal === maxVal) {
            return { min: 0, max: 100 };
        }

        return { min: minVal - 10, max: maxVal + 10 };
    }, [laps, compareMetric, compareLaps]);

    return (
        <div className="mt-9 space-y-3">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center">
                <h2 className="border-b">LAP COMPARISON</h2>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative z-10">
                        <button
                            onClick={() => setIsLapSelectOpen(!isLapSelectOpen)}
                            className="px-3 py-1 text-xs rounded border flex items-center gap-2"
                        >
                            <span>Select Laps ({compareLaps.length})</span>
                            <span className="text-xs">
                                {isLapSelectOpen ? "▲" : "▼"}
                            </span>
                        </button>

                        {isLapSelectOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full border rounded max-h-60 overflow-y-auto bg-white">
                                {availableLaps.map((lapNum) => (
                                    <label
                                        key={lapNum}
                                        className="flex items-center gap-3 px-2 py-1 rounded cursor-pointer text-xs"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedLaps.includes(
                                                lapNum
                                            )}
                                            onChange={() =>
                                                toggleLapSelection(lapNum)
                                            }
                                        />
                                        <span>
                                            Lap {lapNum}{" "}
                                            {lapNum === currentLap && "(Live)"}
                                        </span>
                                    </label>
                                ))}
                                {availableLaps.length === 0 && (
                                    <div className="p-2 text-xs text-center">
                                        No complete laps yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {METRICS.map((m) => (
                            <button
                                key={m.key}
                                onClick={() => setCompareMetric(m.key)}
                                className={`px-2 py-0.5 text-xs rounded border transition-colors hover:cursor-pointer ${
                                    compareMetric === m.key
                                        ? "bg-black text-white"
                                        : ""
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative h-64 w-full border border-gray-800 rounded overflow-hidden mb-4">
                {compareLaps.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        Select laps above to compare
                    </div>
                ) : (
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        {compareLaps.map((lapNum) => {
                            const colorIdx = sortedLaps.indexOf(lapNum);
                            const color = COLORS[colorIdx % COLORS.length];

                            const data = laps[lapNum];
                            if (!data || !data.length) return null;

                            const range = max - min;
                            const stepX = 100 / (data.length - 1 || 1);

                            const points = data
                                .map((d: any, i: number) => {
                                    const x = i * stepX;
                                    const val = Number(d[compareMetric]);
                                    const normalizedY = (val - min) / range;
                                    const y = 100 - normalizedY * 100;
                                    return `${x},${y}`;
                                })
                                .join(" ");

                            return (
                                <polyline
                                    key={lapNum}
                                    points={points}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={
                                        lapNum === currentLap ? "0.8" : "0.4"
                                    }
                                    vectorEffect="non-scaling-stroke"
                                    opacity={lapNum === currentLap ? 1 : 0.7}
                                />
                            );
                        })}
                    </svg>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {compareLaps.map((lapNum) => {
                        const colorIdx = sortedLaps.indexOf(lapNum);
                        const color = COLORS[colorIdx % COLORS.length];

                        return (
                            <div
                                key={lapNum}
                                className="flex items-center gap-2 text-xs"
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: color,
                                    }}
                                />
                                <span
                                    className={
                                        lapNum === currentLap
                                            ? "font-semibold"
                                            : "text-gray-400 font-mono"
                                    }
                                >
                                    LAP {lapNum}{" "}
                                    {lapNum === currentLap && "(LIVE)"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <h2 className="border-b pt-4">SESSION HISTORY</h2>

            {sortedLaps.map((lapNum) => (
                <div key={lapNum}>
                    <div className="flex items-baseline gap-3 mb-4">
                        <h3 className="text-sm">LAP {lapNum}</h3>
                        {lapNum === currentLap && (
                            <span className="text-xs text-green-400 px-1 rounded border">
                                LIVE
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-mono ml-auto">
                            {laps[lapNum].length} SAMPLES
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="SpeedKmh"
                            color="rgba(96, 165, 250, 1)"
                            label="Speed"
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Rpms"
                            color="rgba(248, 113, 113, 1)"
                            label="RPM"
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Gas"
                            color="rgba(74, 222, 128, 1)"
                            label="Throttle"
                            minY={0}
                            maxY={1}
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Brake"
                            color="rgba(251, 191, 36, 1)"
                            label="Brake"
                            minY={0}
                            maxY={1}
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="SteerAngle"
                            color="rgba(168, 85, 247, 1)"
                            label="Steering"
                            minY={-1}
                            maxY={1}
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Gear"
                            color="rgba(14, 165, 233, 1)"
                            label="Gear"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
