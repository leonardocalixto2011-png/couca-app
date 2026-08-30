/**
 * Slot generation — pure functions, no DB. Tested in availability.test.ts.
 *
 * Times inside the studio day are handled as "minutes from midnight" in the
 * studio timezone; callers convert the chosen slot to a real Date at the edge.
 */
import { SLOT_STEP_MIN } from "./policy";

export type Interval = { startMin: number; endMin: number };

export type DayWindow = {
  isOpen: boolean;
  openMin: number;
  closeMin: number;
};

/** Total chair time for a booking: base length + 15 min per add-on. */
export function bookingDurationMin(baseMin: number, addonCount: number): number {
  return baseMin + addonCount * 15;
}

/** True when [aStart,aEnd) and [bStart,bEnd) overlap. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/**
 * Candidate start times (minutes from midnight) for a service of `durationMin`,
 * within the open window, on a `step` grid, excluding anything that collides
 * with a busy interval or starts before `earliestStartMin`.
 */
export function generateSlotMinutes(opts: {
  day: DayWindow;
  durationMin: number;
  busy: Interval[];
  earliestStartMin?: number;
  step?: number;
}): number[] {
  const { day, durationMin, busy } = opts;
  const step = opts.step ?? SLOT_STEP_MIN;
  const earliest = opts.earliestStartMin ?? 0;
  if (!day.isOpen || durationMin <= 0) return [];

  const lastStart = day.closeMin - durationMin;
  const out: number[] = [];
  for (let start = day.openMin; start <= lastStart; start += step) {
    if (start < earliest) continue;
    const candidate: Interval = { startMin: start, endMin: start + durationMin };
    if (busy.some((b) => overlaps(candidate, b))) continue;
    out.push(start);
  }
  return out;
}

/** "570" -> "09:30" */
export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "09:30" -> 570 */
export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}
