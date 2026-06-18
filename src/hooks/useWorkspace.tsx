import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';

interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar_url?: string;
}

interface WorkspaceContextType {
  activeWorkspaceId: string | null; // null means 'Global View'
  setActiveWorkspaceId: (id: string | null) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session, agency } = useAuth();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from API when agency is available
  useEffect(() => {
    let mounted = true;
    const fetchWorkspaces = async () => {
      if (!session || !agency) {
        if (mounted) setWorkspaces([]);
        return;
      }
      try {
        setLoading(true);
        const data = await apiClient<Workspace[]>('/spaces');
        if (mounted) {
          setWorkspaces(data);
          
          // Verify if active workspace is valid
          const saved = localStorage.getItem('kanba_active_workspace');
          if (saved === 'global') {
            setActiveWorkspaceIdState(null);
          } else if (saved && data.find(w => w.id === saved)) {
            setActiveWorkspaceIdState(saved);
          } else if (data.length > 0) {
            // Default to the first workspace if invalid or not set
            setActiveWorkspaceIdState(data[0].id);
            localStorage.setItem('kanba_active_workspace', data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching workspaces", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWorkspaces();
    return () => { mounted = false; };
  }, [session, agency]);

  const setActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (id === null) {
      localStorage.setItem('kanba_active_workspace', 'global');
    } else {
      localStorage.setItem('kanba_active_workspace', id);
    }
  };

  const activeWorkspace = activeWorkspaceId 
    ? workspaces.find(w => w.id === activeWorkspaceId) || null 
    : null;

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspaceId,
      setActiveWorkspaceId,
      workspaces,
      activeWorkspace,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
