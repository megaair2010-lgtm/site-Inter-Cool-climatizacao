import { PageHero } from "../components/layout/PageHero";
import { CtaBand } from "../components/sections/CtaBand";
import { FaqSection } from "../components/sections/FaqSection";
import { useSeo } from "../hooks";

export function FaqPage() {
  useSeo("Perguntas frequentes", "Dúvidas sobre instalação, manutenção, higienização, PMOC, VRF, prazos e garantia.", "/faq");
  return (
    <>
      <PageHero eyebrow="FAQ" title="Perguntas frequentes" crumbs={[{ to: "/", label: "Início" }, { label: "FAQ" }]} />
      <FaqSection />
      <CtaBand title="Não encontrou sua resposta?" text="Fale com a nossa equipe pelo WhatsApp ou envie sua solicitação." />
    </>
  );
}
