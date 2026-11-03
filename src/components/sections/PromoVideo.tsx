import { Reveal, Section } from "../ui";
import { Link } from "../../lib/router";

/** Vídeo institucional curto (quadrado, com trilha) logo após a faixa de serviços. */
export function PromoVideo() {
  return (
    <Section id="video" tone="white">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Reveal>
          <figure className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[var(--radius-panel)] bg-ink shadow-soft">
            <video
              controls
              playsInline
              preload="none"
              poster="/video/promo-poster.jpg"
              width={1080}
              height={1080}
              aria-label="Vídeo de apresentação da Inter-Cool"
              className="block aspect-square h-auto w-full bg-ink object-cover"
            >
              <source src="/video/promo.mp4" type="video/mp4" />
              Seu navegador não reproduz vídeo.
            </video>
          </figure>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-xs font-semibold text-brand">Conheça a Inter-Cool</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-graphite sm:text-4xl">Do split ao chiller, com o mesmo time técnico</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Residências, comércios, supermercados e órgãos públicos. Trabalhamos com as principais marcas e cuidamos da instalação à manutenção.
          </p>
          <Link to="/orcamento" className="btn-primary btn-shine mt-8 inline-flex min-h-12 w-fit items-center rounded-[var(--radius-control)] px-6 font-semibold">Peça sua visita técnica</Link>
        </Reveal>
      </div>
    </Section>
  );
}
