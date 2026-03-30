"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, AuthMeResponse } from "@/types/user";
import { supabase } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/auth";
import type { Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  questionsUsed: number;
  questionsLimit: number;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isAuthenticated: false,
  isAnonymous: true,
  questionsUsed: 0,
  questionsLimit: 3,
  isLoading: true,
  refreshAuth: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authMe, setAuthMe] = useState<AuthMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const result = await fetchMe();
      setAuthMe(result.data);
      setUser(result.data.user);
    } catch {
      setAuthMe(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      refreshAuth().finally(() => setIsLoading(false));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      refreshAuth();
    });

    return () => subscription.unsubscribe();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: authMe?.authenticated ?? false,
        isAnonymous: authMe?.anonymous ?? true,
        questionsUsed: authMe?.questions_used ?? 0,
        questionsLimit: authMe?.questions_limit ?? 3,
        isLoading,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
