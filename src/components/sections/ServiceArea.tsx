import { Button, Icon, Section, SectionHead } from "../ui";
import { SITE } from "../../config/site";
import { isPlaceholder } from "../../lib/site-helpers";

/* ---------------- Área de atendimento ---------------- */
export function ServiceArea() {
  const hasMap = !isPlaceholder(SITE.GOOGLE_MAPS_EMBED_URL) && SITE.GOOGLE_MAPS_EMBED_URL.startsWith("https://www.google.com/maps/embed");
  return (
    <Section id="atendimento">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHead eyebrow="Área de atendimento" title={<>Atendemos {SITE.COMPANY_REGION}</>} subtitle="Da capital ao interior e litoral: equipe técnica para instalação, manutenção e contratos em todo o estado." />
          {SITE.SERVICE_AREAS.length ? (
            <ul className="-mt-6 flex flex-wrap gap-2">
              {SITE.SERVICE_AREAS.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-soft"><Icon name="pin" className="h-4 w-4 text-brand" />{c}</li>
              ))}
            </ul>
          ) : (
            <p className="-mt-6 rounded-xl border border-dashed border-amber-400/70 bg-amber-50 p-4 text-sm text-amber-700">Cadastre as cidades atendidas em <code>SERVICE_AREAS</code> (src/config/site.ts).</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/orcamento" size="lg">Agendar avaliação</Button>
            {!isPlaceholder(SITE.GOOGLE_MAPS_URL) && <Button href={SITE.GOOGLE_MAPS_URL} variant="ghost" size="lg" icon="pin">Ver no Google Maps</Button>}
          </div>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
          {hasMap ? (
            <iframe title="Mapa da área de atendimento" src={SITE.GOOGLE_MAPS_EMBED_URL} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[radial-gradient(120%_100%_at_100%_0%,#1E4E9E_0%,#0C2456_50%,#071634_100%)] p-8 text-white">
              <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#8FCDEB_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-white shadow-lift"><Icon name="pin" className="h-6 w-6" /></span>
                <div>
                  <p className="text-xs font-semibold text-brand-light">Área de cobertura</p>
                  <p className="font-display text-xl font-semibold">Estado de São Paulo</p>
                </div>
              </div>
              <p className="relative font-display text-[7rem] font-semibold leading-none text-white/10 sm:text-[9rem]">SP</p>
              <ul className="relative grid grid-cols-2 gap-2 text-sm">
                {SITE.SERVICE_AREAS.map((c) => <li key={c} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-light" />{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
