import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const normalizePhone = (value: string) => value.replace(/[\s().-]/g, "");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json();
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const normalizedPhone = typeof body.normalized_phone === "string"
      ? normalizePhone(body.normalized_phone.trim())
      : normalizePhone(identifier);

    if (!identifier || !password) return json({ error: "Invalid credentials." }, 400);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

    let email: string | null = identifier.includes("@") ? identifier.toLowerCase() : null;

    if (!email) {
      const usernameResult = await service.from("profiles").select("email").ilike("username", identifier).maybeSingle();
      email = usernameResult.data?.email ?? null;

      if (!email) {
        const phoneResult = await service.from("profiles").select("email").eq("phone", normalizedPhone).maybeSingle();
        email = phoneResult.data?.email ?? null;
      }
    }

    if (!email) return json({ error: "Invalid credentials." }, 401);

    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data.session) return json({ error: "Invalid credentials." }, 401);

    const profile = await service
      .from("profiles")
      .select("id, full_name, email, account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile.data?.account_status === "deleted") {
      await anon.auth.signOut();
      return json({ error: "This account has been deleted." }, 403);
    }

    // Preserve the legacy security notification without exposing the account
    // email or other profile data to the Flutter client.
    try {
      await service.rpc("queue_email", {
        p_to: profile.data?.email ?? email,
        p_subject: "New login to your Bishram Ekata Mandali account",
        p_text: `Hello ${profile.data?.full_name ?? ""},\n\nWe noticed a login to your account. If this was you, no action is needed.\nIf you did not log in, please reset your password or contact us.\n\n— Bishram Ekata Mandali`,
        p_html: `<p>Hello ${profile.data?.full_name ?? ""},</p><p>We noticed a login to your account. If this was you, no action is needed.</p><p>If you did not log in, please reset your password or contact us.</p><p>— Bishram Ekata Mandali</p>`,
      });
    } catch {
      // Login must not fail solely because notification delivery is unavailable.
    }

    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return json({ error: "Invalid credentials." }, 401);
  }
});
