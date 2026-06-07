import { Exercise } from "./storage";

export function generateInsights(
  exercises: Exercise[],
  sessions: any[],
  streakDays: number,
  todayMinutes: number
): string[] {
  const insights: string[] = [];

  // Teacher assignments never practiced
  const unpracticedAssigned = exercises.filter(e => e.is_assigned && e.history.length <= 1);
  if (unpracticedAssigned.length > 0) {
    const count = unpracticedAssigned.length;
    insights.push(`You have ${count} teacher-assigned exercise${count > 1 ? "s" : ""} you haven't practiced yet.`);
  }

  // Streak
  if (streakDays >= 7) {
    insights.push("You've practiced every day this week — incredible consistency.");
  } else if (streakDays >= 3) {
    insights.push(`${streakDays} days in a row — you're building a real habit.`);
  } else if (streakDays === 0 && sessions.length > 0) {
    const lastSession = sessions
      .map(s => new Date(s.created_at).getTime())
      .sort((a, b) => b - a)[0];
    const daysSince = Math.floor((Date.now() - lastSession) / 86400000);
    if (daysSince > 3) {
      insights.push("You haven't practiced in a few days — even 10 minutes makes a difference.");
    }
  }

  // BPM progress — target hit or close
  for (const exercise of exercises) {
    if (insights.length >= 3) break;
    if (!exercise.targetBpm || exercise.targetBpm <= (exercise.history[0]?.bpm ?? exercise.currentBpm)) continue;
    if (exercise.currentBpm >= exercise.targetBpm) {
      insights.push(`You've hit your target on ${exercise.title} — consider raising the bar.`);
    } else if (exercise.currentBpm / exercise.targetBpm >= 0.9) {
      insights.push(`You're close to your target on ${exercise.title} — push for it.`);
    }
  }

  // Most improved exercise
  if (insights.length < 3) {
    let bestRatio = 1.1;
    let bestTitle: string | null = null;
    for (const exercise of exercises) {
      const initial = exercise.history[0]?.bpm;
      if (!initial || initial === 0) continue;
      const ratio = exercise.currentBpm / initial;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestTitle = exercise.title;
      }
    }
    if (bestTitle) {
      insights.push(`${bestTitle} has improved the most — great focus.`);
    }
  }

  // Category balance — last 7 days
  if (insights.length < 3) {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentSessionDates = new Set(
      sessions
        .filter(s => new Date(s.created_at).getTime() >= sevenDaysAgo)
        .map(s => s.created_at)
    );
    if (recentSessionDates.size > 0) {
      const allCategories = [...new Set(exercises.map(e => e.category))];
      const practicedCategories = new Set(
        exercises
          .filter(e =>
            e.history.slice(1).some(h => new Date(h.date).getTime() >= sevenDaysAgo)
          )
          .map(e => e.category)
      );
      for (const category of allCategories) {
        if (insights.length >= 3) break;
        if (!practicedCategories.has(category)) {
          insights.push(`You haven't practiced any ${category} exercises recently — try to mix it up.`);
        }
      }
    }
  }

  return insights.slice(0, 3);
}
