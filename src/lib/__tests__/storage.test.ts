import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("@/test/supabaseMock");
  return { supabase: createSupabaseMock() };
});

import { supabase } from "@/integrations/supabase/client";
import { StorageService, clearCache } from "@/lib/storage";
import type { SupabaseMock } from "@/test/supabaseMock";

const mock = supabase as unknown as SupabaseMock;

/** A raw exercises row as Postgres returns it (snake_case). */
const exerciseRow = (overrides: Record<string, unknown> = {}) => ({
  id: "ex-1",
  project_id: null,
  title: "Spider Walk",
  category: "Technical",
  current_bpm: 100,
  target_bpm: 140,
  status: "In Progress",
  history: [{ date: "2026-01-01T00:00:00.000Z", bpm: 80 }],
  songsterr_url: null,
  youtube_url: null,
  ultimate_guitar_url: null,
  tutorial_url: null,
  diagram_url: null,
  is_assigned: true,
  teacher_notes: "Watch your thumb position",
  ...overrides,
});

beforeEach(() => {
  mock.__reset();
  clearCache();
});

describe("StorageService.getExercises", () => {
  it("returns an empty list when nobody is signed in", async () => {
    mock.__setUser(null);

    expect(await StorageService.getExercises()).toEqual([]);
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("scopes the query to the signed-in user", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });

    await StorageService.getExercises();

    const eqCalls = mock.__callsFor("exercises", "eq");
    expect(eqCalls).toContainEqual(
      expect.objectContaining({ args: ["user_id", "teacher-a"] }),
    );
  });

  // The cache is module-level. Without a user check it would hand one
  // account's exercises to the next account that signs in.
  it("does not serve one account's exercises to another", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__setTable("exercises", {
      data: [exerciseRow({ id: "a-1", title: "Belongs to A" })],
      error: null,
    });
    const first = await StorageService.getExercises();
    expect(first[0].title).toBe("Belongs to A");

    mock.__setUser({ id: "teacher-b" });
    mock.__setTable("exercises", {
      data: [exerciseRow({ id: "b-1", title: "Belongs to B" })],
      error: null,
    });
    const second = await StorageService.getExercises();

    expect(second).toHaveLength(1);
    expect(second[0].title).toBe("Belongs to B");
    expect(second.some((e) => e.title === "Belongs to A")).toBe(false);
  });

  it("serves a repeat read from cache instead of hitting the database", async () => {
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });

    await StorageService.getExercises();
    const queriesAfterFirst = mock.from.mock.calls.length;
    await StorageService.getExercises();

    expect(mock.from.mock.calls.length).toBe(queriesAfterFirst);
  });

  it("refetches once the cache is cleared", async () => {
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });

    await StorageService.getExercises();
    const queriesAfterFirst = mock.from.mock.calls.length;
    clearCache();
    await StorageService.getExercises();

    expect(mock.from.mock.calls.length).toBeGreaterThan(queriesAfterFirst);
  });

  it("propagates database errors instead of returning a partial list", async () => {
    mock.__setTable("exercises", {
      data: null,
      error: new Error("permission denied"),
    });

    await expect(StorageService.getExercises()).rejects.toThrow(
      "permission denied",
    );
  });
});

describe("row mapping", () => {
  it("maps snake_case columns onto the Exercise shape", async () => {
    mock.__queue("exercises", [{ data: exerciseRow(), error: null }]);

    const exercise = await StorageService.getExercise("ex-1");

    expect(exercise).toMatchObject({
      id: "ex-1",
      title: "Spider Walk",
      currentBpm: 100,
      targetBpm: 140,
      is_assigned: true,
      teacherNotes: "Watch your thumb position",
    });
  });

  it("defaults a null history to an empty array", async () => {
    mock.__queue("exercises", [
      { data: exerciseRow({ history: null }), error: null },
    ]);

    const exercise = await StorageService.getExercise("ex-1");

    expect(exercise?.history).toEqual([]);
  });

  it("defaults a missing is_assigned to false", async () => {
    mock.__queue("exercises", [
      { data: exerciseRow({ is_assigned: null }), error: null },
    ]);

    const exercise = await StorageService.getExercise("ex-1");

    expect(exercise?.is_assigned).toBe(false);
  });

  it("returns null rather than throwing when the row is missing", async () => {
    mock.__queue("exercises", [
      { data: null, error: new Error("no rows returned") },
    ]);

    expect(await StorageService.getExercise("nope")).toBeNull();
  });
});

describe("StorageService.addExercise", () => {
  it("seeds history with the starting bpm and sets target to match", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__queue("exercises", [
      { data: exerciseRow({ current_bpm: 90, target_bpm: 90 }), error: null },
    ]);

    await StorageService.addExercise({
      title: "New Drill",
      category: "Technical",
      currentBpm: 90,
      status: "In Progress",
    });

    const payload = mock.__lastPayload("exercises", "insert") as Array<
      Record<string, unknown>
    >;
    expect(payload[0]).toMatchObject({
      user_id: "teacher-a",
      current_bpm: 90,
      target_bpm: 90,
    });
    expect(payload[0].history).toHaveLength(1);
    expect((payload[0].history as Array<{ bpm: number }>)[0].bpm).toBe(90);
  });

  it("refuses to write when nobody is signed in", async () => {
    mock.__setUser(null);

    await expect(
      StorageService.addExercise({
        title: "New Drill",
        category: "Technical",
        currentBpm: 90,
        status: "In Progress",
      }),
    ).rejects.toThrow("User not logged in");
  });

  it("invalidates the cache so the new exercise shows up", async () => {
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });
    await StorageService.getExercises();
    const queriesBefore = mock.from.mock.calls.length;

    mock.__queue("exercises", [{ data: exerciseRow(), error: null }]);
    await StorageService.addExercise({
      title: "New Drill",
      category: "Technical",
      currentBpm: 90,
      status: "In Progress",
    });
    await StorageService.getExercises();

    // insert + the refetch that the cleared cache forces
    expect(mock.from.mock.calls.length).toBeGreaterThan(queriesBefore + 1);
  });
});

describe("StorageService.saveSession", () => {
  // Session duration silently saving as 0 was a real defect; pin it down.
  it("writes the duration it was given", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__queue("sessions", [
      {
        data: {
          id: "s-1",
          date: "2026-02-01T00:00:00.000Z",
          duration: 1800,
          exercises: ["ex-1"],
        },
        error: null,
      },
    ]);

    const saved = await StorageService.saveSession({
      date: "2026-02-01T00:00:00.000Z",
      duration: 1800,
      exercises: ["ex-1"],
    });

    const payload = mock.__lastPayload("sessions", "insert") as Array<
      Record<string, unknown>
    >;
    expect(payload[0]).toMatchObject({ duration: 1800, user_id: "teacher-a" });
    expect(saved.duration).toBe(1800);
  });

  it("defaults a null exercises column to an empty array", async () => {
    mock.__queue("sessions", [
      {
        data: {
          id: "s-1",
          date: "2026-02-01T00:00:00.000Z",
          duration: 600,
          exercises: null,
        },
        error: null,
      },
    ]);

    const saved = await StorageService.saveSession({
      date: "2026-02-01T00:00:00.000Z",
      duration: 600,
      exercises: [],
    });

    expect(saved.exercises).toEqual([]);
  });
});

describe("StorageService.checkProgressiveOverload", () => {
  const atBpm = (bpm: number) => ({ date: "2026-01-01T00:00:00.000Z", bpm });

  it("stays quiet until there are at least 3 logged sessions", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          target_bpm: 120,
          history: [atBpm(120), atBpm(120)],
        }),
        error: null,
      },
    ]);

    expect(await StorageService.checkProgressiveOverload("ex-1")).toBeNull();
  });

  it("suggests a bump after 3 sessions at or above target", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          current_bpm: 120,
          target_bpm: 120,
          history: [atBpm(120), atBpm(120), atBpm(120)],
        }),
        error: null,
      },
    ]);

    const result = await StorageService.checkProgressiveOverload("ex-1");

    expect(result).toEqual({
      newBpm: 125,
      reason: "You've hit your target for 3 sessions in a row!",
    });
  });

  it("scales the bump with the target, rounded to the nearest 5", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          current_bpm: 200,
          target_bpm: 200,
          history: [atBpm(200), atBpm(200), atBpm(200)],
        }),
        error: null,
      },
    ]);

    const result = await StorageService.checkProgressiveOverload("ex-1");

    expect(result?.newBpm).toBe(210);
  });

  it("only looks at the most recent 3 sessions", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          target_bpm: 120,
          history: [atBpm(60), atBpm(120), atBpm(120), atBpm(120)],
        }),
        error: null,
      },
    ]);

    expect(await StorageService.checkProgressiveOverload("ex-1")).not.toBeNull();
  });

  it("stays quiet when one of the last 3 fell short", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          target_bpm: 120,
          history: [atBpm(120), atBpm(110), atBpm(120)],
        }),
        error: null,
      },
    ]);

    expect(await StorageService.checkProgressiveOverload("ex-1")).toBeNull();
  });

  it("returns null for an exercise that does not exist", async () => {
    mock.__queue("exercises", [{ data: null, error: new Error("not found") }]);

    expect(await StorageService.checkProgressiveOverload("nope")).toBeNull();
  });
});

describe("StorageService.getExerciseTemplates", () => {
  it("caches the template list across calls", async () => {
    mock.__setTable("exercise_templates", {
      data: [
        {
          id: "t-1",
          title: "Chromatic Warmup",
          category: "Warmup",
          default_bpm: 70,
          description: null,
          diagram_url: null,
          tutorial_url: null,
        },
      ],
      error: null,
    });

    const first = await StorageService.getExerciseTemplates();
    const queriesAfterFirst = mock.from.mock.calls.length;
    const second = await StorageService.getExerciseTemplates();

    expect(first).toEqual(second);
    expect(mock.from.mock.calls.length).toBe(queriesAfterFirst);
  });

  it("normalises null optional columns to undefined", async () => {
    mock.__setTable("exercise_templates", {
      data: [
        {
          id: "t-1",
          title: "Chromatic Warmup",
          category: "Warmup",
          default_bpm: 70,
          description: null,
          diagram_url: null,
          tutorial_url: null,
        },
      ],
      error: null,
    });

    const [template] = await StorageService.getExerciseTemplates();

    expect(template.description).toBeUndefined();
    expect(template.diagram_url).toBeUndefined();
  });
});
