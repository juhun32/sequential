import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";

export const Telemetry = () => {
    const history = useTelemetryStore((state: any) => state.history);

    // showing last 200 frames
    const recentHistory = history.slice(-200);

    return (
        <div className="w-full overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Gas"
                    color="#10b981"
                    label="Gas"
                    minY={0}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Brake"
                    color="#ef4444"
                    label="Brake"
                    minY={0}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Gear"
                    color="#f59e0b"
                    label="Gear"
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Rpms"
                    color="#3b82f6"
                    label="RPM"
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="SteerAngle"
                    color="#8b5cf6"
                    label="Steer Angle"
                    minY={-1}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="SpeedKmh"
                    color="#ec4899"
                    label="Speed (km/h)"
                />
            </div>
            <div className="text-xs font-mono">
                Total Frames Captured: {history.length}
            </div>
            <pre className="text-xs p-4 border rounded overflow-auto max-h-[400px] font-mono">
                {JSON.stringify(history, null, 2)}
            </pre>
        </div>
    );
};
