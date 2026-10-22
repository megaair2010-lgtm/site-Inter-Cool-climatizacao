import { PageHero } from "../components/layout/PageHero";
import { CtaBand } from "../components/sections/CtaBand";
import { Process } from "../components/sections/Process";
import { Segments } from "../components/sections/Segments";
import { useSeo } from "../hooks";

export function SolutionsPage() {
  useSeo("Soluções por segmento", "Climatização para residências, comércios, indústrias, clínicas, restaurantes e condomínios.", "/solucoes");
  return (
    <>
      <PageHero eyebrow="Soluções" title="Soluções para cada tipo de ambiente" crumbs={[{ to: "/", label: "Início" }, { label: "Soluções" }]} />
      <Segments />
      <Process />
      <CtaBand />
    </>
  );
}
