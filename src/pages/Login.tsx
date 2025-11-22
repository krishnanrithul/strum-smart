import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate("/");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 space-y-6 border-border bg-card">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter neon-glow">
                        FretGym
                    </h1>
                    <p className="text-muted-foreground">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-secondary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-secondary"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center">{error}</div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 font-semibold"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isSignUp ? (
                            "Sign Up"
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary hover:underline"
                    >
                        {isSignUp
                            ? "Already have an account? Sign In"
                            : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </Card>
        </div>
    );
}
