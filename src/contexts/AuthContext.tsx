import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Tenant, AppRole } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);

        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .single();
          setTenant(tenantData as Tenant | null);
        } else {
          setTenant(null);
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        setRole(roleData ? (roleData.role as AppRole) : null);
      } else {
        setProfile(null);
        setTenant(null);
        setRole(null);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setProfile(null);
      setTenant(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Keep loading=true while we fetch user data so guards never
          // see an intermediate state of user=set, tenant=null.
          setLoading(true);
          setTimeout(async () => {
            await fetchUserData(newSession.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check existing session — wait for user data before releasing loading
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await fetchUserData(existingSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, tenant, role, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
