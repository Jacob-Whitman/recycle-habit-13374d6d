// Supabase Edge Function: send_sol_reward
// When the authenticated user has recycled 100+ items (lifetime) and hasn't claimed yet,
// sends 5 SOL on Solana devnet to the configured reward address.
// Requires: SOLANA_TREASURY_PRIVATE_KEY (JSON array of 64 secret key bytes) and treasury funded on devnet.

import { createClient } from "npm:@supabase/supabase-js";
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "npm:@solana/web3.js";

const REWARD_LAMPS = 5 * LAMPORTS_PER_SOL;
const REWARD_ADDRESS = "8r2EpKVHLf1ASuDtj2up8TDwjkTbHbDY94UcT7jcEQ1s";
const DEVNET_RPC = "https://api.devnet.solana.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: claimed } = await supabase
      .from("sol_reward_claimed")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (claimed) {
      return new Response(
        JSON.stringify({ claimed: true, message: "Reward already claimed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: entries } = await supabase.from("log_entries").select("quantity").eq("user_id", user.id);
    const lifetimeTotal = (entries ?? []).reduce((sum, e) => sum + e.quantity, 0);
    if (lifetimeTotal < 100) {
      return new Response(
        JSON.stringify({ error: "Need 100 items recycled", lifetimeTotal }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const secretJson = Deno.env.get("SOLANA_TREASURY_PRIVATE_KEY");
    if (!secretJson) {
      console.error("SOLANA_TREASURY_PRIVATE_KEY not set");
      return new Response(
        JSON.stringify({ error: "Reward not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    const secret = new Uint8Array(JSON.parse(secretJson));
    const treasury = Keypair.fromSecretKey(secret);
    const connection = new Connection(DEVNET_RPC);
    const toPubkey = new PublicKey(REWARD_ADDRESS);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey,
        lamports: REWARD_LAMPS,
      })
    );
    const signature = await sendAndConfirmTransaction(connection, tx, [treasury], {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    const { error: insertError } = await supabase.from("sol_reward_claimed").insert({ user_id: user.id });
    if (insertError) {
      console.error("sol_reward_claimed insert failed:", insertError);
      return new Response(
        JSON.stringify({ error: "Reward sent but claim record failed", signature }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, signature, message: "5 SOL sent to reward address" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to send reward" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
