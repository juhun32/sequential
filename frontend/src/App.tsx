import { useSocket } from "./hooks/socket";
import { Tachometer } from "./components/telemetry/telemetry";

function App() {
    const sessionId = "live_session_1";
    useSocket(sessionId);

    return (
        <div className="min-h-screen bg-background font-mono p-8">
            <header>
                <h1 className="tracking-tighter">SEQUENTIAL // {sessionId}</h1>
            </header>

            <Tachometer />
        </div>
    );
}

export default App;
