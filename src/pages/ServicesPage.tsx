import { PageHero } from "../components/layout/PageHero";
import { CtaBand } from "../components/sections/CtaBand";
import { Button, Icon, ImageSlot, Reveal, Section } from "../components/ui";
import { SERVICES } from "../data/content";
import { useSeo } from "../hooks";

export function ServicesPage() {
  useSeo("Serviços de climatização e HVAC", "Instalação, manutenção preventiva e corretiva, higienização, PMOC, VRF/VRV, chillers, fancoils e projetos HVAC em todo o estado de São Paulo.", "/servicos");
  return (
    <>
      <PageHero eyebrow="Serviços" title="Nossas soluções em climatização" text="Do projeto à manutenção, oferecemos soluções completas para manter seus ambientes confortáveis, eficientes e seguros." crumbs={[{ to: "/", label: "Início" }, { label: "Serviços" }]} />
      <Section>
        <div className="grid gap-6">
          {SERVICES.filter((s) => s.active).map((s, i) => (
            <Reveal key={s.id} as="article" className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:grid-cols-[220px_1fr_auto] md:items-center md:p-6" >
              <div id={s.slug} className="aspect-[16/10] overflow-hidden rounded-2xl md:aspect-square"><ImageSlot src={s.image} art={s.art} alt={s.title} hint={s.title} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{s.title}</h2>
                <p className="mt-2 text-slate-600">{s.description}</p>
                <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {s.bullets.map((b) => <li key={b} className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.2} />{b}</li>)}
                </ul>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                {s.hasPage && <Button to={`/servicos/${s.slug}`} variant="ghost">Saiba mais</Button>}
                <Button to={`/orcamento?servico=${s.slug}`}>Solicitar orçamento</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
