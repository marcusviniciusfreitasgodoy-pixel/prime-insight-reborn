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

interface LeadNotificationRequest {
  type: "initial" | "returning" | "complete";
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  interesse: string;
  objetivo?: string;
  urgencia?: string;
  preferencia_contato?: string;
  bairro?: string;
  area?: number;
  tipologia?: string;
  quartos?: number;
  banheiros?: number;
  suites?: number;
  vagas?: number;
  diferenciais?: string;
  estimativaMin?: number;
  estimativaMed?: number;
  estimativaMax?: number;
  enderecoImovelAnalise?: string;
  valorPedidoVendedor?: number;
  evaluationNumber?: number;
  itbiMinM2?: number;
  itbiMedM2?: number;
  itbiMaxM2?: number;
  itbiTransactionCount?: number;
}

const formatCurrency = (value: number | undefined) => {
  if (!value) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Função para enviar e-mail de confirmação ao cliente
async function sendClientConfirmationEmail(data: LeadNotificationRequest) {
  if (!data.leadEmail) {
    console.log("No client email provided, skipping confirmation");
    return null;
  }

  const notificationType = data.type || "initial";
  const isVenda = data.interesse === "venda";
  
  let emailSubject: string;
  let headerTitle: string;
  let headerSubtitle: string;
  let mainContent: string;
  let ctaSection: string;

  // ===== Helpers de layout (table-based para compatibilidade Gmail/Outlook) =====
  const propertyInfo = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa;border-radius:8px;margin:20px 0;border:1px solid #e9ecef;">
      <tr><td style="padding:18px 20px;">
        <h4 style="margin:0 0 12px 0;color:#0C2340;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">📍 Imóvel Analisado</h4>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#444;">
          ${data.bairro ? `<tr><td style="padding:4px 0;width:100px;color:#888;">Bairro</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(data.bairro)}</td></tr>` : ""}
          ${data.tipologia ? `<tr><td style="padding:4px 0;color:#888;">Tipo</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(data.tipologia)}</td></tr>` : ""}
          ${data.area ? `<tr><td style="padding:4px 0;color:#888;">Área</td><td style="padding:4px 0;font-weight:600;">${data.area} m²</td></tr>` : ""}
          ${data.quartos ? `<tr><td style="padding:4px 0;color:#888;">Quartos</td><td style="padding:4px 0;font-weight:600;">${data.quartos}</td></tr>` : ""}
          ${data.suites ? `<tr><td style="padding:4px 0;color:#888;">Suítes</td><td style="padding:4px 0;font-weight:600;">${data.suites}</td></tr>` : ""}
          ${data.banheiros ? `<tr><td style="padding:4px 0;color:#888;">Banheiros</td><td style="padding:4px 0;font-weight:600;">${data.banheiros}</td></tr>` : ""}
          ${data.vagas ? `<tr><td style="padding:4px 0;color:#888;">Vagas</td><td style="padding:4px 0;font-weight:600;">${data.vagas}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>
  `;

  const estimativaSection = data.estimativaMin && data.estimativaMed && data.estimativaMax ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0C2340;border-radius:10px;margin:24px 0;">
      <tr><td style="padding:22px 20px;text-align:center;">
        <p style="margin:0 0 4px 0;color:#D4AF37;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">Sua Estimativa Preliminar</p>
        <p style="margin:0 0 18px 0;color:rgba(255,255,255,0.7);font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Baseado em transações ITBI da região</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" align="center" style="padding:8px 4px;border-right:1px solid rgba(255,255,255,0.15);">
              <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Mínimo</p>
              <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${formatCurrency(data.estimativaMin)}</p>
            </td>
            <td width="34%" align="center" style="padding:8px 4px;border-right:1px solid rgba(255,255,255,0.15);">
              <p style="margin:0 0 6px 0;color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Mais Provável</p>
              <p style="margin:0;color:#D4AF37;font-size:22px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${formatCurrency(data.estimativaMed)}</p>
            </td>
            <td width="33%" align="center" style="padding:8px 4px;">
              <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Máximo</p>
              <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${formatCurrency(data.estimativaMax)}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  ` : "";

  const ruaCondominioWarning = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;margin:20px 0;">
      <tr><td style="padding:14px 16px;font-family:'Segoe UI',Arial,sans-serif;">
        <p style="margin:0 0 6px 0;color:#92400e;font-size:13px;font-weight:700;">⚠️ Importante: estimativa por rua, não por condomínio</p>
        <p style="margin:0;color:#78350f;font-size:13px;line-height:1.5;">
          Esta análise considera o <strong>logradouro e bairro</strong>, mas não diferencia condomínios específicos (padrão construtivo, lazer, conservação, andar, vista). Imóveis na mesma rua podem ter valores reais bem diferentes.
        </p>
      </td></tr>
    </table>
  `;

  if (notificationType === "initial" || notificationType === "returning") {
    emailSubject = "📊 Sua Avaliação Preliminar - Godoy Prime Realty";
    headerTitle = "Sua Avaliação Preliminar está Pronta";
    headerSubtitle = "Análise baseada em transações oficiais da região";

    mainContent = `
      <p style="margin:0 0 16px 0;color:#333;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">
        Olá <strong>${escapeHtml(data.leadName)}</strong>,
      </p>
      <p style="margin:0 0 8px 0;color:#555;font-size:15px;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">
        Recebemos sua solicitação e processamos uma estimativa preliminar de valor com base nos dados oficiais de transações ITBI dos últimos 12 meses na sua região.
      </p>

      ${estimativaSection}

      ${propertyInfo}

      ${ruaCondominioWarning}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin:24px 0;">
        <tr><td style="padding:18px 20px;font-family:'Segoe UI',Arial,sans-serif;">
          <h4 style="margin:0 0 8px 0;color:#92400e;font-size:15px;">⚡ Quer uma Avaliação Mais Precisa?</h4>
          <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
            O <strong>Parecer Técnico Completo</strong> considera os 26 diferenciais específicos do seu imóvel (padrão, conservação, vista, lazer, documentação) e pode revelar um valor <strong>15% a 30% superior</strong> ou identificar problemas que afetam o preço.
          </p>
        </td></tr>
      </table>
    `;

    ctaSection = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
        <tr><td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#D4AF37;border-radius:8px;">
              <a href="${whatsappUrl(WHATSAPP_MESSAGES.parecerLeadNotification(data.leadName))}" style="display:inline-block;padding:16px 36px;color:#0C2340;text-decoration:none;font-weight:700;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">
                📋 Solicitar Parecer Técnico Completo
              </a>
            </td></tr>
          </table>
          <p style="margin:12px 0 0 0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Atendimento direto via WhatsApp com especialista CRECI-RJ 11841</p>
        </td></tr>
      </table>
    `;

  } else {
    emailSubject = "✅ Parecer Técnico Solicitado - Godoy Prime Realty";
    headerTitle = "Recebemos sua Solicitação";
    headerSubtitle = "Parecer Técnico em andamento";

    mainContent = `
      <p style="margin:0 0 16px 0;color:#333;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">
        Olá <strong>${escapeHtml(data.leadName)}</strong>,
      </p>
      <p style="margin:0 0 16px 0;color:#555;font-size:15px;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">
        <strong>Excelente decisão.</strong> Recebemos sua solicitação de Parecer Técnico Godoy Prime e nossa equipe já está analisando os dados do seu imóvel.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:4px;margin:20px 0;">
        <tr><td style="padding:16px 20px;font-family:'Segoe UI',Arial,sans-serif;">
          <h4 style="margin:0 0 6px 0;color:#065f46;font-size:15px;">✅ Solicitação Confirmada</h4>
          <p style="margin:0;color:#047857;font-size:14px;line-height:1.6;">
            Um especialista entrará em contato em até <strong>2 horas úteis</strong> para apresentar a análise completa.
          </p>
        </td></tr>
      </table>

      ${propertyInfo}

      ${estimativaSection}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin:20px 0;">
        <tr><td style="padding:18px 20px;font-family:'Segoe UI',Arial,sans-serif;">
          <h4 style="margin:0 0 10px 0;color:#0C2340;font-size:15px;">🎯 O que esperar:</h4>
          <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.7;">
            <li>Análise personalizada com os 26 fatores técnicos</li>
            <li>Comparativo com transações reais da região</li>
            <li>Orientação estratégica para ${isVenda ? 'venda' : 'compra'}</li>
            <li>Conformidade NBR 14653-2</li>
          </ul>
        </td></tr>
      </table>
    `;

    ctaSection = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
        <tr><td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#25D366;border-radius:8px;">
              <a href="https://wa.me/${PHONE.e164}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">
                📱 Falar Agora no WhatsApp
              </a>
            </td></tr>
          </table>
          <p style="margin:12px 0 0 0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">${PHONE.display} — Marcus Godoy</p>
        </td></tr>
      </table>
    `;
  }

  const clientEmailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(12,35,64,0.08);">
        <!-- Header -->
        <tr><td style="background:#0C2340;padding:32px 24px;text-align:center;">
          <p style="margin:0 0 8px 0;color:#D4AF37;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Godoy Prime Realty</p>
          <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">${headerTitle}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.75);font-size:14px;">${headerSubtitle}</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:28px 24px;">
          ${mainContent}
          ${ctaSection}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 4px 0;color:#0C2340;font-size:13px;font-weight:700;">Marcus Godoy — CRECI-RJ 11841</p>
          <p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;">Especialista em Imóveis de Alto Padrão na Barra da Tijuca</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">
            <a href="https://godoyprime.com.br" style="color:#0C2340;text-decoration:none;font-weight:600;">godoyprime.com.br</a>
            &nbsp;·&nbsp;
            <a href="${PHONE.tel}" style="color:#0C2340;text-decoration:none;font-weight:600;">${PHONE.display}</a>
          </p>
          <p style="margin:14px 0 0 0;color:#9ca3af;font-size:11px;line-height:1.5;">
            Você recebeu este email porque solicitou uma avaliação na nossa plataforma.<br>
            Este conteúdo é informativo e não substitui um Parecer Técnico formal.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
    console.log("Sending client confirmation email to:", data.leadEmail);
    
    const clientEmailResponse = await resend.emails.send({
      from: "Godoy Prime Realty <marcus@godoyprime.com.br>",
      to: [data.leadEmail],
      subject: emailSubject,
      html: clientEmailHtml,
    });

    console.log("Client email response:", JSON.stringify(clientEmailResponse, null, 2));
    
    if (clientEmailResponse.error) {
      console.error("Error sending client email:", clientEmailResponse.error);
      return { success: false, error: clientEmailResponse.error };
    }

    return { success: true, emailId: clientEmailResponse.data?.id };
  } catch (error: any) {
    console.error("Error sending client confirmation email:", error.message);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== send-lead-notification START ===");
  console.log("Method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT properly (rejects arbitrary strings; presence-only check is not enough).
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    try {
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claims, error: claimsErr } = await authClient.auth.getClaims(
        authHeader.replace('Bearer ', ''),
      );
      if (claimsErr || !claims?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: LeadNotificationRequest = await req.json();
    console.log("Received notification request:", JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.leadName || !data.leadEmail || !data.leadPhone) {
      console.error("Missing required fields:", { name: data.leadName, email: data.leadEmail, phone: data.leadPhone });
      return new Response(
        JSON.stringify({ error: "Missing required fields: leadName, leadEmail, leadPhone" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isCompra = data.interesse === "compra";
    const notificationType = data.type || "initial";

    console.log("Processing notification type:", notificationType, "interesse:", data.interesse);

    // Determine service type based on interest
    const serviceType = isCompra 
      ? "Personal Shopper Imobiliário" 
      : "Captação de Imóveis";
    
    const serviceDescription = isCompra
      ? "O cliente está buscando um imóvel para compra. Oportunidade para oferecer os serviços de Personal Shopper Imobiliário da Godoy Prime Realty."
      : "O cliente deseja vender um imóvel. Oportunidade para oferecer os serviços de Captação de Imóveis da Godoy Prime Realty.";

    const propertyDetails = `
      <ul style="margin: 0; padding-left: 20px;">
        ${data.bairro ? `<li><strong>Bairro:</strong> ${escapeHtml(data.bairro)}</li>` : ""}
        ${data.tipologia ? `<li><strong>Tipologia:</strong> ${escapeHtml(data.tipologia)}</li>` : ""}
        ${data.area ? `<li><strong>Área:</strong> ${data.area} m²</li>` : ""}
        ${data.quartos ? `<li><strong>Quartos:</strong> ${data.quartos}</li>` : ""}
        ${data.suites ? `<li><strong>Suítes:</strong> ${data.suites}</li>` : ""}
        ${data.banheiros ? `<li><strong>Banheiros:</strong> ${data.banheiros}</li>` : ""}
        ${data.vagas ? `<li><strong>Vagas:</strong> ${data.vagas}</li>` : ""}
        ${data.diferenciais ? `<li><strong>Diferenciais:</strong> ${escapeHtml(data.diferenciais)}</li>` : ""}
        ${data.enderecoImovelAnalise ? `<li><strong>Endereço Analisado:</strong> ${escapeHtml(data.enderecoImovelAnalise)}</li>` : ""}
        ${data.valorPedidoVendedor ? `<li><strong>Valor Pedido pelo Vendedor:</strong> ${formatCurrency(data.valorPedidoVendedor)}</li>` : ""}
      </ul>
    `;

    const estimativaDetails = data.estimativaMin && data.estimativaMed && data.estimativaMax ? `
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0C2340;">Estimativa Preliminar:</h4>
        <p style="margin: 5px 0;"><strong>Mínimo:</strong> ${formatCurrency(data.estimativaMin)}</p>
        <p style="margin: 5px 0;"><strong>Médio:</strong> ${formatCurrency(data.estimativaMed)}</p>
        <p style="margin: 5px 0;"><strong>Máximo:</strong> ${formatCurrency(data.estimativaMax)}</p>
      </div>
    ` : "";

    const additionalInfo = data.objetivo || data.urgencia || data.preferencia_contato ? `
      <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0C2340;">Informações Adicionais:</h4>
        ${data.objetivo ? `<p style="margin: 5px 0;"><strong>Objetivo:</strong> ${escapeHtml(data.objetivo)}</p>` : ""}
        ${data.urgencia ? `<p style="margin: 5px 0;"><strong>Urgência:</strong> ${escapeHtml(data.urgencia)}</p>` : ""}
        ${data.preferencia_contato ? `<p style="margin: 5px 0;"><strong>Preferência de Contato:</strong> ${escapeHtml(data.preferencia_contato)}</p>` : ""}
      </div>
    ` : "";

    // Different email content based on notification type
    let emailSubject: string;
    let ctaTitle: string;
    let actionMessage: string;
    
    if (notificationType === "initial") {
      emailSubject = `🆕 Novo Lead - ${serviceType} - ${escapeHtml(data.leadName)}`;
      ctaTitle = `🆕 NOVO LEAD - ${serviceType.toUpperCase()}`;
      actionMessage = serviceDescription;
    } else if (notificationType === "returning") {
      const evalNum = data.evaluationNumber || 2;
      emailSubject = `🔄 Lead Retornou (${evalNum}ª consulta) - ${escapeHtml(data.leadName)}`;
      ctaTitle = `🔄 LEAD RETORNOU - ${evalNum}ª CONSULTA`;
      actionMessage = `O cliente já tinha feito consultas anteriores e VOLTOU para fazer nova análise. Isso demonstra alto interesse. ${serviceDescription}`;
    } else {
      emailSubject = `🏠 Solicitação Parecer Técnico - ${escapeHtml(data.leadName)}`;
      ctaTitle = `⚡ SOLICITAÇÃO DE PARECER TÉCNICO GODOY PRIME`;
      actionMessage = `O cliente realizou uma consulta preliminar e SOLICITOU o Parecer Técnico completo. PRIORIDADE ALTA - entrar em contato imediatamente.`;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0C2340; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; color: #D4AF37; }
          .content { background: #ffffff; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .cta { background: ${notificationType === 'complete' ? '#D4AF37' : '#0C2340'}; color: ${notificationType === 'complete' ? '#0C2340' : '#D4AF37'}; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; font-weight: bold; }
          .contact-info { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .service-box { background: ${isCompra ? '#e8f4e8' : '#fff3e8'}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${isCompra ? '#22c55e' : '#f59e0b'}; }
          .priority { background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Godoy Prime Realty</h1>
            <p style="margin: 10px 0 0 0;">${notificationType === 'initial' ? 'Novo Lead Capturado' : 'Solicitação de Parecer Técnico'}</p>
          </div>
          
          <div class="content">
            <div class="cta">
              ${ctaTitle}
            </div>

            ${notificationType === 'complete' ? `
              <div class="priority">
                <h4 style="margin: 0 0 10px 0; color: #dc2626;">🚨 AÇÃO IMEDIATA NECESSÁRIA</h4>
                <p style="margin: 0; font-size: 14px;">Este lead solicitou ativamente o Parecer Técnico. Entre em contato nas próximas 2 horas para máxima conversão.</p>
              </div>
            ` : ''}

            <div class="service-box">
              <h4 style="margin: 0 0 10px 0; color: #0C2340;">💼 Serviço Recomendado: ${serviceType}</h4>
              <p style="margin: 0; font-size: 14px;">${actionMessage}</p>
            </div>
            
            <h3 style="color: #0C2340;">Dados do Cliente:</h3>
            <div class="contact-info">
              <p style="margin: 5px 0;"><strong>Nome:</strong> ${escapeHtml(data.leadName)}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(data.leadEmail)}</p>
              <p style="margin: 5px 0;"><strong>Telefone:</strong> ${escapeHtml(data.leadPhone)}</p>
              <p style="margin: 5px 0;"><strong>Interesse:</strong> ${isCompra ? '🏠 Comprar Imóvel' : '💰 Vender Imóvel'}</p>
            </div>

            ${additionalInfo}
            
            <h3 style="color: #0C2340;">Detalhes do Imóvel:</h3>
            ${propertyDetails}
            
            ${estimativaDetails}
            
            <div class="footer">
              <p>Este email foi enviado automaticamente pelo sistema Godoy Prime Analytics.</p>
              <p>© ${new Date().getFullYear()} Godoy Prime Realty - CRECI 11841</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to marcus@godoyprime.com.br...");
    
    // Send email notification to the agency
    const emailResponse = await resend.emails.send({
      from: "Godoy Prime <marcus@godoyprime.com.br>",
      to: ["marcus@godoyprime.com.br"],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Resend API response:", JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Agency email sent successfully! ID:", emailResponse.data?.id);

    // If this is a "complete" notification, mark lead as having requested parecer
    if (notificationType === "complete" && data.leadEmail) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { error: updateError } = await supabase
          .from("leads")
          .update({ 
            parecer_solicitado: true, 
            parecer_solicitado_at: new Date().toISOString() 
          })
          .eq("email", data.leadEmail.toLowerCase().trim());
        
        if (updateError) {
          console.error("Error updating parecer_solicitado:", updateError);
        } else {
          console.log("Lead marked as parecer_solicitado for:", data.leadEmail);
        }
      } catch (updateErr: any) {
        console.error("Error updating lead parecer status:", updateErr.message);
      }
    }

    // Send confirmation email to the client
    const clientEmailResult = await sendClientConfirmationEmail(data);
    console.log("Client email result:", clientEmailResult);

    // === Z-API WhatsApp Integration ===
    let whatsappResults: any = { client: null, broker: null };
    try {
      const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
      const zapiToken = Deno.env.get("ZAPI_TOKEN");
      
      if (instanceId && zapiToken) {
        const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}/send-text`;
        const zapiHeaders: Record<string, string> = { "Content-Type": "application/json" };
        const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
        if (clientToken) zapiHeaders["Client-Token"] = clientToken;
        const formatPhone = (p: string) => {
          const d = p.replace(/\D/g, "");
          return d.startsWith("55") ? d : `55${d}`;
        };
        
        const isCompraMsg = data.interesse === "compra";
        const formattedEstimativa = data.estimativaMed ? formatCurrency(data.estimativaMed) : "";

        // Bloco detalhado do imóvel (mesmos campos exibidos no site)
        const imovelLinhas = [
          data.enderecoImovelAnalise ? `📍 Endereço: ${data.enderecoImovelAnalise}` : (data.bairro ? `📍 Bairro: ${data.bairro}` : ""),
          data.tipologia ? `🏢 Tipo: ${data.tipologia}` : "",
          data.area ? `📐 Área: ${data.area} m²` : "",
          data.quartos ? `🛏️ Quartos: ${data.quartos}` : "",
          data.suites ? `🛁 Suítes: ${data.suites}` : "",
          data.banheiros ? `🚿 Banheiros: ${data.banheiros}` : "",
          data.vagas ? `🚗 Vagas: ${data.vagas}` : "",
          data.diferenciais ? `✨ Diferenciais: ${data.diferenciais}` : "",
        ].filter(Boolean).join("\n");

        const faixaBlock = (data.estimativaMin && data.estimativaMed && data.estimativaMax)
          ? `\n\n💰 *Estimativa Preliminar*\nMínimo: ${formatCurrency(data.estimativaMin)}\nMais Provável: ${formatCurrency(data.estimativaMed)}\nMáximo: ${formatCurrency(data.estimativaMax)}`
          : "";

        const m2Block = (data.itbiMinM2 && data.itbiMedM2 && data.itbiMaxM2)
          ? `\n\n📊 *R$/m² na região*\n${formatCurrency(data.itbiMinM2)} – ${formatCurrency(data.itbiMedM2)} – ${formatCurrency(data.itbiMaxM2)}${data.itbiTransactionCount ? `\nBase: ${data.itbiTransactionCount} transações ITBI` : ""}`
          : "";

        // Message to client
        let clientMsg = "";
        if (notificationType === "initial" || notificationType === "returning") {
          clientMsg = `🏠 *Godoy Prime Realty — Laudo Preliminar*\n\nOlá ${data.leadName}! 👋\n\nSegue o resumo da sua avaliação online, com os MESMOS dados exibidos no site:\n\n*Imóvel analisado*\n${imovelLinhas}${faixaBlock}${m2Block}\n\n⚠️ Esta é uma *estimativa algorítmica* baseada em transações ITBI oficiais. Para imóveis exclusivos, a variação pode chegar a 15%.\n\n📋 Quer o *Parecer Técnico Completo* com validação manual do especialista (NBR 14653-2)? Responda *PARECER* e um especialista entra em contato em até 2h úteis.\n\nGodoy Prime Realty — CRECI-RJ 11841`;
        } else {
          clientMsg = `✅ *Godoy Prime Realty — Parecer Solicitado*\n\nOlá ${data.leadName}!\n\nRecebemos sua solicitação de *Parecer Técnico Completo*. 🎉\n\n*Imóvel analisado*\n${imovelLinhas}${faixaBlock}${m2Block}\n\nUm especialista entrará em contato em até *2h úteis* para iniciar a análise presencial.\n\nGodoy Prime Realty — CRECI-RJ 11841`;
        }

        // Message to broker
        let brokerMsg = "";
        if (notificationType === "complete") {
          brokerMsg = `🚨 *PARECER TÉCNICO SOLICITADO*\n\n👤 ${data.leadName}\n📧 ${data.leadEmail}\n📱 ${data.leadPhone}\n${data.bairro ? `📍 ${data.bairro}` : ""}\n${formattedEstimativa ? `💰 ${formattedEstimativa}` : ""}\n${isCompraMsg ? `🏠 Interesse: Compra` : `💰 Interesse: Venda`}\n\n⚡ *AÇÃO IMEDIATA* - Contatar nas próximas 2h!`;
        } else {
          const evalLabel = notificationType === "returning" ? ` (${data.evaluationNumber || 2}ª consulta)` : "";
          brokerMsg = `📋 *NOVO LEAD${evalLabel}*\n\n👤 ${data.leadName}\n📧 ${data.leadEmail}\n📱 ${data.leadPhone}\n${data.bairro ? `📍 ${data.bairro}` : ""}\n${formattedEstimativa ? `💰 ${formattedEstimativa}` : ""}\n${isCompraMsg ? `🏠 Interesse: Compra` : `💰 Interesse: Venda`}`;
        }

        // Send to client
        if (data.leadPhone) {
          try {
            const clientResp = await fetch(zapiUrl, {
              method: "POST",
              headers: zapiHeaders,
              body: JSON.stringify({ phone: formatPhone(data.leadPhone), message: clientMsg }),
            });
            whatsappResults.client = await clientResp.json();
            console.log("WhatsApp client result:", JSON.stringify(whatsappResults.client));
          } catch (e: any) {
            console.error("WhatsApp client error:", e.message);
          }
        }

        // Send to broker
        try {
          const brokerResp = await fetch(zapiUrl, {
            method: "POST",
            headers: zapiHeaders,
            body: JSON.stringify({ phone: PHONE.e164, message: brokerMsg }),
          });
          whatsappResults.broker = await brokerResp.json();
          console.log("WhatsApp broker result:", JSON.stringify(whatsappResults.broker));
        } catch (e: any) {
          console.error("WhatsApp broker error:", e.message);
        }

        // Log messages
        try {
          const supabaseUrl2 = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey2 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(supabaseUrl2, supabaseKey2);
          
          const logs = [
            { phone: formatPhone(data.leadPhone), message_type: `${notificationType}_client`, message_content: clientMsg.substring(0, 500), status: whatsappResults.client ? "sent" : "failed", response_data: whatsappResults.client },
            { phone: PHONE.e164, message_type: `${notificationType}_broker`, message_content: brokerMsg.substring(0, 500), status: whatsappResults.broker ? "sent" : "failed", response_data: whatsappResults.broker },
          ];
          await sb.from("whatsapp_messages_log").insert(logs);
        } catch (logErr: any) {
          console.error("Error logging WhatsApp:", logErr.message);
        }
      } else {
        console.log("Z-API credentials not configured, skipping WhatsApp");
      }
    } catch (whatsappErr: any) {
      console.error("WhatsApp integration error:", whatsappErr.message);
    }

    console.log("=== send-lead-notification END (SUCCESS) ===");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notificação enviada com sucesso",
        emailId: emailResponse.data?.id,
        clientEmailSent: clientEmailResult?.success || false,
        clientEmailId: clientEmailResult?.emailId,
        serviceType,
        whatsappSent: !!(whatsappResults.client || whatsappResults.broker),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("=== send-lead-notification ERROR ===");
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
