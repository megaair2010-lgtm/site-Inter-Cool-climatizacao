import { Button } from "../components/ui";
import { useSeo } from "../hooks";

export function NotFoundPage() {
  useSeo("Página não encontrada", "A página que você procura não existe.", "/404");
  return (
    <section className="grid min-h-[70vh] place-items-center bg-mist px-4 pt-[72px] text-center">
      <div>
        <p className="font-display text-7xl font-semibold text-brand">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-slate-600">O endereço pode ter mudado. Volte ao início ou solicite seu orçamento.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/" variant="ghost">Ir para o início</Button>
          <Button to="/orcamento">Solicitar orçamento</Button>
        </div>
      </div>
    </section>
  );
}

/** Dados estruturados (Schema.org) — só são publicados com os dados reais preenchidos */
