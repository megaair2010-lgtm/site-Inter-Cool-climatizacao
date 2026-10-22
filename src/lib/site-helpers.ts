import { SITE, WHATSAPP_DEFAULT_MESSAGE } from "../config/site";

/** Valor ainda não preenchido: vazio, null ou entre [colchetes] */
export function isPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "" || /^\[.*\]$/.test(value.trim());
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export const hasWhatsApp = () => /^\d{12,13}$/.test(SITE.WHATSAPP_NUMBER);

/** Link do WhatsApp com mensagem pronta. Sem número configurado, leva ao formulário. */
export function whatsappUrl(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  if (!hasWhatsApp()) return "/orcamento";
  return `https://wa.me/${SITE.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const phoneHref = () => {
  const d = SITE.COMPANY_PHONE.replace(/\D/g, "");
  return d ? `tel:+55${d}` : "";
};

/** Máscara de telefone brasileiro */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
