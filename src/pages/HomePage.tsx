import { AboutBlock } from "../components/sections/AboutBlock";
import { BeforeAfterSection } from "../components/sections/BeforeAfter";
import { CtaBand } from "../components/sections/CtaBand";
import { Differentials } from "../components/sections/Differentials";
import { FactsBar } from "../components/sections/FactsBar";
import { ServiceTicker } from "../components/sections/ServiceTicker";
import { FaqSection } from "../components/sections/FaqSection";
import { HeroVideo } from "../components/sections/HeroVideo";
import { HowItWorks } from "../components/sections/HowItWorks";
import { Process } from "../components/sections/Process";
import { QuoteSection } from "../components/sections/QuoteForm";
import { Segments } from "../components/sections/Segments";
import { ServiceArea } from "../components/sections/ServiceArea";
import { Solutions } from "../components/sections/Solutions";
import { FieldWork } from "../components/sections/FieldWork";
import { Testimonials } from "../components/sections/Testimonials";
import { useSeo } from "../hooks";

/**
 * Narrativa da página inicial:
 * apresentar (hero, fatos) → explicar (empresa, soluções, segmentos) → demonstrar (galeria)
 * → reduzir dúvidas (processo, diferenciais, FAQ) → converter (formulário, CTA final).
 * Seções sem conteúdo real (antes/depois, marcas, depoimentos) ficam ocultas automaticamente.
 */
export function HomePage() {
  useSeo(
    "Engenharia de Climatização e HVAC em São Paulo",
    "Inter-Cool: instalação e manutenção de sistemas VRF/VRV, chillers, fancoils, Self Contained, Split e Multi Split, dutos e PMOC em todo o estado de São Paulo.",
    "/"
  );
  return (
    <>
      <HeroVideo />
      <ServiceTicker />
      <FactsBar />
      <AboutBlock />
      <Solutions />
      <FieldWork />
      <HowItWorks />
      <Segments />
      <BeforeAfterSection />
      <Process />
      <Differentials />
      <Testimonials />
      <QuoteSection />
      <ServiceArea />
      <FaqSection limit={6} />
      <CtaBand />
    </>
  );
}
