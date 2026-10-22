import { Button, Container, Reveal, WhatsAppButton } from "../ui";

/* ---------------- CTA ---------------- */
export function CtaBand({ title = "Pronto para climatizar com padrão profissional?", text = "Fale com nossa equipe e receba uma solução adequada para o seu ambiente." }: { title?: string; text?: string }) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl bg-graphite px-6 py-12 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="float-slow absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-[90px]" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">{title}</h2>
              <p className="mt-4 max-w-xl text-slate-300">{text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button to="/orcamento" size="lg">Solicitar orçamento</Button>
              <WhatsAppButton size="lg">Falar no WhatsApp</WhatsAppButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
