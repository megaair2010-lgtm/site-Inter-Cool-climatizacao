import { useEffect, useRef, useState, type FormEvent } from "react";
import { SITE } from "../../config/site";
import { Link } from "../../lib/router";
import { cx, hasWhatsApp } from "../../lib/site-helpers";
import { trackEvent } from "../../lib/analytics";
import { Icon } from "../ui";
import { greeting, handle, isOpenNow, type BotMsg, type Lead, type Step } from "./bot";

const waLink = (text: string) => `https://wa.me/${SITE.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/** Assistente virtual flutuante: tira dúvidas e monta o pedido para o WhatsApp/formulário. */
export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<BotMsg[]>(() => [greeting()]);
  const [step, setStep] = useState<Step>("menu");
  const [lead, setLead] = useState<Lead>({});
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [nudge, setNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // convite discreto depois de alguns segundos
  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = (value: string, shown: string, isReply: boolean) => {
    if (!value.trim() || typing) return;
    setMsgs((m) => [...m.map((x) => ({ ...x, replies: undefined })), { from: "user", text: shown }]);
    const r = handle(step, lead, value, isReply);
    setStep(r.step);
    setLead(r.lead);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, ...r.out]);
      if (r.step === "done") trackEvent("chatbot_lead_ready", { service: r.lead.service });
    }, 550);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text, text.trim(), false);
    setText("");
  };

  const toggle = () => {
    setOpen((o) => !o);
    setNudge(false);
    if (!open) {
      trackEvent("chatbot_open");
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  };

  const last = msgs[msgs.length - 1];
  const freeTextHint = step === "city" ? "Ex.: Santo André – Centro" : step === "name" ? "Seu nome" : step === "detail" ? "Descreva o problema…" : "Digite sua mensagem…";

  return (
    <>
      {/* Janela */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={`Assistente virtual ${SITE.COMPANY_NAME}`}
        className={cx(
          "fixed bottom-24 right-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-[380px] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(11,15,20,.45)] transition duration-300 sm:right-6",
          "h-[min(600px,calc(100dvh-8rem))]",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        )}
      >
        <header className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
          <img src="/logo-intercool-icone.webp" alt="" aria-hidden="true" width={40} height={40} className="block h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Assistente {SITE.COMPANY_NAME}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={cx("h-2 w-2 rounded-full", isOpenNow() ? "bg-emerald-400" : "bg-amber-400")} />
              {isOpenNow() ? "Equipe online agora" : "Resposta no próximo horário comercial"}
            </p>
          </div>
          {hasWhatsApp() && (
            <a href={waLink(`Olá! Vim pelo site da ${SITE.COMPANY_NAME}.`)} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-[#15803D]" onClick={() => trackEvent("whatsapp_click", { place: "chat_header" })}>
              <Icon name="whatsapp" className="h-5 w-5" />
            </a>
          )}
          <button type="button" onClick={toggle} aria-label="Fechar assistente" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-mist px-4 py-4" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={cx("flex flex-col", m.from === "user" ? "items-end" : "items-start")}>
              <p className={cx("max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm", m.from === "user" ? "rounded-br-md bg-brand-gradient text-white" : "rounded-bl-md bg-white text-graphite")}>
                {m.text}
              </p>
              {m.actions && (
                <div className="mt-2 flex w-full max-w-[85%] flex-col gap-2">
                  {m.actions.whatsapp && hasWhatsApp() && (
                    <a href={waLink(m.actions.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_click", { place: "chatbot" })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
                      <Icon name="whatsapp" className="h-5 w-5" /> Enviar pelo WhatsApp
                    </a>
                  )}
                  {m.actions.form && (
                    <Link to={m.actions.form} onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-graphite transition hover:border-graphite">
                      Formulário completo (com fotos)
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm" aria-label="Digitando">
              {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 120}ms` }} />)}
            </div>
          )}
          {!typing && last?.replies && (
            <div className="flex flex-wrap gap-2 pt-1">
              {last.replies.map((r) => (
                <button key={r.value} type="button" onClick={() => send(r.value, r.label, true)} className="rounded-full border border-brand/30 bg-white px-3.5 py-2 text-left text-[13px] font-medium text-brand transition hover:border-brand hover:bg-brand hover:text-white">
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder={freeTextHint}
            aria-label="Mensagem"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-mist px-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
          <button type="submit" disabled={!text.trim() || typing} aria-label="Enviar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition disabled:opacity-40">
          </button>
        </form>
        <p className="bg-white pb-2 text-center text-xs text-slate-400">Assistente automático · nenhum dado é salvo nesta conversa</p>
      </div>

      {/* Convite */}
      {nudge && !open && (
        <button type="button" onClick={toggle} className="fixed bottom-24 right-4 z-40 max-w-[240px] rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-sm text-graphite shadow-lift ring-1 ring-slate-200 animate-[chatpop_.35s_ease-out] sm:right-6">
          <b>Precisa de orçamento?</b> Monto seu pedido em 1 minuto.</button>
      )}

      {/* Botão flutuante */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Fechar assistente" : "Abrir assistente virtual"}
        className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-brand-gradient py-3 pl-3 pr-3 text-white shadow-[0_14px_34px_-10px_rgba(30,85,176,.8)] transition hover:brightness-110 sm:bottom-6 sm:right-6 sm:pr-5"
      >
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
          {open ? <Icon name="close" className="h-6 w-6" /> : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
            </svg>
          )}
          {!open && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />}
        </span>
        <span className="hidden text-sm font-semibold sm:inline">{open ? "Fechar" : "Atendimento online"}</span>
      </button>
      <style>{`@keyframes chatpop{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}`}</style>
    </>
  );
}
