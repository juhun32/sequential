import { useMemo } from "react";
import type { TelemetryFrame } from "./lap-methods";
import { sampleForRender } from "../../lib/telemetry";

interface TelemetryGraphProps {
    data: TelemetryFrame[];
    dataKey: string;
    color: string;
    label: string;
    minY?: number;
    maxY?: number;
    showGrid?: boolean;
    maxPoints?: number;
}

export const TelemetryGraph = ({
    data,
    dataKey,
    color,
    label,
    minY,
    maxY,
    showGrid = true,
    maxPoints = 140,
}: TelemetryGraphProps) => {
    const height = 50;

    const renderData = useMemo(
        () => sampleForRender(data, maxPoints),
        [data, maxPoints],
    );

    const points = useMemo(() => {
        if (!renderData.length) return "";

        const numericValues = renderData
            .map((d) => Number(d[dataKey]))
            .filter((value) => Number.isFinite(value));

        if (numericValues.length === 0) return "";

        let min = minY ?? Infinity;
        let max = maxY ?? -Infinity;

        if (minY === undefined || maxY === undefined) {
            numericValues.forEach((val) => {
                if (val < min) min = val;
                if (val > max) max = val;
            });
        }

        // prevent division by zero if flat line
        if (min === max) {
            min -= 1;
            max += 1;
        }

        const range = max - min;
        const stepX = 100 / (renderData.length - 1 || 1);

        return renderData
            .map((d, i) => {
                const x = i * stepX;
                const rawValue = Number(d[dataKey]);
                const val = Number.isFinite(rawValue) ? rawValue : min;
                // invert Y because SVG coords start topleft
                const normalizedY = (val - min) / range;
                const y = height - normalizedY * height;
                return `${x},${y}`;
            })
            .join(" ");
    }, [renderData, dataKey, minY, maxY]);

    const rawCurrentValue =
        data.length > 0 ? Number(data[data.length - 1][dataKey]) : NaN;
    const currentValue = Number.isFinite(rawCurrentValue)
        ? rawCurrentValue
        : null;

    return (
        <div className="border p-2 bg-foreground">
            <div className="flex justify-between items-center text-xs font-mono mb-2 text-gray-400">
                <span className="uppercase tracking-wider">{label}</span>
                <span style={{ color }} className="font-bold">
                    {currentValue === null ? "--" : currentValue.toFixed(2)}
                </span>
            </div>
            <div className="relative h-24 w-full overflow-hidden">
                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    {showGrid && (
                        <>
                            {Array.from({ length: 11 }, (_, i) => (
                                <line
                                    key={`v-${i}`}
                                    x1={i * 10}
                                    y1={0}
                                    x2={i * 10}
                                    y2={height}
                                    stroke="rgba(148, 163, 184, 0.12)"
                                    strokeWidth="0.22"
                                />
                            ))}
                            {Array.from({ length: 6 }, (_, i) => (
                                <line
                                    key={`h-${i}`}
                                    x1={0}
                                    y1={(i * height) / 5}
                                    x2={100}
                                    y2={(i * height) / 5}
                                    stroke="rgba(148, 163, 184, 0.12)"
                                    strokeWidth="0.22"
                                />
                            ))}
                        </>
                    )}
                    <polyline
                        fill="none"
                        stroke={color}
                        strokeWidth="0.9"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </div>
    );
};
