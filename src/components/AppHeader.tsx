import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MiniLogo from "@/components/MiniLogo";
import { supabase } from "@/integrations/supabase/client";

interface AppHeaderProps {
  title?: string;
  breadcrumb?: string;
  showBack?: boolean;
  onBack?: () => void;
  titleAccessory?: React.ReactNode;
}

const AppHeader = ({ title, breadcrumb, showBack = false, onBack, titleAccessory }: AppHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="container mx-auto px-3 py-3 flex items-center justify-between">
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
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold tracking-widest uppercase text-foreground truncate max-w-[180px] block">
                    {title}
                  </span>
                  {titleAccessory}
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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
