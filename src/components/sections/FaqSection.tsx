import { useState } from "react";
import { Button, Section, SectionHead } from "../ui";
import { FAQ } from "../../data/content";
import { cx } from "../../lib/site-helpers";

/* ---------------- FAQ ---------------- */
export function FaqSection({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<string | null>(FAQ[0]?.id ?? null);
  return (
    <Section id="faq">
      <SectionHead eyebrow="Dúvidas" title="Perguntas frequentes" center />
      <div className="mx-auto grid max-w-3xl gap-3">
        {FAQ.slice(0, limit).map((f) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id} className={cx("rounded-2xl border bg-white transition", isOpen ? "border-brand/40 shadow-soft" : "border-slate-200")}>
              <h3>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.id)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-sans text-base font-semibold">
                  {f.question}
                  <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full border transition", isOpen ? "rotate-45 border-brand text-brand" : "border-slate-300 text-slate-500")}>+</span>
                </button>
              </h3>
              <div className={cx("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className={cx("px-5 pb-5 leading-relaxed text-slate-600", /^\[.*\]$/.test(f.answer) && "italic")}>
                    {/^\[.*\]$/.test(f.answer) ? <span className="ph-mark">{f.answer}</span> : f.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {limit && <div className="mt-10 text-center"><Button to="/faq" variant="ghost">Ver todas as perguntas</Button></div>}
    </Section>
  );
}
