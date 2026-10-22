import { useRef, useState } from "react";
import { Icon, Reveal, Section, SectionHead } from "../ui";
import { SEGMENTS } from "../../data/content";
import { MEDIA } from "../../data/media";
import { Link } from "../../lib/router";
import { cx } from "../../lib/site-helpers";

/** Foto de cada segmento (fotos da empresa; recortes de apresentação ficam com selo "ilustrativa") */
const PHOTO: Record<string, string> = {
  g1: "hiWall", g2: "vrfCobertura", g3: "chiller", g4: "dutoForro", g5: "rack", g6: "cassete",
};

function SegPhoto({ id, on }: { id: string; on: boolean }) {
  const m = MEDIA[PHOTO[id]];
  return (
    <img
      src={m.src}
      width={m.w}
      height={m.h}
      alt=""
      loading="lazy"
      decoding="async"
      className={cx("seg-photo absolute inset-0 h-full w-full object-cover", on && "is-on")}
    />
  );
}

/* ---------------- Segmentos: vitrine interativa ---------------- */
export function Segments() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const cur = SEGMENTS[active];

  const onKey = (e: React.KeyboardEvent) => {
    const n = SEGMENTS.length;
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (active + 1) % n;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (active - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <Section id="segmentos" tone="dark" className="relative overflow-hidden">
      <div aria-hidden="true" className="float-slow pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand/30 blur-[110px]" />
      <SectionHead dark title="Soluções para cada tipo de ambiente" subtitle="Cada ambiente tem uma necessidade de conforto térmico, qualidade do ar e disponibilidade. Nossa equipe adapta a solução a cada caso." />
      <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10">
        <div role="tablist" aria-label="Segmentos atendidos" aria-orientation="vertical" onKeyDown={onKey} className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {SEGMENTS.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => { tabs.current[i] = el; }}
              role="tab"
              id={`seg-tab-${s.id}`}
              aria-selected={i === active}
              aria-controls="seg-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onMouseEnter={() => window.matchMedia?.("(hover: hover)").matches && setActive(i)}
              className="seg-tab flex min-h-14 shrink-0 items-center gap-4 rounded-2xl border border-white/15 px-5 text-left text-white hover:border-white/40 lg:w-full"
            >
              <Icon name={s.icon} className="h-5 w-5 shrink-0 text-brand-light" />
              <span className="font-semibold">{s.title}</span>
            </button>
          ))}
        </div>

        <div id="seg-panel" role="tabpanel" aria-labelledby={`seg-tab-${cur.id}`} className="relative isolate min-h-[26rem] overflow-hidden rounded-[var(--radius-panel)] bg-graphite lg:min-h-[30rem]">
          {SEGMENTS.map((s, i) => <SegPhoto key={s.id} id={s.id} on={i === active} />)}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(7_22_52/.95)_0%,rgb(7_22_52/.55)_45%,rgb(7_22_52/.1)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <h3 key={cur.id} className="hero-title font-display text-3xl font-semibold text-white sm:text-4xl">{cur.title}</h3>
            <p key={`p-${cur.id}`} className="hero-text mt-3 max-w-lg text-lg text-slate-200">{cur.text}</p>
            <Link to={`/orcamento?segmento=${cur.id}`} className="btn-primary btn-shine mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-control)] px-6 font-semibold">Solicitar orçamento</Link>
          </div>
          {MEDIA[PHOTO[cur.id]].kind === "ilustrativa" && <span className="absolute right-4 top-4 rounded-md bg-black/45 px-2 py-0.5 text-xs text-white/85 backdrop-blur">Imagem ilustrativa</span>}
        </div>
      </Reveal>
    </Section>
  );
}
