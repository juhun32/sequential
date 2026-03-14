import { useSocket } from "./hooks/socket";
import { Telemetry } from "./components/telemetry/telemetry";
import { LapList } from "./components/telemetry/lap-list";
import { useTelemetryStore } from "./store/store";

function App() {
    const sessionId = "live_session_1";
    const latestFrame = useTelemetryStore((state: any) => state.latestFrame);
    const currentLap = useTelemetryStore((state: any) => state.currentLap);

    useSocket(sessionId);

    const currentLapTimeMs =
        Number(latestFrame?.lap) === Number(currentLap)
            ? Number(latestFrame?.currentLapTime ?? 0)
            : 0;

    return (
        <div className="min-h-screen bg-background font-mono p-8 mx-auto">
            <header>
                <h1 className="tracking-tighter">
                    SEQUENTIAL{" "}
                    <span className="text-gray-400 text-xs">{sessionId}</span>
                </h1>
            </header>

            <Telemetry currentLapTimeMs={currentLapTimeMs} />
            <LapList />
        </div>
    );
}

export default App;
