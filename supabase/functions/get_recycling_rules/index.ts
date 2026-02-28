// Supabase Edge Function: get_recycling_rules
// Invoke with body: { zip: "12345" }
// Returns: { rules: { plastic_bottle?: "accepted"|"not_accepted"|"not_sure", ... } | null }
//
// To use local recycling data: add a database table or call an external API (e.g. Recycle Check,
// EPA, or a municipal API) and map results to app item_type ids. For now returns null.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as { zip?: string };
    const zip = typeof body?.zip === "string" ? body.zip.replace(/\D/g, "").slice(0, 5) : "";

    if (zip.length !== 5) {
      return new Response(
        JSON.stringify({ rules: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // TODO: Look up rules for zip from your data source or external API.
    // Example: const rules = await lookupFromApi(zip);
    // Return format: { plastic_bottle: "accepted", aluminum_can: "accepted", cardboard: "accepted", paper: "accepted", ... }
    const rules: Record<string, string> | null = null;

    return new Response(JSON.stringify({ rules }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ rules: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
