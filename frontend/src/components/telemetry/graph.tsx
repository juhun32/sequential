import { useMemo } from "react";

interface TelemetryGraphProps {
    data: any[];
    dataKey: string;
    color: string;
    label: string;
    minY?: number;
    maxY?: number;
}

export const TelemetryGraph = ({
    data,
    dataKey,
    color,
    label,
    minY,
    maxY,
}: TelemetryGraphProps) => {
    const height = 50;

    const points = useMemo(() => {
        if (!data.length) return "";

        let min = minY ?? Infinity;
        let max = maxY ?? -Infinity;

        if (minY === undefined || maxY === undefined) {
            data.forEach((d) => {
                const val = Number(d[dataKey]);
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
        const stepX = 100 / (data.length - 1 || 1);

        return data
            .map((d, i) => {
                const x = i * stepX;
                const val = Number(d[dataKey]);
                // invert Y because SVG coords start topleft
                const normalizedY = (val - min) / range;
                const y = height - normalizedY * height;
                return `${x},${y}`;
            })
            .join(" ");
    }, [data, dataKey, minY, maxY]);

    const currentValue = data.length > 0 ? data[data.length - 1][dataKey] : 0;

    return (
        <div className="border rounded p-2">
            <div className="flex justify-between items-center text-xs font-mono mb-2 text-gray-400">
                <span className="uppercase tracking-wider">{label}</span>
                <span style={{ color }} className="font-bold">
                    {typeof currentValue === "number"
                        ? currentValue.toFixed(2)
                        : currentValue}
                </span>
            </div>
            <div className="relative h-24 w-full overflow-hidden">
                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <polyline
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </div>
    );
};
