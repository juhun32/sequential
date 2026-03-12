import type { MetricConfig } from "../../types/telemetry";

type MetricToggleGroupProps = {
    title: string;
    metrics: MetricConfig[];
    selectedMetrics: string[];
    onToggle: (key: string) => void;
};

export const MetricToggleGroup = ({
    title,
    metrics,
    selectedMetrics,
    onToggle,
}: MetricToggleGroupProps) => {
    return (
        <div>
            <p className="text-xs font-mono mb-1">{title}</p>
            <div className="flex flex-wrap gap-1">
                {metrics.map((metric) => {
                    const isSelected = selectedMetrics.includes(metric.key);
                    return (
                        <button
                            key={`sel-${metric.key}`}
                            type="button"
                            onClick={() => onToggle(metric.key)}
                            className={`text-xs font-mono border px-2 py-0.5 ${
                                isSelected ? "bg-black text-white" : ""
                            }`}
                        >
                            {metric.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
