import { useMemo, useState } from "react";
import { useTelemetryStore } from "../../store/store";
import {
    formatTime,
    getSectorTimesForFrames,
    groupFramesByLap,
    metricHasData,
    type TelemetryFrame,
} from "./lap-methods";
import {
    DEFAULT_LIVE_SELECTED_METRICS,
    LIVE_METRICS,
} from "./telemetry-config";
import { MetricToggleGroup } from "./metric-toggle-group";
import { TelemetrySection } from "./telemetry-section";
import type { MetricConfig } from "../../types/telemetry";
import { normalizeSector } from "../../lib/telemetry";

interface TelemetryProps {
    currentLapTimeMs: number;
}

export const Telemetry = ({ currentLapTimeMs }: TelemetryProps) => {
    const history = useTelemetryStore(
        (state: any) => state.history as TelemetryFrame[],
    );
    const latestFrame = useTelemetryStore(
        (state: any) => state.latestFrame as TelemetryFrame | null,
    );
    const currentLap = useTelemetryStore((state: any) => state.currentLap);

    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
        DEFAULT_LIVE_SELECTED_METRICS,
    );

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

    const selectableEngineMetrics = selectableMetrics.filter(
        (metric) => metric.section === "engine",
    );
    const selectableSuspensionMetrics = selectableMetrics.filter(
        (metric) => metric.section === "suspension",
    );

    return (
        <div className="w-full overflow-hidden grid grid-cols-[1fr_5fr] gap-1">
            <pre className="text-xs p-2 border font-mono space-y-1 h-fit">
                <p>Total frames: {history.length}</p>
                <p>Live window: {recentHistory.length} samples</p>
                <p>Selectable metrics: {selectableMetrics.length}</p>
                <p>Visible metrics: {selectedMetrics.length}</p>
                {JSON.stringify(recentHistory.slice(-1)[0], null, 2)}
            </pre>

            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-1">
                    <p className="text-sm font-mono border px-2 h-fit">
                        Current Laptime: {formatTime(currentLapTimeMs)}
                    </p>
                    <p className="text-sm font-mono border px-2 h-fit">
                        Sector Times: S1 {formatTime(currentLapSectorTimes[1])}{" "}
                        | S2 {formatTime(currentLapSectorTimes[2])} | S3{" "}
                        {formatTime(currentLapSectorTimes[3])}
                    </p>
                    <p className="text-sm font-mono border px-2 h-fit">
                        Active Sector {currentSector}:{" "}
                        {formatTime(currentSectorTimeMs)}
                    </p>
                </div>

                <MetricToggleGroup
                    title="Engine and Control Metrics"
                    metrics={selectableEngineMetrics}
                    selectedMetrics={selectedMetrics}
                    onToggle={toggleMetric}
                />
                <MetricToggleGroup
                    title="Suspension and Ride Metrics"
                    metrics={selectableSuspensionMetrics}
                    selectedMetrics={selectedMetrics}
                    onToggle={toggleMetric}
                />

                <div className="space-y-2">
                    <TelemetrySection
                        title="Engine and Control Metrics"
                        data={recentHistory}
                        metrics={selectedEngineMetrics}
                        emptyMessage="Select at least one engine metric."
                    />

                    <TelemetrySection
                        title="Suspension and Ride Metrics"
                        data={recentHistory}
                        metrics={selectedSuspensionMetrics}
                        emptyMessage="Select at least one suspension metric."
                    />

                    {selectedEngineMetrics.length === 0 &&
                        selectedSuspensionMetrics.length === 0 && (
                            <div className="border p-2 text-sm text-gray-400 font-mono">
                                Waiting for valid telemetry values...
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};
