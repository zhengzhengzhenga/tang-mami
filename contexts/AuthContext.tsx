import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  username: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function usernameToEmail(username: string): string {
  return `${username}@tangmami.local`;
}

function emailToUsername(email?: string | null): string | null {
  if (!email) return null;
  return email.replace(/@tangmami\.local$/i, '');
}

function getUsernameFromUser(user: User): string | null {
  const meta = user?.user_metadata as { username?: string } | undefined;
  return meta?.username ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = user ? getUsernameFromUser(user) : null;

  const ensureUserProfile = async (authUser: User) => {
    const profileUsername =
      getUsernameFromUser(authUser) ?? emailToUsername(authUser.email) ?? null;
    if (!profileUsername) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: authUser.id,
          username: profileUsername,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('ensureUserProfile failed:', error.message);
    }
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          void ensureUserProfile(s.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void ensureUserProfile(s.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string) => {
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !password) {
      setError('请输入用户名和密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }
    const { error: err } = await supabase.auth.signUp({
      email: usernameToEmail(trimmed),
      password,
      options: {
        data: { username: trimmed }
      }
    });
    if (err) {
      if (err.message.includes('already registered')) {
        setError('该用户名已被注册，请直接登录');
      } else if (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed')) {
        setError('网络请求失败，请检查网络连接及 Supabase 配置（.env 中的 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY）');
      } else {
        setError(err.message || '注册失败');
      }
      throw err;
    }
  };

  const signIn = async (username: string, password: string) => {
    setError(null);
    const trimmed = username.trim();
    if (!trimmed || !password) {
      setError('请输入用户名和密码');
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(trimmed),
      password,
    });
    if (err) {
      if (err.message.includes('Invalid login')) {
        setError('用户名或密码错误');
      } else if (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed')) {
        setError('网络请求失败，请检查网络连接及 Supabase 配置（.env 中的 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY）');
      } else {
        setError(err.message || '登录失败');
      }
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    await supabase.auth.signOut();
  };

  const clearError = () => setError(null);

  const value: AuthContextValue = {
    user,
    session,
    username,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
