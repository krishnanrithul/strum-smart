export interface Exercise {
    id: string;
    title: string;
    category: "Technical" | "Repertoire" | "Warmup";
    currentBpm: number;
    targetBpm: number;
    status: "New" | "In Progress" | "Maintenance" | "Mastered";
    history: { date: string; bpm: number }[];
}

export interface Session {
    id: string;
    date: string;
    duration: number; // in seconds
    exercises: string[]; // exercise IDs
}

const STORAGE_KEYS = {
    EXERCISES: "fretgym_exercises",
    SESSIONS: "fretgym_sessions",
};

const DEFAULT_EXERCISES: Exercise[] = [
    {
        id: "1",
        title: "Alternate Picking",
        category: "Technical",
        currentBpm: 120,
        targetBpm: 120,
        status: "In Progress",
        history: [{ date: new Date().toISOString(), bpm: 120 }],
    },
    {
        id: "2",
        title: "Sultans of Swing - Solo",
        category: "Repertoire",
        currentBpm: 95,
        targetBpm: 95,
        status: "In Progress",
        history: [{ date: new Date().toISOString(), bpm: 95 }],
    },
    {
        id: "3",
        title: "Chromatic Scale",
        category: "Warmup",
        currentBpm: 140,
        targetBpm: 140,
        status: "Mastered",
        history: [{ date: new Date().toISOString(), bpm: 140 }],
    },
    {
        id: "4",
        title: "Spider Walk",
        category: "Warmup",
        currentBpm: 100,
        targetBpm: 100,
        status: "In Progress",
        history: [{ date: new Date().toISOString(), bpm: 100 }],
    },
    {
        id: "5",
        title: "Legato Runs",
        category: "Technical",
        currentBpm: 110,
        targetBpm: 110,
        status: "In Progress",
        history: [{ date: new Date().toISOString(), bpm: 110 }],
    },
    {
        id: "6",
        title: "Neon - Main Riff",
        category: "Repertoire",
        currentBpm: 80,
        targetBpm: 80,
        status: "New",
        history: [{ date: new Date().toISOString(), bpm: 80 }],
    },
    {
        id: "7",
        title: "Contrary Motion",
        category: "Warmup",
        currentBpm: 60,
        targetBpm: 60,
        status: "New",
        history: [{ date: new Date().toISOString(), bpm: 60 }],
    },
    {
        id: "8",
        title: "Fingerstyle Arpeggios",
        category: "Warmup",
        currentBpm: 80,
        targetBpm: 80,
        status: "In Progress",
        history: [{ date: new Date().toISOString(), bpm: 80 }],
    },
];

export const StorageService = {
    getExercises: (): Exercise[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.EXERCISES);
        let exercises: Exercise[] = [];

        if (stored) {
            exercises = JSON.parse(stored);
        }

        // Merge missing defaults
        let hasChanges = false;
        DEFAULT_EXERCISES.forEach(def => {
            if (!exercises.find(e => e.id === def.id)) {
                exercises.push(def);
                hasChanges = true;
            }
        });

        if (hasChanges || !stored) {
            localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
        }

        return exercises;
    },

    getExercise: (id: string): Exercise | undefined => {
        const exercises = StorageService.getExercises();
        return exercises.find((e) => e.id === id);
    },

    saveExercise: (exercise: Exercise) => {
        const exercises = StorageService.getExercises();
        const index = exercises.findIndex((e) => e.id === exercise.id);
        if (index >= 0) {
            exercises[index] = exercise;
        } else {
            exercises.push(exercise);
        }
        localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    },

    addExercise: (exercise: Omit<Exercise, "id" | "history" | "targetBpm">) => {
        const newExercise: Exercise = {
            ...exercise,
            id: crypto.randomUUID(),
            targetBpm: exercise.currentBpm,
            history: [{ date: new Date().toISOString(), bpm: exercise.currentBpm }],
        };
        StorageService.saveExercise(newExercise);
        return newExercise;
    },

    updateExerciseBpm: (id: string, newBpm: number) => {
        const exercise = StorageService.getExercise(id);
        if (exercise) {
            exercise.currentBpm = newBpm;
            exercise.history.push({ date: new Date().toISOString(), bpm: newBpm });
            StorageService.saveExercise(exercise);
        }
    },

    updateTargetBpm: (id: string, newTarget: number) => {
        const exercise = StorageService.getExercise(id);
        if (exercise) {
            exercise.targetBpm = newTarget;
            StorageService.saveExercise(exercise);
        }
    },

    checkProgressiveOverload: (id: string): { newBpm: number; reason: string } | null => {
        const exercise = StorageService.getExercise(id);
        if (!exercise || exercise.history.length < 3) return null;

        const last3 = exercise.history.slice(-3);
        const allHitTarget = last3.every((h) => h.bpm >= exercise.targetBpm);

        if (allHitTarget) {
            // Suggest 5% increase, rounded to nearest 5
            const increase = Math.max(5, Math.round((exercise.targetBpm * 0.05) / 5) * 5);
            return {
                newBpm: exercise.targetBpm + increase,
                reason: "You've hit your target for 3 sessions in a row!",
            };
        }
        return null;
    },

    generateRoutine: (): { warmup: Exercise | null; technical: Exercise | null; repertoire: Exercise | null } => {
        const exercises = StorageService.getExercises();

        const getRandom = (list: Exercise[]) =>
            list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;

        const warmups = exercises.filter(e => e.category === "Warmup");
        const technicals = exercises.filter(e => e.category === "Technical");
        const repertoires = exercises.filter(e => e.category === "Repertoire");

        // Prioritize "In Progress" for technical/repertoire
        const activeTechnicals = technicals.filter(e => e.status === "In Progress");
        const activeRepertoires = repertoires.filter(e => e.status === "In Progress");

        return {
            warmup: getRandom(warmups),
            technical: getRandom(activeTechnicals.length > 0 ? activeTechnicals : technicals),
            repertoire: getRandom(activeRepertoires.length > 0 ? activeRepertoires : repertoires),
        };
    },

    getRandomExerciseByCategory: (category: string, excludeId?: string): Exercise | null => {
        const exercises = StorageService.getExercises();
        const filtered = exercises.filter(
            (e) => e.category === category && e.id !== excludeId
        );

        if (filtered.length === 0) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    },

    getSessions: (): Session[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return stored ? JSON.parse(stored) : [];
    },

    saveSession: (session: Omit<Session, "id">) => {
        const sessions = StorageService.getSessions();
        const newSession = { ...session, id: crypto.randomUUID() };
        sessions.push(newSession);
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        return newSession;
    },
};
