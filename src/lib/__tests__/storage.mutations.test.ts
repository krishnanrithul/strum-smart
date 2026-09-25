import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("@/test/supabaseMock");
  return { supabase: createSupabaseMock() };
});

import { supabase } from "@/integrations/supabase/client";
import { StorageService, clearCache } from "@/lib/storage";
import type { SupabaseMock } from "@/test/supabaseMock";

const mock = supabase as unknown as SupabaseMock;

const exerciseRow = (overrides: Record<string, unknown> = {}) => ({
  id: "ex-1",
  project_id: null,
  title: "Spider Walk",
  category: "Technical",
  current_bpm: 100,
  target_bpm: 140,
  status: "In Progress",
  history: [{ date: "2026-01-01T00:00:00.000Z", bpm: 80 }],
  is_assigned: false,
  teacher_notes: null,
  ...overrides,
});

const templateRow = (overrides: Record<string, unknown> = {}) => ({
  id: "t-1",
  title: "Chromatic Warmup",
  category: "Warmup",
  default_bpm: 70,
  description: null,
  diagram_url: null,
  tutorial_url: null,
  ...overrides,
});

beforeEach(() => {
  mock.__reset();
  clearCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("projects", () => {
  it("lists only the signed-in user's projects", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__setTable("projects", {
      data: [{ id: "p-1", title: "Blackbird", status: "In Progress" }],
      error: null,
    });

    const projects = await StorageService.getProjects();

    expect(projects).toHaveLength(1);
    expect(mock.__callsFor("projects", "eq")[0].args).toEqual([
      "user_id",
      "teacher-a",
    ]);
  });

  it("returns an empty list when signed out", async () => {
    mock.__setUser(null);

    expect(await StorageService.getProjects()).toEqual([]);
  });

  it("returns null for a project that cannot be read", async () => {
    mock.__queue("projects", [{ data: null, error: new Error("not found") }]);

    expect(await StorageService.getProject("nope")).toBeNull();
  });

  it("stamps a new project with the owner", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__queue("projects", [
      { data: { id: "p-1", title: "Blackbird", status: "New" }, error: null },
    ]);

    await StorageService.addProject({
      title: "Blackbird",
      status: "New",
    });

    const payload = mock.__lastPayload("projects", "insert") as Array<
      Record<string, unknown>
    >;
    expect(payload[0]).toMatchObject({ title: "Blackbird", user_id: "teacher-a" });
  });

  it("refuses to create a project when signed out", async () => {
    mock.__setUser(null);

    await expect(
      StorageService.addProject({ title: "Blackbird", status: "New" }),
    ).rejects.toThrow("User not logged in");
  });

  it("writes an absent artist as null rather than undefined", async () => {
    await StorageService.updateProject("p-1", {
      title: "Blackbird",
      status: "Completed",
    });

    expect(mock.__lastPayload("projects", "update")).toEqual({
      title: "Blackbird",
      artist: null,
      status: "Completed",
    });
  });

  it("deletes by id", async () => {
    await StorageService.deleteProject("p-1");

    expect(mock.__callsFor("projects", "delete")).toHaveLength(1);
    expect(mock.__callsFor("projects", "eq")[0].args).toEqual(["id", "p-1"]);
  });
});

describe("updateExerciseBpm", () => {
  it("appends to history instead of replacing it", async () => {
    mock.__queue("exercises", [
      {
        data: exerciseRow({
          history: [
            { date: "2026-01-01T00:00:00.000Z", bpm: 80 },
            { date: "2026-01-05T00:00:00.000Z", bpm: 90 },
          ],
        }),
        error: null,
      },
      { data: null, error: null }, // the update
    ]);

    await StorageService.updateExerciseBpm("ex-1", 100);

    const payload = mock.__lastPayload("exercises", "update") as {
      current_bpm: number;
      history: Array<{ bpm: number }>;
    };
    expect(payload.current_bpm).toBe(100);
    expect(payload.history.map((h) => h.bpm)).toEqual([80, 90, 100]);
  });

  it("invalidates the cache so the new bpm is read back", async () => {
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });
    await StorageService.getExercises();
    const queriesBefore = mock.from.mock.calls.length;

    mock.__queue("exercises", [
      { data: exerciseRow(), error: null },
      { data: null, error: null },
    ]);
    await StorageService.updateExerciseBpm("ex-1", 110);
    await StorageService.getExercises();

    expect(mock.from.mock.calls.length).toBeGreaterThan(queriesBefore + 2);
  });

  it("does nothing when the exercise is missing", async () => {
    mock.__queue("exercises", [{ data: null, error: new Error("gone") }]);

    await StorageService.updateExerciseBpm("nope", 120);

    expect(mock.__callsFor("exercises", "update")).toHaveLength(0);
  });
});

describe("updateExercise", () => {
  it("maps the camelCase fields onto their columns", async () => {
    await StorageService.updateExercise("ex-1", {
      title: "Renamed",
      category: "Warmup",
      currentBpm: 95,
      targetBpm: 130,
    });

    expect(mock.__lastPayload("exercises", "update")).toEqual({
      title: "Renamed",
      category: "Warmup",
      current_bpm: 95,
      target_bpm: 130,
    });
  });
});

describe("updateTargetBpm", () => {
  it("writes only the target column", async () => {
    await StorageService.updateTargetBpm("ex-1", 150);

    expect(mock.__lastPayload("exercises", "update")).toEqual({
      target_bpm: 150,
    });
  });
});

describe("deleteExercise", () => {
  it("deletes by id and drops the cache", async () => {
    mock.__setTable("exercises", { data: [exerciseRow()], error: null });
    await StorageService.getExercises();
    const queriesBefore = mock.from.mock.calls.length;

    await StorageService.deleteExercise("ex-1");
    await StorageService.getExercises();

    expect(mock.__callsFor("exercises", "delete")).toHaveLength(1);
    expect(mock.from.mock.calls.length).toBeGreaterThan(queriesBefore + 1);
  });
});

describe("getSessions", () => {
  it("returns an empty list when signed out", async () => {
    mock.__setUser(null);

    expect(await StorageService.getSessions()).toEqual([]);
  });

  it("scopes sessions to the signed-in user", async () => {
    mock.__setUser({ id: "teacher-a" });
    mock.__setTable("sessions", {
      data: [
        {
          id: "s-1",
          date: "2026-02-01T00:00:00.000Z",
          duration: 600,
          exercises: [],
        },
      ],
      error: null,
    });

    await StorageService.getSessions();

    expect(mock.__callsFor("sessions", "eq")[0].args).toEqual([
      "user_id",
      "teacher-a",
    ]);
  });
});

describe("generateRoutine", () => {
  // getRandom uses Math.random; pinning it to 0 always takes the first match.
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("picks one of the user's own exercises per category", async () => {
    mock.__setTable("exercises", {
      data: [
        exerciseRow({ id: "w-1", category: "Warmup", title: "Chromatics" }),
        exerciseRow({ id: "t-1", category: "Technical", title: "Spider Walk" }),
        exerciseRow({ id: "r-1", category: "Repertoire", title: "Blackbird" }),
      ],
      error: null,
    });
    mock.__setTable("exercise_templates", { data: [], error: null });

    const routine = await StorageService.generateRoutine();

    expect(routine.warmup?.title).toBe("Chromatics");
    expect(routine.technical?.title).toBe("Spider Walk");
    expect(routine.repertoire?.title).toBe("Blackbird");
  });

  it("prefers an in-progress exercise over a completed one", async () => {
    mock.__setTable("exercises", {
      data: [
        exerciseRow({
          id: "t-1",
          category: "Technical",
          title: "Finished",
          status: "Completed",
        }),
        exerciseRow({
          id: "t-2",
          category: "Technical",
          title: "Still Working",
          status: "In Progress",
        }),
      ],
      error: null,
    });
    mock.__setTable("exercise_templates", { data: [], error: null });

    const routine = await StorageService.generateRoutine();

    expect(routine.technical?.title).toBe("Still Working");
  });

  it("falls back to any exercise when none are in progress", async () => {
    mock.__setTable("exercises", {
      data: [
        exerciseRow({
          id: "t-1",
          category: "Technical",
          title: "Finished",
          status: "Completed",
        }),
      ],
      error: null,
    });
    mock.__setTable("exercise_templates", { data: [], error: null });

    const routine = await StorageService.generateRoutine();

    expect(routine.technical?.title).toBe("Finished");
  });

  it("creates an exercise from a template for an empty category", async () => {
    mock.__setTable("exercises", { data: [], error: null });
    mock.__setTable("exercise_templates", {
      data: [templateRow({ category: "Warmup", title: "Chromatic Warmup" })],
      error: null,
    });
    // getExercises, then the insert each fallback performs
    mock.__queue("exercises", [
      { data: [], error: null },
      {
        data: exerciseRow({ category: "Warmup", title: "Chromatic Warmup" }),
        error: null,
      },
    ]);

    const routine = await StorageService.generateRoutine();

    expect(routine.warmup?.title).toBe("Chromatic Warmup");
  });

  it("returns null for a category with no exercises and no templates", async () => {
    mock.__setTable("exercises", { data: [], error: null });
    mock.__setTable("exercise_templates", { data: [], error: null });

    const routine = await StorageService.generateRoutine();

    expect(routine.warmup).toBeNull();
    expect(routine.technical).toBeNull();
    expect(routine.repertoire).toBeNull();
  });
});

describe("getRandomExerciseByCategory", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("never returns the exercise being excluded", async () => {
    mock.__setTable("exercises", {
      data: [
        exerciseRow({ id: "ex-1", category: "Technical", title: "Current" }),
        exerciseRow({ id: "ex-2", category: "Technical", title: "Other" }),
      ],
      error: null,
    });

    const picked = await StorageService.getRandomExerciseByCategory(
      "Technical",
      "ex-1",
    );

    expect(picked?.id).toBe("ex-2");
  });

  it("ignores other categories", async () => {
    mock.__setTable("exercises", {
      data: [
        exerciseRow({ id: "w-1", category: "Warmup", title: "Chromatics" }),
        exerciseRow({ id: "t-1", category: "Technical", title: "Spider Walk" }),
      ],
      error: null,
    });

    const picked = await StorageService.getRandomExerciseByCategory("Warmup");

    expect(picked?.title).toBe("Chromatics");
  });

  it("returns null when neither an exercise nor a template exists", async () => {
    mock.__setTable("exercises", { data: [], error: null });
    mock.__setTable("exercise_templates", { data: [], error: null });

    expect(
      await StorageService.getRandomExerciseByCategory("Technical"),
    ).toBeNull();
  });
});

describe("addExercisesIfNew", () => {
  const item = (title: string, category: "Technical" | "Repertoire" | "Warmup" = "Technical") => ({
    title,
    category,
    currentBpm: 80,
    status: "New" as const,
  });

  /** One query for the existing library, then one insert per new exercise. */
  const queueLibrary = (existingTitles: string[], insertCount: number) => {
    mock.__queue("exercises", [
      {
        data: existingTitles.map((title, i) =>
          exerciseRow({ id: `have-${i}`, title }),
        ),
        error: null,
      },
      ...Array.from({ length: insertCount }, (_, i) => ({
        data: exerciseRow({ id: `new-${i}` }),
        error: null,
      })),
    ]);
  };

  it("adds everything when the library is empty", async () => {
    queueLibrary([], 2);

    const result = await StorageService.addExercisesIfNew([
      item("Spider Walk"),
      item("Blackbird", "Repertoire"),
    ]);

    expect(result.added).toHaveLength(2);
    expect(result.skipped).toEqual([]);
  });

  // The tester's report: adding the same routine twice silently duplicated
  // every exercise in it.
  it("skips an exercise the user already has", async () => {
    queueLibrary(["Spider Walk"], 1);

    const result = await StorageService.addExercisesIfNew([
      item("Spider Walk"),
      item("Blackbird", "Repertoire"),
    ]);

    expect(result.skipped).toEqual(["Spider Walk"]);
    expect(result.added).toHaveLength(1);
    expect(mock.__callsFor("exercises", "insert")).toHaveLength(1);
  });

  it("adds nothing when every item is already there", async () => {
    queueLibrary(["Spider Walk", "Blackbird"], 0);

    const result = await StorageService.addExercisesIfNew([
      item("Spider Walk"),
      item("Blackbird", "Repertoire"),
    ]);

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual(["Spider Walk", "Blackbird"]);
    expect(mock.__callsFor("exercises", "insert")).toHaveLength(0);
  });

  it("ignores case and stray whitespace when comparing", async () => {
    queueLibrary(["Spider Walk"], 0);

    const result = await StorageService.addExercisesIfNew([
      item("  spider walk  "),
    ]);

    expect(result.added).toEqual([]);
    expect(result.skipped).toHaveLength(1);
  });

  it("reports the skipped title as the user wrote it", async () => {
    queueLibrary(["Spider Walk"], 0);

    const result = await StorageService.addExercisesIfNew([
      item("SPIDER WALK"),
    ]);

    expect(result.skipped).toEqual(["SPIDER WALK"]);
  });

  // The picker can hand the same title over twice in one go.
  it("collapses duplicates inside the incoming batch", async () => {
    queueLibrary([], 1);

    const result = await StorageService.addExercisesIfNew([
      item("Spider Walk"),
      item("Spider Walk"),
    ]);

    expect(result.added).toHaveLength(1);
    expect(result.skipped).toEqual(["Spider Walk"]);
    expect(mock.__callsFor("exercises", "insert")).toHaveLength(1);
  });

  it("does nothing at all for an empty list", async () => {
    queueLibrary([], 0);

    const result = await StorageService.addExercisesIfNew([]);

    expect(result).toEqual({ added: [], skipped: [] });
    expect(mock.__callsFor("exercises", "insert")).toHaveLength(0);
  });
});
