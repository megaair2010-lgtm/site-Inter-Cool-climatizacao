import { Button, Reveal, Section, SectionHead } from "../ui";
import { PROCESS } from "../../data/content";

/* ---------------- Processo ---------------- */
export function Process() {
  return (
    <Section>
      <SectionHead eyebrow="Como funciona" title="Processo de atendimento" subtitle="Simples, transparente e com você informado em cada etapa." />
      <ol className="relative grid gap-6 md:grid-cols-4">
        <Reveal className="absolute left-0 right-0 top-7 hidden md:block"><div aria-hidden="true" className="draw-line h-0.5 bg-gradient-to-r from-brand/0 via-brand/60 to-brand/0" /></Reveal>
        {PROCESS.map((p, i) => (
          <Reveal as="li" key={p.n} delay={i * 100} className="relative">
            <span className="lift relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-graphite font-display text-lg font-semibold text-brand-light shadow-lift">{p.n}</span>
            <h3 className="mt-5 text-base font-semibold">{p.title}</h3>
            <p className="mt-2 text-slate-600">{p.text}</p>
          </Reveal>
        ))}
      </ol>
      <div className="mt-12">
        <Button to="/orcamento" size="lg">Solicitar orçamento</Button>
      </div>
    </Section>
  );
}
