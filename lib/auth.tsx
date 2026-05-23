"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarColor: string;
}

export interface SignUpResult {
  // True if Supabase requires the user to click an email link before they
  // can sign in. False means they're signed in already and we have a session.
  needsConfirmation: boolean;
}

interface AuthContextValue {
  user: User | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("AUTH_TIMEOUT")),
      ms,
    );
    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function userFromSession(
  session: Session,
  profile?: {
    full_name: string | null;
    role: string | null;
    avatar_color: string | null;
  } | null,
): User {
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    fullName:
      profile?.full_name ??
      (session.user.user_metadata?.full_name as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "User",
    role: (profile?.role as UserRole | undefined) ?? "customer",
    avatarColor: profile?.avatar_color ?? "#0A0A0A",
  };
}

async function loadUserFromSession(
  supabase: SupabaseClient,
  session: Session,
): Promise<User> {
  try {
    const { data: profile } = await withTimeout(
      supabase
        .from("profiles")
        .select("full_name, role, avatar_color")
        .eq("id", session.user.id)
        .maybeSingle(),
      AUTH_TIMEOUT_MS,
    );

    // RLS may return null when the auth signup trigger hasn't fired yet
    // (very rare race). Fall back to auth metadata so we always return a
    // sane User object; the next page load will pick up the real profile.
    return userFromSession(session, profile);
  } catch {
    // If the profile read fails or times out, do not leave the app stuck in
    // the admin hydration shell. The next refresh/auth event can retry.
    return userFromSession(session);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Stable browser client for the lifetime of this provider. Multiple
  // createClient() calls would each maintain their own auth listener.
  const [supabase] = useState<SupabaseClient>(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authRun = 0;

    // 1. Restore session from cookies on first mount.
    (async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
        if (mounted && session) {
          const u = await loadUserFromSession(supabase, session);
          if (mounted) setUser(u);
        } else if (mounted) {
          setUser(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    // 2. Subscribe to auth state changes — login/logout in another tab,
    //    token refresh, etc.
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const run = ++authRun;
        window.setTimeout(() => {
          void (async () => {
            if (!mounted || run !== authRun) return;
            if (session) {
              const u = await loadUserFromSession(supabase, session);
              if (mounted && run === authRun) setUser(u);
            } else {
              setUser(null);
            }
          })();
        }, 0);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<User> => {
      if (!email.trim() || !password.trim()) {
        throw new Error("MISSING_CREDENTIALS");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) {
        throw new Error("INVALID_CREDENTIALS");
      }
      // Load the profile now so the caller can route on role immediately;
      // onAuthStateChange will fire shortly after with the same data.
      const u = await loadUserFromSession(supabase, data.session);
      setUser(u);
      return u;
    },
    [supabase],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
    ): Promise<SignUpResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Passed through to raw_user_meta_data and read by the
          // handle_new_auth_user() DB trigger that creates the profile row.
          data: { full_name: fullName.trim() },
        },
      });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      signIn,
      signUp,
      signOut,
      isAdmin: user?.role === "admin",
    }),
    [user, hydrated, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used inside <AuthProvider>");
  return ctx;
}
