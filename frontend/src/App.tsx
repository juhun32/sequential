import { useMemo } from "react";
import { useSocket } from "./hooks/socket";
import { Telemetry } from "./components/telemetry/telemetry";
import { LapList } from "./components/telemetry/lap-list";
import { useTelemetryStore } from "./store/store";
import {
    getLapTimeForLap,
    groupFramesByLap,
} from "./components/telemetry/lap-methods";

function App() {
    const sessionId = "live_session_1";
    const history = useTelemetryStore((state: any) => state.history);
    const currentLap = useTelemetryStore((state: any) => state.currentLap);

    useSocket(sessionId);

    const currentLapTimeMs = useMemo(() => {
        const laps = groupFramesByLap(history);
        return getLapTimeForLap(laps, currentLap);
    }, [history, currentLap]);

    return (
        <div className="min-h-screen bg-background font-mono p-8 mx-auto">
            <header>
                <h1 className="tracking-tighter">
                    SEQUENTIAL //{" "}
                    <span className="text-gray-400">{sessionId}</span>
                </h1>
            </header>

            <Telemetry currentLapTimeMs={currentLapTimeMs} />
            <LapList />
        </div>
    );
}

export default App;
