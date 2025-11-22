import { supabase } from "@/integrations/supabase/client";

export interface Project {
    id: string;
    title: string;
    artist?: string;
    status: "New" | "In Progress" | "Maintenance" | "Mastered";
    created_at: string;
}

export interface Exercise {
    id: string;
    project_id?: string; // Link to a Song Project
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

// Helper to map Supabase rows to our Interface (snake_case -> camelCase)
const mapExercise = (row: any): Exercise => ({
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    category: row.category as any,
    currentBpm: row.current_bpm,
    targetBpm: row.target_bpm,
    status: row.status as any,
    history: row.history || [],
});

const mapSession = (row: any): Session => ({
    id: row.id,
    date: row.date,
    duration: row.duration,
    exercises: row.exercises || [],
});

export const StorageService = {
    // --- Projects ---
    getProjects: async (): Promise<Project[]> => {
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(row => ({
            ...row,
            status: row.status as Project['status']
        }));
    },

    addProject: async (project: Omit<Project, "id" | "created_at">): Promise<Project> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
            .from("projects")
            .insert([{ ...project, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            status: data.status as Project['status']
        };
    },

    // --- Exercises ---
    getExercises: async (): Promise<Exercise[]> => {
        console.log('Fetching exercises...');
        const { data, error } = await supabase.from("exercises").select("*").order("created_at", { ascending: false });
        console.log('Exercises response:', { data, error });
        if (error) throw error;
        return (data || []).map(mapExercise);
    },

    getExercise: async (id: string): Promise<Exercise | null> => {
        const { data, error } = await supabase.from("exercises").select("*").eq("id", id).single();
        if (error) return null;
        return mapExercise(data);
    },

    addExercise: async (exercise: Omit<Exercise, "id" | "history" | "targetBpm">): Promise<Exercise> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const newExercise = {
            user_id: user.id,
            project_id: exercise.project_id,
            title: exercise.title,
            category: exercise.category,
            current_bpm: exercise.currentBpm,
            target_bpm: exercise.currentBpm, // Default target = current
            status: exercise.status,
            history: [{ date: new Date().toISOString(), bpm: exercise.currentBpm }],
        };

        const { data, error } = await supabase
            .from("exercises")
            .insert([newExercise])
            .select()
            .single();

        if (error) throw error;
        return mapExercise(data);
    },

    updateExerciseBpm: async (id: string, newBpm: number) => {
        const exercise = await StorageService.getExercise(id);
        if (!exercise) return;

        const newHistory = [...exercise.history, { date: new Date().toISOString(), bpm: newBpm }];

        const { error } = await supabase
            .from("exercises")
            .update({
                current_bpm: newBpm,
                history: newHistory,
            })
            .eq("id", id);

        if (error) throw error;
    },

    updateTargetBpm: async (id: string, newTarget: number) => {
        const { error } = await supabase
            .from("exercises")
            .update({ target_bpm: newTarget })
            .eq("id", id);

        if (error) throw error;
    },

    // --- Sessions ---
    getSessions: async (): Promise<Session[]> => {
        const { data, error } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSession);
    },

    saveSession: async (session: Omit<Session, "id">): Promise<Session> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
            .from("sessions")
            .insert([{ ...session, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return mapSession(data);
    },

    // --- Logic ---
    checkProgressiveOverload: async (id: string): Promise<{ newBpm: number; reason: string } | null> => {
        const exercise = await StorageService.getExercise(id);
        if (!exercise || exercise.history.length < 3) return null;

        const last3 = exercise.history.slice(-3);
        const allHitTarget = last3.every((h) => h.bpm >= exercise.targetBpm);

        if (allHitTarget) {
            const increase = Math.max(5, Math.round((exercise.targetBpm * 0.05) / 5) * 5);
            return {
                newBpm: exercise.targetBpm + increase,
                reason: "You've hit your target for 3 sessions in a row!",
            };
        }
        return null;
    },

    generateRoutine: async (): Promise<{ warmup: Exercise | null; technical: Exercise | null; repertoire: Exercise | null }> => {
        const exercises = await StorageService.getExercises();

        const getRandom = (list: Exercise[]) =>
            list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;

        const warmups = exercises.filter(e => e.category === "Warmup");
        const technicals = exercises.filter(e => e.category === "Technical");
        const repertoires = exercises.filter(e => e.category === "Repertoire");

        const activeTechnicals = technicals.filter(e => e.status === "In Progress");
        const activeRepertoires = repertoires.filter(e => e.status === "In Progress");

        return {
            warmup: getRandom(warmups),
            technical: getRandom(activeTechnicals.length > 0 ? activeTechnicals : technicals),
            repertoire: getRandom(activeRepertoires.length > 0 ? activeRepertoires : repertoires),
        };
    },

    getRandomExerciseByCategory: async (category: string, excludeId?: string): Promise<Exercise | null> => {
        const exercises = await StorageService.getExercises();
        const filtered = exercises.filter(
            (e) => e.category === category && e.id !== excludeId
        );

        if (filtered.length === 0) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    },
};
