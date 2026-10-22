import type { ReactNode } from "react";
import { Container, Icon } from "../ui";
import { Link } from "../../lib/router";

/* Cabeçalho das páginas internas */
export function PageHero({ eyebrow, title, text, crumbs }: { eyebrow: string; title: ReactNode; text?: ReactNode; crumbs: { to?: string; label: string }[] }) {
  return (
    <section className="relative overflow-hidden bg-ink pt-[72px] text-white">
      <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-[110px]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
      <Container className="relative py-16 sm:py-20">
        <nav aria-label="Você está em" className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span className="text-slate-200">{c.label}</span>}
              {i < crumbs.length - 1 && <Icon name="chevron" className="h-3.5 w-3.5" />}
            </span>
          ))}
        </nav>
        <p className="mt-8 text-xs font-semibold text-brand-light">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-lg text-slate-300">{text}</p>}
      </Container>
    </section>
  );
}
