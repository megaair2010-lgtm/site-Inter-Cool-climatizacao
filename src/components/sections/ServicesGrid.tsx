import { Icon, ImageSlot, Reveal, Section, SectionHead } from "../ui";
import { SERVICES } from "../../data/content";
import { Link } from "../../lib/router";

/* ---------------- Serviços ---------------- */
export function ServicesGrid({ limit }: { limit?: number }) {
  const list = SERVICES.filter((s) => s.active).sort((a, b) => a.order - b.order).slice(0, limit);
  return (
    <Section id="servicos" tone="mist">
      <SectionHead
        eyebrow="Serviços"
        title="Nossas soluções em climatização"
        subtitle="Do projeto à manutenção, oferecemos soluções completas para manter seus ambientes confortáveis, eficientes e seguros."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((s, i) => (
          <Reveal key={s.id} delay={(i % 4) * 70} as="article" className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift">
            <div className="relative aspect-[16/10] overflow-hidden">
              <ImageSlot src={s.image} art={s.art} alt={s.title} hint={s.title} className="transition duration-500 group-hover:scale-[1.04]" />
            </div>
            <div className="relative flex flex-1 flex-col p-6 pt-8">
            <span className="absolute -top-6 left-6 grid h-12 w-12 place-items-center rounded-xl bg-graphite text-brand-light shadow-lift ring-4 ring-white transition group-hover:bg-brand group-hover:text-white">
              <IconFor name={s.icon} />
            </span>
            <h3 className="mt-1 text-lg font-semibold leading-snug">{s.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.short}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm font-semibold">
              <Link to={s.hasPage ? `/servicos/${s.slug}` : `/servicos#${s.slug}`} className="text-graphite transition hover:text-brand">Saiba mais</Link>
              <Link to={`/orcamento?servico=${s.slug}`} className="inline-flex items-center gap-1 text-brand transition hover:gap-2">Solicitar orçamento</Link>
            </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
function IconFor({ name }: { name: Parameters<typeof Icon>[0]["name"] }) {
  return <Icon name={name} className="h-6 w-6" />;
}
