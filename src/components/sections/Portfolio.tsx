import { useState } from "react";
import { Button, Icon, ImageSlot, Section, SectionHead } from "../ui";
import { PROJECTS, PROJECT_FILTERS } from "../../data/content";
import { cx } from "../../lib/site-helpers";
import type { Project } from "../../types";

/* ---------------- Portfólio ---------------- */
function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.03]">
          <ImageSlot src={p.image} art={p.art} alt={p.title} hint={`Foto do projeto: ${p.title}`} />
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">{p.serviceType}</span>
          {p.location && <span className="inline-flex items-center gap-1 text-slate-500"><Icon name="pin" className="h-3.5 w-3.5" />{p.location}</span>}
          {p.isPlaceholder && <span className="ph-mark px-1.5 py-0.5 text-amber-600">Exemplo</span>}
        </div>
        <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
        <p className={cx("mt-2 text-sm leading-relaxed text-slate-600", p.isPlaceholder && "italic")}>{p.description}</p>
      </div>
    </article>
  );
}

export function Portfolio({ full }: { full?: boolean }) {
  const [filter, setFilter] = useState<string>("todos");
  const list = PROJECTS.filter((p) => filter === "todos" || p.categories.includes(filter as never)).slice(0, full ? undefined : 6);
  return (
    <Section id="projetos" tone="mist">
      <SectionHead eyebrow="Portfólio" title="Soluções que executamos" subtitle="Tipos de instalação, manutenção e projeto que a nossa equipe realiza no dia a dia." />
      <div role="tablist" aria-label="Filtrar projetos" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {PROJECT_FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={cx("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition", filter === f.id ? "border-graphite bg-graphite text-white" : "border-slate-300 bg-white text-slate-600 hover:border-graphite")}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <ProjectCard key={p.id} p={p} />)}
        {list.length === 0 && <p className="text-slate-500">Nenhum projeto nesta categoria ainda.</p>}
      </div>
      {!full && (
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Button to="/projetos" variant="secondary" size="lg">Ver todos os projetos</Button>
          <Button to="/orcamento" variant="ghost" size="lg">Solicitar orçamento</Button>
        </div>
      )}
    </Section>
  );
}
