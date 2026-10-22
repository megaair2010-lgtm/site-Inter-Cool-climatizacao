import { PageHero } from "../components/layout/PageHero";
import { AboutBlock } from "../components/sections/AboutBlock";
import { CtaBand } from "../components/sections/CtaBand";
import { Differentials } from "../components/sections/Differentials";
import { Testimonials } from "../components/sections/Testimonials";
import { useSeo } from "../hooks";

export function AboutPage() {
  useSeo("Sobre nós", "Conheça a empresa, nossa equipe e nosso compromisso com a qualidade em climatização.", "/sobre");
  return (
    <>
      <PageHero eyebrow="Sobre nós" title="Experiência técnica e compromisso com nossos clientes" crumbs={[{ to: "/", label: "Início" }, { label: "Sobre nós" }]} />
      <AboutBlock full />
      <Differentials />
      <Testimonials />
      <CtaBand />
    </>
  );
}
