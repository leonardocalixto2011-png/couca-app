import { describe, it, expect } from "vitest";
import {
  bookingDurationMin,
  overlaps,
  generateSlotMinutes,
  minutesToLabel,
  labelToMinutes,
  type DayWindow,
} from "./availability";

const OPEN: DayWindow = { isOpen: true, openMin: 600, closeMin: 1080 }; // 10:00–18:00

describe("bookingDurationMin", () => {
  it("adds 15 min per add-on", () => {
    expect(bookingDurationMin(60, 0)).toBe(60);
    expect(bookingDurationMin(60, 2)).toBe(90);
    expect(bookingDurationMin(45, 3)).toBe(90);
  });
});

describe("overlaps", () => {
  it("detects overlap and abutment correctly", () => {
    expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 630, endMin: 690 })).toBe(true);
    expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 660, endMin: 720 })).toBe(false); // back-to-back is fine
    expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 540, endMin: 600 })).toBe(false);
  });
});

describe("generateSlotMinutes", () => {
  it("returns nothing when closed", () => {
    expect(generateSlotMinutes({ day: { ...OPEN, isOpen: false }, durationMin: 60, busy: [] })).toEqual([]);
  });

  it("fills the open window on a 15-min grid, leaving room for the service", () => {
    const slots = generateSlotMinutes({ day: OPEN, durationMin: 60, busy: [] });
    expect(slots[0]).toBe(600); // 10:00
    expect(slots.at(-1)).toBe(1020); // 17:00 -> ends 18:00
    expect(slots).toContain(615);
  });

  it("excludes candidates that collide with existing bookings", () => {
    const busy = [{ startMin: 660, endMin: 750 }]; // 11:00–12:30 booked
    const slots = generateSlotMinutes({ day: OPEN, durationMin: 60, busy });
    expect(slots).not.toContain(660);
    expect(slots).not.toContain(690);
    expect(slots).not.toContain(720); // 12:00 start would end 13:00, still overlaps tail
    expect(slots).toContain(600); // 10:00–11:00 ok
    expect(slots).toContain(750); // 12:30 start ok
  });

  it("honours earliestStartMin (lead time)", () => {
    const slots = generateSlotMinutes({ day: OPEN, durationMin: 60, busy: [], earliestStartMin: 840 });
    expect(slots[0]).toBe(840); // 14:00
    expect(slots).not.toContain(600);
  });

  it("longer services push the last bookable start earlier", () => {
    const long = generateSlotMinutes({ day: OPEN, durationMin: 120, busy: [] });
    expect(long.at(-1)).toBe(960); // 16:00 -> ends 18:00
  });
});

describe("label helpers", () => {
  it("round-trips", () => {
    expect(minutesToLabel(570)).toBe("09:30");
    expect(minutesToLabel(600)).toBe("10:00");
    expect(labelToMinutes("14:45")).toBe(885);
  });
});
