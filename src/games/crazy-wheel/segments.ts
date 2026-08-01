/** Crazy Wheel segments — colored wedges with payout multipliers. */

export type WheelSegment = {
  id: string;
  label: string;
  /** Payout multiplier on stake (integer-friendly: stored as ×100 for display) */
  mult: number;
  color: string;
  /** Relative weight for spin landing (higher = more common) */
  weight: number;
};

/** Left → right around the arc (screen coords). */
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: "red", label: "x2", mult: 2, color: "#EF4444", weight: 18 },
  { id: "purple", label: "x3", mult: 3, color: "#8B5CF6", weight: 12 },
  { id: "orange", label: "x2", mult: 2, color: "#F97316", weight: 18 },
  { id: "gold", label: "x5", mult: 5, color: "#EAB308", weight: 6 },
  { id: "yellow", label: "x3", mult: 3, color: "#FDE047", weight: 12 },
  { id: "lime", label: "x2", mult: 2, color: "#84CC16", weight: 18 },
  { id: "green", label: "x10", mult: 10, color: "#22C55E", weight: 3 },
];

export function pickWeightedIndex(segments: WheelSegment[] = WHEEL_SEGMENTS): number {
  const total = segments.reduce((s, seg) => s + seg.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < segments.length; i++) {
    r -= segments[i].weight;
    if (r <= 0) return i;
  }
  return segments.length - 1;
}

/** Angle span for each segment (semicircle π radians). */
export function segmentAngles(count: number): { start: number; end: number; mid: number }[] {
  // Semicircle from π (left) to 0 (right) — top arc
  const span = Math.PI / count;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.PI - i * span;
    const end = start - span;
    return { start, end, mid: (start + end) / 2 };
  });
}
