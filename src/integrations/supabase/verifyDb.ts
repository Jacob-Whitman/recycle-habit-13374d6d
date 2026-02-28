import { supabase } from "./client";

export type VerifyResult =
  | { ok: true; message: string; details?: string }
  | { ok: false; message: string; details?: string };

/**
 * Verifies Supabase connection and that the database is reachable.
 * - Checks env vars are set
 * - Reads from item_types (public table, no auth required)
 * - If session exists, verifies profile can be read
 */
export async function verifyDatabase(): Promise<VerifyResult> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return {
      ok: false,
      message: "Database not configured",
      details: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env",
    };
  }

  try {
    const { data: items, error: itemsError } = await supabase
      .from("item_types")
      .select("id")
      .limit(1);

    if (itemsError) {
      return {
        ok: false,
        message: "Database connection failed",
        details: itemsError.message,
      };
    }

    if (!items || items.length === 0) {
      return {
        ok: false,
        message: "Database reachable but empty",
        details: "Run the Supabase migration to seed item_types.",
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        return {
          ok: true,
          message: "Connected (public data OK)",
          details: `Profile read failed: ${profileError.message}. Run migrations if you haven't.`,
        };
      }
    }

    return {
      ok: true,
      message: "Database connected and working",
      details: session?.user ? "Auth and profile OK." : "Public tables OK. Sign in to use profile data.",
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message: "Database check failed",
      details: err,
    };
  }
}
