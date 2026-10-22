import { useEffect, useRef, useState } from "react";
import { HERO_SLIDES } from "../../data/hero";
import { SITE } from "../../config/site";
import { Link } from "../../lib/router";
import { trackEvent } from "../../lib/analytics";

/**
 * Hero com vídeo de fundo em loop (animação própria da Inter-Cool, 10 s, sem áudio).
 * Regras: toca sem som, pausa fora da tela / aba oculta / prefers-reduced-motion e tem botão de pausa (WCAG 2.2.2).
 * Fonte do vídeo: public/video/hero.mp4 · pôster: public/images/hero-poster.webp
 */
const VIDEO_WEBM = "/video/hero.webm";
const VIDEO_MP4 = "/video/hero.mp4";
const POSTER = "/images/hero-poster.webp";

function useReducedMotion() {
  const [r, setR] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

export function HeroVideo() {
  const lead = HERO_SLIDES[0];
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [offscreen, setOffscreen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  const wants = userPaused === null ? !reduced : !userPaused;
  const shouldPlay = wants && !offscreen && !hidden;
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (shouldPlay) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [shouldPlay]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (playing) { setUserPaused(true); v.pause(); } else { setUserPaused(false); v.play().catch(() => {}); }
  };

  return (
    <section ref={section} aria-label="Apresentação da Inter-Cool" className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 -z-10">
        <video
          ref={video}
          className="hero-video absolute inset-0 h-full w-full object-cover"
          poster={POSTER}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>
        <div className="hero-scrim absolute inset-0" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[var(--content-max)] flex-1 flex-col justify-center px-4 pb-36 pt-28 sm:px-6 sm:pb-44 sm:pt-32 lg:px-8 lg:pb-48">
        <h1 className="hero-kicker max-w-xl text-sm font-medium leading-snug text-brand-light sm:text-base">
          {SITE.COMPANY_NAME}: climatização e engenharia HVAC para empresas, indústrias e residências em {SITE.COMPANY_STATE === "SP" ? "todo o estado de São Paulo" : SITE.COMPANY_REGION}
        </h1>
        <div className="mt-6 max-w-[46rem]">
          <h2 className="hero-title font-display text-[2.15rem] font-semibold leading-[1.06] tracking-[-0.02em] text-white sm:text-5xl lg:text-[4rem]">{lead.title}</h2>
          <p className="hero-text mt-5 max-w-[36rem] text-base leading-relaxed text-slate-200 sm:text-lg">{lead.text}</p>
        </div>
        <div className="hero-cta mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/orcamento" onClick={() => trackEvent("cta_click", { place: "hero", cta: "orcamento" })} className="btn-primary btn-shine inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-control)] px-7 text-[0.95rem] font-semibold">
            Solicitar orçamento
          </Link>
          <Link to="/#solucoes" onClick={() => trackEvent("cta_click", { place: "hero", cta: "solucoes" })} className="inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-control)] border border-white/30 px-7 text-[0.95rem] font-semibold text-white transition hover:border-white hover:bg-white/10">
            Conhecer soluções
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-[var(--content-max)] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 border-t border-white/15 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pr-24 lg:pr-48 min-[1760px]:pr-0">
            <ul className="hidden grid-cols-2 gap-x-8 text-sm text-slate-200 sm:grid lg:grid-cols-3">
              {HERO_SLIDES.map((s) => (
                <li key={s.id}>
                  <Link to={`/orcamento?servico=${s.service}`} className="inline-flex min-h-11 items-center transition hover:text-white hover:underline underline-offset-4">{s.tag}</Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-xs text-slate-300">Imagens e vídeo da empresa</span>
              <button type="button" onClick={toggle} className="hero-ctrl" aria-label={playing ? "Pausar animação de fundo" : "Reproduzir animação de fundo"}>
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
