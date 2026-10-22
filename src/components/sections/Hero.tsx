import { SITE } from "../../config/site";
import { useCountUp, useInView } from "../../hooks";
import { Button, Container, Icon, ImageSlot, WhatsAppButton } from "../ui";
import type { IconName } from "../../types";

function Stat({ value, label, suffix = "+" }: { value: number | null; label: string; suffix?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="min-w-0">
      <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
        {value === null ? <span className="ph-mark px-1 text-amber-300" title="Preencha SITE.STATS em src/config/site.ts">[X]</span> : <>{n.toLocaleString("pt-BR")}{suffix}</>}
      </p>
      <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-[72px] text-white">
      {/* fundo técnico discreto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-brand/40 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-brand-sky/20 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-28">
        <div className="reveal is-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
            HVAC · Climatização · Refrigeração
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.6rem]">
            Climatização profissional para ambientes que <span className="text-gradient">exigem excelência.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Instalação, manutenção e soluções completas em HVAC para residências, empresas, comércios e indústrias.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button to="/orcamento" size="lg">Solicitar orçamento</Button>
            <WhatsAppButton size="lg" variant="light">Falar pelo WhatsApp</WhatsAppButton>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {SITE.STATS.projects !== null && <Stat value={SITE.STATS.projects} label="Projetos realizados" />}
            {SITE.STATS.clients !== null && <Stat value={SITE.STATS.clients} label="Clientes atendidos" />}
            {SITE.STATS.years !== null && <Stat value={SITE.STATS.years} label="Anos de experiência" suffix="" />}
            {SITE.HIGHLIGHTS.slice(0, 3 - [SITE.STATS.projects, SITE.STATS.clients, SITE.STATS.years].filter((v) => v !== null).length).map((h) => (
              <div key={h.label} className="min-w-0">
                <dt className="font-display text-xl font-semibold text-white sm:text-2xl">{h.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{h.label}</dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="font-display text-2xl font-semibold text-white sm:text-3xl"><Icon name="shield" className="h-8 w-8 text-brand-light" /></dt>
              <dd className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Atendimento profissional</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1 ring-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
            <ImageSlot src={SITE.IMAGES.hero} dark alt="Chiller de água gelada em cobertura comercial" hint="Foto profissional: técnico HVAC trabalhando em uma instalação moderna de ar-condicionado" art="chiller" />
          </div>
          {/* cartão flutuante */}
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-4 text-graphite shadow-lift sm:left-6 sm:right-auto sm:w-72">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name="receipt" /></span>
              <div>
                <p className="text-sm font-semibold">Orçamento sem compromisso</p>
                <p className="text-xs text-slate-500">Resposta rápida pelo WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const TRUST: { icon: IconName; title: string }[] = [
  { icon: "team", title: "Equipe especializada" },
  { icon: "clock", title: "Atendimento rápido" },
  { icon: "shield", title: "Garantia nos serviços" },
  { icon: "receipt", title: "Orçamento transparente" },
];

export function TrustBar() {
  return (
    <section aria-label="Nossos compromissos" className="border-b border-slate-200 bg-white">
      <Container className="py-10">
        <p className="text-center font-display text-sm font-semibold text-slate-400">
          Qualidade <span className="text-brand-light">•</span> Segurança <span className="text-brand-light">•</span> Eficiência <span className="text-brand-light">•</span> Compromisso
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={t.icon} /></span>
              <span className="text-sm font-semibold leading-snug sm:text-[0.95rem]"><Icon name="check" className="mr-1 hidden h-4 w-4 text-brand sm:inline" strokeWidth={2.4} />{t.title}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
