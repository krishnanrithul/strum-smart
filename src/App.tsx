import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Link } from "react-router-dom";
import { Home, Library as LibraryIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="pb-[72px]">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-zinc-200 dark:border-border" style={{ height: "72px" }}>
        <div className="container mx-auto px-4 h-full">
          <div className="grid grid-cols-3 gap-2 h-full items-center">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-lg transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" fill={isActive ? "currentColor" : "none"} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

const App = () => (
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

export default App;