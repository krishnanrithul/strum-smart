import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ECGLoader from "@/components/ECGLoader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = () => {
    const { session, loading } = useAuth();
    const location = useLocation();
    const [role, setRole] = useState<string | null>(null);
    const [onboarded, setOnboarded] = useState<boolean | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to fully settle before doing anything — prevents a
        // race where profileLoading=false + onboarded=null fires the redirect
        // before the session is actually available.
        if (loading) return;
        if (!session) { setProfileLoading(false); return; }

        setProfileLoading(true);
        (supabase as any)
            .from("profiles")
            .select("id, role, onboarded, level, genre")
            .eq("id", session.user.id)
            .single()
            .then(({ data }: { data: { role: string; onboarded: boolean | null } | null }) => {
                setRole(data?.role ?? "student");
                // Accept onboarded from auth metadata (set by Onboarding page) OR profiles table
                const metaOnboarded = session.user.user_metadata?.onboarded === true;
                setOnboarded(metaOnboarded || data?.onboarded === true);
                setProfileLoading(false);
            });
    }, [session, loading]);

    if (loading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <ECGLoader />
            </div>
        );
    }

    if (!session) return <Navigate to="/auth" replace />;
    if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;

    if (onboarded !== true && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};