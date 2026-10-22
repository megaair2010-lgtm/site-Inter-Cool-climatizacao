import type { ReactNode } from "react";

/** Ilustrações técnicas (SVG) de equipamentos HVAC — usadas como reserva quando a foto não carrega. */
import type { ArtName } from "../../types";
export type { ArtName };

const W = "#EEF2FA", C = "#8FCDEB", S = "#BFE6F5", M = "#3E5A86", F = "#0E2A5C", H = "#F2A65A";

const air = (x: number, y: number, n = 3, dy = 7, l = 26) =>
  Array.from({ length: n }).map((_, i) => (
    <path key={`a${x}${y}${i}`} d={`M${x} ${y + i * dy} q ${l / 4} -4 ${l / 2} 0 t ${l / 2} 0`} stroke={C} strokeWidth={1.4} opacity={1 - i * 0.25} />
  ));
const ceil = (y: number) => <path d={`M6 ${y} H154`} stroke={M} strokeWidth={2} />;

const ART: Record<ArtName, ReactNode> = {
  split: (
    <>
      <path d="M10 14 H150" stroke={M} strokeWidth={2} />
      <rect x={24} y={20} width={112} height={30} rx={9} fill={F} stroke={W} strokeWidth={1.6} />
      <path d="M34 42 H126" stroke={S} strokeWidth={1.6} />
      <circle cx={122} cy={30} r={2} fill={C} />
      {air(56, 60)}
    </>
  ),
  pisoteto: (
    <>
      {ceil(14)}
      <rect x={14} y={16} width={132} height={28} rx={5} fill={F} stroke={W} strokeWidth={1.6} />
      {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M${24 + i * 8} 36 v5`} stroke={S} strokeWidth={1.4} />)}
      {air(40, 56, 3, 8, 80)}
    </>
  ),
  k7: (
    <>
      <rect x={45} y={8} width={70} height={70} rx={6} fill={F} stroke={W} strokeWidth={1.6} />
      <rect x={62} y={25} width={36} height={36} rx={3} stroke={M} strokeWidth={1.4} />
      {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${68 + i * 6} 29 v28`} stroke={M} strokeWidth={1} />)}
      <path d="M58 15 H102 M58 71 H102 M52 21 V65 M108 21 V65" stroke={S} strokeWidth={2.2} />
      <path d="M40 43 h-6 M120 43 h6" stroke={C} strokeWidth={1.6} />
    </>
  ),
  duto: (
    <>
      <rect x={12} y={10} width={40} height={22} rx={3} fill={F} stroke={W} strokeWidth={1.6} />
      <path d="M52 16 H140 V32 M52 26 H130 V32" stroke={S} strokeWidth={1.4} />
      {ceil(36)}
      <rect x={78} y={33} width={20} height={6} fill={F} stroke={C} strokeWidth={1.2} />
      <rect x={124} y={33} width={20} height={6} fill={F} stroke={C} strokeWidth={1.2} />
      {air(80, 50, 2, 8, 16)}
      {air(126, 50, 2, 8, 16)}
    </>
  ),
  fancoil: (
    <>
      <rect x={40} y={14} width={80} height={58} rx={5} fill={F} stroke={W} strokeWidth={1.6} />
      {Array.from({ length: 11 }).map((_, i) => <path key={i} d={`M${50 + i * 6} 22 V54`} stroke={S} strokeWidth={1} opacity={0.8} />)}
      <rect x={48} y={60} width={64} height={6} rx={2} stroke={M} strokeWidth={1.2} />
      <path d="M120 30 H146 V82" stroke={C} strokeWidth={2.4} />
      <path d="M120 44 H138 V82" stroke={H} strokeWidth={2.4} />
    </>
  ),
  chiller: (
    <>
      <rect x={10} y={30} width={140} height={42} rx={4} fill={F} stroke={W} strokeWidth={1.6} />
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={i}>
          <circle cx={32 + i * 32} cy={24} r={12} fill={F} stroke={S} strokeWidth={1.4} />
          <path d={`M${32 + i * 32} 14 V34 M${22 + i * 32} 24 H${42 + i * 32}`} stroke={M} strokeWidth={1.2} />
        </g>
      ))}
      <path d="M22 46 H138 M22 56 H138" stroke={M} strokeWidth={1.2} />
      <path d="M150 50 H158 M150 62 H158" stroke={C} strokeWidth={2.4} />
      <path d="M14 72 v8 M146 72 v8" stroke={W} strokeWidth={1.6} />
    </>
  ),
  self: (
    <>
      <path d="M66 6 H94 V16" stroke={S} strokeWidth={1.6} />
      <rect x={54} y={16} width={52} height={66} rx={4} fill={F} stroke={W} strokeWidth={1.6} />
      {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M62 ${26 + i * 6} H98`} stroke={S} strokeWidth={1.2} />)}
      <rect x={62} y={60} width={36} height={14} rx={2} stroke={M} strokeWidth={1.2} />
    </>
  ),
  vrf: (
    <>
      <rect x={8} y={26} width={46} height={52} rx={4} fill={F} stroke={W} strokeWidth={1.6} />
      <circle cx={31} cy={42} r={10} stroke={S} strokeWidth={1.4} />
      <circle cx={31} cy={64} r={10} stroke={S} strokeWidth={1.4} />
      <path d="M54 52 H76 M76 12 V80" stroke={C} strokeWidth={2} />
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={i}>
          <path d={`M76 ${14 + i * 21} H100`} stroke={C} strokeWidth={1.4} />
          <rect x={100} y={8 + i * 21} width={48} height={12} rx={4} fill={F} stroke={W} strokeWidth={1.3} />
          <circle cx={76} cy={14 + i * 21} r={2.2} fill={S} />
        </g>
      ))}
    </>
  ),
  multi: (
    <>
      <rect x={10} y={40} width={44} height={40} rx={4} fill={F} stroke={W} strokeWidth={1.6} />
      <circle cx={32} cy={60} r={12} stroke={S} strokeWidth={1.4} />
      {Array.from({ length: 3 }).map((_, i) => (
        <g key={i}>
          <rect x={96} y={8 + i * 26} width={52} height={16} rx={5} fill={F} stroke={W} strokeWidth={1.4} />
          <path d={`M54 ${50 + i * 6} H76 V${16 + i * 26} H96`} stroke={C} strokeWidth={1.2} />
        </g>
      ))}
    </>
  ),
  condensadora: (
    <>
      <rect x={14} y={16} width={132} height={58} rx={5} fill={F} stroke={W} strokeWidth={1.6} />
      {[0, 1].map((i) => (
        <g key={i}>
          <circle cx={50 + i * 60} cy={45} r={21} stroke={S} strokeWidth={1.4} />
          <circle cx={50 + i * 60} cy={45} r={4} fill={C} />
          <path d={`M${50 + i * 60} 26 V64 M${31 + i * 60} 45 H${69 + i * 60}`} stroke={M} strokeWidth={1.2} />
        </g>
      ))}
      <path d="M18 80 H142" stroke={M} strokeWidth={2} />
    </>
  ),
  pmoc: (
    <>
      <rect x={52} y={8} width={56} height={74} rx={5} fill={F} stroke={W} strokeWidth={1.6} />
      <rect x={68} y={4} width={24} height={10} rx={3} fill={F} stroke={S} strokeWidth={1.4} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M62 ${28 + i * 12} l3 3 l6 -6`} stroke={C} strokeWidth={1.6} />
          <path d={`M76 ${27 + i * 12} H98`} stroke={M} strokeWidth={1.6} />
        </g>
      ))}
    </>
  ),
  higienizacao: (
    <>
      <path d="M10 14 H150" stroke={M} strokeWidth={2} />
      <rect x={24} y={20} width={112} height={30} rx={9} fill={F} stroke={W} strokeWidth={1.6} />
      <path d="M34 42 H126" stroke={S} strokeWidth={1.6} />
      {[[40, 66], [80, 72], [118, 64], [60, 82], [100, 84]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6} V${y + 6} M${x - 6} ${y} H${x + 6} M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`} stroke={C} strokeWidth={1.3} opacity={0.9 - i * 0.12} />
      ))}
    </>
  ),
};

export function EquipArt({ name, className }: { name: ArtName; className?: string }) {
  return (
    <svg viewBox="0 0 160 90" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ART[name]}
    </svg>
  );
}
