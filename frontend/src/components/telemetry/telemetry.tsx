import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";
import { formatTime } from "./lap-methods";

interface TelemetryProps {
    currentLapTimeMs: number;
}

export const Telemetry = ({ currentLapTimeMs }: TelemetryProps) => {
    const history = useTelemetryStore((state: any) => state.history);

    // showing last 200 frames
    const recentHistory = history.slice(-200);

    return (
        <div className="w-full overflow-hidden grid grid-cols-[auto_1fr] gap-1">
            <pre className="text-xs p-3 border rounded overflow-auto font-mono h-100">
                Total frames captured: {history.length}
                {JSON.stringify(history, null, 2)}
            </pre>
            <div className="flex flex-col gap-1">
                <p className="text-sm font-mono border rounded px-2 h-fit">
                    Current Laptime: {formatTime(currentLapTimeMs)}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="speedKmh"
                        color="rgba(236, 72, 153, 1)"
                        label="Speed (km/h)"
                    />
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="rpms"
                        color="rgba(59, 130, 246, 1)"
                        label="RPM"
                    />
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="gas"
                        color="rgba(16, 185, 129, 1)"
                        label="Throttle"
                        minY={0}
                        maxY={1}
                    />
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="brake"
                        color="rgba(239, 68, 68, 1)"
                        label="Brake"
                        minY={0}
                        maxY={1}
                    />
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="steerAngle"
                        color="rgba(139, 92, 246, 1)"
                        label="Steer Angle"
                        minY={-1}
                        maxY={1}
                    />
                    <TelemetryGraph
                        data={recentHistory}
                        dataKey="gear"
                        color="rgba(245, 158, 11, 1)"
                        label="Gear"
                    />
                </div>
            </div>
        </div>
    );
};
