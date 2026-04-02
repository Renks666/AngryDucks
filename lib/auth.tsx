import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile, UserRole } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  inviteCode?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!error && data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async ({ email, password, name, inviteCode }: SignUpParams) => {
    // Determine role based on invite code
    let role: UserRole = 'guest';

    if (inviteCode) {
      const { data: code, error: codeError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .is('used_by', null)
        .single();

      if (codeError || !code) throw new Error('Неверный или использованный инвайт-код');
      role = 'player';
    }

    // Create auth user — pass name+role as metadata for the trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Не удалось создать пользователя');

    const userId = authData.user.id;

    // If a session exists (email confirmation disabled), the trigger already ran.
    // If no session yet (confirmation required), insert profile manually — will fail
    // only if trigger already created it (ON CONFLICT DO NOTHING handles that).
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      name,
      role,
      skill_level: 'amateur',
    });
    // Ignore RLS/conflict errors — trigger may have already created the profile
    if (profileError && !profileError.message.includes('row-level security') && profileError.code !== '23505') {
      throw profileError;
    }

    // Mark invite code as used
    if (inviteCode && role === 'player') {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        await supabase
          .from('invite_codes')
          .update({ used_by: profileData.id, is_active: false })
          .eq('code', inviteCode.toUpperCase());
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
