import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = () => {
    const { session, loading } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!session) return;
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();
            setRole(data?.role ?? "student");
            setRoleLoading(false);
        };
        fetchRole();
    }, [session]);

    if (loading || roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return <Navigate to="/auth" replace />;
    if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;

    return <Outlet />;
};