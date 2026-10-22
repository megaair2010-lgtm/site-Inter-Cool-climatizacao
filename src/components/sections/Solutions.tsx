import { useState } from "react";
import { MEDIA } from "../../data/media";
import { Link } from "../../lib/router";
import { cx } from "../../lib/site-helpers";
import { EquipArt, Icon, Reveal, SectionHead, Container, type ArtName } from "../ui";
import type { IconName } from "../../types";

/* Famílias de sistemas confirmadas pela empresa (ver SERVICES / FAQ em src/data/content.ts). */
const FEATURED = [
  {
    img: "vrfCobertura", slug: "vrf", kicker: "Edifícios comerciais",
    title: "Sistemas VRF / VRV",
    text: "Fluxo de refrigerante variável para edifícios com muitas zonas: instalação, comissionamento, manutenção e diagnóstico de falhas.",
  },
  {
    img: "chiller", slug: "chiller", kicker: "Água gelada",
    title: "Chillers e fancoils",
    text: "Manutenção preventiva e corretiva de centrais de água gelada, com medições, limpeza e relatório técnico.",
  },
  {
    img: "dutoForro", slug: "projetos", kicker: "Projeto e distribuição de ar",
    title: "Dutos e Self Contained",
    text: "Carga térmica, definição do sistema, rede de dutos, grelhas e difusores, com acompanhamento da instalação.",
  },
] as const;

const DIRECT: { art: ArtName; name: string; use: string }[] = [
  { art: "split", name: "Split hi-wall", use: "Salas, escritórios e consultórios" },
  { art: "multi", name: "Multi Split", use: "Vários ambientes com uma única condensadora" },
  { art: "k7", name: "Cassete K7", use: "Lojas, recepções e salas com forro" },
  { art: "pisoteto", name: "Piso-teto", use: "Ambientes amplos e sem forro" },
  { art: "duto", name: "Dutado", use: "Distribuição discreta por grelhas e difusores" },
  { art: "self", name: "Self Contained", use: "Grandes áreas, galpões e auditórios" },
];

const SERVICES: { icon: IconName; title: string; text: string; to: string }[] = [
  { icon: "snow", title: "Instalação", text: "Dimensionamento, tubulação de cobre, vácuo e testes.", to: "/servicos/instalacao" },
  { icon: "calendar", title: "Manutenção preventiva", text: "Plano conforme o uso, medições e relatório.", to: "/servicos/manutencao" },
  { icon: "wrench", title: "Manutenção corretiva", text: "Diagnóstico e orçamento antes do reparo.", to: "/orcamento?servico=manutencao-corretiva" },
  { icon: "spark", title: "Higienização", text: "Filtros, turbina, serpentina e dreno.", to: "/servicos/higienizacao" },
  { icon: "doc", title: "PMOC", text: "Plano, rotinas e registros para uso coletivo.", to: "/servicos/pmoc" },
  { icon: "duct", title: "Projetos HVAC", text: "Do levantamento técnico ao projeto executivo.", to: "/servicos/projetos" },
];

function FeaturePhoto({ imgId, className }: { imgId: string; className?: string }) {
  const m = MEDIA[imgId];
  return (
    <img
      src={m.src}
      width={m.w}
      height={m.h}
      alt={m.alt}
      loading="lazy"
      decoding="async"
      className={cx("absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]", className)}
    />
  );
}

export function Solutions() {
  return (
    <section id="solucoes" className="bg-white py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHead
            eyebrow="Portfólio de soluções"
            title="Sistemas de climatização do residencial ao industrial"
            subtitle="Cada sistema é escolhido pela carga térmica, pelo tipo de ocupação e pela operação do ambiente — não pelo equipamento mais fácil de vender."
          />
          <Link to="/servicos" className="mb-12 hidden items-center gap-2 text-sm font-semibold text-brand hover:gap-3 lg:mb-16 lg:inline-flex">
            Ver todos os serviços
          </Link>
        </div>

        {/* A — Sistemas de maior porte: composição assimétrica */}
        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {FEATURED.map((f, i) => (
            <Reveal
              key={f.slug}
              as="article"
              delay={i * 80}
              className={cx(
                "group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] bg-ink p-6 text-white sm:p-8",
                i === 0 ? "lg:col-span-7 lg:row-span-2 lg:min-h-[560px]" : "lg:col-span-5 lg:min-h-0"
              )}
            >
              <FeaturePhoto imgId={f.img} className="-z-20" />
              {MEDIA[f.img].kind === "ilustrativa" && <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">Imagem ilustrativa</span>}
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(7_22_52/.94)_0%,rgb(7_22_52/.6)_45%,rgb(7_22_52/.15)_100%)]" />
              <p className="text-xs font-semibold text-brand-light">{f.kicker}</p>
              <h3 className={cx("mt-2 font-semibold text-white", i === 0 ? "text-3xl sm:text-4xl" : "text-2xl")}>{f.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200 sm:text-base">{f.text}</p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <Link to={`/servicos/${f.slug}`} className="inline-flex items-center gap-1 text-white underline-offset-4 hover:underline">Detalhes técnicos</Link>
                <Link to={`/orcamento?servico=${f.slug}`} className="inline-flex items-center gap-1 text-brand-light transition hover:gap-2">Solicitar orçamento</Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* B — Expansão direta: lista técnica em vez de grade de cartões iguais */}
        <div className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold text-brand">Expansão direta</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Um equipamento adequado para cada ambiente</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Selecionamos o tipo de evaporadora pela arquitetura do espaço, pelo forro, pela distribuição de ar desejada e pelo ruído aceitável. Instalação com gás R-410A ou R-32.
            </p>
            <Link to="/orcamento?servico=instalacao" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:gap-3">
              Pedir avaliação do ambiente
            </Link>
          </Reveal>
          <ul className="grid sm:grid-cols-2 sm:gap-x-10">
            {DIRECT.map((d) => (
              <li key={d.name} className="spec-row flex items-center gap-4 py-4">
                <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink">
                  <EquipArt name={d.art} className="w-11" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{d.name}</span>
                  <span className="block text-sm text-slate-500">{d.use}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* C — Serviços que sustentam os sistemas */}
        <div className="mt-20 rounded-[var(--radius-panel)] bg-mist p-6 sm:p-10">
          <h3 className="text-lg font-semibold">Serviços em todo o ciclo de vida do sistema</h3>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-steel sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal as="li" key={s.title} delay={(i % 3) * 90} className="bg-white">
                <Link to={s.to} className="group flex h-full items-start gap-4 p-5 transition hover:bg-mist/60">
                  <span className="icon-pop grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name={s.icon} className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold">{s.title} <Icon name="chevron" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand" /></span>
                    <span className="mt-1 block text-sm text-slate-600">{s.text}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
