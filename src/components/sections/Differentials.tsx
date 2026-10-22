import { Button, Icon, Ph, Reveal, Section, SectionHead, WhatsAppButton } from "../ui";
import { SITE } from "../../config/site";
import { DIFFERENTIALS } from "../../data/content";

/* ---------------- Diferenciais ---------------- */
export function Differentials() {
  return (
    <Section tone="dark" className="relative overflow-hidden">
      <div aria-hidden="true" className="float-slow pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/30 blur-[100px]" />
      <div aria-hidden="true" className="float-slower pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-sky/20 blur-[100px]" />
      <SectionHead dark eyebrow="Diferenciais" title={<>Por que escolher a <Ph value={SITE.COMPANY_NAME} />?</>} />
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIALS.map((d, i) => (
          <Reveal key={d.n} delay={(i % 3) * 80} className="group bg-ink p-8 transition-colors duration-300 hover:bg-graphite">
            <span className="icon-pop inline-block"><Icon name={d.icon} className="h-6 w-6 text-brand-light" /></span>
            <h3 className="mt-6 text-lg font-semibold text-white">{d.title}</h3>
            <p className="mt-2 text-slate-400">{d.text}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button to="/orcamento" size="lg">Solicitar orçamento</Button>
        <WhatsAppButton size="lg" variant="light">Falar no WhatsApp</WhatsAppButton>
      </div>
    </Section>
  );
}
