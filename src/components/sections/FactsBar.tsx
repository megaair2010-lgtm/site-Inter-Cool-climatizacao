import { SITE } from "../../config/site";
import { Container, Icon } from "../ui";
import type { IconName } from "../../types";

/** Faixa de especialidades e fatos verificáveis (somente dados confirmados em src/config/site.ts) */
export function FactsBar() {
  const facts: { icon: IconName; k: string; v: string }[] = [
    { icon: "pin", k: "Área de atendimento", v: "Todo o estado de São Paulo" },
    { icon: "vrf", k: "Sistemas", v: "Split a VRF, chiller e Self Contained" },
    { icon: "snow", k: "Fluidos refrigerantes", v: "R-410A e R-32" },
    { icon: "clock", k: "Atendimento", v: "Seg a sex, 8h25 às 17h30" },
  ];
  return (
    <section aria-label="Especialidades" className="border-b border-steel bg-white">
      <Container>
        <ul className="grid grid-cols-2 divide-steel lg:grid-cols-4 lg:divide-x">
          {facts.map((f) => (
            <li key={f.k} className="flex items-start gap-3 py-6 lg:px-6 lg:first:pl-0">
              <Icon name={f.icon} className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{f.k}</p>
                <p className="mt-1 text-sm font-semibold leading-snug sm:text-[0.95rem]">{f.v}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-steel py-3 text-center text-xs text-slate-500">
          <span>{SITE.COMPANY_LEGAL_NAME}</span> <span className="ml-3">CNPJ {SITE.COMPANY_DOCUMENT}</span>
        </p>
      </Container>
    </section>
  );
}
