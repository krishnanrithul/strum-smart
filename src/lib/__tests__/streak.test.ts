import { describe, it, expect } from "vitest";
import {
  computeStreak,
  minutesPracticedOn,
  toLocalDay,
} from "@/lib/streak";

// Tests pin TZ to Asia/Kolkata (see vitest.config.ts) so local and UTC
// calendar dates diverge predictably. 06:00Z is late morning there, safely
// inside the same calendar day.
const onDay = (day: string) => `${day}T06:00:00.000Z`;
const session = (day: string, duration = 600) => ({
  date: onDay(day),
  duration,
});

describe("toLocalDay", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(toLocalDay("2026-09-25T06:00:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("resolves an instant to the user's calendar date, not UTC's", () => {
    // 20:30Z is 02:00 the next morning in Asia/Kolkata.
    expect(toLocalDay("2026-09-24T20:30:00.000Z")).toBe("2026-09-25");
  });
});

describe("computeStreak", () => {
  it("is zero with no sessions", () => {
    expect(computeStreak([], "2026-09-25")).toBe(0);
  });

  it("counts a single day practiced today", () => {
    expect(computeStreak([session("2026-09-25")], "2026-09-25")).toBe(1);
  });

  it("counts consecutive days back from today", () => {
    const sessions = [
      session("2026-09-25"),
      session("2026-09-24"),
      session("2026-09-23"),
    ];

    expect(computeStreak(sessions, "2026-09-25")).toBe(3);
  });

  it("stops at the first missed day", () => {
    const sessions = [session("2026-09-25"), session("2026-09-23")];

    expect(computeStreak(sessions, "2026-09-25")).toBe(1);
  });

  // A streak is a current run, so missing today resets it regardless of how
  // long yesterday's run was.
  it("is zero when today has no session", () => {
    const sessions = [
      session("2026-09-24"),
      session("2026-09-23"),
      session("2026-09-22"),
    ];

    expect(computeStreak(sessions, "2026-09-25")).toBe(0);
  });

  it("counts a day once however many sessions it holds", () => {
    const sessions = [
      session("2026-09-25", 300),
      session("2026-09-25", 900),
      session("2026-09-24"),
    ];

    expect(computeStreak(sessions, "2026-09-25")).toBe(2);
  });

  it("does not depend on the order sessions arrive in", () => {
    const sessions = [
      session("2026-09-23"),
      session("2026-09-25"),
      session("2026-09-24"),
    ];

    expect(computeStreak(sessions, "2026-09-25")).toBe(3);
  });

  it("carries across a month boundary", () => {
    const sessions = [session("2026-10-01"), session("2026-09-30")];

    expect(computeStreak(sessions, "2026-10-01")).toBe(2);
  });

  it("carries across a year boundary", () => {
    const sessions = [session("2027-01-01"), session("2026-12-31")];

    expect(computeStreak(sessions, "2027-01-01")).toBe(2);
  });

  // The original implementation read the UTC date off the ISO string but
  // compared it against the local date, so anything practiced before 05:30
  // local was filed under the previous day and silently broke the streak.
  describe("late-night practice (regression)", () => {
    it("credits a session played after midnight to that local day", () => {
      const afterMidnight = { date: "2026-09-24T20:30:00.000Z", duration: 600 };

      expect(computeStreak([afterMidnight], "2026-09-25")).toBe(1);
    });

    it("keeps a streak alive across a late-night session", () => {
      const sessions = [
        { date: "2026-09-24T20:30:00.000Z", duration: 600 }, // 02:00 on the 25th
        session("2026-09-24"),
        session("2026-09-23"),
      ];

      expect(computeStreak(sessions, "2026-09-25")).toBe(3);
    });
  });
});

describe("minutesPracticedOn", () => {
  it("is zero with no sessions", () => {
    expect(minutesPracticedOn([], "2026-09-25")).toBe(0);
  });

  it("totals every session on the day", () => {
    const sessions = [
      session("2026-09-25", 600),
      session("2026-09-25", 900),
    ];

    expect(minutesPracticedOn(sessions, "2026-09-25")).toBe(25);
  });

  it("ignores other days", () => {
    const sessions = [
      session("2026-09-25", 600),
      session("2026-09-24", 3000),
    ];

    expect(minutesPracticedOn(sessions, "2026-09-25")).toBe(10);
  });

  it("floors part minutes", () => {
    expect(minutesPracticedOn([session("2026-09-25", 119)], "2026-09-25")).toBe(
      1,
    );
  });

  it("counts a late-night session toward that local day", () => {
    const afterMidnight = { date: "2026-09-24T20:30:00.000Z", duration: 1200 };

    expect(minutesPracticedOn([afterMidnight], "2026-09-25")).toBe(20);
  });
});
