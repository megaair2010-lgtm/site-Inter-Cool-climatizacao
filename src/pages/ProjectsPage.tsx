import { PageHero } from "../components/layout/PageHero";
import { BeforeAfterSection } from "../components/sections/BeforeAfter";
import { CtaBand } from "../components/sections/CtaBand";
import { Portfolio } from "../components/sections/Portfolio";
import { useSeo } from "../hooks";

export function ProjectsPage() {
  useSeo("Projetos e serviços realizados", "Portfólio de instalações, manutenções e projetos de climatização.", "/projetos");
  return (
    <>
      <PageHero eyebrow="Projetos" title="Projetos e serviços realizados" crumbs={[{ to: "/", label: "Início" }, { label: "Projetos" }]} />
      <Portfolio full />
      <BeforeAfterSection />
      <CtaBand />
    </>
  );
}
