import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const { signIn, signUp, session } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Redirect if already logged in
    if (session) {
        navigate("/");
        return null;
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = isSignUp 
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: isSignUp ? "Account created!" : "Welcome back!",
                    description: isSignUp 
                        ? "You can now start your practice journey."
                        : "Let's get to work.",
                });
                navigate("/");
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 space-y-6 border-border bg-card">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Dumbbell className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tighter">
                            Fret<span className="text-primary">Gym</span>
                        </h1>
                    </div>
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
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-secondary"
                        />
                    </div>

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
