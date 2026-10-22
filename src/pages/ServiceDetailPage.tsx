import { PageHero } from "../components/layout/PageHero";
import { CtaBand } from "../components/sections/CtaBand";
import { Button, Icon, ImageSlot, Section, SectionHead, WhatsAppButton } from "../components/ui";
import { SITE } from "../config/site";
import { SERVICES } from "../data/content";
import { useSeo } from "../hooks";
import { Link } from "../lib/router";
import { NotFoundPage } from "./NotFoundPage";

export function ServiceDetailPage({ slug }: { slug: string }) {
  const s = SERVICES.find((x) => x.slug === slug && x.hasPage);
  useSeo(s ? s.title : "Serviço", s ? s.short : "", `/servicos/${slug}`);
  if (!s) return <NotFoundPage />;
  const others = SERVICES.filter((x) => x.hasPage && x.slug !== slug).slice(0, 4);
  return (
    <>
      <PageHero eyebrow="Serviço" title={s.title} text={s.short} crumbs={[{ to: "/", label: "Início" }, { to: "/servicos", label: "Serviços" }, { label: s.title }]} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Como funciona</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{s.description}</p>
            <ul className="mt-8 grid gap-4">
              {s.bullets.map((b, i) => (
                <li key={b} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 font-display text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pt-1.5 font-medium">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={`/orcamento?servico=${s.slug}`} size="lg">Solicitar orçamento</Button>
              <WhatsAppButton size="lg" message={`Olá! Vim pelo site da ${SITE.COMPANY_NAME} e gostaria de um orçamento de ${s.title}.`}>Enviar pelo WhatsApp</WhatsAppButton>
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-lift lg:aspect-auto lg:min-h-[480px]">
            <ImageSlot src={s.image} art={s.art} alt={s.title} hint={`Foto real: ${s.title.toLowerCase()} executada pela equipe`} />
          </div>
        </div>
      </Section>
      <Section tone="mist">
        <SectionHead eyebrow="Outros serviços" title="Conheça também" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <Link key={o.id} to={`/servicos/${o.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <Icon name={o.icon} className="h-7 w-7 text-brand" />
              <p className="mt-4 font-semibold">{o.title}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2">Saiba mais</span>
            </Link>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
