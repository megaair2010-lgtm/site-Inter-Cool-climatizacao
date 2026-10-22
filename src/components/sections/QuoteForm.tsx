import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { SITE } from "../../config/site";
import { CLIENT_TYPES, MAX_PHOTOS, MAX_PHOTO_MB, SERVICE_OPTIONS, leadToText, submitLead, validateLead, type FieldErrors } from "../../services/leads";
import { cx, hasWhatsApp, maskPhone, whatsappUrl } from "../../lib/site-helpers";
import { Link, useRouter } from "../../lib/router";
import { trackEvent } from "../../lib/analytics";
import { Button, Icon, Ph, Section, SectionHead, WhatsAppButton } from "../ui";
import type { ClientType, LeadInput, ServiceRequested } from "../../types";

const SLUG_TO_SERVICE: Record<string, ServiceRequested> = {
  instalacao: "instalacao", manutencao: "manutencao-preventiva", "manutencao-corretiva": "manutencao-corretiva",
  higienizacao: "higienizacao", pmoc: "pmoc", vrf: "vrf", chiller: "chiller", projetos: "projeto",
};
const SEGMENT_TO_CLIENT: Record<string, ClientType> = { g1: "residencial", g2: "comercial", g3: "industrial", g4: "comercial", g5: "comercial", g6: "condominio" };

const EMPTY: LeadInput = {
  name: "", phone: "", email: "", city: "", clientType: "residencial", service: "instalacao",
  equipmentCount: "", equipmentBrand: "", message: "", photos: [], website: "",
};

function Field({ label, id, error, required, children, hint }: { label: string; id: string; error?: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-graphite">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
const inputCls = (err?: string) =>
  cx("w-full rounded-xl border bg-white px-4 py-3 text-base text-graphite placeholder:text-slate-400 transition focus:outline-none focus:ring-4",
    err ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-brand focus:ring-brand/15");

export function QuoteForm({ compactHead }: { compactHead?: boolean }) {
  const { query } = useRouter();
  const [v, setV] = useState<LeadInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "fallback">("idle");
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = query.get("servico");
    const g = query.get("segmento");
    setV((o) => ({ ...o, service: (s && SLUG_TO_SERVICE[s]) || o.service, clientType: (g && SEGMENT_TO_CLIENT[g]) || o.clientType }));
  }, [query]);

  const previews = useMemo(() => v.photos.map((f) => URL.createObjectURL(f)), [v.photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const set = <K extends keyof LeadInput>(k: K, val: LeadInput[K]) => {
    setV((o) => ({ ...o, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    set("photos", [...v.photos, ...files].slice(0, MAX_PHOTOS));
    e.target.value = "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateLead(v);
    setErrors(errs);
    setConsentErr(!consent);
    if (Object.keys(errs).length || !consent) {
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setState("sending");
    const r = await submitLead(v);
    if (r.ok) {
      trackEvent("generate_lead", { service: v.service, client_type: v.clientType });
      setState("done");
    } else {
      setState("fallback");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-brand/30 bg-white p-8 text-center shadow-lift sm:p-12" role="status">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white"><Icon name="check" className="h-8 w-8" strokeWidth={2.4} /></span>
        <h3 className="mt-6 text-2xl font-semibold">Solicitação enviada!</h3>
        <p className="mx-auto mt-3 max-w-md text-slate-600">Recebemos sua solicitação. Nossa equipe entrará em contato em breve.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <WhatsAppButton message={leadToText(v)}>Enviar também pelo WhatsApp</WhatsAppButton>
          <button type="button" onClick={() => { setV(EMPTY); setConsent(false); setState("idle"); }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">Nova solicitação</button>
        </div>
      </div>
    );
  }

  const textToSend = leadToText(v);
  return (
    <form onSubmit={onSubmit} noValidate className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-lift sm:p-10">
      {!compactHead && (
        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name="receipt" /></span>
          <div>
            <p className="font-display text-lg font-semibold">Formulário de orçamento</p>
            <p className="text-sm text-slate-500">Leva menos de 2 minutos. Campos com * são obrigatórios.</p>
          </div>
        </div>
      )}

      {/* campo-isca anti-spam: invisível para pessoas */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Não preencha</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" id="name" required error={errors.name}>
          <input id="name" autoComplete="name" className={inputCls(errors.name)} value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} placeholder="Seu nome completo" />
        </Field>
        <Field label="Telefone / WhatsApp" id="phone" required error={errors.phone}>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={15} className={inputCls(errors.phone)} value={v.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : undefined} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="E-mail" id="email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" className={inputCls(errors.email)} value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} placeholder="voce@email.com" />
        </Field>
        <Field label="Cidade" id="city" required error={errors.city}>
          <input id="city" autoComplete="address-level2" className={inputCls(errors.city)} value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} aria-describedby={errors.city ? "city-err" : undefined} placeholder="Cidade / bairro" />
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium">Tipo de cliente <span className="text-brand">*</span></legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CLIENT_TYPES.map((c) => (
            <label key={c.value} className={cx("flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition", v.clientType === c.value ? "border-brand bg-brand/5 text-brand" : "border-slate-300 text-slate-600 hover:border-slate-400")}>
              <input type="radio" name="clientType" value={c.value} checked={v.clientType === c.value} onChange={() => set("clientType", c.value)} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Field label="Serviço" id="service" required>
          <select id="service" className={inputCls()} value={v.service} onChange={(e) => set("service", e.target.value as ServiceRequested)}>
            {SERVICE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Quantidade de equipamentos" id="equipmentCount" error={errors.equipmentCount}>
          <input id="equipmentCount" inputMode="numeric" className={inputCls(errors.equipmentCount)} value={v.equipmentCount} onChange={(e) => set("equipmentCount", e.target.value.replace(/\D/g, "").slice(0, 4))} aria-invalid={!!errors.equipmentCount} aria-describedby={errors.equipmentCount ? "equipmentCount-err" : undefined} placeholder="Ex.: 2" />
        </Field>
        <Field label="Marca do equipamento" id="equipmentBrand">
          <input id="equipmentBrand" className={inputCls()} value={v.equipmentBrand} onChange={(e) => set("equipmentBrand", e.target.value.slice(0, 60))} placeholder="Se souber" />
        </Field>
      </div>

      <div className="mt-6">
        <Field label="Mensagem" id="message" error={errors.message} hint="Conte o que você precisa: ambiente, problema, prazo desejado.">
          <textarea id="message" rows={4} maxLength={2000} className={inputCls(errors.message)} value={v.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-err" : undefined} />
        </Field>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Fotos do equipamento ou do local</p>
        <div className={cx("rounded-2xl border-2 border-dashed p-5 transition", errors.photos ? "border-red-300" : "border-slate-300 hover:border-brand")}>
          <input ref={fileRef} id="photos" type="file" accept="image/*" multiple onChange={onFiles} className="sr-only" />
          <label htmlFor="photos" className="flex cursor-pointer flex-col items-center gap-2 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand"><Icon name="upload" /></span>
            <span className="text-sm font-semibold text-graphite">Adicionar fotos</span>
            <span className="text-xs text-slate-500">Até {MAX_PHOTOS} imagens, {MAX_PHOTO_MB} MB cada</span>
          </label>
          {v.photos.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {v.photos.map((f, i) => (
                <li key={i} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                  <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set("photos", v.photos.filter((_, k) => k !== i))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-white" aria-label={`Remover ${f.name}`}>
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.photos && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.photos}</p>}
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentErr(false); }} aria-invalid={consentErr} className="mt-0.5 h-5 w-5 rounded accent-[#1E55B0]" />
        <span>Concordo com o uso dos meus dados para o retorno deste pedido, conforme a <Link to="/politica-de-privacidade" className="font-semibold text-brand underline-offset-2 hover:underline">Política de Privacidade</Link>.</span>
      </label>
      {consentErr && <p className="mt-1.5 text-xs font-medium text-red-600">Marque a autorização para continuar.</p>}

      <button type="submit" disabled={state === "sending"} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-white transition hover:bg-[#17468F] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
        {state === "sending" ? "Enviando..." : "Solicitar orçamento"}
      </button>

      {state === "fallback" && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
          <p className="font-semibold">Não foi possível enviar pelo site agora.</p>
          <p className="mt-1">Envie sua solicitação diretamente para nossa equipe:</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {hasWhatsApp() ? (
              <Button href={whatsappUrl(textToSend)} variant="whatsapp" icon="whatsapp">Enviar pelo WhatsApp</Button>
            ) : (
              <p className="ph-mark p-2 text-xs">Configure WHATSAPP_NUMBER e o endpoint VITE_LEADS_ENDPOINT para receber os pedidos.</p>
            )}
            {SITE.COMPANY_EMAIL && <span className="self-center">ou pelo e-mail <b><Ph value={SITE.COMPANY_EMAIL} /></b></span>}
          </div>
        </div>
      )}
    </form>
  );
}

export function QuoteSection() {
  return (
    <Section id="orcamento" tone="mist">
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionHead eyebrow="Orçamento" title="Solicite seu orçamento" subtitle="Conte para nossa equipe o que você precisa. Analisaremos sua solicitação e entraremos em contato." />
          <ul className="-mt-4 grid gap-4">
            {[
              ["receipt", "Orçamento claro, sem compromisso"],
              ["clock", "Retorno da equipe em horário comercial"],
              ["camera", "Envie fotos para agilizar a análise"],
            ].map(([i, t]) => (
              <li key={t} className="flex items-center gap-3 text-slate-700">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-soft"><Icon name={i as never} className="h-5 w-5" /></span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-graphite p-6 text-white">
            <p className="text-sm text-slate-300">Prefere conversar agora?</p>
            <p className="mt-1 font-display text-lg font-semibold">Fale com um especialista</p>
            <WhatsAppButton className="mt-4 w-full sm:w-auto">Falar no WhatsApp</WhatsAppButton>
          </div>
        </div>
        <QuoteForm />
      </div>
    </Section>
  );
}
