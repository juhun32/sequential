import { useTelemetryStore } from "../../store/store";

export const Tachometer = () => {
    const history = useTelemetryStore((state: any) => state.history);

    return (
        <div className="w-full overflow-hidden flex flex-col gap-2">
            <div className="text-xs font-mono">
                Total Frames Captured: {history.length}
            </div>
            <pre className="text-xs p-4 border rounded overflow-auto max-h-[400px] font-mono">
                {JSON.stringify(history, null, 2)}
            </pre>
        </div>
    );
};
