import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthLoader } from "@/components/layout/AuthLoader";

// ─────────────────────────────────────────────────────────────
//  Code-split boundary:
//  PUBLIC chunk  → Landing, Auth  (no app dependencies)
//  APP chunk     → Everything behind authentication
// ─────────────────────────────────────────────────────────────

// Public — tiny, no heavy deps
const Landing      = lazy(() => import("@/pages/Landing"));
const Auth         = lazy(() => import("@/pages/Auth"));
const Join         = lazy(() => import("@/pages/Join"));
const NotFound     = lazy(() => import("@/pages/NotFound"));

// Authenticated — full app bundle (loads only after login)
const Onboarding        = lazy(() => import("@/pages/Onboarding"));
const Dashboard         = lazy(() => import("@/pages/Dashboard"));
const Projects          = lazy(() => import("@/pages/Projects"));
const KanbanBoard       = lazy(() => import("@/pages/KanbanBoard"));
const Team              = lazy(() => import("@/pages/Team"));
const Settings          = lazy(() => import("@/pages/Settings"));
const ClientDashboard   = lazy(() => import("@/pages/ClientDashboard"));
const ClientKanbanBoard = lazy(() => import("@/pages/ClientKanbanBoard"));

// Layouts — only needed inside the app
const DashboardLayout = lazy(() =>
  import("@/components/features/DashboardLayout").then(m => ({ default: m.DashboardLayout }))
);
const ClientLayout = lazy(() =>
  import("@/components/layout/ClientLayout").then(m => ({ default: m.ClientLayout }))
);

// ─────────────────────────────────────────────────────────────
//  Suspense fallbacks
// ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — reduce refetch noise
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Route guards
// ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();

  if (loading && (!session || !profile)) return <PageLoader />;
  if (!session) return <Navigate to="/" replace />;

  if (profile?.status === "inactive") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card p-12 rounded border border-border text-center shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded flex items-center justify-center mb-8">
            <div className="h-10 w-10 text-destructive font-black text-3xl">!</div>
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">
            Acesso <span className="text-destructive">Suspenso</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sua conta foi inativada pela administração da agência.
          </p>
          <div className="mt-8 pt-8 border-t border-border">
            <button
              className="text-xs font-semibold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
              onClick={() => (window.location.href = "/auth")}
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!agency && !loading) return <Navigate to="/onboarding" replace />;
  if (profile?.role === "client") return <Navigate to="/cliente/dashboard" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();
  if (loading && (!session || !profile)) return <PageLoader />;
  if (!session) return <Navigate to="/" replace />;
  if (profile?.status === "inactive") return <Navigate to="/auth" replace />;
  if (!agency && !loading) return <Navigate to="/onboarding" replace />;
  if (profile?.role !== "client") return <Navigate to="/dashboard" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* ── Rotas Públicas (chunk minúsculo) ── */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <Landing />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/join/:token"
        element={
          <Suspense fallback={<PageLoader />}>
            <Join />
          </Suspense>
        }
      />

      {/* ── Onboarding ── */}
      <Route
        path="/onboarding"
        element={
          <Suspense fallback={<AuthLoader />}>
            <Onboarding />
          </Suspense>
        }
      />

      {/* ── Rotas Protegidas — app chunk ── */}
      <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
      <Route path="/projetos"   element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Projects /></Suspense></ProtectedRoute>} />
      <Route path="/projetos/:projectId/kanban" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><KanbanBoard /></Suspense></ProtectedRoute>} />
      <Route path="/team"       element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Team /></Suspense></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Settings /></Suspense></ProtectedRoute>} />

      {/* ── Rotas de Cliente ── */}
      <Route path="/cliente/dashboard"                        element={<ClientRoute><Suspense fallback={<PageLoader />}><ClientDashboard /></Suspense></ClientRoute>} />
      <Route path="/cliente/projetos/:projectId/kanban"       element={<ClientRoute><Suspense fallback={<PageLoader />}><ClientKanbanBoard /></Suspense></ClientRoute>} />

      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────
//  App root
// ─────────────────────────────────────────────────────────────
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
