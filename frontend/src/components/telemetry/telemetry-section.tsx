import { TelemetryGraph } from "./graph";
import type { TelemetryFrame } from "./lap-methods";
import type { MetricConfig } from "../../types/telemetry";

type TelemetrySectionProps = {
    title: string;
    data: TelemetryFrame[];
    metrics: MetricConfig[];
    emptyMessage?: string;
    showHeader?: boolean;
    containerClassName?: string;
};

export const TelemetrySection = ({
    title,
    data,
    metrics,
    emptyMessage,
    showHeader = true,
    containerClassName = "border p-2",
}: TelemetrySectionProps) => {
    return (
        <div className={containerClassName}>
            {showHeader && (
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono tracking-wide">{title}</h3>
                </div>
            )}

            {metrics.length === 0 ? (
                <div className="text-xs text-gray-500 font-mono border p-2 bg-foreground">
                    {emptyMessage ?? "No data available for this section."}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                    {metrics.map((metric) => (
                        <TelemetryGraph
                            key={`${title}-${metric.key}`}
                            data={data}
                            dataKey={metric.key}
                            color={metric.color}
                            label={metric.label}
                            minY={metric.minY}
                            maxY={metric.maxY}
                            maxPoints={120}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
