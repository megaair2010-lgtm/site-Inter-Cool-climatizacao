/**
 * Envio de solicitações de orçamento (leads).
 * O navegador NUNCA fala direto com o banco de dados: envia para um
 * endpoint do servidor (VITE_LEADS_ENDPOINT, ex.: /api/leads), que
 * valida, aplica anti-spam e grava. Veja api/leads.ts.
 */
import type { ClientType, LeadInput, ServiceRequested } from "../types";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const ENDPOINT = env.VITE_LEADS_ENDPOINT || "";

export const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
  { value: "condominio", label: "Condomínio" },
];

export const SERVICE_OPTIONS: { value: ServiceRequested; label: string }[] = [
  { value: "instalacao", label: "Instalação" },
  { value: "manutencao-preventiva", label: "Manutenção preventiva" },
  { value: "manutencao-corretiva", label: "Manutenção corretiva" },
  { value: "higienizacao", label: "Higienização" },
  { value: "pmoc", label: "PMOC" },
  { value: "vrf", label: "VRF / VRV" },
  { value: "chiller", label: "Chiller / Fancoil" },
  { value: "projeto", label: "Projeto" },
  { value: "outro", label: "Outro" },
];

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_MB = 5;

export type FieldErrors = Partial<Record<keyof LeadInput, string>>;

export function validateLead(v: LeadInput): FieldErrors {
  const e: FieldErrors = {};
  if (v.name.trim().length < 2) e.name = "Informe seu nome.";
  if (v.phone.replace(/\D/g, "").length < 10) e.phone = "Informe um telefone com DDD.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = "E-mail inválido.";
  if (v.city.trim().length < 2) e.city = "Informe a cidade.";
  if (v.equipmentCount && !/^\d{1,4}$/.test(v.equipmentCount)) e.equipmentCount = "Use apenas números.";
  if (v.message.length > 2000) e.message = "Mensagem muito longa (máx. 2000 caracteres).";
  if (v.photos.length > MAX_PHOTOS) e.photos = `Envie no máximo ${MAX_PHOTOS} fotos.`;
  if (v.photos.some((f) => !f.type.startsWith("image/"))) e.photos = "Envie apenas imagens.";
  if (v.photos.some((f) => f.size > MAX_PHOTO_MB * 1024 * 1024)) e.photos = `Cada foto pode ter até ${MAX_PHOTO_MB} MB.`;
  return e;
}

export type SubmitResult = { ok: true } | { ok: false; reason: "no-endpoint" | "network" | "server" };

export async function submitLead(v: LeadInput): Promise<SubmitResult> {
  // Robô preencheu o campo-isca: finge sucesso e descarta
  if (v.website) return { ok: true };
  if (!ENDPOINT) return { ok: false, reason: "no-endpoint" };

  const fd = new FormData();
  fd.append("name", v.name.trim());
  fd.append("phone", v.phone);
  fd.append("email", v.email.trim());
  fd.append("city", v.city.trim());
  fd.append("clientType", v.clientType);
  fd.append("service", v.service);
  fd.append("equipmentCount", v.equipmentCount);
  fd.append("equipmentBrand", v.equipmentBrand.trim());
  fd.append("message", v.message.trim());
  fd.append("website", v.website);
  v.photos.forEach((f) => fd.append("photos", f, f.name));

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    const res = await fetch(ENDPOINT, { method: "POST", body: fd, signal: ctl.signal });
    clearTimeout(t);
    return res.ok ? { ok: true } : { ok: false, reason: "server" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** Texto do pedido para enviar pelo WhatsApp quando o servidor não estiver disponível */
export function leadToText(v: LeadInput): string {
  const svc = SERVICE_OPTIONS.find((s) => s.value === v.service)?.label ?? v.service;
  const ct = CLIENT_TYPES.find((c) => c.value === v.clientType)?.label ?? v.clientType;
  return [
    "Olá! Gostaria de solicitar um orçamento.",
    `Nome: ${v.name}`,
    `Telefone: ${v.phone}`,
    v.email && `E-mail: ${v.email}`,
    `Cidade: ${v.city}`,
    `Tipo de cliente: ${ct}`,
    `Serviço: ${svc}`,
    v.equipmentCount && `Quantidade de equipamentos: ${v.equipmentCount}`,
    v.equipmentBrand && `Marca: ${v.equipmentBrand}`,
    v.message && `Mensagem: ${v.message}`,
  ]
    .filter(Boolean)
    .join("\n");
}
