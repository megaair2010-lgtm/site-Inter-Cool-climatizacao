import { Button, ImageSlot, Section, SectionHead } from "../ui";
import { SITE } from "../../config/site";

/* ---------------- Sobre ---------------- */
export function AboutBlock({ full }: { full?: boolean }) {
  const items = [
    { k: "Quem somos", v: `${SITE.COMPANY_LEGAL_NAME} — empresa paulista de climatização e refrigeração, CNPJ ${SITE.COMPANY_DOCUMENT}.` },
    { k: "Missão", v: "Entregar ambientes confortáveis, eficientes e seguros, com serviço técnico bem feito e comunicação clara do orçamento à entrega." },
    { k: "Visão", v: "Ser referência em climatização no estado de São Paulo pela confiança, pela qualidade técnica e pelo atendimento." },
    { k: "Valores", v: "Segurança em primeiro lugar, transparência, pontualidade, responsabilidade ambiental e respeito ao cliente." },
    { k: "O que fazemos", v: "Instalação, manutenção preventiva e corretiva, higienização, PMOC, VRF/VRV, chillers, fancoils, Self Contained e projetos HVAC." },
    { k: "Onde atendemos", v: `Atendimento em ${SITE.COMPANY_REGION}: capital, Grande São Paulo, interior e litoral. ${SITE.BUSINESS_HOURS}.` },
  ];
  return (
    <Section id="sobre" tone={full ? "white" : "mist"}>
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:sticky lg:top-28 lg:aspect-[4/5]">
          <ImageSlot parallax src={SITE.IMAGES.about} art="vrf" alt="Técnicos trabalhando em cobertura com equipamentos de ar-condicionado" hint="Foto da equipe ou da empresa" />
        </div>
        <div>
          <SectionHead eyebrow="Sobre nós" title="Experiência técnica e compromisso com nossos clientes" subtitle={<>A {SITE.COMPANY_NAME} atua em climatização e refrigeração com soluções completas para residências, comércios, empresas e indústrias — do aparelho de parede ao sistema de água gelada.</>} />
          <dl className="-mt-4 grid gap-4 sm:grid-cols-2">
            {(full ? items : items.slice(0, 4)).map((it) => (
              <div key={it.k} className="rounded-2xl border border-slate-200 bg-white p-5">
                <dt className="text-xs font-semibold text-brand">{it.k}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{it.v}</dd>
              </div>
            ))}
          </dl>
          {!full && <div className="mt-8"><Button to="/sobre" variant="secondary">Conhecer a empresa</Button></div>}
        </div>
      </div>
    </Section>
  );
}
