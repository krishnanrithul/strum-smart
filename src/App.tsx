import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import Library from "./pages/Library";
import Progress from "./pages/Progress";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import SongPractice from "./pages/SongPractice";

const queryClient = new QueryClient();

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
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/practice/:id" element={<Practice />} />
              <Route path="/song/:id" element={<SongPractice />} />
              <Route path="/library" element={<Library />} />
              <Route path="/progress" element={<Progress />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
