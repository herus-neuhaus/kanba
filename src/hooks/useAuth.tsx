import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Agency } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  agency: Agency | null;
  loading: boolean;
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

  // Sync refs with state
  useEffect(() => {
    profileRef.current = profile;
    loadingRef.current = loading;
  }, [profile, loading]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setProfile(data as Profile);
        if (data.agency_id) {
          const { data: agencyData } = await supabase.from('agencies').select('*').eq('id', data.agency_id).single();
          if (agencyData) setAgency(agencyData as Agency);
        }
      }
    } catch (e) {
      console.error("Auth: Error fetching profile", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Auth: Initialization error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Refresh profile in background unless it's a new login
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAgency(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    const { data, error } = await supabase.from('agencies').insert({ name, owner_user_id: user.id }).select().single();
    if (error) throw error;
    const agencyData = data as Agency;
    await supabase.from('profiles').update({ agency_id: agencyData.id, role: 'owner' }).eq('id', user.id);
    setAgency(agencyData);
    await fetchProfile(user.id);
    return agencyData;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, agency, loading, signUp, signIn, signOut, createAgency, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
