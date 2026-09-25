import type { Exercise, Session } from "@/lib/storage";

/** ISO timestamp N days before now. */
export const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 86_400_000).toISOString();

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

/**
 * Build an Exercise.
 *
 * Defaults mirror what StorageService.addExercise actually writes: a brand new
 * exercise has targetBpm === currentBpm and exactly one history entry. Several
 * insight rules key off that shape, so starting from it keeps tests honest.
 */
export const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => {
  const currentBpm = overrides.currentBpm ?? 80;
  const base: Exercise = {
    id: nextId("ex"),
    title: "Spider Walk",
    category: "Technical",
    currentBpm,
    targetBpm: currentBpm,
    status: "In Progress",
    history: [{ date: daysAgo(30), bpm: currentBpm }],
    is_assigned: false,
  };
  return { ...base, ...overrides };
};

/**
 * An exercise that has genuinely progressed: an initial history entry at
 * `from` bpm, a later one at `to`, and a target above the starting point.
 */
export const makeProgressedExercise = (
  from: number,
  to: number,
  target: number,
  overrides: Partial<Exercise> = {},
): Exercise =>
  makeExercise({
    currentBpm: to,
    targetBpm: target,
    history: [
      { date: daysAgo(30), bpm: from },
      { date: daysAgo(1), bpm: to },
    ],
    ...overrides,
  });

export const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: nextId("sess"),
  date: daysAgo(0),
  duration: 600,
  exercises: [],
  ...overrides,
});

/** Reset id counter so failure messages stay readable across files. */
export const resetFactories = () => {
  seq = 0;
};
