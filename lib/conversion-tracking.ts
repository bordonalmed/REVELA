// Sistema de Tracking de Conversão para Meta Ads, X/Twitter, Google Ads e TikTok
// Gerencia pixels de conversão de todas as plataformas

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    twq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    ttq?: {
      load: (id: string) => void;
      page: () => void;
      track: (event: string, data?: any) => void;
    };
  }
}

// Tipos de eventos de conversão
export type ConversionEvent = 
  | 'page_view'
  | 'login'
  | 'signup'
  | 'create_project'
  | 'view_project'
  | 'export_image'
  | 'share_social'
  | 'complete_registration'
  | 'purchase'
  | 'lead'
  | 'contact'
  | 'schedule'
  | 'submit_application'
  | 'subscribe'
  | 'start_trial'
  | 'add_to_cart'
  | 'initiate_checkout'
  | 'add_payment_info'
  | 'search'
  | 'view_content'
  | 'add_to_wishlist';

// Interface para dados de conversão
export interface ConversionData {
  event: ConversionEvent;
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  [key: string]: any;
}

// Meta Pixel (Facebook/Instagram)
export const initMetaPixel = (pixelId: string): void => {
  if (typeof window === 'undefined' || !pixelId) return;

  // Carregar script do Meta Pixel
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq?.('init', pixelId);
  window.fbq?.('track', 'PageView');
};

export const trackMetaConversion = (event: ConversionEvent, data?: ConversionData): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const params: any = {};
  
  if (data?.value) params.value = data.value;
  if (data?.currency) params.currency = data.currency;
  if (data?.content_name) params.content_name = data.content_name;
  if (data?.content_category) params.content_category = data.content_category;
  if (data?.content_ids) params.content_ids = data.content_ids;
  if (data?.contents) params.contents = data.contents;

  window.fbq?.('track', event, params);
};

// X/Twitter Pixel
export const initTwitterPixel = (pixelId: string): void => {
  if (typeof window === 'undefined' || !pixelId) return;

  (function(e: any, t: any, n: any, s: any, u: any, a: any) {
    e.twq || (s = e.twq = function() {
      s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
    }, s.version = '1.1', s.queue = [], u = t.createElement(n), u.async = !0, u.src = 'https://static.ads-twitter.com/uwt.js', a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a));
  })(window, document, 'script');

  window.twq?.('config', pixelId);
};

export const trackTwitterConversion = (event: ConversionEvent, data?: ConversionData): void => {
  if (typeof window === 'undefined' || !window.twq) return;

  const params: any = {};
  
  if (data?.value) params.value = data.value;
  if (data?.currency) params.currency = data.currency;
  if (data?.content_name) params.content_name = data.content_name;

  window.twq?.('event', event, params);
};

// Google Ads (via Google Analytics ou Google Ads Conversion Tracking)
export const initGoogleAds = (conversionId: string, conversionLabel?: string): void => {
  if (typeof window === 'undefined' || !conversionId) return;

  // Google Ads usa o gtag do Google Analytics
  // Se já tiver gtag inicializado, apenas adiciona a configuração
  window.gtag?.('config', conversionId, {
    send_page_view: true,
  });
};

export const trackGoogleAdsConversion = (
  conversionId: string,
  conversionLabel: string,
  value?: number,
  currency: string = 'BRL'
): void => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag?.('event', 'conversion', {
    'send_to': `${conversionId}/${conversionLabel}`,
    'value': value,
    'currency': currency,
  });
};

// TikTok Pixel
export const initTikTokPixel = (pixelId: string): void => {
  if (typeof window === 'undefined' || !pixelId) return;

  (function(w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    var ttq = w[t] = w[t] || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'],
    ttq.setAndDefer = function(t: any, e: any) {
      t[e] = function() {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function(t: any) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    },
    ttq.load = function(e: any, n: any) {
      var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {},
      ttq._i[e] = [],
      ttq._i[e]._u = i,
      ttq._t = ttq._t || {},
      ttq._t[e] = +new Date,
      ttq._o = ttq._o || {},
      ttq._o[e] = n || {};
      var o = document.createElement('script');
      o.type = 'text/javascript',
      o.async = !0,
      o.src = i + '?sdkid=' + e + '&lib=' + t;
      var a = document.getElementsByTagName('script')[0];
      a.parentNode?.insertBefore(o, a);
    };

    ttq.load(pixelId);
    ttq.page();
  })(window, document, 'ttq');

  window.ttq = window.ttq || {};
};

export const trackTikTokConversion = (event: ConversionEvent, data?: ConversionData): void => {
  if (typeof window === 'undefined' || !window.ttq) return;

  const params: any = {};
  
  if (data?.value) params.value = data.value;
  if (data?.currency) params.currency = data.currency;
  if (data?.content_name) params.content_name = data.content_name;
  if (data?.content_ids) params.content_ids = data.content_ids;

  window.ttq?.track(event, params);
};

// Função helper para trackear conversão em todas as plataformas
export const trackConversion = async (
  event: ConversionEvent,
  data?: ConversionData,
  platforms?: {
    meta?: boolean;
    twitter?: boolean;
    google?: { conversionId: string; conversionLabel: string };
    tiktok?: boolean;
  }
): Promise<void> => {
  // Meta Pixel
  if (platforms?.meta !== false && typeof window !== 'undefined' && window.fbq) {
    trackMetaConversion(event, data);
  }

  // Twitter Pixel
  if (platforms?.twitter !== false && typeof window !== 'undefined' && window.twq) {
    trackTwitterConversion(event, data);
  }

  // Google Ads - buscar label via API se necessário
  if (platforms?.google && typeof window !== 'undefined' && window.gtag) {
    trackGoogleAdsConversion(
      platforms.google.conversionId,
      platforms.google.conversionLabel,
      data?.value,
      data?.currency
    );
  } else if (typeof window !== 'undefined' && window.gtag) {
    // Tentar buscar label do Google Ads via API
    try {
      const response = await fetch('/api/conversion-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      if (response.ok) {
        const { conversionId, conversionLabel } = await response.json();
        if (conversionId && conversionLabel) {
          trackGoogleAdsConversion(conversionId, conversionLabel, data?.value, data?.currency);
        }
      }
    } catch (error) {
      // Silenciosamente falhar se não conseguir buscar
      console.debug('Não foi possível buscar label do Google Ads:', error);
    }
  }

  // TikTok Pixel
  if (platforms?.tiktok !== false && typeof window !== 'undefined' && window.ttq) {
    trackTikTokConversion(event, data);
  }
};

// Mapear eventos do Revela para eventos de conversão
export const mapRevelaEventToConversion = (
  revelaEvent: string,
  additionalData?: any
): { event: ConversionEvent; data?: ConversionData } => {
  const eventMap: Record<string, ConversionEvent> = {
    'login': 'complete_registration',
    'signup': 'complete_registration',
    'create_project': 'lead',
    'view_project': 'view_content',
    'export_image': 'purchase',
    'share_social': 'share_social',
    'update_project': 'lead',
    'edit_image': 'view_content',
  };

  const conversionEvent = eventMap[revelaEvent] || 'page_view';

  const conversionData: ConversionData = {
    event: conversionEvent,
    ...additionalData,
  };

  return { event: conversionEvent, data: conversionData };
};

// Versão síncrona para compatibilidade (chama a versão assíncrona sem await)
export const trackConversionSync = (
  event: ConversionEvent,
  data?: ConversionData,
  platforms?: {
    meta?: boolean;
    twitter?: boolean;
    google?: { conversionId: string; conversionLabel: string };
    tiktok?: boolean;
  }
): void => {
  // Executar assincronamente sem bloquear
  trackConversion(event, data, platforms).catch(() => {
    // Silenciosamente ignorar erros
  });
};

