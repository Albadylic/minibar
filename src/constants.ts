import type { DrinkType, SeatPosition } from "./types";

export const DRINKS: { type: DrinkType; label: string; color: string }[] = [
  { type: "ale", label: "Ale", color: "#c87533" },
  { type: "stout", label: "Stout", color: "#3b2314" },
  { type: "lager", label: "Lager", color: "#f0c040" },
];

// 11 seats around a horseshoe bar: 3 left, 5 front, 3 right
// Coordinates are percentages of the game board
export const SEATS: SeatPosition[] = [
  // Left side (top to bottom)
  { id: 0, side: "left", x: 12, y: 22, entryX: 2, entryY: 22 },
  { id: 1, side: "left", x: 12, y: 37, entryX: 2, entryY: 37 },
  { id: 2, side: "left", x: 12, y: 52, entryX: 2, entryY: 52 },
  // Front (left to right, below the bar bottom)
  { id: 3, side: "front", x: 24, y: 75, entryX: 24, entryY: 92 },
  { id: 4, side: "front", x: 37, y: 75, entryX: 37, entryY: 92 },
  { id: 5, side: "front", x: 50, y: 75, entryX: 50, entryY: 92 },
  { id: 6, side: "front", x: 63, y: 75, entryX: 63, entryY: 92 },
  { id: 7, side: "front", x: 76, y: 75, entryX: 76, entryY: 92 },
  // Right side (top to bottom)
  { id: 8, side: "right", x: 88, y: 22, entryX: 98, entryY: 22 },
  { id: 9, side: "right", x: 88, y: 37, entryX: 98, entryY: 37 },
  { id: 10, side: "right", x: 88, y: 52, entryX: 98, entryY: 52 },
];

// Timing
export const CUSTOMER_MAX_WAIT = 12; // seconds
export const INITIAL_SPAWN_INTERVAL = 4; // seconds
export const MIN_SPAWN_INTERVAL = 1.5; // seconds
export const WALK_DURATION = 1.2; // seconds
export const FEEDBACK_DURATION = 0.8; // seconds before walking out after serve

// Rating
export const INITIAL_RATING = 2.5;
export const MAX_RATING = 5;
export const RATING_CORRECT = 0.25;
export const RATING_WRONG = -1;
export const RATING_TIMEOUT = -0.5;

// Score
export const SCORE_PER_SERVE = 50;
export const FAST_SERVE_MULTIPLIER = 2;
export const FAST_SERVE_THRESHOLD = 0.75; // >75% time remaining = fast

// Difficulty ramp: spawn interval decreases over time
export const DIFFICULTY_RAMP_RATE = 0.05; // seconds decrease per second elapsed

// Customer colors (no yellow/brown/orange - those overlap with drink colors)
export const CUSTOMER_COLORS = [
  "#e06090",
  "#50b0e0",
  "#70c070",
  "#b050e0",
  "#c070c0",
  "#e08080",
  "#60d0b0",
  "#a0d0f0",
];

// Bar workers
export const WORKER_COLOR = "#e0e0e0";
export const WORKER_COUNT = 3;
export const WORKER_SPEED = 28; // percentage units per second
export const WORKER_PAUSE_MIN = 0.4;
export const WORKER_PAUSE_MAX = 1.0;

// Inner-bar service positions (inside the bar, near each seat)
export const BAR_SERVICE_POSITIONS: { x: number; y: number }[] = [
  // Left inner edge (matching seats 0-2)
  { x: 24, y: 22 },
  { x: 24, y: 37 },
  { x: 24, y: 52 },
  // Bottom inner edge (matching seats 3-7)
  { x: 28, y: 62 },
  { x: 39, y: 62 },
  { x: 50, y: 62 },
  { x: 61, y: 62 },
  { x: 72, y: 62 },
  // Right inner edge (matching seats 8-10)
  { x: 76, y: 22 },
  { x: 76, y: 37 },
  { x: 76, y: 52 },
];

// Barrel pickup positions inside the bar (below the barrel labels)
export const BARREL_POSITIONS: { x: number; y: number }[] = [
  { x: 38, y: 30 },
  { x: 50, y: 30 },
  { x: 62, y: 30 },
];
