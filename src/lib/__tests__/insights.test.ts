import { describe, it, expect, beforeEach } from "vitest";
import { generateInsights } from "@/lib/insights";
import {
  makeExercise,
  makeProgressedExercise,
  makeSession,
  daysAgo,
  resetFactories,
} from "@/test/factories";

beforeEach(resetFactories);

// generateInsights is pure, so these are straight input/output assertions.
// The rules run in priority order and the result is capped at 3.

describe("generateInsights", () => {
  it("returns nothing for a brand new account", () => {
    expect(generateInsights([], [], 0, 0)).toEqual([]);
  });

  it("never returns more than 3 insights", () => {
    const exercises = [
      makeExercise({ is_assigned: true }),
      makeProgressedExercise(60, 120, 120, { title: "A" }),
      makeProgressedExercise(60, 120, 120, { title: "B" }),
      makeProgressedExercise(60, 120, 120, { title: "C" }),
    ];

    expect(generateInsights(exercises, [], 7, 0)).toHaveLength(3);
  });

  describe("teacher-assigned exercises", () => {
    // A freshly created exercise has exactly one history entry (the initial
    // bpm written by addExercise), so length <= 1 means "never practiced".
    it("flags an assigned exercise that was never practiced", () => {
      const exercises = [makeExercise({ is_assigned: true })];

      expect(generateInsights(exercises, [], 0, 0)).toContain(
        "You have 1 teacher-assigned exercise you haven't practiced yet.",
      );
    });

    it("pluralises when several are unpractised", () => {
      const exercises = [
        makeExercise({ is_assigned: true }),
        makeExercise({ is_assigned: true }),
      ];

      expect(generateInsights(exercises, [], 0, 0)).toContain(
        "You have 2 teacher-assigned exercises you haven't practiced yet.",
      );
    });

    it("stops flagging once the student has logged a session against it", () => {
      const exercises = [
        makeExercise({
          is_assigned: true,
          history: [
            { date: daysAgo(10), bpm: 80 },
            { date: daysAgo(1), bpm: 85 },
          ],
        }),
      ];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("teacher-assigned"))).toBe(false);
    });

    it("ignores unpractised exercises the student added themselves", () => {
      const exercises = [makeExercise({ is_assigned: false })];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("teacher-assigned"))).toBe(false);
    });

    it("is listed before other insights", () => {
      const exercises = [
        makeExercise({ is_assigned: true }),
        makeProgressedExercise(60, 120, 120),
      ];

      expect(generateInsights(exercises, [], 0, 0)[0]).toContain(
        "teacher-assigned",
      );
    });
  });

  describe("streaks", () => {
    it("celebrates a full week", () => {
      expect(generateInsights([], [], 7, 0)).toContain(
        "You've practiced every day this week — incredible consistency.",
      );
    });

    it("celebrates a streak of 3 or more", () => {
      expect(generateInsights([], [], 3, 0)).toContain(
        "3 days in a row — you're building a real habit.",
      );
      expect(generateInsights([], [], 6, 0)).toContain(
        "6 days in a row — you're building a real habit.",
      );
    });

    it("says nothing for a streak of 1 or 2", () => {
      expect(generateInsights([], [], 1, 0)).toEqual([]);
      expect(generateInsights([], [], 2, 0)).toEqual([]);
    });

    it("nudges a lapsed student who has practiced before", () => {
      const sessions = [makeSession({ date: daysAgo(6) })];

      expect(generateInsights([], sessions, 0, 0)).toContain(
        "You haven't practiced in a few days — even 10 minutes makes a difference.",
      );
    });

    it("does not nudge when the last session was recent", () => {
      const sessions = [makeSession({ date: daysAgo(2) })];

      const insights = generateInsights([], sessions, 0, 0);
      expect(insights.some((i) => i.includes("haven't practiced in"))).toBe(
        false,
      );
    });

    it("uses the most recent session, not the oldest", () => {
      const sessions = [
        makeSession({ date: daysAgo(30) }),
        makeSession({ date: daysAgo(1) }),
      ];

      const insights = generateInsights([], sessions, 0, 0);
      expect(insights.some((i) => i.includes("haven't practiced in"))).toBe(
        false,
      );
    });

    it("treats the nudge threshold as strictly more than 3 days", () => {
      const atThreshold = generateInsights(
        [],
        [makeSession({ date: daysAgo(3) })],
        0,
        0,
      );
      const pastThreshold = generateInsights(
        [],
        [makeSession({ date: daysAgo(4) })],
        0,
        0,
      );

      expect(atThreshold.some((i) => i.includes("haven't practiced in"))).toBe(
        false,
      );
      expect(
        pastThreshold.some((i) => i.includes("haven't practiced in")),
      ).toBe(true);
    });

    it("says nothing when there are no sessions at all", () => {
      expect(generateInsights([], [], 0, 0)).toEqual([]);
    });
  });

  describe("bpm progress", () => {
    it("congratulates hitting the target", () => {
      const exercises = [
        makeProgressedExercise(60, 120, 120, { title: "Spider Walk" }),
      ];

      expect(generateInsights(exercises, [], 0, 0)).toContain(
        "You've hit your target on Spider Walk — consider raising the bar.",
      );
    });

    it("encourages when within 10% of the target", () => {
      const exercises = [
        makeProgressedExercise(60, 92, 100, { title: "Alt Picking" }),
      ];

      expect(generateInsights(exercises, [], 0, 0)).toContain(
        "You're close to your target on Alt Picking — push for it.",
      );
    });

    it("stays quiet when the target is still far off", () => {
      const exercises = [
        makeProgressedExercise(60, 70, 120, { title: "Sweep" }),
      ];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("close to your target"))).toBe(
        false,
      );
      expect(insights.some((i) => i.includes("hit your target"))).toBe(false);
    });

    // addExercise writes target_bpm === current_bpm, so a never-practiced
    // exercise would otherwise read as "target achieved" on day one.
    it("ignores exercises whose target was never raised above the start", () => {
      const exercises = [makeExercise({ currentBpm: 80, targetBpm: 80 })];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("hit your target"))).toBe(false);
    });

    it("ignores exercises with no target set", () => {
      const exercises = [
        makeExercise({ currentBpm: 80, targetBpm: 0 as number }),
      ];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("target"))).toBe(false);
    });
  });

  describe("most improved", () => {
    // Targets are kept at or below the starting bpm so the bpm-progress rule
    // skips these and the most-improved rule is what we're actually reading.
    const improved = (title: string, from: number, to: number) =>
      makeExercise({
        title,
        currentBpm: to,
        targetBpm: from,
        history: [{ date: daysAgo(30), bpm: from }],
      });

    it("names the exercise with the biggest gain", () => {
      const exercises = [improved("Slow Riff", 60, 70), improved("Fast Riff", 60, 120)];

      expect(generateInsights(exercises, [], 0, 0)).toContain(
        "Fast Riff has improved the most — great focus.",
      );
    });

    it("requires more than a 10% gain", () => {
      const exercises = [improved("Barely Moved", 100, 105)];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("improved the most"))).toBe(false);
    });

    it("does not divide by a starting bpm of zero", () => {
      const exercises = [improved("Bad Data", 0, 100)];

      const insights = generateInsights(exercises, [], 0, 0);
      expect(insights.some((i) => i.includes("improved the most"))).toBe(false);
      expect(insights.every((i) => !i.includes("Infinity"))).toBe(true);
    });
  });

  describe("category balance", () => {
    // history[0] is the creation entry, so "practiced recently" is decided by
    // history.slice(1) — entries written by actual sessions.
    it("flags a category with no recent practice", () => {
      const exercises = [makeExercise({ category: "Technical" })];
      const sessions = [makeSession({ date: daysAgo(1) })];

      expect(generateInsights(exercises, sessions, 0, 0)).toContain(
        "You haven't practiced any Technical exercises recently — try to mix it up.",
      );
    });

    it("does not flag a category practiced within the last week", () => {
      const exercises = [
        makeExercise({
          category: "Technical",
          currentBpm: 80,
          targetBpm: 80,
          history: [
            { date: daysAgo(30), bpm: 80 },
            { date: daysAgo(2), bpm: 80 },
          ],
        }),
      ];
      const sessions = [makeSession({ date: daysAgo(1) })];

      expect(generateInsights(exercises, sessions, 0, 0)).toEqual([]);
    });

    it("stays quiet when there were no sessions in the last week", () => {
      const exercises = [makeExercise({ category: "Warmup" })];
      const sessions = [makeSession({ date: daysAgo(20) })];

      const insights = generateInsights(exercises, sessions, 0, 0);
      expect(insights.some((i) => i.includes("mix it up"))).toBe(false);
    });
  });

  // Regression guard. These two rules read the session timestamp. They were
  // reading `created_at`, which mapSession does not return — every comparison
  // was against NaN, so both rules were silently dead in production.
  describe("session timestamps (regression)", () => {
    it("reads the field mapSession actually returns", () => {
      const lapsed = generateInsights(
        [],
        [makeSession({ date: daysAgo(10) })],
        0,
        0,
      );
      expect(lapsed).not.toEqual([]);

      const balance = generateInsights(
        [makeExercise({ category: "Repertoire" })],
        [makeSession({ date: daysAgo(1) })],
        0,
        0,
      );
      expect(balance).not.toEqual([]);
    });

    it("is not fooled by a stray created_at field", () => {
      const session = {
        ...makeSession({ date: daysAgo(10) }),
        created_at: daysAgo(0),
      };

      expect(generateInsights([], [session], 0, 0)).toContain(
        "You haven't practiced in a few days — even 10 minutes makes a difference.",
      );
    });
  });
});
