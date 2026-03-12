import { formatTime } from "./lap-methods";

type LapSelectionSidebarProps = {
    panelKey: string;
    laps: number[];
    currentLap: number;
    selectedLaps: number[];
    onToggle: (lapNum: number) => void;
    getLapTime: (lapNum: number) => number;
    maxHeightClass?: string;
};

export const LapSelectionSidebar = ({
    panelKey,
    laps,
    currentLap,
    selectedLaps,
    onToggle,
    getLapTime,
    maxHeightClass,
}: LapSelectionSidebarProps) => {
    return (
        <div
            className={`${maxHeightClass ?? "max-h-[256px]"} overflow-y-auto space-y-1 border p-2`}
        >
            {laps.map((lapNum) => (
                <label
                    key={`${panelKey}-${lapNum}`}
                    className="flex items-start gap-2 text-xs font-mono cursor-pointer hover:bg-white/5"
                >
                    <input
                        type="checkbox"
                        checked={selectedLaps.includes(lapNum)}
                        onChange={() => onToggle(lapNum)}
                    />
                    <span>
                        Lap {lapNum} {lapNum === currentLap && "(Live)"}
                        <p className="text-gray-500">
                            {formatTime(getLapTime(lapNum))}
                        </p>
                    </span>
                </label>
            ))}
        </div>
    );
};
