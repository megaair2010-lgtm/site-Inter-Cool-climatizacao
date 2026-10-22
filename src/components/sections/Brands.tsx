import { Container, EquipArt } from "../ui";
import type { ArtName } from "../../types";

const EQUIPMENT: { art: ArtName; name: string }[] = [
  { art: "split", name: "Split Hi-Wall" },
  { art: "multi", name: "Multi Split" },
  { art: "k7", name: "Cassete K7" },
  { art: "pisoteto", name: "Piso-Teto" },
  { art: "duto", name: "Dutados" },
  { art: "self", name: "Self Contained" },
  { art: "vrf", name: "VRF / VRV" },
  { art: "fancoil", name: "Fancoil" },
  { art: "chiller", name: "Chiller" },
];
import { SITE } from "../../config/site";
import { BRANDS } from "../../data/content";

/* ---------------- Marcas ---------------- */
export function Brands() {
  return (
    <section aria-label="Marcas e equipamentos" className="border-y border-slate-200 bg-white py-14">
      <Container>
        <p className="text-center font-display text-xl font-semibold sm:text-2xl">{SITE.SHOW_BRANDS ? "Trabalhamos com as principais tecnologias de climatização" : "Todos os tipos de sistema, do Split ao Chiller"}</p>
        {SITE.SHOW_BRANDS ? (
          <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-14 hover:[animation-play-state:paused]">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <span key={i} aria-hidden={i >= BRANDS.length} className="font-display text-2xl font-semibold text-slate-300 transition hover:text-graphite">{b}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul className="flex w-max animate-[marquee_45s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
              {[...EQUIPMENT, ...EQUIPMENT].map((e, i) => (
                <li key={i} aria-hidden={i >= EQUIPMENT.length} className="w-44 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-ink p-3 text-center">
                  <EquipArt name={e.art} className="mx-auto h-20 w-full" />
                  <p className="mt-2 text-sm font-semibold text-white">{e.name}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">Consulte disponibilidade e compatibilidade para seu equipamento.</p>
      </Container>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </section>
  );
}
