import { PageHero } from "../components/layout/PageHero";
import { CtaBand } from "../components/sections/CtaBand";
import { QuoteForm } from "../components/sections/QuoteForm";
import { Button, Icon, Reveal, Section, SectionHead, WhatsAppButton } from "../components/ui";
import type { IconName } from "../types";
import { MEDIA, type Media } from "../data/media";
import { SITE } from "../config/site";
import { Link } from "../lib/router";
import { useSeo } from "../hooks";

/**
 * Página interna para construtoras, incorporadoras, engenharias e arquitetos.
 * Usa o cabeçalho, o rodapé e os componentes do site. Conteúdo próprio:
 * perfil de cliente de obra, sistemas de grande porte, etapas de execução e entrega técnica.
 * Só fatos confirmados (ver docs/captacao/marca.md): nada de números, clientes ou prazos.
 */

const PUBLICOS: { icon: IconName; title: string; text: string; ask: string }[] = [
  {
    icon: "building",
    title: "Construtoras e incorporadoras",
    text: "Infraestrutura de climatização por pavimento (tubulação frigorígena, drenos e pontos de comando), áreas comuns, lojas e unidades entregues com equipamento instalado.",
    ask: "Envie o memorial ou o projeto de climatização para cotação.",
  },
  {
    icon: "doc",
    title: "Engenharias e gerenciadoras",
    text: "Subcontratação de climatização em obras corporativas, fit-out e retrofit, com equipe técnica própria e escopo fechado em proposta por escrito.",
    ask: "Inclua a Inter-Cool na concorrência de climatização da próxima obra.",
  },
  {
    icon: "spark",
    title: "Escritórios de arquitetura",
    text: "Compatibilização ainda no projeto: escolha entre cassete, dutado ou piso-teto, posição de condensadoras, rede de dutos, grelhas e acesso para manutenção.",
    ask: "Tenha um contato técnico de climatização durante o desenvolvimento do projeto.",
  },
  {
    icon: "factory",
    title: "Obras comerciais e industriais",
    text: "Lojas, escritórios, clínicas, galpões e áreas de produção com sistemas dimensionados para a carga térmica real e manutenção recorrente depois da entrega.",
    ask: "Peça o levantamento técnico do ambiente.",
  },
];

const SISTEMAS: { icon: IconName; title: string; text: string }[] = [
  { icon: "vrf", title: "VRF / VRV", text: "Condensadoras em cobertura ou área técnica atendendo vários ambientes com controle individual. Indicado para prédios comerciais e áreas comuns." },
  { icon: "snow", title: "Chiller e fancoil", text: "Sistemas de água gelada para grandes áreas e cargas térmicas elevadas, com fancoils distribuídos pelos pavimentos." },
  { icon: "building", title: "Self Contained", text: "Equipamentos de grande capacidade para áreas abertas, com insuflamento por rede de dutos." },
  { icon: "duct", title: "Redes de dutos e difusão", text: "Dutos, grelhas e difusores dimensionados para vazão, ruído e distribuição uniforme do ar." },
  { icon: "tool", title: "Infraestrutura frigorígena", text: "Tubulação de cobre isolada, drenos com caimento e passagens previstas antes do fechamento do forro." },
  { icon: "fan", title: "Cassete, piso-teto e dutado", text: "Evaporadoras escolhidas conforme forro, pé-direito e projeto de interiores." },
];

const ETAPAS: { title: string; text: string }[] = [
  { title: "Análise do projeto", text: "Leitura de plantas, memorial e cronograma da obra. Visita técnica quando necessário." },
  { title: "Compatibilização e carga térmica", text: "Cálculo por ambiente, escolha do sistema e conferência de interferências com elétrica, estrutura e forro." },
  { title: "Proposta por escrito", text: "Escopo, solução e condições claras. Nada é executado sem aprovação." },
  { title: "Infraestrutura", text: "Tubulação frigorígena, drenos, rede de dutos e pontos de comando na fase certa da obra." },
  { title: "Montagem dos equipamentos", text: "Instalação de condensadoras, evaporadoras, fancoils e acessórios conforme projeto." },
  { title: "Comissionamento e entrega técnica", text: "Testes de estanqueidade, vácuo, carga de fluido e funcionamento, com orientação para a manutenção e o PMOC." },
];

const ENTREGA = [
  "Relação dos equipamentos instalados e suas localizações",
  "Registro dos testes de funcionamento realizados",
  "Orientação de operação para a equipe do cliente",
  "Plano de manutenção preventiva e PMOC (Lei 13.589/2018) quando aplicável",
  "Atendimento de manutenção depois da entrega",
];

const FOTOS: Media[] = [MEDIA.vrfCobertura, MEDIA.dutoForro, MEDIA.rack, MEDIA.dutoGrelha, MEDIA.cassete, MEDIA.pisoTeto];

const WHATS_MSG = "Olá, Inter-Cool! Tenho uma obra e quero cotar a climatização.";

export function ObrasPage() {
  useSeo(
    "Climatização para obras, construtoras e projetos corporativos",
    "Instalação de VRF, chiller, Self Contained e redes de dutos para construtoras, incorporadoras, engenharias e arquitetos em São Paulo e região metropolitana.",
    "/obras"
  );
  return (
    <>
      <PageHero
        eyebrow="Obras e projetos"
        title="Climatização para obras comerciais, industriais e corporativas"
        text={`Da compatibilização do projeto à entrega técnica: instalamos sistemas de grande porte para construtoras, incorporadoras, engenharias e escritórios de arquitetura em ${SITE.COMPANY_REGION}.`}
        crumbs={[{ to: "/", label: "Início" }, { label: "Obras" }]}
      />

      <Section tone="white">
        <div className="-mt-4 flex flex-col gap-3 sm:flex-row">
          <Button to="/obras#orcamento-obra" size="lg" icon="doc">Enviar projeto para cotação</Button>
          <WhatsAppButton size="lg" variant="ghost" message={WHATS_MSG}>Falar sobre uma obra</WhatsAppButton>
        </div>

        <div className="mt-16">
          <SectionHead title="Para quem trabalhamos em obra" subtitle="Cada tipo de contratante precisa de algo diferente da climatização. Atuamos como fornecedor técnico dentro do cronograma de quem conduz a obra." />
          <div className="grid gap-6 md:grid-cols-2">
            {PUBLICOS.map((p, i) => (
              <Reveal as="article" key={p.title} delay={i * 80} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand"><Icon name={p.icon} className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-slate-600">{p.text}</p>
                <p className="mt-4 text-sm font-semibold text-graphite">{p.ask}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="mist">
        <SectionHead title="Sistemas de grande porte que instalamos" subtitle="Escolhemos o sistema pela carga térmica, pelo uso do edifício e pela rotina de manutenção, não por catálogo." />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SISTEMAS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 60} className="flex gap-4 rounded-2xl bg-white p-6 shadow-soft">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-graphite text-brand-light"><Icon name={s.icon} className="h-5 w-5" /></span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="white">
        <SectionHead title="Como entramos na obra" subtitle="Etapas de execução alinhadas ao cronograma da construtora ou da gerenciadora." />
        <ol className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {ETAPAS.map((e, i) => (
            <Reveal as="li" key={e.title} delay={i * 70} className="border-t-2 border-graphite pt-5">
              <span className="font-display text-sm font-semibold text-brand">Etapa {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{e.title}</h3>
              <p className="mt-2 text-slate-600">{e.text}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section tone="dark">
        <SectionHead dark title="Registros de obra" subtitle="Fotos de instalações em campo: infraestrutura, dutos, centrais de compressores e equipamentos instalados." />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {FOTOS.map((f, i) => (
            <Reveal key={f.id} delay={i * 60}>
              <figure className="overflow-hidden rounded-2xl bg-ink">
                <img src={f.src} alt={f.alt} width={f.w} height={f.h} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-4 py-3 text-sm text-slate-300">{f.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-400">Mais registros na página de <Link to="/projetos" className="underline hover:text-white">projetos</Link>.</p>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <SectionHead title="O que fica com você na entrega técnica" subtitle="A obra termina com o sistema testado e com a informação necessária para operar e manter." />
            <ul className="-mt-4 grid gap-3">
              {ENTREGA.map((t) => (
                <li key={t} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white"><Icon name="check" className="h-4 w-4" strokeWidth={2.4} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="rounded-3xl bg-graphite p-8 text-white">
            <p className="text-sm text-slate-300">Área de atendimento</p>
            <p className="mt-2 font-display text-2xl font-semibold">{SITE.COMPANY_REGION}</p>
            <p className="mt-4 text-slate-300">Obras em outras cidades são avaliadas conforme o porte e o escopo do projeto. Atendimento de segunda a sexta, das 8h25 às 17h30.</p>
            <WhatsAppButton className="mt-6" message={WHATS_MSG}>Consultar disponibilidade</WhatsAppButton>
          </Reveal>
        </div>
      </Section>

      <Section id="orcamento-obra" tone="mist">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionHead title="Envie sua obra para cotação" subtitle="Informe o tipo de obra e o que precisa. Planta, memorial ou fotos ajudam a agilizar a análise técnica." />
            <ul className="-mt-4 grid gap-4 text-slate-700">
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-soft"><Icon name="doc" className="h-5 w-5" /></span>Proposta por escrito antes de qualquer execução</li>
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-soft"><Icon name="clock" className="h-5 w-5" /></span>Retorno em horário comercial</li>
              <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-soft"><Icon name="mail" className="h-5 w-5" /></span>Projetos maiores: {SITE.COMPANY_EMAIL}</li>
            </ul>
          </div>
          <QuoteForm initialClientType="comercial" initialService="projeto" />
        </div>
      </Section>

      <CtaBand title="Tem uma obra em orçamento?" text="Mande o projeto de climatização ou o escopo da obra. Analisamos e respondemos com proposta por escrito." />
    </>
  );
}
