import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/features/DashboardLayout";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import KanbanBoard from "@/pages/KanbanBoard";
import Team from "@/pages/Team";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (!agency) return <Navigate to="/onboarding" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
