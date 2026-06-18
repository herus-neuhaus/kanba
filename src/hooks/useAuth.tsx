import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api/client';
import type { Profile, Agency } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  agency: Agency | null;
  loading: boolean;
  onboardingCompleted: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createAgency: (name: string) => Promise<Agency>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track profile presence inside the onAuthStateChange closure
  const profileRef = useRef<Profile | null>(null);
  const loadingRef = useRef<boolean>(true);
  const isFirstRun = useRef(true);
  const lastSessionId = useRef<string | null>(null);

  // Sync refs with state
  useEffect(() => {
    profileRef.current = profile;
    loadingRef.current = loading;
  }, [profile, loading]);

  const fetchProfile = async (userId: string) => {
    try {
      const context = await apiClient<{ user: any; profile: Profile | null; agency: Agency | null }>('/me');

      if (context.profile) {
        setProfile(context.profile);
        
        if (context.agency) {
          localStorage.setItem('active_agency_id', context.agency.id);
          setAgency(context.agency);
        } else {
          setAgency(null);
          const storedActiveId = localStorage.getItem('active_agency_id');
          if (storedActiveId) {
             console.warn("Auth: Access revoked for agency", storedActiveId);
             localStorage.removeItem('active_agency_id');
             window.alert("Seu acesso a esta agência foi inativado ou removido pelo administrador.");
          }
        }
      } else {
        setProfile(null);
        setAgency(null);
      }
    } catch (e: any) {
      console.error("Auth: Error fetching profile", e);
      if (e.message?.includes('Forbidden') || e.message?.includes('inativada') || e.message?.includes('access')) {
        localStorage.removeItem('active_agency_id');
        window.alert("Seu acesso foi revogado ou sua conta foi inativada.");
      }
      setProfile(null);
      setAgency(null);
    }
  };

  const processInvite = async (userId: string) => {
    const inviteToken = localStorage.getItem('invite_token');
    if (!inviteToken) return;

    try {
      console.log("Auth: Processing invite token via API", inviteToken);
      
      const result = await apiClient<{ success: boolean; message?: string; agency_id?: string }>(`/invites/${inviteToken}/accept`, {
        method: 'POST'
      });
      
      if (!result || !result.success) {
        console.warn("Auth: Invite rejection", result.message);
        localStorage.removeItem('invite_token');
        return;
      }

      localStorage.removeItem('invite_token');
      console.log("Auth: Invite processed successfully via API");
      
      if (result.agency_id) {
         localStorage.setItem('active_agency_id', result.agency_id);
      }
      
      // Profile will be fetched afterwards sequentially by the useEffect
    } catch (err) {
      console.error("Auth: Error processing invite", err);
      localStorage.removeItem('invite_token');
    }
  };

  // 1. Synchronous Session Management (Avoids Web Locks deadlock)
  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("Auth: Initial session error", error);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      // If no session, clear loading immediately
      if (!session) setLoading(false);
    });

    // Synchronous listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log(`Auth event: ${event}`);
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        setProfile(null);
        setAgency(null);
        setLoading(false);
      }
      // If session exists, Effect #2 will handle the loading state
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Reactive Metadata Fetcher (Profile/Agency)
  useEffect(() => {
    // Only run if we have a user but haven't resolved loading or profile yet
    // Or when user session changes
    if (!session?.user) return;
    
    let mounted = true;
    
    const fetchAdditionalData = async () => {
      try {
        // Use sessionId to prevent duplicate runs for the same token
        const sessionId = session.access_token;
        if (sessionId === lastSessionId.current && !isFirstRun.current) {
          setLoading(false);
          return;
        }
        lastSessionId.current = sessionId;

        await processInvite(session.user.id);
        await fetchProfile(session.user.id);
      } catch (err) {
        console.error("Auth: Metadata fetch error", err);
      } finally {
        if (mounted) {
          setLoading(false);
          isFirstRun.current = false;
        }
      }
    };

    fetchAdditionalData();
    
    return () => { mounted = false; };
  }, [session?.user?.id]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const createAgency = async (name: string): Promise<Agency> => {
    if (!user) throw new Error('Not authenticated');
    
    const agencyData = await apiClient('/agencies', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    localStorage.setItem('active_agency_id', agencyData.id);
    setAgency(agencyData);
    await fetchProfile(user.id);
    return agencyData;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      agency, 
      loading, 
      onboardingCompleted,
      signUp, 
      signIn, 
      signOut, 
      createAgency, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
