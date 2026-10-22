import { useRef, useState } from "react";
import { ImageSlot, Section, SectionHead } from "../ui";
import { SITE } from "../../config/site";
import { BEFORE_AFTER } from "../../data/content";

/* ---------------- Antes e depois ---------------- */
function Compare({ title, before, after }: { title: string; before?: string; after?: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div
        ref={box}
        className="relative aspect-[4/3] cursor-ew-resize select-none touch-pan-y"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
        onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
      >
        {!before && !after ? (
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="bg-gradient-to-br from-graphite to-ink" />
            <div className="bg-gradient-to-br from-mist to-white" />
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="rounded-xl bg-white/95 px-4 py-3 shadow-soft">
                <p className="text-xs font-semibold text-slate-600">Fotos de antes e depois do serviço</p>
                <span className="ph-mark mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-amber-600">Espaço para foto real</span>
              </div>
            </div>
          </div>
        ) : (<>
        <div className="absolute inset-0"><ImageSlot src={after} alt={`Depois: ${title}`} hint="Foto DEPOIS do serviço" /></div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <ImageSlot src={before} dark alt={`Antes: ${title}`} hint="Foto ANTES do serviço" />
        </div>
        <span className="absolute left-3 top-3 rounded-md bg-ink/85 px-2 py-1 text-xs font-bold text-white">Antes</span>
        <span className="absolute right-3 top-3 rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">Depois</span>
        <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-graphite shadow-lift">⇆</span>
        </div>
        </>)}
        <input type="range" min={4} max={96} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label={`Comparar antes e depois: ${title}`} className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0" />
      </div>
      <figcaption className="p-5 text-sm font-semibold">{title}</figcaption>
    </figure>
  );
}

export function BeforeAfterSection() {
  // Só aparece com fotos reais de antes/depois (ou no modo edição)
  if (!SITE.SHOW_PLACEHOLDERS && !BEFORE_AFTER.some((b) => b.before && b.after)) return null;
  return (
    <Section>
      <SectionHead eyebrow="Antes e depois" title="Veja a diferença de um serviço profissional" subtitle="Arraste a barra para comparar." />
      <div className="grid gap-6 md:grid-cols-3">
        {BEFORE_AFTER.map((b) => <Compare key={b.id} title={b.title} before={b.before} after={b.after} />)}
      </div>
    </Section>
  );
}
