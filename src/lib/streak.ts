import type { Session } from "./storage";

type DatedSession = Pick<Session, "date" | "duration">;

/**
 * The calendar date an instant falls on, in the user's own timezone.
 *
 * Sessions are stored as UTC timestamps. Slicing the ISO string instead
 * (`date.split("T")[0]`) yields the UTC date, which is a different day from
 * the user's for part of every day — east of UTC that is the small hours,
 * which for a practice app is prime playing time.
 */
export const toLocalDay = (value: string | Date): string =>
  new Date(value).toLocaleDateString("en-CA");

/**
 * Shift a YYYY-MM-DD calendar date by whole days.
 *
 * The parts are fed to the Date constructor rather than parsed from the
 * string, because `new Date("2026-09-25")` is read as UTC midnight — which is
 * already the previous day for anyone west of UTC.
 */
const shiftDay = (day: string, delta: number): string => {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(year, month - 1, date);
  shifted.setDate(shifted.getDate() + delta);
  return toLocalDay(shifted);
};

/**
 * Consecutive days practiced, counting back from today.
 *
 * A streak has to include today: miss a day and it is 0, not the length of
 * the run that ended yesterday.
 */
export const computeStreak = (
  sessions: DatedSession[],
  today: string = toLocalDay(new Date()),
): number => {
  const practicedDays = new Set(sessions.map((s) => toLocalDay(s.date)));

  let streak = 0;
  let cursor = today;
  while (practicedDays.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }

  return streak;
};

/** Whole minutes practiced on a given local day. */
export const minutesPracticedOn = (
  sessions: DatedSession[],
  day: string = toLocalDay(new Date()),
): number =>
  Math.floor(
    sessions
      .filter((s) => toLocalDay(s.date) === day)
      .reduce((total, s) => total + s.duration, 0) / 60,
  );
