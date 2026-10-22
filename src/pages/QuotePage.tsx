import { PageHero } from "../components/layout/PageHero";
import { QuoteSection } from "../components/sections/QuoteForm";
import { useSeo } from "../hooks";

export function QuotePage() {
  useSeo("Solicitar orçamento", "Solicite seu orçamento de instalação, manutenção, higienização, PMOC ou projeto de climatização.", "/orcamento");
  return (
    <>
      <PageHero eyebrow="Orçamento" title="Solicite seu orçamento" text="Conte para nossa equipe o que você precisa. Analisaremos sua solicitação e entraremos em contato." crumbs={[{ to: "/", label: "Início" }, { label: "Orçamento" }]} />
      <QuoteSection />
    </>
  );
}
