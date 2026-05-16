import { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MiniLogo from "@/components/MiniLogo";
import { supabase } from "@/integrations/supabase/client";

interface AppHeaderProps {
  title?: string;
  breadcrumb?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const AppHeader = ({ title, breadcrumb, showBack = false, onBack }: AppHeaderProps) => {
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left */}
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {title && (
              <div>
                {breadcrumb && (
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    {breadcrumb}
                  </p>
                )}
                <span className="text-xs font-semibold tracking-widest uppercase text-foreground">
                  {title}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MiniLogo />
            <span className="text-sm font-semibold tracking-widest text-foreground">
              Fret<span className="text-primary">Gym</span>
            </span>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
