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
import Join from "@/pages/Join";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { AuthLoader } from "@/components/layout/AuthLoader";
import { ClientLayout } from "@/components/layout/ClientLayout";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientKanbanBoard from "@/pages/ClientKanbanBoard";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();
  if (loading && (!session || !profile)) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" replace />;
  
  if (profile?.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-background/60 backdrop-blur-3xl p-12 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-8 rotate-3">
             <div className="h-10 w-10 text-destructive font-black text-3xl">!</div>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic mb-2">Acesso <span className="text-destructive not-italic">Suspenso</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 leading-relaxed">
            Sua conta neste ambiente foi inativada <br /> pela administração da agência.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5">
             <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity" onClick={() => window.location.href = '/auth'}>Voltar ao Login</button>
          </div>
        </div>
      </div>
    );
  }

  if (!agency && !loading) return <Navigate to="/onboarding" replace />;

  if (profile?.role === 'client') {
    return <Navigate to="/cliente/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();
  if (loading && (!session || !profile)) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/auth" replace />;

  if (profile?.status === 'inactive') {
    return <Navigate to="/auth" replace />;
  }

  if (!agency && !loading) return <Navigate to="/onboarding" replace />;
  
  if (profile?.role !== 'client') {
    return <Navigate to="/" replace />;
  }

  return <ClientLayout>{children}</ClientLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projetos" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projetos/:projectId/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Rotas de Cliente */}
      <Route path="/cliente/dashboard" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
      <Route path="/cliente/projetos/:projectId/kanban" element={<ClientRoute><ClientKanbanBoard /></ClientRoute>} />
      
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
