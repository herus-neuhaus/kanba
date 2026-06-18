import { CommandPalette } from "@/components/features/CommandPalette";
import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthLoader } from "@/components/layout/AuthLoader";
import { LoadingSplash } from "@/components/layout/LoadingSplash";
import { UnauthorizedAccess } from "@/components/UnauthorizedAccess";
import { WorkspaceProvider } from "@/hooks/useWorkspace";

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
const TaskRedirect      = lazy(() => import("@/pages/TaskRedirect"));
const CRM               = lazy(() => import("@/pages/CRM"));
const Reports           = lazy(() => import("@/pages/Reports"));
const SubscriptionPending = lazy(() => import("@/pages/SubscriptionPending"));
const SpaceProjects       = lazy(() => import("@/pages/SpaceProjects"));
const SpaceSettings       = lazy(() => import("@/pages/SpaceSettings"));

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

  // We don't check loading here anymore as it's handled at the AppRoutes level
  // This prevents the "flash" by ensuring this component only runs when auth is resolved.
  
  if (!session) return <Navigate to="/auth" replace />;

  if (profile?.status === "inactive") {
    return <UnauthorizedAccess />;
  }

  // ── Subscription Check ──
  const isInvalid = 
    agency && 
    (agency.subscription_status === 'past_due' || agency.subscription_status === 'canceled' || 
    (agency.next_billing_date && new Date(agency.next_billing_date) < new Date()));

  if (isInvalid && window.location.pathname !== '/assinatura-pendente') {
    return <Navigate to="/assinatura-pendente" replace />;
  }

  // If user linked via invite or finished onboarding, skip it
  if (profile?.onboarding_completed) {
    return (
      <Suspense fallback={<LoadingSplash />}>
        <DashboardLayout>{children}</DashboardLayout>
      </Suspense>
    );
  }

  // Rule: if no agency and onboarding not completed, go to onboarding
  if (!agency && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // If session is recovered but no profile (and loading finished), redirect to auth
  if (!profile && !loading) {
    return <Navigate to="/auth" replace />;
  }

  // Fallback for edge cases
  if (profile?.agency_role?.role_type === "client") return <Navigate to="/cliente/dashboard" replace />;

  return (
    <Suspense fallback={<LoadingSplash />}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, agency, loading } = useAuth();
  if (loading && (!session || !profile)) return <PageLoader />;
  if (!session) return <Navigate to="/" replace />;
  if (profile?.status === "inactive") return <UnauthorizedAccess />;
  if (!agency && !loading) return <Navigate to="/onboarding" replace />;
  if (profile?.agency_role?.role_type !== "client") return <Navigate to="/dashboard" replace />;

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
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSplash />;
  }

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
      <Route path="/crm"        element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CRM /></Suspense></ProtectedRoute>} />
      <Route path="/reports"    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Reports /></Suspense></ProtectedRoute>} />
      <Route path="/espacos/:spaceId" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
      <Route path="/espacos/:spaceId/settings" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><SpaceSettings /></Suspense></ProtectedRoute>} />
      <Route path="/espacos/:spaceId/crm" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CRM /></Suspense></ProtectedRoute>} />
      <Route 
        path="/assinatura-pendente" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <SubscriptionPending />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* ── Rotas de Cliente ── */}
      <Route path="/cliente/dashboard"                        element={<ClientRoute><Suspense fallback={<PageLoader />}><ClientDashboard /></Suspense></ClientRoute>} />
      <Route path="/cliente/projetos/:projectId/kanban"       element={<ClientRoute><Suspense fallback={<PageLoader />}><ClientKanbanBoard /></Suspense></ClientRoute>} />
      
      {/* ── Redirecionamento de Tarefa (Shortlink) ── */}
      <Route path="/t/:taskId" element={<Suspense fallback={<LoadingSplash />}><TaskRedirect /></Suspense>} />

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
          <WorkspaceProvider>
            <AppRoutes />
            <CommandPalette />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
