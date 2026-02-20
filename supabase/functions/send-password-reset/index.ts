import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, origin } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Generate recovery link via Admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${origin || "https://prime-insight-reborn.lovable.app"}/reset-password`,
      },
    });

    if (error) {
      // Don't reveal if user exists or not
      console.error("generateLink error:", error.message);
      return new Response(
        JSON.stringify({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recoveryLink = data?.properties?.action_link;
    if (!recoveryLink) {
      console.error("No action_link returned");
      return new Response(
        JSON.stringify({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeEmail = escapeHtml(email);

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#D4AF37;font-size:24px;margin:0;">GODOY PRIME</h1>
      <p style="color:#888;font-size:12px;letter-spacing:2px;margin:4px 0 0;">REALTY</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:32px;">
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Redefinição de Senha</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;">
        Olá,<br><br>
        Recebemos uma solicitação para redefinir a senha da conta associada a <strong style="color:#D4AF37;">${safeEmail}</strong>.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${recoveryLink}" style="display:inline-block;background:#D4AF37;color:#000;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:bold;font-size:14px;">
          Redefinir Minha Senha
        </a>
      </div>
      <p style="color:#888;font-size:12px;line-height:1.5;">
        Se você não solicitou esta alteração, ignore este email. O link expira em 1 hora.
      </p>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:24px;">
      Godoy Prime Realty &bull; Inteligência Imobiliária Premium
    </p>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Godoy Prime Realty <marcus@godoyprime.com.br>",
        to: [email.trim().toLowerCase()],
        subject: "Redefinir sua senha - Godoy Prime",
        html: htmlTemplate,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
    }

    return new Response(
      JSON.stringify({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
