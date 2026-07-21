"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabaseClient";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  refreshSession: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch (cause) {
      setUser(null);
      setError(cause instanceof Error ? cause.message : "Member session could not be checked.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, error, refreshSession }),
    [user, loading, error, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}