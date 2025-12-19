import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
                  ${questionLabels[questionId] || questionId}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                  ${answerLabels[answer] || answer}
                </td>
              </tr>
            `).join("")}
          </table>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Godoy Prime Realty <onboarding@resend.dev>",
      to: ["marcusvgodoy@gmail.com"],
      subject: `Novo Feedback: ${tipoLabels[feedback.tipo_feedback] || feedback.tipo_feedback}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Novo Feedback Recebido</h1>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Tipo:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${tipoLabels[feedback.tipo_feedback] || feedback.tipo_feedback}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Avaliação:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${stars}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nome:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${feedback.nome || "Não informado"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${feedback.email || "Não informado"}</td>
              </tr>
            </table>
            
            ${surveyHtml}
            
            <div style="margin-top: 20px;">
              <h3 style="color: #1e3a5f; margin-bottom: 10px;">💬 Comentários:</h3>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${feedback.mensagem || "Sem comentários adicionais"}
              </div>
            </div>
          </div>
          
          <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Este email foi enviado automaticamente pelo sistema de feedback.</p>
          </div>
        </div>
      `,
    });

    console.log("Feedback notification sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
