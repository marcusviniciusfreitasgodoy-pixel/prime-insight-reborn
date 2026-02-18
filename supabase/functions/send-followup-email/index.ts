import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Escapes HTML special characters to prevent XSS and HTML injection attacks.
 * This function sanitizes user-provided strings before embedding them in HTML templates.
 */
function escapeHtml(unsafe: string | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  interesse: string;
  bairro_interesse: string | null;
  area_interesse: number | null;
  valor_interesse: number | null;
  created_at: string;
}

const formatCurrency = (value: number | undefined | null) => {
  if (!value) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

async function sendFollowUpEmail(lead: Lead): Promise<{ success: boolean; error?: string }> {
  const isVenda = lead.interesse === "venda";
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0C2340 0%, #1a365d 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0 0 10px 0; color: #D4AF37; font-size: 22px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 25px; border: 1px solid #e0e0e0; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; text-align: center; }
        .footer p { margin: 5px 0; color: #888; font-size: 12px; }
        .logo-text { color: #D4AF37; font-weight: bold; font-size: 20px; }
        .highlight-box { background: linear-gradient(135deg, #D4AF37 0%, #b8962f 100%); color: #0C2340; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .benefit-list { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefit-list ul { margin: 0; padding-left: 20px; }
        .benefit-list li { margin: 8px 0; color: #555; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">🏠 GODOY PRIME REALTY</div>
          <h1>Ainda Pensando na ${isVenda ? 'Venda' : 'Compra'}?</h1>
          <p>Estamos aqui para ajudar você a tomar a melhor decisão</p>
        </div>
        
        <div class="content">
          <p style="color: #555; font-size: 15px;">Olá <strong>${escapeHtml(lead.nome)}</strong>,</p>
          
          <p style="color: #555; font-size: 15px;">
            Há alguns dias você fez uma avaliação preliminar conosco${lead.bairro_interesse ? ` para um imóvel na <strong>${escapeHtml(lead.bairro_interesse)}</strong>` : ''}. Gostaríamos de saber se podemos ajudá-lo de alguma forma!
          </p>

          <div class="highlight-box">
            <h3 style="margin: 0 0 10px 0;">📋 Parecer Técnico Completo</h3>
            <p style="margin: 0; font-size: 14px;">
              Nosso especialista analisa os <strong>diferenciais específicos</strong> do seu imóvel, revelando valores até <strong>30% mais precisos</strong> que a estimativa preliminar.
            </p>
          </div>

          <div class="benefit-list">
            <h4 style="margin: 0 0 15px 0; color: #0C2340;">✨ O que você ganha com o Parecer Técnico:</h4>
            <ul>
              <li><strong>Análise Personalizada</strong> - Consideramos vista, andar, acabamentos e reformas</li>
              <li><strong>Comparativo de Mercado</strong> - Transações recentes em imóveis similares</li>
              <li><strong>Estratégia de ${isVenda ? 'Precificação' : 'Negociação'}</strong> - Orientação para o melhor negócio</li>
              <li><strong>Sem Compromisso</strong> - Consultoria gratuita e sem pressão</li>
            </ul>
          </div>

          ${lead.valor_interesse ? `
          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              <strong>💰 Sua última estimativa:</strong> ${formatCurrency(lead.valor_interesse)}
              <br><small style="color: #888;">Com o Parecer Técnico, você pode descobrir um valor ainda mais preciso.</small>
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://prime-insight-reborn.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #0C2340 0%, #1a365d 100%); color: white; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📊 Solicitar Parecer Técnico Grátis
            </a>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #888; font-size: 13px; margin: 0;">Ou fale diretamente conosco:</p>
            <a href="https://wa.me/5521999680553" style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 10px;">
              📱 WhatsApp (21) 99968-0553
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Godoy Prime Realty</strong> - CRECI-RJ 11841</p>
          <p>Especialistas em Imóveis de Alto Padrão na Barra da Tijuca</p>
          <p style="margin-top: 15px;">
            <a href="https://godoyprime.com.br" style="color: #0C2340; text-decoration: none;">godoyprime.com.br</a>
          </p>
          <p style="margin-top: 15px; color: #aaa; font-size: 11px;">
            Você recebeu este email porque fez uma avaliação em nossa plataforma.<br>
            <a href="#" style="color: #aaa;">Cancelar inscrição</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const emailResponse = await resend.emails.send({
      from: "Godoy Prime Realty <marcus@godoyprime.com.br>",
      to: [lead.email],
      subject: `🔔 ${escapeHtml(lead.nome)}, seu Parecer Técnico está esperando - Godoy Prime`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Error sending follow-up email:", emailResponse.error);
      return { success: false, error: emailResponse.error.message };
    }

    console.log("Follow-up email sent successfully to:", lead.email, "ID:", emailResponse.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending follow-up email:", error.message);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== send-followup-email START ===");
  console.log("Method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for scheduled calls
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.log("Unauthorized request - invalid or missing cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find leads that:
    // 1. Were created more than 48 hours ago
    // 2. Haven't received a follow-up email yet
    // 3. Haven't requested a Parecer Técnico
    // 4. Have aceita_marketing = true or null (not explicitly false)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    console.log("Looking for leads created before:", fortyEightHoursAgo);

    const { data: leads, error: fetchError } = await supabase
      .from("leads")
      .select("id, nome, email, telefone, interesse, bairro_interesse, area_interesse, valor_interesse, created_at")
      .lt("created_at", fortyEightHoursAgo)
      .is("followup_sent_at", null)
      .eq("parecer_solicitado", false)
      .or("aceita_marketing.is.null,aceita_marketing.eq.true")
      .limit(50); // Process max 50 leads per run to avoid timeouts

    if (fetchError) {
      console.error("Error fetching leads:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${leads?.length || 0} leads eligible for follow-up`);

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No leads eligible for follow-up",
          processed: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const lead of leads) {
      const result = await sendFollowUpEmail(lead);
      
      if (result.success) {
        // Mark the lead as having received follow-up
        const { error: updateError } = await supabase
          .from("leads")
          .update({ followup_sent_at: new Date().toISOString() })
          .eq("id", lead.id);

        if (updateError) {
          console.error("Error updating lead:", lead.id, updateError);
        }

        successCount++;
        results.push({ email: lead.email, success: true });
      } else {
        errorCount++;
        results.push({ email: lead.email, success: false, error: result.error });
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`=== send-followup-email END === Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${leads.length} leads`,
        successCount,
        errorCount,
        results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("=== send-followup-email ERROR ===");
    console.error("Error details:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
