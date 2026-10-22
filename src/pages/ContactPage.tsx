import type { ReactNode } from "react";
import { PageHero } from "../components/layout/PageHero";
import { QuoteForm } from "../components/sections/QuoteForm";
import { ServiceArea } from "../components/sections/ServiceArea";
import { Icon, Ph, Section, WhatsAppButton } from "../components/ui";
import { SITE } from "../config/site";
import { useSeo } from "../hooks";
import { phoneHref } from "../lib/site-helpers";

function ContactCard({ icon, title, children }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={icon} /></span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <div className="mt-1 break-words font-medium">{children}</div>
      </div>
    </div>
  );
}

export function ContactPage() {
  useSeo("Contato", "Fale com a nossa equipe pelo WhatsApp, telefone, e-mail ou formulário.", "/contato");
  return (
    <>
      <PageHero eyebrow="Contato" title="Fale com a nossa equipe" text="Escolha o canal que preferir. Respondemos em horário comercial." crumbs={[{ to: "/", label: "Início" }, { label: "Contato" }]} />
      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div className="grid content-start gap-4">
            <ContactCard icon="whatsapp" title="WhatsApp"><Ph value={SITE.WHATSAPP_NUMBER ? SITE.COMPANY_PHONE || SITE.WHATSAPP_NUMBER : ""} fallback="[WHATSAPP]" /></ContactCard>
            <ContactCard icon="phone" title="Telefone">{phoneHref() ? <a href={phoneHref()} className="hover:text-brand">{SITE.COMPANY_PHONE}</a> : <Ph value="" fallback="[TELEFONE]" />}</ContactCard>
            <ContactCard icon="mail" title="E-mail"><Ph value={SITE.COMPANY_EMAIL} fallback="[E-MAIL]" /></ContactCard>
            <ContactCard icon="pin" title={SITE.COMPANY_ADDRESS ? "Endereço" : "Região"}><Ph value={SITE.COMPANY_ADDRESS || `Atendimento em ${SITE.COMPANY_REGION}`} /></ContactCard>
            <ContactCard icon="clock" title="Horário"><Ph value={SITE.BUSINESS_HOURS} /></ContactCard>
            <WhatsAppButton size="lg" className="mt-2">Falar com um especialista</WhatsAppButton>
          </div>
          <QuoteForm />
        </div>
      </Section>
      <ServiceArea />
    </>
  );
}
