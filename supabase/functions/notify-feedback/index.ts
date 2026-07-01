import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PHONE, WHATSAPP_MESSAGES, whatsappUrl } from "../_shared/contact.ts";

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

interface FeedbackNotification {
  nome?: string;
  email?: string;
  tipo_feedback: string;
  avaliacao?: number;
  mensagem: string;
  respostas_questionario?: Record<string, string>;
}

const tipoLabels: Record<string, string> = {
  sugestao: "💡 Sugestão",
  bug: "🐛 Bug/Problema",
  elogio: "👏 Elogio",
  critica: "📝 Crítica construtiva",
  outro: "📌 Outro",
  pesquisa_validacao: "📋 Pesquisa de Validação",
};

const questionLabels: Record<string, string> = {
  faz_sentido: "Este tipo de serviço faz sentido para você?",
  ja_viu_similar: "Você já viu algo parecido antes?",
  ajuda_decisao: "Isso ajudaria você em uma decisão sobre imóveis?",
  navegacao: "Como foi navegar pela plataforma?",
  mobile: "A visualização no celular está adequada?",
  clareza: "As informações são claras?",
  visual: "O que achou do visual da plataforma?",
  sofia_ia: "A Sofia (assistente IA) foi útil?",
  compartilharia: "Você compartilharia com alguém?",
  usaria_novamente: "Usaria novamente?",
};

const answerLabels: Record<string, string> = {
  sim_totalmente: "✅ Sim, totalmente!",
  parcialmente: "🤔 Parcialmente",
  nao_muito: "😕 Não muito",
  nunca_vi: "🆕 Nunca vi nada assim",
  vi_similar: "👀 Vi algo similar",
  conheco_bem: "🎯 Já conheço bem esse tipo",
  com_certeza: "💪 Com certeza!",
  talvez: "🤷 Talvez",
  indiferente: "😐 Indiferente",
  muito_facil: "🚀 Muito fácil",
  facil: "👍 Fácil",
  algumas_dificuldades: "😕 Algumas dificuldades",
  otima: "📱 Ótima",
  boa: "👍 Boa",
  regular: "😐 Regular",
  nao_testei: "🤷 Não testei no celular",
  muito_claras: "💡 Muito claras",
  claras: "✅ Claras",
  confusas_em_partes: "🤔 Confusas em partes",
  profissional: "⭐ Profissional e elegante",
  bom: "👍 Bom",
  simples: "😐 Simples",
  precisa_melhorar: "🔧 Precisa melhorar",
  muito_util: "🤖 Muito útil!",
  util: "👍 Útil",
  nao_usei: "❌ Não usei",
  provavelmente: "👍 Provavelmente",
  sim: "✅ Sim!",
  nao: "❌ Não",
};

// Send confirmation email to user with consultation details
async function sendUserConfirmationEmail(feedback: FeedbackNotification) {
  if (!feedback.email) {
    console.log("No email provided, skipping user confirmation");
    return null;
  }

  const userName = feedback.nome || "Participante";

  try {
    const response = await resend.emails.send({
      from: "Godoy Prime Realty <onboarding@resend.dev>",
      to: [feedback.email],
      subject: "🎉 Sua consultoria gratuita está garantida! - Godoy Prime Realty",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Obrigado, ${escapeHtml(userName)}! 🎉
              </h1>
              <p style="color: #d4e5f7; margin: 15px 0 0 0; font-size: 16px;">
                Sua participação é muito valiosa para nós
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              
              <!-- Reward Section -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #f59e0b;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 32px; margin-right: 15px;">🎁</span>
                  <h2 style="color: #92400e; margin: 0; font-size: 20px;">Sua Recompensa Exclusiva</h2>
                </div>
                <p style="color: #78350f; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
                  Como agradecimento pela sua participação, você ganhou uma <strong>consultoria gratuita</strong> com Marcus Godoy!
                </p>
                <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Análise personalizada do seu imóvel</li>
                  <li>Dúvidas sobre o mercado imobiliário do Rio</li>
                  <li>Orientação profissional sem compromisso</li>
                </ul>
              </div>
              
              <!-- How to Schedule -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📅 Como agendar sua consultoria</h3>
                <p style="color: #64748b; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                  Clique no botão abaixo para entrar em contato pelo WhatsApp e agendar o melhor horário para você:
                </p>
                <a href="${whatsappUrl(WHATSAPP_MESSAGES.feedbackConsultoria(escapeHtml(userName)), PHONE.feedback)}" 
                   style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  💬 Agendar pelo WhatsApp
                </a>
              </div>
              
              <!-- About Marcus -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 25px;">
                <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">👤 Sobre Marcus Godoy</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.7;">
                  Marcus é corretor de imóveis especializado no mercado do Rio de Janeiro, com ampla experiência em avaliações e negociações imobiliárias. Na sua consultoria, você terá orientação profissional personalizada para suas necessidades.
                </p>
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e3a5f; padding: 25px 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 12px;">
                Godoy Prime Realty - Inteligência Imobiliária
              </p>
              <p style="color: #64748b; margin: 0; font-size: 11px;">
                Este email foi enviado porque você participou da nossa pesquisa de validação.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    console.log("User confirmation email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending user confirmation email:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a valid Supabase JWT to prevent anonymous email/spam abuse.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const feedback: FeedbackNotification = await req.json();
    
    const stars = feedback.avaliacao 
      ? "⭐".repeat(feedback.avaliacao) + "☆".repeat(5 - feedback.avaliacao)
      : "Não avaliado";

    // Build survey responses HTML
    let surveyHtml = "";
    if (feedback.respostas_questionario && Object.keys(feedback.respostas_questionario).length > 0) {
      surveyHtml = `
        <div style="margin-top: 20px;">
          <h3 style="color: #1e3a5f; margin-bottom: 15px;">📋 Respostas do Questionário:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${Object.entries(feedback.respostas_questionario).map(([questionId, answer]) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; vertical-align: top; width: 50%;">
                  ${questionLabels[questionId] || escapeHtml(questionId)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                  ${answerLabels[answer] || escapeHtml(answer)}
                </td>
              </tr>
            `).join("")}
          </table>
        </div>
      `;
    }

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Godoy Prime Realty <onboarding@resend.dev>",
      to: ["marcusvgodoy@gmail.com"],
      subject: `Novo Feedback: ${tipoLabels[feedback.tipo_feedback] || escapeHtml(feedback.tipo_feedback)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Novo Feedback Recebido</h1>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Tipo:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${tipoLabels[feedback.tipo_feedback] || escapeHtml(feedback.tipo_feedback)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Avaliação:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${stars}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nome:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(feedback.nome) || "Não informado"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(feedback.email) || "Não informado"}</td>
              </tr>
            </table>
            
            ${surveyHtml}
            
            <div style="margin-top: 20px;">
              <h3 style="color: #1e3a5f; margin-bottom: 10px;">💬 Comentários:</h3>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${escapeHtml(feedback.mensagem) || "Sem comentários adicionais"}
              </div>
            </div>
          </div>
          
          <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Este email foi enviado automaticamente pelo sistema de feedback.</p>
          </div>
        </div>
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation email to user (if email provided)
    if (feedback.tipo_feedback === "pesquisa_validacao" && feedback.email) {
      await sendUserConfirmationEmail(feedback);
    }

    return new Response(JSON.stringify(adminEmailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
