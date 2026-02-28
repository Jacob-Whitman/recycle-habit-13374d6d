/**
 * Fetch recycling rules for a US ZIP code from a configured API or Supabase Edge Function.
 * Rules map item_type_id -> "accepted" | "not_accepted" | "not_sure".
 *
 * Set VITE_RECYCLING_LOOKUP_URL to your API (e.g. a serverless function) that returns:
 *   GET {url}?zip=12345  ->  { "plastic_bottle": "accepted", "aluminum_can": "accepted", ... }
 * Or deploy the Supabase Edge Function get_recycling_rules and it will be called automatically.
 */

import { supabase } from "@/integrations/supabase/client";

const VALID_RULES = new Set(["accepted", "not_accepted", "not_sure"]);

function normalizeZip(value: string): string {
  return value.trim().replace(/\D/g, "").slice(0, 9);
}

/** True if the value looks like a US ZIP (5 digits, or 5+4). */
export function isZipCode(value: string): boolean {
  const z = normalizeZip(value);
  return z.length === 5 || z.length === 9;
}

/** Extract 5-digit ZIP for lookup (use first 5 digits if 5+4). */
export function zipForLookup(value: string): string {
  return normalizeZip(value).slice(0, 5);
}

export type RecyclingRulesResult = Record<string, "accepted" | "not_accepted" | "not_sure">;

/**
 * Default rules when no API returns data. Matches common US curbside guidelines:
 * Accepted: plastic bottles/jugs, aluminum/tin/steel cans, glass jars, paper, flattened cardboard.
 * Not accepted: plastic bags/film, shredded paper in bin, electronics, batteries (use drop-off).
 */
export const DEFAULT_RECYCLING_RULES: RecyclingRulesResult = {
  plastic_bottle: "accepted",
  aluminum_can: "accepted",
  glass_bottle: "accepted",
  steel_can: "accepted",
  cardboard: "accepted",
  paper: "accepted",
  paperboard: "accepted",
  carton: "accepted",
  plastic_clamshell: "not_sure",
  plastic_film: "not_accepted",
  batteries: "not_accepted",
  electronics: "not_accepted",
};

/** Local guidelines text shown when rules are pre-filled from ZIP. */
export const DEFAULT_LOCAL_GUIDELINES = [
  "No plastic bags — do not bag recyclables; return bags to grocery stores.",
  "Clean and dry — containers must be empty and rinsed.",
  "Accepted: plastic bottles/jugs, aluminum/tin/steel cans, glass jars, paper, flattened cardboard.",
  "Avoid: Styrofoam, greasy pizza boxes, plastic film/bags, clothing, shredded paper.",
  "Electronics & hazmat: Batteries and motor oil go to drop-off centers, not curbside.",
];

/**
 * Fetch recycling rules for the given ZIP. Tries API/Edge Function first; if none or failure, returns default rules so ZIP always gets a pre-fill.
 */
export async function fetchRecyclingRulesByZip(zip: string): Promise<RecyclingRulesResult> {
  const zip5 = zipForLookup(zip);
  if (zip5.length !== 5) return { ...DEFAULT_RECYCLING_RULES };

  const url = import.meta.env.VITE_RECYCLING_LOOKUP_URL as string | undefined;

  if (url) {
    try {
      const res = await fetch(`${url.replace(/\?.*$/, "")}?zip=${zip5}`);
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const rules = normalizeRules(data);
        if (Object.keys(rules).length > 0) return rules;
      }
    } catch {
      // fall through to default
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ rules?: Record<string, string> | null }>("get_recycling_rules", {
      body: { zip: zip5 },
    });
    if (!error && data?.rules && Object.keys(data.rules).length > 0) {
      return normalizeRules(data.rules);
    }
  } catch {
    // fall through to default
  }

  return { ...DEFAULT_RECYCLING_RULES };
}

function normalizeRules(raw: Record<string, unknown>): RecyclingRulesResult {
  const out: RecyclingRulesResult = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === "string" && VALID_RULES.has(val)) {
      out[key] = val as "accepted" | "not_accepted" | "not_sure";
    }
  }
  return out;
}
