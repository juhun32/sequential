import type { MetricConfig } from "../../types/telemetry";

export const LIVE_METRICS: MetricConfig[] = [
    {
        key: "speedKmh",
        label: "Speed",
        section: "engine",
        color: "rgba(236, 72, 153, 1)",
    },
    {
        key: "rpms",
        label: "RPM",
        section: "engine",
        color: "rgba(59, 130, 246, 1)",
    },
    {
        key: "gas",
        label: "Throttle",
        section: "engine",
        color: "rgba(16, 185, 129, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "brake",
        label: "Brake",
        section: "engine",
        color: "rgba(239, 68, 68, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "steerAngle",
        label: "Steer",
        section: "engine",
        color: "rgba(139, 92, 246, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "gear",
        label: "Gear",
        section: "engine",
        color: "rgba(245, 158, 11, 1)",
    },
    {
        key: "fuel",
        label: "Fuel",
        section: "engine",
        color: "rgba(234, 179, 8, 1)",
    },
    {
        key: "chassisPitch",
        label: "Pitch",
        section: "suspension",
        color: "rgba(192, 132, 252, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisRoll",
        label: "Roll",
        section: "suspension",
        color: "rgba(56, 189, 248, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisYaw",
        label: "Yaw",
        section: "suspension",
        color: "rgba(99, 102, 241, 1)",
    },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        section: "suspension",
        color: "rgba(14, 165, 233, 1)",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        section: "suspension",
        color: "rgba(20, 184, 166, 1)",
    },
    {
        key: "chassisHeave",
        label: "Heave",
        section: "suspension",
        color: "rgba(244, 114, 182, 1)",
    },
];

export const DEFAULT_LIVE_SELECTED_METRICS = [
    "speedKmh",
    "chassisPitch",
    "chassisRoll",
    "chassisYaw",
    "rideHeightFront",
    "rideHeightRear",
];

export const COMPARE_METRICS: MetricConfig[] = [
    { key: "speedKmh", label: "Speed", section: "engine", color: "#60a5fa" },
    { key: "rpms", label: "RPM", section: "engine", color: "#f87171" },
    {
        key: "gas",
        label: "Throttle",
        section: "engine",
        color: "#4ade80",
        minY: 0,
        maxY: 1,
    },
    {
        key: "brake",
        label: "Brake",
        section: "engine",
        color: "#fbbf24",
        minY: 0,
        maxY: 1,
    },
    {
        key: "steerAngle",
        label: "Steering",
        section: "engine",
        color: "#a855f7",
        minY: -1,
        maxY: 1,
    },
    { key: "gear", label: "Gear", section: "engine", color: "#0ea5e9" },
    { key: "fuel", label: "Fuel", section: "engine", color: "#eab308" },
    {
        key: "chassisHeave",
        label: "Heave",
        section: "suspension",
        color: "#f472b6",
    },
    {
        key: "chassisPitch",
        label: "Pitch",
        section: "suspension",
        color: "#c084fc",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisRoll",
        label: "Roll",
        section: "suspension",
        color: "#38bdf8",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisYaw",
        label: "Yaw",
        section: "suspension",
        color: "#6366f1",
    },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        section: "suspension",
        color: "#14b8a6",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        section: "suspension",
        color: "#06b6d4",
    },
    {
        key: "suspensionBalance",
        label: "F/R Balance",
        section: "suspension",
        color: "#facc15",
    },
];

export const HISTORY_ENGINE_METRICS: MetricConfig[] = [
    {
        key: "speedKmh",
        label: "Speed",
        section: "engine",
        color: "rgba(96, 165, 250, 1)",
    },
    {
        key: "rpms",
        label: "RPM",
        section: "engine",
        color: "rgba(248, 113, 113, 1)",
    },
    {
        key: "gas",
        label: "Throttle",
        section: "engine",
        color: "rgba(74, 222, 128, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "brake",
        label: "Brake",
        section: "engine",
        color: "rgba(251, 191, 36, 1)",
        minY: 0,
        maxY: 1,
    },
    {
        key: "steerAngle",
        label: "Steering",
        section: "engine",
        color: "rgba(168, 85, 247, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "gear",
        label: "Gear",
        section: "engine",
        color: "rgba(14, 165, 233, 1)",
    },
];

export const HISTORY_SUSPENSION_METRICS: MetricConfig[] = [
    {
        key: "chassisPitch",
        label: "Chassis Pitch",
        section: "suspension",
        color: "rgba(192, 132, 252, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisRoll",
        label: "Chassis Roll",
        section: "suspension",
        color: "rgba(56, 189, 248, 1)",
        minY: -1,
        maxY: 1,
    },
    {
        key: "chassisYaw",
        label: "Chassis Yaw",
        section: "suspension",
        color: "rgba(99, 102, 241, 1)",
    },
    {
        key: "rideHeightFront",
        label: "Ride Height Front",
        section: "suspension",
        color: "rgba(20, 184, 166, 1)",
    },
    {
        key: "rideHeightRear",
        label: "Ride Height Rear",
        section: "suspension",
        color: "rgba(14, 165, 233, 1)",
    },
];

export const LAP_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
];

export const SAMPLE_MIN_LIVE_LAP = 12;
export const SAMPLE_MIN_FINISHED_LAP = 50;
export const RENDER_POINTS_PER_SECTOR = 110;
