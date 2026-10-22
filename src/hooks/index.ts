import { useEffect, useRef, useState } from "react";
import { SITE } from "../config/site";
import { isPlaceholder } from "../lib/site-helpers";
import { trackPage } from "../lib/analytics";

/** Define title, description e canonical de cada página */
export function useSeo(title: string, description: string, path: string) {
  useEffect(() => {
    const full = `${title} | ${SITE.COMPANY_NAME}`;
    document.title = full;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
    if (!isPlaceholder(SITE.SITE_URL)) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = SITE.SITE_URL.replace(/\/$/, "") + path;
    }
    trackPage(path, full);
  }, [title, description, path]);
}

/** true quando o elemento entra na tela (para animações de entrada) */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/** Contador animado de 0 até o valor final */
export function useCountUp(target: number | null, run: boolean, ms = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null || !run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return value;
}
