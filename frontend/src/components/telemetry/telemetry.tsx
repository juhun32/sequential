import { useTelemetryStore } from "../../store/store";
import { TelemetryGraph } from "./graph";

export const Telemetry = () => {
    const history = useTelemetryStore((state: any) => state.history);

    // showing last 200 frames
    const recentHistory = history.slice(-200);

    return (
        <div className="w-full overflow-hidden flex flex-col gap-4">
            <div className="text-xs font-mono">
                Total frames captured: {history.length}
            </div>
            <pre className="text-xs p-3 border rounded overflow-auto max-h-[300px] font-mono">
                {JSON.stringify(history, null, 2)}
            </pre>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Gas"
                    color="rgba(16, 185, 129, 1)"
                    label="Gas"
                    minY={0}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Brake"
                    color="rgba(239, 68, 68, 1)"
                    label="Brake"
                    minY={0}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Gear"
                    color="rgba(245, 158, 11, 1)"
                    label="Gear"
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="Rpms"
                    color="rgba(59, 130, 246, 1)"
                    label="RPM"
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="SteerAngle"
                    color="rgba(139, 92, 246, 1)"
                    label="Steer Angle"
                    minY={-1}
                    maxY={1}
                />
                <TelemetryGraph
                    data={recentHistory}
                    dataKey="SpeedKmh"
                    color="rgba(236, 72, 153, 1)"
                    label="Speed (km/h)"
                />
            </div>
        </div>
    );
};
