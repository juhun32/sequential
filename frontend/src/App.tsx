import { useSocket } from "./hooks/socket";
import { Telemetry } from "./components/telemetry/telemetry";
import { LapList } from "./components/telemetry/lap-list";

function App() {
    const sessionId = "live_session_1";
    useSocket(sessionId);

    return (
        <div className="min-h-screen bg-background font-mono p-8 max-w-5xl mx-auto">
            <header>
                <h1 className="tracking-tighter">
                    SEQUENTIAL //{" "}
                    <span className="text-gray-400">{sessionId}</span>
                </h1>
            </header>

            <Telemetry />
            <LapList />
        </div>
    );
}

export default App;
