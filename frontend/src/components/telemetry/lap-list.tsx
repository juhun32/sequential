import { useEffect, useMemo, useState } from "react";
import { useTelemetryStore } from "../../store/store";
import { Button } from "../ui/button";
import {
    getLapTimeForLap,
    groupFramesByLap,
    groupFramesBySector,
    metricHasData,
    type TelemetryFrame,
} from "./lap-methods";
import {
    COMPARE_METRICS,
    HISTORY_ENGINE_METRICS,
    HISTORY_SUSPENSION_METRICS,
    SAMPLE_MIN_FINISHED_LAP,
    SAMPLE_MIN_LIVE_LAP,
} from "./telemetry-config";
import type { LapSectors } from "../../types/telemetry";
import { getCompareRange } from "../../lib/telemetry";
import { LapSelectionSidebar } from "./lap-selection-sidebar";
import { SectorComparisonChart } from "./sector-comparison-chart";
import { HistoryLapCard } from "./history-lap-card";

export const LapList = () => {
    const { history, currentLap } = useTelemetryStore() as {
        history: TelemetryFrame[];
        currentLap: number;
    };

    const [compareMetric, setCompareMetric] = useState("speedKmh");
    const [selectedCompareLaps, setSelectedCompareLaps] = useState<number[]>(
        [],
    );
    const [selectedHistoryLaps, setSelectedHistoryLaps] = useState<number[]>(
        [],
    );

    const laps = useMemo(() => groupFramesByLap(history), [history]);
    const lapSectors = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(laps).map(([lapNum, frames]) => [
                    Number(lapNum),
                    groupFramesBySector(frames),
                ]),
            ) as LapSectors,
        [laps],
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

    const compareRange = useMemo(
        () => getCompareRange(compareMetric, compareLaps, lapSectors),
        [compareMetric, compareLaps, lapSectors],
    );

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
                    <LapSelectionSidebar
                        panelKey="compare"
                        laps={availableLaps}
                        currentLap={currentLap}
                        selectedLaps={selectedCompareLaps}
                        onToggle={toggleCompareLap}
                        getLapTime={(lapNum) => getLapTimeForLap(laps, lapNum)}
                    />

                    <div className="relative h-64 w-full overflow-hidden bg-foreground">
                        <SectorComparisonChart
                            compareLaps={compareLaps}
                            currentLap={currentLap}
                            sortedLaps={sortedLaps}
                            lapSectors={lapSectors}
                            compareMetric={compareMetric}
                            min={compareRange.min}
                            max={compareRange.max}
                        />
                    </div>
                </div>

                <h2 className="border-b pt-4">SESSION HISTORY</h2>

                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_5fr]">
                    <LapSelectionSidebar
                        panelKey="history"
                        laps={availableLaps}
                        currentLap={currentLap}
                        selectedLaps={selectedHistoryLaps}
                        onToggle={toggleHistoryLap}
                        getLapTime={(lapNum) => getLapTimeForLap(laps, lapNum)}
                        maxHeightClass="max-h-[838px]"
                    />

                    <div className="flex flex-col space-y-6">
                        {historyLaps.length === 0 && (
                            <div className="border ml-1 p-2 text-xs text-gray-500 font-mono flex items-center justify-center">
                                Select laps from the sidebar to render session
                                graphs.
                            </div>
                        )}

                        {historyLaps.map((lapNum) => {
                            const lapFrames = laps[lapNum] ?? [];
                            const lapTimeVal = getLapTimeForLap(laps, lapNum);

                            const engineMetrics = HISTORY_ENGINE_METRICS.filter(
                                (metric) =>
                                    metricHasData(lapFrames, metric.key, 4),
                            );
                            const suspensionMetrics =
                                HISTORY_SUSPENSION_METRICS.filter((metric) =>
                                    metricHasData(lapFrames, metric.key, 4),
                                );

                            return (
                                <HistoryLapCard
                                    key={lapNum}
                                    lapNum={lapNum}
                                    currentLap={currentLap}
                                    lapFrames={lapFrames}
                                    lapTimeMs={lapTimeVal}
                                    engineMetrics={engineMetrics}
                                    suspensionMetrics={suspensionMetrics}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
