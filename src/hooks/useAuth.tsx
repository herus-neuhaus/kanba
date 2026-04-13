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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid throwing on 0 rows

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData as Profile);
        
        if (profileData.agency_id) {
          const { data: agencyData, error: agencyError } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', profileData.agency_id)
            .maybeSingle();
          
          if (!agencyError && agencyData) {
            setAgency(agencyData as Agency);
          } else {
            setAgency(null);
          }
        } else {
          setAgency(null);
        }
      } else {
        setProfile(null);
        setAgency(null);
      }
    } catch (e) {
      console.error("Auth: Error fetching profile", e);
      setProfile(null);
      setAgency(null);
    }
  };

  const processInvite = async (userId: string) => {
    const inviteToken = localStorage.getItem('invite_token');
    if (!inviteToken) return;

    try {
      console.log("Auth: Processing invite token", inviteToken);
      
      // 1. Get invite details
      const { data: invite, error: fetchError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', inviteToken)
        .single();
        
      if (fetchError || !invite || invite.used) {
        localStorage.removeItem('invite_token');
        return;
      }

      // 2. Link user to agency and mark onboarding as complete
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          agency_id: invite.agency_id, 
          role: invite.role,
          status: 'active',
          onboarding_completed: true 
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;

      // 3. Mark invite as used
      await supabase.from('invites').update({ used: true }).eq('id', invite.id);
      
      localStorage.removeItem('invite_token');
      console.log("Auth: Invite processed successfully");
      
      // Refresh profile to reflect changes
      await fetchProfile(userId);
    } catch (err) {
      console.error("Auth: Error processing invite", err);
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
    const { data, error } = await supabase.from('agencies').insert({ name, owner_user_id: user.id }).select().single();
    if (error) throw error;
    const agencyData = data as Agency;
    await supabase.from('profiles').update({ 
      agency_id: agencyData.id, 
      role: 'owner',
      onboarding_completed: true 
    }).eq('id', user.id);
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
