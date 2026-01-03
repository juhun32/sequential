import { useMemo } from "react";
import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";

export const LapList = () => {
    const { history, currentLap } = useTelemetryStore() as any;

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

    return (
        <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold border-b border-gray-800 pb-2 text-gray-100">
                SESSION HISTORY
            </h2>

            {sortedLaps.map((lapNum) => (
                <div
                    key={lapNum}
                    className="bg-gray-900/30 p-4 rounded-lg border border-gray-800"
                >
                    <div className="flex items-baseline gap-4 mb-4">
                        <h3 className="text-xl font-bold text-white">
                            LAP {lapNum}
                        </h3>
                        {lapNum === currentLap && (
                            <span className="text-xs font-bold text-green-400 px-2 py-0.5 rounded bg-green-400/10 animate-pulse">
                                LIVE
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-mono ml-auto">
                            {laps[lapNum].length} SAMPLES
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="SpeedKmh"
                            color="rgba(96, 165, 250, 1)"
                            label="Speed"
                            minY={0}
                            maxY={300}
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Rpms"
                            color="rgba(248, 113, 113, 1)"
                            label="RPM"
                            minY={0}
                            maxY={8000}
                        />
                        <TelemetryGraph
                            data={laps[lapNum]}
                            dataKey="Gas"
                            color="rgba(74, 222, 128, 1)"
                            label="Throttle"
                            minY={0}
                            maxY={1}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
