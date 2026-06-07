import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { Home, Library as LibraryIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import Library from "./pages/Library";
import Progress from "./pages/Progress";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDetail from "./pages/StudentDetail";
import SongPractice from "./pages/SongPractice";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/library", icon: LibraryIcon, label: "Library" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
];

const StudentLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
        <div className={pathname === "/" ? "block" : "hidden"}><Index /></div>
        <div className={pathname === "/library" ? "block" : "hidden"}><Library /></div>
        <div className={pathname === "/progress" ? "block" : "hidden"}><Progress /></div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#222222]" style={{ height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="container mx-auto px-4 h-full">
          <div className="grid grid-cols-3 gap-2 h-full items-center">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 transition-all",
                    isActive ? "text-green-500" : "text-[#666666]"
                  )}
                >
                  <div className={cn(
                    "flex flex-col items-center transition-all",
                    isActive ? "rounded-xl bg-secondary px-6 py-2" : ""
                  )}>
                    <Icon className="h-6 w-6 mb-1" fill={isActive ? "currentColor" : "none"} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

function App() {
  useEffect(() => {
    SplashScreen.hide({ fadeOutDuration: 500 });
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/student/:id" element={<StudentDetail />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<StudentLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/library" element={<Library />} />
                <Route path="/progress" element={<Progress />} />
              </Route>
              <Route path="/practice/:id" element={<Practice />} />
              <Route path="/song/:id" element={<SongPractice />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

export default App;