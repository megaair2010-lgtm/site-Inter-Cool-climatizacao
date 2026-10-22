import { useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link } from "../../lib/router";
import { cx, isPlaceholder, whatsappUrl, hasWhatsApp } from "../../lib/site-helpers";
import { useInView } from "../../hooks";
import { trackEvent } from "../../lib/analytics";
import { Icon } from "./Icon";
import type { IconName } from "../../types";
import { SITE } from "../../config/site";
import { EquipArt, type ArtName } from "./EquipArt";

export { Icon, EquipArt };
export type { ArtName };

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({ id, children, className, tone = "white" }: { id?: string; children: ReactNode; className?: string; tone?: "white" | "mist" | "dark" }) {
  const bg = tone === "dark" ? "bg-ink text-white" : tone === "mist" ? "bg-mist" : "bg-white";
  return (
    <section id={id} className={cx("py-20 sm:py-24 lg:py-28", bg, className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={cx("inline-flex items-center gap-2 text-xs font-semibold", dark ? "text-brand-light" : "text-brand")}>
      <span className={cx("h-px w-6", dark ? "bg-brand-light" : "bg-brand")} />
      {children}
    </p>
  );
}

// `eyebrow` é aceito por compatibilidade, mas não é exibido (rótulo decorativo acima de cada título é um anti-pattern).
export function SectionHead({ title, subtitle, dark, center }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; dark?: boolean; center?: boolean }) {
  return (
    <Reveal className={cx("mb-12 max-w-3xl lg:mb-16", center && "mx-auto text-center")}>
      <h2 className={cx("text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]", dark ? "text-white" : "text-graphite")}>{title}</h2>
      <span className="rule" aria-hidden="true" />
      {subtitle && <p className={cx("mt-5 text-lg leading-relaxed", dark ? "text-slate-300" : "text-slate-600")}>{subtitle}</p>}
    </Reveal>
  );
}

export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={cx("reveal", inView && "is-in", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

type Variant = "primary" | "secondary" | "whatsapp" | "ghost" | "light";
const VARIANTS: Record<Variant, string> = {
  primary: "btn-shine bg-brand text-white hover:bg-[#17468F]",
  secondary: "bg-graphite text-white hover:bg-ink",
  whatsapp: "bg-[#15803D] text-white hover:bg-[#116A33] shadow-[0_10px_24px_-12px_rgba(21,128,61,.7)]",
  ghost: "border border-slate-300 text-graphite hover:border-graphite bg-white",
  light: "border border-white/25 text-white hover:bg-white/10",
};

export function Button({
  to, href, variant = "primary", size = "md", icon, children, className, external, onClick, ...rest
}: {
  to?: string; href?: string; variant?: Variant; size?: "md" | "lg"; icon?: IconName; children: ReactNode; className?: string; external?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls = cx(
    "inline-flex min-h-11 items-center justify-center gap-2 text-center sm:whitespace-nowrap rounded-xl font-semibold transition duration-200 active:translate-y-px",
    size === "lg" ? "px-6 py-4 text-[0.95rem]" : "px-5 py-3 text-sm",
    VARIANTS[variant],
    className
  );
  const content = (
    <>
      {icon && <Icon name={icon} className="h-5 w-5" />}
      <span>{children}</span>
    </>
  );
  if (href || external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={cls} onClick={onClick} {...rest}>
      {content}
    </Link>
  );
}

/** Botão de WhatsApp. Sem número configurado, leva ao formulário de orçamento. */
export function WhatsAppButton({ message, children = "Falar no WhatsApp", variant = "whatsapp", size = "md", className }: { message?: string; children?: ReactNode; variant?: Variant; size?: "md" | "lg"; className?: string }) {
  const url = whatsappUrl(message);
  const onClick = () => trackEvent("whatsapp_click");
  return hasWhatsApp() ? (
    <Button href={url} variant={variant} size={size} icon="whatsapp" className={className} onClick={onClick}>{children}</Button>
  ) : (
    <Button to="/orcamento" variant={variant} size={size} icon="whatsapp" className={className} title="Configure WHATSAPP_NUMBER em src/config/site.ts">{children}</Button>
  );
}

/** Mostra o valor; se for placeholder, destaca para o administrador substituir */
export function Ph({ value, fallback, className }: { value: unknown; fallback?: string; className?: string }) {
  const empty = isPlaceholder(value);
  if (empty && !SITE.SHOW_PLACEHOLDERS) return fallback && !/^\[.*\]$/.test(fallback) ? <span className={className}>{fallback}</span> : null;
  const text = empty ? (typeof value === "string" && value.trim() ? value : fallback ?? "[A PREENCHER]") : String(value);
  return (
    <span className={cx(empty && "ph-mark", className)} title={empty ? "Informação a preencher em src/config/site.ts" : undefined}>
      {text}
    </span>
  );
}

/**
 * Foto com reserva: tenta carregar `src`; se não houver foto (ou ela não carregar),
 * mostra uma ilustração técnica do equipamento. Fotos de banco de imagem recebem o selo "Foto ilustrativa".
 */
export function ImageSlot({ src, alt, hint, art = "condensadora", className, dark, parallax }: { src?: string; alt: string; hint: string; art?: ArtName; className?: string; dark?: boolean; parallax?: boolean }) {
  const [failed, setFailed] = useState(false);
  const hasSrc = !!src && !isPlaceholder(src) && !failed;
  if (hasSrc) {
    const stock = SITE.ILLUSTRATIVE_PHOTOS;
    return (
      <div className={cx("relative h-full w-full", className)}>
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cx("h-full w-full object-cover", parallax && "parallax")} />
        {stock && <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur">Imagem ilustrativa</span>}
      </div>
    );
  }
  if (SITE.SHOW_PLACEHOLDERS && !src) {
    return (
      <div role="img" aria-label={`Espaço para foto: ${hint}`} className={cx("relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden p-6 text-center", dark ? "bg-[linear-gradient(135deg,#111827,#0B2534_55%,#087EA4)] text-slate-300" : "bg-[linear-gradient(135deg,#F3F4F6,#E6F2F7)] text-slate-500", className)}>
        <span className={cx("relative grid h-12 w-12 place-items-center rounded-full", dark ? "bg-white/10" : "bg-white shadow-soft")}><Icon name="camera" className="h-6 w-6" /></span>
        <p className="relative max-w-[28ch] text-sm font-medium">{hint}</p>
        <span className="relative rounded-full border border-dashed border-amber-400/70 px-3 py-1 text-xs font-semibold text-amber-500">Espaço para foto real</span>
      </div>
    );
  }
  return (
    <div role="img" aria-label={alt} className={cx("relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_80%_0%,#1E4E9E_0%,#0C2456_45%,#071634_100%)]", className)}>
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-sky/25 blur-3xl" />
      <EquipArt name={art} className="relative w-[78%] max-w-[420px] drop-shadow-[0_0_24px_rgba(56,189,248,.25)]" />
    </div>
  );
}

export function Stars({ n = 5, className }: { n?: number; className?: string }) {
  return (
    <div className={cx("flex gap-0.5 text-amber-400", className)} aria-label={`${n} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
        </svg>
      ))}
    </div>
  );
}
