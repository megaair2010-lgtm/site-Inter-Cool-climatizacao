/**
 * FOTOS E VÍDEO DA EMPRESA (enviados pelo cliente)
 * Legendas descrevem apenas o tipo de equipamento/serviço — sem nome de cliente, local ou
 * promessa. `kind: "ilustrativa"` = recorte de material de fabricante/apresentação: mostrar o selo.
 */
export interface Media {
  id: string;
  src: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
  kind: "campo" | "ilustrativa";
}

export const MEDIA: Record<string, Media> = {
  vrfCobertura: { id: "vrfCobertura", src: "/images/campo/vrf-cobertura.webp", w: 1080, h: 810, alt: "Condensadoras VRF instaladas em cobertura de edifício", caption: "Condensadoras VRF em cobertura", kind: "campo" },
  rack: { id: "rack", src: "/images/campo/rack-compressores.webp", w: 1080, h: 810, alt: "Central de compressores de refrigeração com tubulação isolada", caption: "Central de compressores e infraestrutura frigorígena", kind: "campo" },
  dutoForro: { id: "dutoForro", src: "/images/campo/duto-forro.webp", w: 721, h: 1600, alt: "Rede de dutos sob forro de madeira durante a instalação", caption: "Rede de dutos em instalação", kind: "campo" },
  dutoGrelha: { id: "dutoGrelha", src: "/images/campo/duto-grelha.webp", w: 721, h: 1600, alt: "Grelha linear e dutos flexíveis acima do forro", caption: "Grelha linear e dutos flexíveis", kind: "campo" },
  cassete: { id: "cassete", src: "/images/campo/cassete.webp", w: 1040, h: 780, alt: "Evaporadora cassete instalada em forro de madeira", caption: "Cassete em forro ripado", kind: "campo" },
  pisoTeto: { id: "pisoTeto", src: "/images/campo/piso-teto.webp", w: 1600, h: 902, alt: "Evaporadora piso-teto em ambiente em obra", caption: "Piso-teto em ambiente de obra", kind: "campo" },
  hiWall: { id: "hiWall", src: "/images/campo/hi-wall.webp", w: 1600, h: 1200, alt: "Split hi-wall instalado em parede", caption: "Split hi-wall instalado", kind: "campo" },
  tecnico: { id: "tecnico", src: "/images/campo/tecnico.webp", w: 721, h: 1600, alt: "Técnico operando condensadora, com cilindro de gás refrigerante ao lado", caption: "Técnico em atendimento", kind: "campo" },
  hiWallSala: { id: "hiWallSala", src: "/images/campo/tcl.webp", w: 500, h: 500, alt: "Split hi-wall branco instalado em parede clara", caption: "Split hi-wall em parede", kind: "ilustrativa" },
  chiller: { id: "chiller", src: "/images/campo/slide-chiller.webp", w: 1599, h: 444, alt: "Condensadora de grande porte com tubulação de água gelada", caption: "Equipamento de grande porte", kind: "ilustrativa" },
  selfContained: { id: "selfContained", src: "/images/campo/slide-selfcontained.webp", w: 1599, h: 444, alt: "Equipamento Self Contained em área técnica", caption: "Self Contained", kind: "ilustrativa" },
  multi: { id: "multi", src: "/images/campo/slide-multisplit.webp", w: 1599, h: 444, alt: "Condensadoras multi split instaladas lado a lado", caption: "Multi Split", kind: "ilustrativa" },
};

export const OBRA_VIDEO = {
  mp4: "/video/obra.mp4",
  webm: "/video/obra.webm",
  poster: "/images/obra-poster.webp",
  w: 816,
  h: 464,
};

export const GALLERY: Media[] = [
  MEDIA.dutoForro, MEDIA.vrfCobertura, MEDIA.cassete, MEDIA.rack,
  MEDIA.hiWall, MEDIA.dutoGrelha, MEDIA.pisoTeto, MEDIA.tecnico,
];
