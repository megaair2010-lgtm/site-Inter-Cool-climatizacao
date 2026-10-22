/**
 * Motor do assistente virtual (regras, sem IA externa).
 * Não envia dados para nenhum servidor: as respostas saem daqui e, quando o
 * cliente quer avançar, o pedido vai pronto para o WhatsApp ou para o formulário.
 */
import { SITE } from "../../config/site";
import { FAQ, SERVICES } from "../../data/content";

export type Reply = { label: string; value: string };
export type BotMsg = {
  from: "bot" | "user";
  text: string;
  replies?: Reply[];
  /** Ações finais: abrir WhatsApp com resumo ou ir para o formulário */
  actions?: { whatsapp?: string; form?: string };
};

export type Lead = { service?: string; serviceLabel?: string; client?: string; qty?: string; city?: string; name?: string; detail?: string };
export type Step = "menu" | "service" | "client" | "qty" | "city" | "name" | "detail" | "done" | "faq" | "free";

export const SERVICE_CHOICES: Reply[] = [
  { label: "Instalação", value: "instalacao" },
  { label: "Manutenção preventiva", value: "manutencao" },
  { label: "Conserto / não gela", value: "manutencao-corretiva" },
  { label: "Higienização", value: "higienizacao" },
  { label: "PMOC (empresas)", value: "pmoc" },
  { label: "VRF / VRV", value: "vrf" },
  { label: "Chiller / Fancoil", value: "chiller" },
  { label: "Projeto HVAC", value: "projetos" },
];
const CLIENT_CHOICES: Reply[] = [
  { label: "Residência", value: "Residencial" },
  { label: "Comércio / escritório", value: "Comercial" },
  { label: "Indústria", value: "Industrial" },
  { label: "Condomínio", value: "Condomínio" },
];
const QTY_CHOICES: Reply[] = [
  { label: "1 aparelho", value: "1" },
  { label: "2 a 5", value: "2 a 5" },
  { label: "6 a 20", value: "6 a 20" },
  { label: "Mais de 20 / sistema central", value: "mais de 20" },
];

export const MENU: Reply[] = [
  { label: "Pedir orçamento", value: "orcamento" },
  { label: "Meu ar está com problema", value: "problema" },
  { label: "Dúvidas frequentes", value: "faq" },
  { label: "Regiões e horário", value: "info" },
  { label: "Falar com atendente", value: "humano" },
];

const label = (list: Reply[], v?: string) => list.find((r) => r.value === v)?.label ?? v ?? "";

export function isOpenNow(d = new Date()): boolean {
  const day = d.getDay(); // 0 dom … 6 sáb
  const min = d.getHours() * 60 + d.getMinutes();
  return day >= 1 && day <= 5 && min >= 8 * 60 + 25 && min <= 17 * 60 + 30;
}

export function greeting(): BotMsg {
  const open = isOpenNow();
  return {
    from: "bot",
    text: `Olá! Sou o assistente virtual da ${SITE.COMPANY_NAME}.\nPosso montar seu pedido de orçamento em 1 minuto ou tirar suas dúvidas.` +
      (open ? "" : `\n\nNossa equipe atende ${SITE.BUSINESS_HOURS.toLowerCase()}. Deixe seu pedido que respondemos no próximo horário de atendimento.`),
    replies: MENU,
  };
}

export function leadMessage(l: Lead): string {
  const lines = [
    `Olá! Vim pelo site da ${SITE.COMPANY_NAME} e gostaria de um orçamento.`,
    l.serviceLabel && `• Serviço: ${l.serviceLabel}`,
    l.client && `• Tipo de cliente: ${l.client}`,
    l.qty && `• Quantidade de equipamentos: ${l.qty}`,
    l.city && `• Cidade/bairro: ${l.city}`,
    l.name && `• Nome: ${l.name}`,
    l.detail && `• Detalhes: ${l.detail}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export function formLink(l: Lead): string {
  return `/orcamento${l.service ? `?servico=${l.service}` : ""}`;
}

/* ---------------- Respostas por palavra-chave ---------------- */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const KEYWORDS: { k: RegExp; a: () => BotMsg }[] = [
  { k: /\b(preco|valor|quanto custa|custa|orcamento|cotacao)\b/, a: () => ({ from: "bot", text: "O valor depende do tipo de equipamento, da quantidade e do local. Montando o pedido aqui, nossa equipe responde com um orçamento claro e sem compromisso. Vamos lá?", replies: [{ label: "Montar pedido", value: "orcamento" }, { label: "Falar com atendente", value: "humano" }] }) },
  { k: /\b(nao gela|nao esfria|pingando|vazando|goteja|barulho|cheiro|desliga|erro|pisca|parou|quebrou|nao liga)\b/, a: () => ({ from: "bot", text: "Entendi, parece um caso de manutenção corretiva. Fazemos o diagnóstico técnico e passamos o orçamento antes de qualquer reparo. Vou montar seu pedido:", replies: [{ label: "Continuar", value: "svc:manutencao-corretiva" }] }) },
  { k: /\b(horario|aberto|funciona|atende que horas|sabado|domingo)\b/, a: () => info() },
  { k: /\b(regiao|regioes|cidade|atendem|bairro|interior|litoral|abc|zona)\b/, a: () => info() },
  { k: /\b(cnpj|empresa|razao social)\b/, a: () => ({ from: "bot", text: `${SITE.COMPANY_LEGAL_NAME}\nCNPJ ${SITE.COMPANY_DOCUMENT}`, replies: MENU }) },
  { k: /\b(email|e-mail)\b/, a: () => ({ from: "bot", text: `Nosso e-mail: ${SITE.COMPANY_EMAIL}`, replies: MENU }) },
  { k: /\b(telefone|whatsapp|zap|ligar|contato|atendente|humano|pessoa)\b/, a: () => human() },
  { k: /\b(gas|r410|r-410|r32|r-32|r22|carga)\b/, a: () => ({ from: "bot", text: "Trabalhamos com os gases R-410A e R-32, incluindo carga de gás, teste de vazamento e vácuo da tubulação.", replies: [{ label: "Pedir orçamento", value: "orcamento" }, { label: "Voltar ao menu", value: "menu" }] }) },
];

function info(): BotMsg {
  return {
    from: "bot",
    text: `Atendemos ${SITE.COMPANY_REGION}: ${SITE.SERVICE_AREAS.join(", ")}.\n${SITE.BUSINESS_HOURS}.`,
    replies: [{ label: "Pedir orçamento", value: "orcamento" }, { label: "Falar com atendente", value: "humano" }, { label: "Voltar ao menu", value: "menu" }],
  };
}

function human(): BotMsg {
  return {
    from: "bot",
    text: `Claro! Fale direto com a equipe pelo WhatsApp ${SITE.COMPANY_PHONE}${isOpenNow() ? "." : ` — respondemos ${SITE.BUSINESS_HOURS.toLowerCase()}.`}`,
    actions: { whatsapp: `Olá! Vim pelo site da ${SITE.COMPANY_NAME} e gostaria de falar com um atendente.` },
    replies: [{ label: "Voltar ao menu", value: "menu" }],
  };
}

function matchFaq(q: string) {
  const words = norm(q).split(/\W+/).filter((w) => w.length > 3);
  let best: { score: number; i: number } = { score: 0, i: -1 };
  FAQ.forEach((f, i) => {
    const hay = norm(f.question + " " + f.answer);
    const score = words.filter((w) => hay.includes(w)).length;
    if (score > best.score) best = { score, i };
  });
  return best.score >= 2 ? FAQ[best.i] : null;
}

function matchService(q: string) {
  const t = norm(q);
  const map: [RegExp, string][] = [
    [/higieniz|limpeza|limpar/, "higienizacao"],
    [/pmoc/, "pmoc"],
    [/vrf|vrv/, "vrf"],
    [/chiller|fancoil|agua gelada/, "chiller"],
    [/projeto|carga termica|duto|self/, "projetos"],
    [/instal/, "instalacao"],
    [/preventiv|contrato/, "manutencao"],
    [/manutenc|conserto|reparo|arrumar/, "manutencao-corretiva"],
  ];
  return map.find(([r]) => r.test(t))?.[1];
}

/* ---------------- Máquina de estados ---------------- */
export function handle(step: Step, lead: Lead, input: string, isReply: boolean): { step: Step; lead: Lead; out: BotMsg[] } {
  const v = input.trim();
  if (!v) return { step, lead, out: [] };

  // comandos globais
  if (isReply && v === "menu") return { step: "menu", lead: {}, out: [{ from: "bot", text: "Como posso ajudar?", replies: MENU }] };
  if (isReply && v === "humano") return { step: "menu", lead, out: [human()] };
  if (isReply && v === "info") return { step: "menu", lead, out: [info()] };
  if (isReply && (v === "orcamento" || v === "problema")) {
    if (v === "problema") return { step: "detail", lead: { service: "manutencao-corretiva", serviceLabel: "Conserto / manutenção corretiva" }, out: [{ from: "bot", text: "Sinto muito pelo transtorno! Conte em poucas palavras o que está acontecendo (ex.: não gela, pingando água, fazendo barulho, mostra código de erro):" }] };
    return { step: "service", lead: {}, out: [{ from: "bot", text: "Ótimo! Qual serviço você precisa?", replies: SERVICE_CHOICES }] };
  }
  if (isReply && v === "faq") return { step: "faq", lead, out: [{ from: "bot", text: "Escolha uma pergunta ou digite a sua:", replies: FAQ.slice(0, 8).map((f) => ({ label: f.question, value: `faq:${f.id}` })) }] };
  if (isReply && v.startsWith("faq:")) {
    const f = FAQ.find((x) => x.id === v.slice(4));
    return { step: "faq", lead, out: [{ from: "bot", text: f?.answer ?? "", replies: [{ label: "Pedir orçamento", value: "orcamento" }, { label: "Outra dúvida", value: "faq" }, { label: "Voltar ao menu", value: "menu" }] }] };
  }
  if (isReply && v.startsWith("svc:")) {
    const s = v.slice(4);
    return { step: "client", lead: { ...lead, service: s, serviceLabel: label(SERVICE_CHOICES, s) }, out: [{ from: "bot", text: "Certo. O atendimento é para:", replies: CLIENT_CHOICES }] };
  }

  switch (step) {
    case "service": {
      const s = isReply ? v : matchService(v) ?? "outro";
      const svc = SERVICES.find((x) => x.slug === s);
      return { step: "client", lead: { ...lead, service: s, serviceLabel: label(SERVICE_CHOICES, s) || svc?.title || v }, out: [{ from: "bot", text: "Certo. O atendimento é para:", replies: CLIENT_CHOICES }] };
    }
    case "client":
      return { step: "qty", lead: { ...lead, client: v }, out: [{ from: "bot", text: "Quantos equipamentos, mais ou menos?", replies: QTY_CHOICES }] };
    case "qty":
      return { step: "city", lead: { ...lead, qty: v }, out: [{ from: "bot", text: "Em qual cidade e bairro será o serviço?" }] };
    case "detail":
      return { step: "client", lead: { ...lead, detail: v.slice(0, 300) }, out: [{ from: "bot", text: "Anotado. O equipamento fica em:", replies: CLIENT_CHOICES }] };
    case "city":
      return { step: "name", lead: { ...lead, city: v.slice(0, 80) }, out: [{ from: "bot", text: `Atendemos ${SITE.COMPANY_REGION} \nPara finalizar, qual é o seu nome?` }] };
    case "name": {
      const l = { ...lead, name: v.slice(0, 60) };
      return {
        step: "done",
        lead: l,
        out: [{
          from: "bot",
          text: `Obrigado, ${l.name.split(" ")[0]}! Seu pedido está pronto:\n\n${leadMessage(l).split("\n").slice(1).join("\n")}\n\nToque em "Enviar pelo WhatsApp" — a mensagem já vai preenchida para nossa equipe. Se preferir, complete o formulário e anexe fotos do equipamento.`,
          actions: { whatsapp: leadMessage(l), form: formLink(l) },
          replies: [{ label: "Começar de novo", value: "menu" }],
        }],
      };
    }
  }

  // texto livre fora de um fluxo
  const t = norm(v);
  const kw = KEYWORDS.find((k) => k.k.test(t));
  if (kw) {
    const msg = kw.a();
    // atalho: "não gela" leva direto para o fluxo de conserto com o relato
    if (msg.replies?.[0]?.value === "svc:manutencao-corretiva") {
      return { step: "client", lead: { service: "manutencao-corretiva", serviceLabel: "Conserto / manutenção corretiva", detail: v.slice(0, 300) }, out: [{ ...msg, replies: CLIENT_CHOICES, text: msg.text.replace("Vou montar seu pedido:", "O equipamento fica em:") }] };
    }
    return { step: "menu", lead, out: [msg] };
  }
  const f = matchFaq(v);
  if (f) return { step: "menu", lead, out: [{ from: "bot", text: f.answer, replies: [{ label: "Pedir orçamento", value: "orcamento" }, { label: "Outra dúvida", value: "faq" }, { label: "Voltar ao menu", value: "menu" }] }] };
  const s = matchService(v);
  if (s) return { step: "client", lead: { service: s, serviceLabel: label(SERVICE_CHOICES, s) }, out: [{ from: "bot", text: `Fazemos ${label(SERVICE_CHOICES, s).toLowerCase()}, sim! Vou montar seu orçamento. O atendimento é para:`, replies: CLIENT_CHOICES }] };
  return { step: "menu", lead, out: [{ from: "bot", text: "Não entendi bem. Posso montar seu orçamento ou te passar para um atendente:", replies: MENU }] };
}
