import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
/** Synthetic identifier for Supabase auth only; app is username-only, no email used. */
const CANONICAL_DOMAIN = "recycle.bandit";

function toUsernameError(err: { message: string }, isSignIn: boolean): string {
  const m = err.message.toLowerCase();
  if (!isSignIn) {
    if (m.includes("already registered") || m.includes("already exists") || m.includes("already in use"))
      return "That username is already taken.";
    if (m.includes("weak_password") || m.includes("password"))
      return "Signup was rejected (password policy). Try again.";
  }
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Wrong username or login code.";
  if (m.includes("not confirmed") || m.includes("confirm your"))
    return "Account not active yet. The app must have email confirmation turned off—check Supabase: Authentication → Providers → Email → disable “Confirm email”.";
  if (m.includes("email"))
    return "Wrong username or login code.";
  return "Something went wrong. Try again.";
}

const WORDS = ["sun", "moon", "star", "leaf", "wave", "bird", "tree", "rain", "snow", "fire", "wind", "cloud", "seed", "path", "drop"];
/** Generates a login code that satisfies Supabase password policy (min length, upper, lower, digit, symbol). */
function generateLoginCode(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const n = Math.floor(10 + Math.random() * 90);
  const capitalized = `${w1.charAt(0).toUpperCase() + w1.slice(1)}-${w2}-${n}!`;
  return capitalized;
}

export function canonicalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export function validateUsername(username: string): { ok: boolean; error?: string } {
  const t = username.trim();
  if (t.length < 3) return { ok: false, error: "Username must be at least 3 characters" };
  if (t.length > 20) return { ok: false, error: "Username must be at most 20 characters" };
  if (!USERNAME_REGEX.test(t)) return { ok: false, error: "Use only letters, numbers, and underscores" };
  return { ok: true };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Shown once after signup; clear after user acknowledges */
  loginCodeToShow: string | null;
  dismissLoginCode: () => void;
  signUpWithUsername: (username: string) => Promise<{ error?: string }>;
  signInWithUsernameAndCode: (username: string, code: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginCodeToShow, setLoginCodeToShow] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithUsername = async (username: string): Promise<{ error?: string }> => {
    const validation = validateUsername(username);
    if (!validation.ok) return { error: validation.error };

    const canonical = canonicalizeUsername(username.trim());
    if (canonical.length < 3) return { error: "Username too short after formatting" };

    const code = generateLoginCode();
    const authId = `${canonical}@${CANONICAL_DOMAIN}`;

    const { data, error } = await supabase.auth.signUp({
      email: authId,
      password: code,
      options: {
        data: { full_name: username.trim() },
      },
    });

    if (error) return { error: toUsernameError(error, false) };
    if (!data.user) return { error: "Something went wrong. Try again." };

    // Ensure profile row exists (trigger may have run; upsert covers race or missing trigger)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { user_id: data.user.id, display_name: username.trim() },
        { onConflict: "user_id" }
      );

    if (profileError) return { error: "Account created but profile setup failed. Try logging in." };

    setLoginCodeToShow(code);
    return {};
  };

  const signInWithUsernameAndCode = async (
    username: string,
    code: string
  ): Promise<{ error?: string }> => {
    const canonical = canonicalizeUsername(username.trim());
    if (canonical.length < 3) return { error: "Invalid username." };

    const authId = `${canonical}@${CANONICAL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email: authId, password: code });

    if (error) return { error: toUsernameError(error, true) };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        loginCodeToShow,
        dismissLoginCode: () => setLoginCodeToShow(null),
        signUpWithUsername,
        signInWithUsernameAndCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
