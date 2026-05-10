import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
    const [name, setName] = useState("");
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
            if (isSignUp) {
                const { data, error } = await signUp(email, password, name.trim() || undefined);
                if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                    if (data?.user && name.trim()) {
                        await (supabase as any)
                            .from("profiles")
                            .upsert({ id: data.user.id, full_name: name.trim() }, { onConflict: "id" });
                    }
                    toast({ title: "Account created!", description: "You can now start your practice journey." });
                    navigate("/");
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                    toast({ title: "Welcome back!", description: "Let's get to work." });
                    navigate("/");
                }
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
                        <svg width="36" height="44" viewBox="0 0 210 290" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0" y="0" width="210" height="18" rx="5" fill="#22c55e"/>
                            <line x1="21" y1="18" x2="21" y2="290" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.25"/>
                            <line x1="63" y1="18" x2="63" y2="290" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.25"/>
                            <line x1="105" y1="18" x2="105" y2="290" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.25"/>
                            <line x1="147" y1="18" x2="147" y2="290" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.25"/>
                            <line x1="189" y1="18" x2="189" y2="290" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.25"/>
                            <line x1="0" y1="88" x2="210" y2="88" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15"/>
                            <line x1="0" y1="158" x2="210" y2="158" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15"/>
                            <line x1="0" y1="228" x2="210" y2="228" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15"/>
                            <rect x="1" y="20" width="208" height="50" rx="25" fill="#22c55e"/>
                            <circle cx="63" cy="123" r="28" fill="#22c55e"/>
                            <text x="63" y="132" textAnchor="middle" fontFamily="sans-serif" fontSize="28" fontWeight="700" fill="#0a0a0a">F</text>
                            <circle cx="147" cy="193" r="28" fill="#22c55e"/>
                            <text x="147" y="202" textAnchor="middle" fontFamily="sans-serif" fontSize="28" fontWeight="700" fill="#0a0a0a">G</text>
                            <circle cx="189" cy="123" r="22" fill="#22c55e" opacity="0.5"/>
                            <circle cx="189" cy="193" r="22" fill="#22c55e" opacity="0.5"/>
                        </svg>
                        <h1 className="text-3xl font-bold tracking-tighter">
                            Fret<span className="text-primary">Gym</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-secondary"
                            />
                        </div>
                    )}
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
