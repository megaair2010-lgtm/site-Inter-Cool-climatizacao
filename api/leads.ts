/**
 * POST /api/leads — recebe o formulário de orçamento.
 *
 * Função serverless no formato Web (Request/Response), compatível com Vercel Functions
 * e adaptável para Netlify/Cloudflare. Roda SOMENTE no servidor: as variáveis abaixo
 * nunca vão para o navegador.
 *
 * Variáveis de ambiente (configure no painel da hospedagem, nunca no código):
 *   ALLOWED_ORIGIN       ex.: https://www.suaempresa.com.br  (obrigatória em produção)
 *   LEADS_NOTIFY_EMAIL   e-mail que recebe os pedidos
 *   LEADS_FROM_EMAIL     remetente verificado no provedor de e-mail
 *   RESEND_API_KEY       chave do provedor de e-mail (exemplo: Resend). Opcional.
 *   DATABASE_URL         conexão do banco (ver database/schema.sql). Opcional.
 */

const MAX_FIELD = 2000;
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const CLIENT_TYPES = ["residencial", "comercial", "industrial", "condominio"];
const SERVICES = ["instalacao", "manutencao-preventiva", "manutencao-corretiva", "higienizacao", "pmoc", "vrf", "chiller", "projeto", "outro"];

/* Limite simples por IP (memória da instância). Em produção, prefira um store
   compartilhado (Upstash/Redis, KV) ou a proteção de bots da hospedagem. */
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > windowMs) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n += 1;
  return h.n > max;
}

const json = (status: number, body: unknown, origin?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    },
  });

const clean = (v: FormDataEntryValue | null, max = MAX_FIELD) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = process.env.ALLOWED_ORIGIN;
  if (!allowed || origin !== allowed) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: { "access-control-allow-origin": allowed, "access-control-allow-methods": "POST", "access-control-max-age": "86400", vary: "Origin" },
  });
}

export async function POST(req: Request) {
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.get("origin") ?? "";

  // 1) Origem: só aceita chamadas do próprio site
  if (allowed && origin && origin !== allowed) return json(403, { ok: false, error: "origin" });

  // 2) Rate limit por IP
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return json(429, { ok: false, error: "rate-limit" }, allowed);

  // 3) Tamanho total do corpo
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_PHOTOS * MAX_PHOTO_BYTES + 200_000) return json(413, { ok: false, error: "too-large" }, allowed);

  let fd: FormData;
  try { fd = await req.formData(); } catch { return json(400, { ok: false, error: "bad-request" }, allowed); }

  // 4) Honeypot: robôs preenchem o campo oculto. Responde "ok" sem processar.
  if (clean(fd.get("website"))) return json(200, { ok: true }, allowed);

  // 5) Validação no servidor (nunca confie só na validação do navegador)
  const lead = {
    name: clean(fd.get("name"), 120),
    phone: clean(fd.get("phone"), 30).replace(/\D/g, ""),
    email: clean(fd.get("email"), 160),
    city: clean(fd.get("city"), 120),
    clientType: clean(fd.get("clientType"), 30),
    service: clean(fd.get("service"), 40),
    equipmentCount: clean(fd.get("equipmentCount"), 6),
    equipmentBrand: clean(fd.get("equipmentBrand"), 80),
    message: clean(fd.get("message")),
  };
  const errors: string[] = [];
  if (lead.name.length < 2) errors.push("name");
  if (lead.phone.length < 10 || lead.phone.length > 13) errors.push("phone");
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push("email");
  if (lead.city.length < 2) errors.push("city");
  if (!CLIENT_TYPES.includes(lead.clientType)) errors.push("clientType");
  if (!SERVICES.includes(lead.service)) errors.push("service");
  if (lead.equipmentCount && !/^\d{1,4}$/.test(lead.equipmentCount)) errors.push("equipmentCount");

  const photos = fd.getAll("photos").filter((p): p is File => typeof p !== "string");
  if (photos.length > MAX_PHOTOS) errors.push("photos");
  for (const p of photos) if (!ALLOWED_IMAGE.includes(p.type) || p.size > MAX_PHOTO_BYTES) { errors.push("photos"); break; }

  if (errors.length) return json(422, { ok: false, error: "validation", fields: errors }, allowed);

  const record = { ...lead, status: "novo", source: "site-form", createdAt: new Date().toISOString() };

  // 6) Armazenamento — TODO: grave em `leads` (database/schema.sql) usando DATABASE_URL.
  //    Envie as fotos para um storage privado (S3, R2, Supabase Storage) e salve só as URLs.
  //    Guarde apenas o necessário para o atendimento (LGPD).

  // 7) Notificação por e-mail (opcional)
  try {
    await notifyByEmail(record, photos);
  } catch (e) {
    console.error("lead notify failed", e instanceof Error ? e.message : e);
    // Sem banco configurado, a falha do e-mail significa perda do pedido: avise o visitante.
    if (!process.env.DATABASE_URL) return json(502, { ok: false, error: "notify" }, allowed);
  }

  return json(200, { ok: true }, allowed);
}

async function notifyByEmail(lead: Record<string, string>, photos: File[]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  const from = process.env.LEADS_FROM_EMAIL;
  if (!key || !to || !from) throw new Error("email not configured");

  const rows = Object.entries(lead)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("");

  const attachments = await Promise.all(
    photos.map(async (p) => ({ filename: p.name.replace(/[^\w.\-]/g, "_"), content: Buffer.from(await p.arrayBuffer()).toString("base64") }))
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email || undefined,
      subject: `Novo pedido de orçamento — ${lead.name} (${lead.city})`,
      html: `<h2>Novo pedido de orçamento</h2><table>${rows}</table>`,
      attachments,
    }),
  });
  if (!res.ok) throw new Error(`email provider ${res.status}`);
}
