import { Icon } from "../ui";

/** Faixa em movimento com as especialidades (somente serviços que a empresa executa; ver data/content.ts) */
const ITEMS = [
  "Sistemas VRF",
  "Dutos e Self Contained",
  "Multisplit",
  "Expansão direta",
  "Chiller e grande porte",
  "Infraestrutura frigorígena",
  "Projetos de climatização",
  "Manutenção preventiva",
];

export function ServiceTicker() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => (
        <li key={t} className="flex items-center gap-6 pr-6">
          <span className="whitespace-nowrap font-display text-lg font-semibold text-white sm:text-xl">{t}</span>
          <Icon name="snow" className="h-5 w-5 shrink-0 text-brand-light" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Especialidades da Inter-Cool" className="overflow-hidden bg-ink py-5">
      <div className="ticker">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
