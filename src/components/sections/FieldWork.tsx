import { useEffect, useRef, useState } from "react";
import { Reveal, SectionHead, Section } from "../ui";
import { GALLERY, OBRA_VIDEO, type Media } from "../../data/media";
import { cx } from "../../lib/site-helpers";
import { Link } from "../../lib/router";

/** "Em campo": vídeo de instalação + galeria com ampliação (dialog nativo). */
export function FieldWork() {
  const [open, setOpen] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const show = (i: number, el: HTMLElement) => { opener.current = el; setOpen(i); };
  const close = () => { setOpen(null); opener.current?.focus(); };
  const step = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + GALLERY.length) % GALLERY.length));
  const cur: Media | null = open === null ? null : GALLERY[open];

  return (
    <Section id="em-campo" tone="mist">
      <SectionHead
        title="Em campo: equipamentos e instalações"
        subtitle="Registros de instalações e equipamentos com os quais trabalhamos — de splits a sistemas VRF, redes de dutos e infraestrutura frigorígena."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-stretch">
        <Reveal>
          <figure className="overflow-hidden rounded-[var(--radius-panel)] bg-ink shadow-soft">
            <video
              controls
              muted
              playsInline
              preload="none"
              poster={OBRA_VIDEO.poster}
              width={OBRA_VIDEO.w}
              height={OBRA_VIDEO.h}
              aria-label="Vídeo: instalação de rede de dutos de ar-condicionado"
              className="block aspect-[816/464] h-auto w-full bg-ink object-cover"
            >
              <source src={OBRA_VIDEO.webm} type="video/webm" />
              <source src={OBRA_VIDEO.mp4} type="video/mp4" />
              Seu navegador não reproduz vídeo.
            </video>
            <figcaption className="px-5 py-4 text-sm text-slate-300">Instalação de rede de dutos, em vídeo (sem áudio).</figcaption>
          </figure>
        </Reveal>

        <Reveal delay={80} className="flex flex-col justify-center">
          <p className="text-xs font-semibold text-brand">Como trabalhamos</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Instalação organizada, do projeto ao teste</h3>
          <p className="mt-4 leading-relaxed text-slate-600">
            Tubulação isolada, dutos bem fixados, drenos testados e acabamento limpo. Cada etapa é conferida antes de entregar o sistema em funcionamento.
          </p>
          <Link to="/orcamento" className="btn-primary btn-shine mt-6 inline-flex min-h-12 w-fit items-center rounded-[var(--radius-control)] px-6 font-semibold">Solicitar orçamento</Link>
        </Reveal>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {GALLERY.map((m, i) => (
          <Reveal as="li" key={m.id} delay={(i % 4) * 60}>
            <button
              type="button"
              onClick={(e) => show(i, e.currentTarget)}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={`Ampliar foto: ${m.caption}`}
            >
              <img src={m.src} width={m.w} height={m.h} alt={m.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-left text-xs font-medium text-white sm:text-sm">{m.caption}</span>
            </button>
          </Reveal>
        ))}
      </ul>

      <dialog
        ref={dlg}
        onClose={() => setOpen(null)}
        onCancel={(e) => { e.preventDefault(); close(); }}
        onClick={(e) => { if (e.target === dlg.current) close(); }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); }}
        aria-label="Foto ampliada"
        className="m-auto max-h-[92dvh] w-[min(94vw,1000px)] rounded-2xl bg-ink p-0 text-white backdrop:bg-black/80"
      >
        {cur && (
          <div className="relative">
            <img src={cur.src} alt={cur.alt} className="mx-auto block max-h-[78dvh] w-auto max-w-full object-contain" />
            <p className="px-5 py-3 text-center text-sm text-slate-200">{cur.caption}</p>
            <button type="button" onClick={close} aria-label="Fechar" className={cx("absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80")}>×</button>
            <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-2xl hover:bg-black/80">‹</button>
            <button type="button" onClick={() => step(1)} aria-label="Próxima foto" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-2xl hover:bg-black/80">›</button>
          </div>
        )}
      </dialog>
    </Section>
  );
}
