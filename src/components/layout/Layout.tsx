import { useEffect, useState, type ReactNode } from "react";
import { SITE } from "../../config/site";
import { Link, useRouter } from "../../lib/router";
import { cx, hasWhatsApp, isPlaceholder, phoneHref, whatsappUrl } from "../../lib/site-helpers";
import { trackEvent } from "../../lib/analytics";
import { Button, Container, Icon, Ph, WhatsAppButton } from "../ui";

export const NAV = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/solucoes", label: "Soluções" },
  { to: "/projetos", label: "Projetos" },
  { to: "/sobre", label: "Sobre nós" },
  { to: "/#atendimento", label: "Atendimento" },
  { to: "/contato", label: "Contato" },
];

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label={`${SITE.COMPANY_NAME} — início`}>
      <img src="/logo-intercool-icone.webp" alt="" aria-hidden="true" width={48} height={48} className="block h-12 w-12 shrink-0 object-contain" />
      <span className="leading-none">
        <span className={cx("block font-logo text-[1.35rem] font-semibold italic tracking-tight", dark ? "text-white" : "text-graphite")}>
          <Ph value={SITE.COMPANY_NAME} />
        </span>
        <span className={cx("mt-1 block text-xs font-semibold", dark ? "text-slate-400" : "text-slate-500")}>Climatização HVAC</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (to: string) => (to === "/" ? path === "/" : !to.includes("#") && path.startsWith(to));
  // Na página inicial o cabeçalho fica transparente sobre o hero até o usuário rolar
  const over = path === "/" && !scrolled && !open;

  return (
    <><div className="scroll-progress" aria-hidden="true" />
    <header className={cx("fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300", over ? "header-over" : scrolled || open ? "bg-white/95 shadow-soft backdrop-blur" : "bg-white/95 backdrop-blur")}>
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <Logo dark={over} />
        <nav aria-label="Principal" className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={cx("rounded-lg px-3 py-2 text-sm font-medium transition-colors", over ? (isActive(n.to) ? "text-white" : "text-white/75 hover:text-white") : isActive(n.to) ? "text-brand" : "text-slate-600 hover:text-graphite")} aria-current={isActive(n.to) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {hasWhatsApp() && (
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_click", { place: "header" })} className="grid h-11 w-11 place-items-center rounded-xl bg-[#15803D] text-white xl:hidden" aria-label="WhatsApp">
              <Icon name="whatsapp" className="h-5 w-5" />
            </a>
          )}
          <span className="hidden sm:block"><Button to="/orcamento">Solicitar orçamento</Button></span>
          <button type="button" onClick={() => setOpen((o) => !o)} className={cx("grid h-11 w-11 place-items-center rounded-xl border xl:hidden", over ? "border-white/30 text-white" : "border-slate-200 text-graphite")} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="menu-mobile">
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </Container>

      {/* Menu mobile */}
      <div id="menu-mobile" className={cx("xl:hidden overflow-hidden bg-white transition-[max-height] duration-300", open ? "max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-slate-100" : "max-h-0")} hidden={!open}>
        <Container className="py-4">
          <nav aria-label="Menu" className="grid">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={cx("flex items-center justify-between border-b border-slate-100 py-4 text-base font-medium", isActive(n.to) ? "text-brand" : "text-graphite")}>
                {n.label}
                <Icon name="chevron" className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </nav>
          <div className="mt-5 grid gap-3 pb-4">
            <Button to="/orcamento" size="lg">Solicitar orçamento</Button>
            <WhatsAppButton size="lg">Falar no WhatsApp</WhatsAppButton>
          </div>
        </Container>
      </div>
    </header></>
  );
}

export function FloatingWhatsApp() {
  const url = whatsappUrl();
  const ext = hasWhatsApp();
  const cls = "group fixed bottom-5 right-5 z-40 flex items-center gap-3 wa-pulse rounded-full bg-[#15803D] py-3 pl-3 pr-3 text-white transition hover:pr-5 sm:bottom-6 sm:right-6";
  const inner = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
        <Icon name="whatsapp" className="h-6 w-6" />
      </span>
      <span className="hidden pr-1 text-sm font-semibold sm:inline">Falar com especialista</span>
    </>
  );
  return ext ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls} aria-label="Falar com especialista no WhatsApp" onClick={() => trackEvent("whatsapp_click", { place: "floating" })}>{inner}</a>
  ) : (
    <Link to="/orcamento" className={cls} aria-label="Falar com especialista" title="Configure WHATSAPP_NUMBER em src/config/site.ts">{inner}</Link>
  );
}

function FootCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-3 text-sm text-slate-400">{children}</div>
    </div>
  );
}

export function Footer() {
  const social = [
    { url: SITE.INSTAGRAM_URL, icon: "instagram" as const, label: "Instagram" },
    { url: SITE.FACEBOOK_URL, icon: "facebook" as const, label: "Facebook" },
    { url: SITE.LINKEDIN_URL, icon: "linkedin" as const, label: "LinkedIn" },
  ];
  return (
    <footer className="bg-ink text-slate-400">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <img src="/images/logo-inter-cool.webp" alt={`Logo ${SITE.COMPANY_NAME} Climatização HVAC`} width={640} height={690} loading="lazy" className="h-auto w-40 sm:w-48" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{SITE.COMPANY_TAGLINE}</p>
          <div className="mt-6 flex gap-3">
            {social.filter((s) => SITE.SHOW_PLACEHOLDERS || !isPlaceholder(s.url)).map((s) =>
              isPlaceholder(s.url) ? (
                <span key={s.label} className="grid h-10 w-10 place-items-center rounded-lg border border-dashed border-amber-500/50 text-slate-600" title={`Configure ${s.label.toUpperCase()}_URL em src/config/site.ts`}>
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
              ) : (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-brand-light hover:text-brand-light">
                  <Icon name={s.icon} className="h-5 w-5" />
                </a>
              )
            )}
          </div>
        </div>
        <FootCol title="Navegação">
          {[["/", "Início"], ["/servicos", "Serviços"], ["/solucoes", "Soluções"], ["/projetos", "Projetos"], ["/sobre", "Sobre nós"], ["/contato", "Contato"], ["/politica-de-privacidade", "Política de Privacidade"]].map(([to, l]) => (
            <Link key={to} to={to} className="transition hover:text-white">{l}</Link>
          ))}
        </FootCol>
        <FootCol title="Serviços">
          {[["/servicos/instalacao", "Instalação"], ["/servicos/manutencao", "Manutenção"], ["/servicos/higienizacao", "Higienização"], ["/servicos/pmoc", "PMOC"], ["/servicos/vrf", "VRF / VRV"], ["/servicos/chiller", "Chillers e Fancoils"], ["/servicos/projetos", "Projetos HVAC"]].map(([to, l]) => (
            <Link key={to} to={to} className="transition hover:text-white">{l}</Link>
          ))}
        </FootCol>
        <FootCol title="Contato">
          <span className="flex gap-3"><Icon name="whatsapp" className="h-5 w-5 shrink-0 text-brand-light" />{hasWhatsApp() ? <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-white">{SITE.COMPANY_PHONE || SITE.WHATSAPP_NUMBER}</a> : <Ph value="" fallback="[WHATSAPP]" />}</span>
          <span className="flex gap-3"><Icon name="phone" className="h-5 w-5 shrink-0 text-brand-light" />{phoneHref() ? <a href={phoneHref()} className="hover:text-white">{SITE.COMPANY_PHONE}</a> : <Ph value="" fallback="[TELEFONE]" />}</span>
          <span className="flex gap-3"><Icon name="mail" className="h-5 w-5 shrink-0 text-brand-light" />{SITE.COMPANY_EMAIL ? <a href={`mailto:${SITE.COMPANY_EMAIL}`} className="break-all hover:text-white">{SITE.COMPANY_EMAIL}</a> : <Ph value="" fallback="[E-MAIL]" />}</span>
          <span className="flex gap-3"><Icon name="pin" className="h-5 w-5 shrink-0 text-brand-light" /><Ph value={SITE.COMPANY_ADDRESS || `Atendimento em ${SITE.COMPANY_REGION}`} /></span>
          <span className="flex gap-3"><Icon name="clock" className="h-5 w-5 shrink-0 text-brand-light" /><Ph value={SITE.BUSINESS_HOURS} /></span>
        </FootCol>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 <Ph value={SITE.COMPANY_NAME} />. Todos os direitos reservados.</p>
          {!isPlaceholder(SITE.COMPANY_DOCUMENT) && <p>CNPJ {SITE.COMPANY_DOCUMENT}</p>}
        </Container>
      </div>
    </footer>
  );
}
