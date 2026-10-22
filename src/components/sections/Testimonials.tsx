import { Icon, Ph, Reveal, Section, SectionHead, Stars } from "../ui";
import { TESTIMONIALS } from "../../data/content";
import { SITE } from "../../config/site";
import { cx } from "../../lib/site-helpers";

/* ---------------- Depoimentos ---------------- */
export function Testimonials() {
  // Sem avaliações reais cadastradas, a seção fica oculta (nada de depoimento inventado)
  if (!SITE.SHOW_PLACEHOLDERS && TESTIMONIALS.every((t) => t.isPlaceholder)) return null;
  return (
    <Section tone="mist">
      <SectionHead eyebrow="Depoimentos" title="O que nossos clientes dizem" />
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.id} delay={i * 80} as="article" className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-soft">
            <Icon name="quote" className="h-8 w-8 text-brand/30" />
            {!t.isPlaceholder && <Stars n={t.rating} className="mt-4" />}
            <p className={cx("mt-4 flex-1 leading-relaxed text-slate-700", t.isPlaceholder && "italic text-slate-500")}>{t.text}</p>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="font-semibold"><Ph value={t.name} /></p>
              <p className="text-sm text-slate-500"><Ph value={t.city} /></p>
            </div>
            {t.isPlaceholder && <span className="absolute right-5 top-5 rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-xs font-bold text-amber-600">Exemplo — substituir</span>}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
