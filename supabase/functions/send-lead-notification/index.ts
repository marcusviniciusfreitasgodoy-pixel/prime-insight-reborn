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

  const propertyInfo = `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0C2340;">📍 Imóvel Analisado:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        ${data.bairro ? `<li><strong>Bairro:</strong> ${escapeHtml(data.bairro)}</li>` : ""}
        ${data.tipologia ? `<li><strong>Tipo:</strong> ${escapeHtml(data.tipologia)}</li>` : ""}
        ${data.area ? `<li><strong>Área:</strong> ${data.area} m²</li>` : ""}
        ${data.quartos ? `<li><strong>Quartos:</strong> ${data.quartos}</li>` : ""}
        ${data.suites ? `<li><strong>Suítes:</strong> ${data.suites}</li>` : ""}
        ${data.banheiros ? `<li><strong>Banheiros:</strong> ${data.banheiros}</li>` : ""}
        ${data.vagas ? `<li><strong>Vagas:</strong> ${data.vagas}</li>` : ""}
      </ul>
    </div>
  `;

  const estimativaSection = data.estimativaMin && data.estimativaMed && data.estimativaMax ? `
    <div style="background: linear-gradient(135deg, #0C2340 0%, #1a365d 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
      <h4 style="margin: 0 0 15px 0; color: #D4AF37; text-align: center;">📊 Sua Estimativa Preliminar</h4>
      <div style="display: flex; justify-content: space-between; text-align: center;">
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Mínimo</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${formatCurrency(data.estimativaMin)}</p>
        </div>
        <div style="flex: 1; border-left: 1px solid rgba(255,255,255,0.2); border-right: 1px solid rgba(255,255,255,0.2);">
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Médio</p>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #D4AF37;">${formatCurrency(data.estimativaMed)}</p>
        </div>
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Máximo</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${formatCurrency(data.estimativaMax)}</p>
        </div>
      </div>
    </div>
  ` : "";

  if (notificationType === "initial" || notificationType === "returning") {
    // E-mail de confirmação de avaliação
    emailSubject = "📊 Sua Avaliação Preliminar - Godoy Prime Realty";
    headerTitle = "Sua Avaliação Preliminar está Pronta!";
    headerSubtitle = "Obrigado por utilizar nossa plataforma de análise de mercado";
    
    mainContent = `
      <p style="color: #555; font-size: 15px;">Olá <strong>${escapeHtml(data.leadName)}</strong>,</p>
      
      <p style="color: #555; font-size: 15px;">
        Recebemos sua solicitação de avaliação e já processamos uma estimativa preliminar com base nos dados de transações ITBI da região.
      </p>

      ${estimativaSection}

      ${propertyInfo}

      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 10px 0; color: #856404;">⚡ Quer uma Avaliação Mais Precisa?</h4>
        <p style="margin: 0; color: #856404; font-size: 14px;">
          A estimativa acima é baseada em dados médios da região. Um <strong>Parecer Técnico Completo</strong> considera os diferenciais específicos do seu imóvel, podendo revelar um valor <strong>15% a 30% superior</strong>.
        </p>
      </div>
    `;

    ctaSection = `
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://prime-insight-reborn.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #b8962f 100%); color: #0C2340; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          📋 Solicitar Parecer Técnico Completo
        </a>
        <p style="margin: 15px 0 0 0; color: #888; font-size: 12px;">Análise detalhada com especialista Godoy Prime</p>
      </div>
    `;

  } else {
    // E-mail de confirmação do Parecer Técnico solicitado
    emailSubject = "✅ Parecer Técnico Solicitado - Godoy Prime Realty";
    headerTitle = "Recebemos sua Solicitação!";
    headerSubtitle = "Parecer Técnico em andamento";
    
    mainContent = `
      <p style="color: #555; font-size: 15px;">Olá <strong>${escapeHtml(data.leadName)}</strong>,</p>
      
      <p style="color: #555; font-size: 15px;">
        <strong>Excelente decisão!</strong> Recebemos sua solicitação de Parecer Técnico Godoy Prime e nossa equipe já está analisando os dados do seu imóvel.
      </p>

      <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Solicitação Confirmada</h4>
        <p style="margin: 0; color: #155724; font-size: 14px;">
          Um especialista Godoy Prime entrará em contato em até <strong>24-48 horas úteis</strong> para discutir os detalhes e apresentar a análise completa.
        </p>
      </div>

      ${propertyInfo}

      ${estimativaSection}

      <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0C2340;">🎯 O que esperar:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
          <li>Análise personalizada considerando diferenciais do imóvel</li>
          <li>Comparativo com transações recentes da região</li>
          <li>Orientação estratégica para ${isVenda ? 'venda' : 'compra'}</li>
          <li>Consultoria sem compromisso</li>
        </ul>
      </div>
    `;

    ctaSection = `
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://wa.me/5521964075124" style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          📱 Falar Agora no WhatsApp
        </a>
        <p style="margin: 15px 0 0 0; color: #888; font-size: 12px;">Dúvidas? Estamos à disposição!</p>
      </div>
    `;
  }

  const clientEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0C2340 0%, #1a365d 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0 0 10px 0; color: #D4AF37; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 25px; border: 1px solid #e0e0e0; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; text-align: center; }
        .footer p { margin: 5px 0; color: #888; font-size: 12px; }
        .logo-text { color: #D4AF37; font-weight: bold; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">🏠 GODOY PRIME REALTY</div>
          <h1>${headerTitle}</h1>
          <p>${headerSubtitle}</p>
        </div>
        
        <div class="content">
          ${mainContent}
          ${ctaSection}
        </div>
        
        <div class="footer">
          <p><strong>Godoy Prime Realty</strong> - CRECI-RJ 11841</p>
          <p>Especialistas em Imóveis de Alto Padrão na Barra da Tijuca</p>
          <p style="margin-top: 15px;">
            <a href="https://godoyprime.com.br" style="color: #0C2340; text-decoration: none;">godoyprime.com.br</a> | 
            <a href="tel:+5521964075124" style="color: #0C2340; text-decoration: none;">(21) 96407-5124</a>
          </p>
          <p style="margin-top: 15px; color: #aaa; font-size: 11px;">
            Este email foi enviado porque você solicitou uma avaliação em nossa plataforma.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

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
    // Validate that request came via Supabase SDK (has Authorization header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
        const formatPhone = (p: string) => {
          const d = p.replace(/\D/g, "");
          return d.startsWith("55") ? d : `55${d}`;
        };
        
        const isCompraMsg = data.interesse === "compra";
        const formattedEstimativa = data.estimativaMed ? formatCurrency(data.estimativaMed) : "";

        // Message to client
        let clientMsg = "";
        if (notificationType === "initial" || notificationType === "returning") {
          clientMsg = `🏠 *Godoy Prime Realty*\n\nOlá ${data.leadName}! 👋\n\nRecebemos sua solicitação de avaliação${data.bairro ? ` no bairro *${data.bairro}*` : ""}.\n\n${formattedEstimativa ? `📊 Estimativa preliminar: *${formattedEstimativa}*\n\n` : ""}Um especialista Godoy Prime pode realizar uma análise detalhada considerando os diferenciais específicos do seu imóvel.\n\n📋 Quer solicitar um *Parecer Técnico Completo*? Acesse: https://prime-insight-reborn.lovable.app\n\nGodoy Prime Realty - CRECI-RJ 11841`;
        } else {
          clientMsg = `✅ *Godoy Prime Realty*\n\nOlá ${data.leadName}!\n\nSua solicitação de *Parecer Técnico* foi recebida com sucesso! 🎉\n\n${data.bairro ? `📍 Imóvel: ${data.bairro}\n` : ""}${formattedEstimativa ? `💰 Estimativa: ${formattedEstimativa}\n` : ""}\nUm especialista entrará em contato em até *24-48 horas úteis*.\n\nDúvidas? Estamos aqui! 😊\n\nGodoy Prime Realty - CRECI-RJ 11841`;
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
              headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "5521964075124", message: brokerMsg }),
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
            { phone: "5521964075124", message_type: `${notificationType}_broker`, message_content: brokerMsg.substring(0, 500), status: whatsappResults.broker ? "sent" : "failed", response_data: whatsappResults.broker },
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
