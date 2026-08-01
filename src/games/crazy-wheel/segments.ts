/** Crazy Wheel segments — matches the live product arc colors. */

export type WheelSegment = {
  id: string;
  label: string;
  mult: number;
  color: string;
  weight: number;
};

/** Left → right around the upper arc (like production Crazy Wheel). */
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: "red", label: "2x", mult: 2, color: "#E85A4F", weight: 16 },
  { id: "purple", label: "3x", mult: 3, color: "#8B5CF6", weight: 11 },
  { id: "orange", label: "2x", mult: 2, color: "#F59E0B", weight: 16 },
  { id: "gold", label: "5x", mult: 5, color: "#EAB308", weight: 6 },
  { id: "yellow", label: "3x", mult: 3, color: "#FACC15", weight: 11 },
  { id: "lime", label: "2x", mult: 2, color: "#A3E635", weight: 16 },
  { id: "green", label: "10x", mult: 10, color: "#4ADE80", weight: 3 },
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

export function segmentAngles(count: number) {
  const span = Math.PI / count;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.PI - i * span;
    const end = start - span;
    return { start, end, mid: (start + end) / 2 };
  });
}
