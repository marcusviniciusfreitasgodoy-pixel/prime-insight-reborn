// Meta Pixel Event Tracking Utilities
// Pixel IDs: 926436730063639, 1664451094966530

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

type AnalyticsEventType = 'pdf_download' | 'parecer_solicitado' | 'whatsapp_click' | 'lead_capture' | 'quick_valuation';

/**
 * Salva evento no banco de dados para analytics interno
 */
async function saveAnalyticsEvent(
  eventType: AnalyticsEventType,
  bairro?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("analytics_events").insert([{
      event_type: eventType,
      bairro: bairro || null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
    }]);
  } catch (error) {
    console.warn("[Analytics] Falha ao salvar evento:", error);
  }
}

/**
 * Track a custom Meta Pixel event
 */
export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
    console.log(`[Meta Pixel] Event tracked: ${eventName}`, params);
  }
}

/**
 * Track a custom Meta Pixel event (non-standard)
 */
export function trackCustomPixelEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
    console.log(`[Meta Pixel] Custom event tracked: ${eventName}`, params);
  }
}

// ==========================================
// Standard Meta Pixel Events
// ==========================================

/**
 * Track Lead event - when a user submits contact information
 */
export function trackLead(params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  trackPixelEvent('Lead', {
    currency: 'BRL',
    ...params,
  });
}

/**
 * Track CompleteRegistration event - when a user completes signup
 */
export function trackCompleteRegistration(params?: {
  content_name?: string;
  status?: string;
  value?: number;
  currency?: string;
}) {
  trackPixelEvent('CompleteRegistration', {
    currency: 'BRL',
    ...params,
  });
}

/**
 * Track Contact event - when a user initiates contact (e.g., WhatsApp)
 */
export function trackContact(params?: {
  content_name?: string;
  content_category?: string;
}) {
  trackPixelEvent('Contact', params);
}

/**
 * Track ViewContent event - when a user views key content
 */
export function trackViewContent(params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  trackPixelEvent('ViewContent', {
    currency: 'BRL',
    ...params,
  });
}

// ==========================================
// Custom Events for Real Estate App
// ==========================================

/**
 * Track WhatsApp click event
 */
export function trackWhatsAppClick(params?: {
  source?: string;
  phone_number?: string;
  bairro?: string;
}) {
  trackContact({
    content_name: 'WhatsApp Click',
    content_category: 'Contact',
    ...params,
  });
  
  // Also track as custom event for more detail
  trackCustomPixelEvent('WhatsAppClick', {
    source: params?.source || 'unknown',
    phone_number: params?.phone_number,
  });

  // Salvar no banco para analytics
  saveAnalyticsEvent('whatsapp_click', params?.bairro, params);
}

/**
 * Track Quick Valuation form submission
 */
export function trackQuickValuation(params?: {
  bairro?: string;
  tipologia?: string;
  area_m2?: number;
  valor_estimado?: number;
}) {
  trackLead({
    content_name: 'Quick Valuation Form',
    content_category: 'Property Valuation',
    value: params?.valor_estimado,
  });
  
  trackCustomPixelEvent('QuickValuation', {
    bairro: params?.bairro,
    tipologia: params?.tipologia,
    area_m2: params?.area_m2,
    valor_estimado: params?.valor_estimado,
  });

  // Salvar no banco para analytics
  saveAnalyticsEvent('quick_valuation', params?.bairro, params);
}

/**
 * Track Complete Lead Capture form submission
 */
export function trackLeadCapture(params?: {
  objetivo?: string;
  urgencia?: string;
  bairro?: string;
  valor_interesse?: number;
}) {
  trackLead({
    content_name: 'Lead Capture Form',
    content_category: 'Full Lead',
    value: params?.valor_interesse,
  });
  
  trackCompleteRegistration({
    content_name: 'Lead Capture Complete',
    status: 'success',
    value: params?.valor_interesse,
  });
  
  trackCustomPixelEvent('LeadCaptureComplete', {
    objetivo: params?.objetivo,
    urgencia: params?.urgencia,
    bairro: params?.bairro,
    valor_interesse: params?.valor_interesse,
  });

  // Salvar no banco para analytics
  saveAnalyticsEvent('lead_capture', params?.bairro, params);
}

/**
 * Track Parecer Técnico (Expert Opinion) request
 */
export function trackParecerSolicitado(params?: {
  bairro?: string;
  valor_estimado?: number;
}) {
  trackCustomPixelEvent('ParecerSolicitado', {
    content_name: 'Parecer Técnico Request',
    bairro: params?.bairro,
    valor_estimado: params?.valor_estimado,
  });

  // Salvar no banco para analytics
  saveAnalyticsEvent('parecer_solicitado', params?.bairro, params);
}

/**
 * Track Valuation PDF download
 */
export function trackPDFDownload(params?: {
  type?: string;
  bairro?: string;
}) {
  trackCustomPixelEvent('PDFDownload', {
    content_name: 'Valuation Report PDF',
    type: params?.type || 'valuation',
    bairro: params?.bairro,
  });

  // Salvar no banco para analytics
  saveAnalyticsEvent('pdf_download', params?.bairro, params);
}
