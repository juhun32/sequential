import { formatTime, getSectorTimesForFrames } from "./lap-methods";
import { TelemetrySection } from "./telemetry-section";
import type { TelemetryFrame } from "./lap-methods";
import type { MetricConfig } from "../../types/telemetry";

type HistoryLapCardProps = {
    lapNum: number;
    currentLap: number;
    lapFrames: TelemetryFrame[];
    lapTimeMs: number;
    engineMetrics: MetricConfig[];
    suspensionMetrics: MetricConfig[];
};

export const HistoryLapCard = ({
    lapNum,
    currentLap,
    lapFrames,
    lapTimeMs,
    engineMetrics,
    suspensionMetrics,
}: HistoryLapCardProps) => {
    const sectorTimes = getSectorTimesForFrames(lapFrames);

    return (
        <div className="space-y-2 pl-2 border-l border-white/10">
            <div className="flex items-baseline gap-2 border-b pb-1">
                {lapNum === currentLap && (
                    <span className="text-xs text-green-400 px-1 border border-green-400/50">
                        LIVE
                    </span>
                )}

                <h3 className="text-sm">LAP {lapNum}</h3>
                <span className="text-sm font-mono flex items-baseline">
                    {formatTime(lapTimeMs)}

                    <p className="text-xs text-gray-500 font-mono ml-2">
                        S1 {formatTime(sectorTimes[1])} | S2{" "}
                        {formatTime(sectorTimes[2])} | S3{" "}
                        {formatTime(sectorTimes[3])}
                    </p>
                </span>

                <span className="text-xs text-gray-500 font-mono ml-auto">
                    {lapFrames.length} samples
                </span>
            </div>

            <div className="border p-2 bg-panel">
                <h4 className="text-xs font-mono text-gray-400 tracking-wide mb-2">
                    Engine and Control Metrics
                </h4>
                <TelemetrySection
                    title="Engine History"
                    data={lapFrames}
                    metrics={engineMetrics}
                    showHeader={false}
                    containerClassName="p-0"
                />
            </div>

            <div className="border p-2 bg-panel">
                <h4 className="text-xs font-mono text-gray-400 tracking-wide mb-2">
                    Suspension Metrics
                </h4>
                <TelemetrySection
                    title="Suspension History"
                    data={lapFrames}
                    metrics={suspensionMetrics}
                    showHeader={false}
                    containerClassName="p-0"
                />
            </div>
        </div>
    );
};
