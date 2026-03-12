import type { TelemetryFrame } from "../components/telemetry/lap-methods";

export type MetricSection = "engine" | "suspension";

export type MetricConfig = {
    key: string;
    label: string;
    section: MetricSection;
    color: string;
    minY?: number;
    maxY?: number;
};

export type LapSectors = Record<number, Record<number, TelemetryFrame[]>>;
