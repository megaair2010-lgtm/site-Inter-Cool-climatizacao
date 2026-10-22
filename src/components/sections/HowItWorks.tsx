import { useEffect, useRef, useState } from "react";
import { Container } from "../ui";
import { cx } from "../../lib/site-helpers";

/**
 * "Ar-condicionado em funcionamento"
 * - Vídeo real (Pexels License: uso comercial gratuito, sem crédito obrigatório — https://www.pexels.com/license/).
 *   Não retrata obra da Inter-Cool: exibido como "Vídeo ilustrativo". Troque `VIDEO` por um vídeo próprio quando houver.
 * - Animação SVG própria do ciclo de um sistema Split (evaporadora → tubulação de cobre → condensadora).
 * Movimento: toca só quando visível, tem botão de pausa e respeita prefers-reduced-motion.
 */
const VIDEO = {
  src: "https://videos.pexels.com/video-files/11503031/11503031-hd_1920_1080_30fps.mp4",
  poster: "https://images.pexels.com/videos/11503031/air-conditioner-air-conditioning-aircon-finger-11503031.jpeg?auto=compress&w=1260&h=750&dpr=1",
  label: "Vídeo: mão ligando um ar-condicionado pelo painel do aparelho",
  credit: { name: "Rafael Alberto Gutierrez Bravo", url: "https://www.pexels.com/video/finger-turning-on-air-conditioning-11503031/" },
};

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

function useInViewport<T extends Element>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const PlayIcon = ({ playing }: { playing: boolean }) =>
  playing ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
  );

function AcVideo() {
  const reduced = useReducedMotion();
  const { ref, visible } = useInViewport<HTMLDivElement>(0.5);
  const video = useRef<HTMLVideoElement>(null);
  const [userPaused, setUserPaused] = useState<boolean | null>(null); // null = usuário ainda não decidiu
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const shouldPlay = visible && (userPaused === false || (userPaused === null && !reduced));

  useEffect(() => {
    const v = video.current;
    if (!v || failed) return;
    if (shouldPlay) {
      if (v.preload === "none") v.preload = "auto";
      v.play().catch(() => setPlaying(false));
    } else v.pause();
  }, [shouldPlay, failed]);

  return (
    <figure ref={ref} className="relative overflow-hidden rounded-[var(--radius-panel)] bg-ink">
      <div className="relative aspect-video">
        {failed ? (
          // Reserva: se o vídeo não carregar, mostra uma foto local do equipamento
          <img src="/images/split.webp" alt="Ar-condicionado split instalado em ambiente interno" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO.src}
            poster={VIDEO.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label={VIDEO.label}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          />
        )}
        {!failed && (
          <button
            type="button"
            onClick={() => (playing ? (setUserPaused(true), video.current?.pause()) : (setUserPaused(false), video.current?.play()))}
            className="absolute bottom-3 left-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink/75 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-ink"
            aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
          >
            <PlayIcon playing={playing} /> {playing ? "Pausar" : "Reproduzir"}
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-400">
        <span>Equipamento em operação.</span>
        {failed ? <span>Imagem ilustrativa</span> : <a href={VIDEO.credit.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Vídeo ilustrativo: {VIDEO.credit.name} / Pexels
        </a>}
      </figcaption>
    </figure>
  );
}

/** Ilustração animada do ciclo de refrigeração de um Split */
function SplitCycle() {
  const { ref, visible } = useInViewport<HTMLDivElement>(0.2);
  const [paused, setPaused] = useState(false);
  return (
    <div ref={ref} className={cx("cycle relative overflow-hidden rounded-[var(--radius-panel)] bg-ink", (!visible || paused) && "is-paused")}>
      <svg viewBox="0 0 640 400" role="img" aria-labelledby="cycle-title cycle-desc" className="block h-auto w-full">
        <title id="cycle-title">Como funciona um ar-condicionado Split</title>
        <desc id="cycle-desc">
          A evaporadora, dentro do ambiente, retira o calor do ar e devolve ar frio. O fluido refrigerante leva esse calor pela tubulação de cobre até a condensadora, na área externa, onde o ventilador o libera para fora.
        </desc>
        <defs>
          <linearGradient id="cy-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0E2552" />
            <stop offset="1" stopColor="#0A1C40" />
          </linearGradient>
          <linearGradient id="cy-unit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#D9E2EF" />
          </linearGradient>
          <linearGradient id="cy-cond" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9EEF5" />
            <stop offset="1" stopColor="#B9C5D6" />
          </linearGradient>
        </defs>

        {/* Ambiente interno x externo */}
        <rect x="0" y="0" width="390" height="400" fill="url(#cy-wall)" />
        <rect x="390" y="0" width="250" height="400" fill="#071634" />
        <rect x="386" y="0" width="8" height="400" fill="#1B3A72" />
        <text className="cy-label" x="20" y="30" fill="#8FB4E8" fontSize="13" fontWeight="600">Ambiente interno</text>
        <text className="cy-label" x="410" y="30" fill="#8FB4E8" fontSize="13" fontWeight="600">Área externa</text>

        {/* Evaporadora (hi-wall) */}
        <g>
          <rect x="60" y="62" width="250" height="74" rx="14" fill="url(#cy-unit)" />
          <rect x="72" y="118" width="226" height="8" rx="4" fill="#AEBBD0" />
          <circle cx="282" cy="84" r="3.5" fill="#22C55E" className="cy-led" />
          <text x="236" y="99" fill="#1E55B0" fontSize="15" fontWeight="700">22°</text>
        </g>
        {/* Ar frio saindo */}
        <g className="cy-cold" stroke="#7FD4F0" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M90 140 C 95 170, 75 195, 85 230" />
          <path d="M140 140 C 145 175, 125 205, 135 245" />
          <path d="M190 140 C 195 175, 175 205, 185 245" />
          <path d="M240 140 C 245 170, 225 195, 235 230" />
        </g>
        <g fill="#BFE9F7" className="cy-flakes">
          <circle cx="110" cy="200" r="2.5" /><circle cx="165" cy="215" r="2" /><circle cx="215" cy="205" r="2.5" /><circle cx="140" cy="250" r="2" />
        </g>
        <text className="cy-label" x="60" y="290" fill="#FFFFFF" fontSize="15" fontWeight="600">1. Evaporadora</text>
        <text className="cy-label" x="60" y="310" fill="#9DB3D6" fontSize="12.5">retira o calor do ar e devolve ar frio</text>

        {/* Tubulação de cobre: linha de líquido e de sucção */}
        <path id="cy-pipe-a" d="M300 100 H 360 V 300 H 470" fill="none" stroke="#B87333" strokeWidth="7" strokeLinejoin="round" />
        <path d="M300 112 H 348 V 312 H 470" fill="none" stroke="#B87333" strokeWidth="7" strokeLinejoin="round" opacity=".8" />
        <path d="M300 100 H 360 V 300 H 470" fill="none" stroke="#FFB27A" strokeWidth="3" strokeDasharray="6 14" className="cy-flow-hot" />
        <path d="M470 312 H 348 V 112 H 300" fill="none" stroke="#7FD4F0" strokeWidth="3" strokeDasharray="6 14" className="cy-flow-cold" />
        <text className="cy-label" x="214" y="352" fill="#FFFFFF" fontSize="15" fontWeight="600">2. Tubulação de cobre</text>
        <text className="cy-label" x="214" y="372" fill="#9DB3D6" fontSize="12.5">o fluido refrigerante transporta o calor</text>

        {/* Condensadora */}
        <g>
          <rect x="470" y="230" width="140" height="120" rx="10" fill="url(#cy-cond)" />
          <circle cx="540" cy="290" r="44" fill="#1A2C4E" />
          <circle cx="540" cy="290" r="44" fill="none" stroke="#8C9BB3" strokeWidth="2" />
          <g className="cy-fan" style={{ transformOrigin: "540px 290px" }} fill="#C9D4E5">
            <path d="M540 290 C 528 268, 532 254, 544 250 C 552 262, 548 278, 540 290 Z" />
            <path d="M540 290 C 528 268, 532 254, 544 250 C 552 262, 548 278, 540 290 Z" transform="rotate(120 540 290)" />
            <path d="M540 290 C 528 268, 532 254, 544 250 C 552 262, 548 278, 540 290 Z" transform="rotate(240 540 290)" />
            <circle cx="540" cy="290" r="6" fill="#8C9BB3" />
          </g>
        </g>
        {/* Calor liberado */}
        <g className="cy-heat" stroke="#FF9A5C" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M520 220 C 515 205, 528 195, 522 180" />
          <path d="M545 218 C 540 200, 553 190, 547 172" />
          <path d="M570 220 C 565 205, 578 195, 572 180" />
        </g>
        <text className="cy-label" x="460" y="120" fill="#FFFFFF" fontSize="15" fontWeight="600">3. Condensadora</text>
        <text className="cy-label" x="460" y="140" fill="#9DB3D6" fontSize="12.5">libera o calor para fora</text>
      </svg>
      <div className="flex justify-end border-t border-white/10 p-3">
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink/75 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-ink"
      >
        <PlayIcon playing={!paused} /> {paused ? "Retomar animação" : "Pausar animação"}
      </button>
      </div>
      <ol className="grid gap-3 border-t border-white/10 p-5 text-sm sm:hidden">
        <li><span className="font-semibold text-white">1. Evaporadora</span> <span className="text-slate-300">retira o calor do ar e devolve ar frio ao ambiente.</span></li>
        <li><span className="font-semibold text-white">2. Tubulação de cobre</span> <span className="text-slate-300">leva o fluido refrigerante com o calor.</span></li>
        <li><span className="font-semibold text-white">3. Condensadora</span> <span className="text-slate-300">libera o calor na área externa.</span></li>
      </ol>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="funcionamento" aria-labelledby="funcionamento-titulo" className="bg-mist py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="max-w-3xl">
          <h2 id="funcionamento-titulo" className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">Ar-condicionado em funcionamento</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Um sistema bem dimensionado e instalado entrega ar frio de forma estável e silenciosa. Veja o equipamento em operação e entenda o caminho do calor dentro de um Split.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AcVideo />
          <SplitCycle />
        </div>
      </Container>
    </section>
  );
}
