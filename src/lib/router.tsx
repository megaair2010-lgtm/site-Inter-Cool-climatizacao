/**
 * Roteador mínimo, sem dependências externas.
 * - "history": URLs amigáveis (/servicos, /contato...) — use em produção.
 *   A hospedagem precisa redirecionar todas as rotas para index.html
 *   (ver README: _redirects / vercel.json).
 * - "memory": navegação interna sem mudar a URL — usado em prévias.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

type Mode = "history" | "memory";
interface RouterCtx {
  path: string;
  query: URLSearchParams;
  navigate: (to: string) => void;
}
const Ctx = createContext<RouterCtx>({ path: "/", query: new URLSearchParams(), navigate: () => {} });

function splitUrl(to: string) {
  let rest = to;
  let hash = "";
  const h = rest.indexOf("#");
  if (h !== -1) { hash = rest.slice(h + 1); rest = rest.slice(0, h); }
  let search = "";
  const q = rest.indexOf("?");
  if (q !== -1) { search = rest.slice(q + 1); rest = rest.slice(0, q); }
  return { path: rest, search, hash };
}

function scrollToHash(hash: string) {
  if (!hash) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  requestAnimationFrame(() => {
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function Router({ children, mode = "history" }: { children: ReactNode; mode?: Mode }) {
  const [path, setPath] = useState(() => (mode === "history" ? window.location.pathname : "/"));
  const [search, setSearch] = useState(() => (mode === "history" ? window.location.search.slice(1) : ""));

  useEffect(() => {
    if (mode !== "history") return;
    const onPop = () => { setPath(window.location.pathname); setSearch(window.location.search.slice(1)); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [mode]);

  const navigate = useCallback(
    (to: string) => {
      const { path: p, search: q, hash } = splitUrl(to);
      const target = p || path;
      if (mode === "history") window.history.pushState({}, "", target + (q ? `?${q}` : "") + (hash ? `#${hash}` : ""));
      const samePage = target === path;
      setPath(target);
      setSearch(q);
      if (samePage || !hash) scrollToHash(hash);
      else setTimeout(() => scrollToHash(hash), 60);
    },
    [mode, path]
  );

  const value = useMemo(() => ({ path, query: new URLSearchParams(search), navigate }), [path, search, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRouter = () => useContext(Ctx);

/** Link interno. Links externos (http, mailto, tel) usam <a> normal. */
export function Link({ to, children, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/** Casa um padrão como "/servicos/:slug" com o caminho atual */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.replace(/\/+$/, "").split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
