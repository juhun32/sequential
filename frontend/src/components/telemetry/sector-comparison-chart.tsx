import { LAP_COLORS, RENDER_POINTS_PER_SECTOR } from "./telemetry-config";
import { metricHasData } from "./lap-methods";
import type { LapSectors } from "../../types/telemetry";
import { sampleForRender } from "../../lib/telemetry";

type SectorComparisonChartProps = {
    compareLaps: number[];
    currentLap: number;
    sortedLaps: number[];
    lapSectors: LapSectors;
    compareMetric: string;
    min: number;
    max: number;
};

export const SectorComparisonChart = ({
    compareLaps,
    currentLap,
    sortedLaps,
    lapSectors,
    compareMetric,
    min,
    max,
}: SectorComparisonChartProps) => {
    if (compareLaps.length === 0) {
        return (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                Select laps from the sidebar to compare.
            </div>
        );
    }

    return (
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
                const color = LAP_COLORS[colorIdx % LAP_COLORS.length];
                const range = max - min || 1;
                const sectorWidth = 100 / 3;

                return [1, 2, 3].map((sector) => {
                    const data = lapSectors[lapNum]?.[sector] ?? [];
                    if (!data.length) return null;
                    if (!metricHasData(data, compareMetric, 2)) return null;

                    const sampledData = sampleForRender(
                        data,
                        RENDER_POINTS_PER_SECTOR,
                    );

                    const stepX =
                        sampledData.length > 1
                            ? sectorWidth / (sampledData.length - 1)
                            : 0;
                    const startX = (sector - 1) * sectorWidth;

                    const points = sampledData
                        .map((frame, idx) => {
                            const x = startX + idx * stepX;
                            const val = Number(frame[compareMetric]);
                            const safeVal = Number.isFinite(val) ? val : min;
                            const normalizedY = (safeVal - min) / range;
                            const y = 100 - normalizedY * 100;
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
                                lapNum === currentLap ? "0.95" : "0.72"
                            }
                            vectorEffect="non-scaling-stroke"
                            opacity={lapNum === currentLap ? 1 : 0.72}
                        />
                    );
                });
            })}
        </svg>
    );
};
