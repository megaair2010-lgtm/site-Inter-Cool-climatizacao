/**
 * Google Analytics 4 e Search Console.
 * IDs vêm de variáveis de ambiente (VITE_GA_ID, VITE_GSC_VERIFICATION).
 * Sem ID configurado, nada é carregado.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export function initAnalytics() {
  const gsc = env.VITE_GSC_VERIFICATION;
  if (gsc && !document.querySelector('meta[name="google-site-verification"]')) {
    const m = document.createElement("meta");
    m.name = "google-site-verification";
    m.content = gsc;
    document.head.appendChild(m);
  }

  const ga = env.VITE_GA_ID;
  if (!ga || !/^G-[A-Z0-9]+$/.test(ga)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", ga, { send_page_view: false });
}

export function trackPage(path: string, title: string) {
  window.gtag?.("event", "page_view", { page_path: path, page_title: title });
}

/** Eventos de conversão: generate_lead, whatsapp_click, phone_click */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  window.gtag?.("event", name, params);
}
