/**
 * SLIDES DO HERO (página inicial)
 * ------------------------------------------------------------------
 * Fotos reais de banco de imagens com licença de uso comercial (Unsplash License:
 * uso gratuito, inclusive comercial, sem obrigação de crédito — https://unsplash.com/license).
 * Elas NÃO retratam obras da Inter-Cool e por isso aparecem com o selo "Foto ilustrativa".
 * Para usar fotos próprias: coloque o arquivo em /public/images e troque `src` por
 * "/images/arquivo.webp" (o campo `remote` passa a ser ignorado).
 *
 * `fallback` é a imagem local exibida se a foto remota não carregar.
 */
export interface HeroSlide {
  id: string;
  /** Rótulo curto da categoria (aparece nos indicadores) */
  tag: string;
  title: string;
  text: string;
  /** Serviço pré-selecionado no formulário de orçamento */
  service: string;
  alt: string;
  /** ID da foto em images.unsplash.com (photo-XXXX) ou caminho local começando com "/" */
  src: string;
  fallback: string;
  /** Enquadramento: ponto focal da foto em desktop e mobile (object-position) */
  focus: { desktop: string; mobile: string };
  credit?: { name: string; url: string };
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "vrf",
    tag: "Engenharia HVAC e VRF",
    title: "Engenharia de climatização para projetos de alto desempenho",
    text: "Soluções HVAC planejadas para ambientes que exigem eficiência, confiabilidade e precisão técnica — do sistema VRF/VRV ao Self Contained.",
    service: "vrf",
    alt: "Fileira de unidades condensadoras de ar-condicionado instaladas na cobertura de um edifício",
    src: "photo-1698479603408-1a66a6d9e80f",
    fallback: "/images/condensadoras.webp",
    focus: { desktop: "50% 55%", mobile: "60% 50%" },
    credit: { name: "Kettenreaktion", url: "https://unsplash.com/photos/a-group-of-air-conditioners-sitting-next-to-each-other-l_Vn4HlFQVw" },
  },
  {
    id: "dutos",
    tag: "Dutos e distribuição de ar",
    title: "Distribuição de ar com precisão de engenharia",
    text: "Projeto da rede de dutos, grelhas e difusores, com acompanhamento da montagem conforme o projeto.",
    service: "projetos",
    alt: "Dutos de ventilação suspensos no teto de um ambiente industrial",
    src: "photo-1786840671711-bdabee8634cf",
    fallback: "/images/dutos.webp",
    focus: { desktop: "50% 40%", mobile: "55% 40%" },
    credit: { name: "Spencer Liao", url: "https://unsplash.com/photos/ventilation-ducts-in-industrial-workspace-L23Drc99Cyk" },
  },
  {
    id: "multisplit",
    tag: "Multi Split",
    title: "Conforto térmico com inteligência de projeto",
    text: "Sistemas Split e Multi Split dimensionados de acordo com a carga térmica e o uso de cada ambiente.",
    service: "instalacao",
    alt: "Quatro unidades externas de ar-condicionado instaladas em uma parede técnica",
    src: "photo-1667983453881-4992fe86ab1b",
    fallback: "/images/split.webp",
    focus: { desktop: "50% 50%", mobile: "50% 50%" },
    credit: { name: "Kien Nguyen", url: "https://unsplash.com/photos/air-conditioning-units-on-grey-wall-994AH40vmVs" },
  },
  {
    id: "expansao-direta",
    tag: "Expansão direta",
    title: "Uma solução técnica para cada ambiente",
    text: "Hi-wall, cassete K7, piso-teto e equipamentos dutados selecionados e instalados conforme os requisitos da aplicação.",
    service: "instalacao",
    alt: "Ar-condicionado tipo split instalado em ambiente interno, com display indicando 22 graus",
    src: "photo-1762341123870-d706f257a12e",
    fallback: "/images/piso-teto.webp",
    focus: { desktop: "60% 45%", mobile: "65% 45%" },
    credit: { name: "Zulfugar Karimov", url: "https://unsplash.com/photos/white-air-conditioner-unit-displaying-22-degrees-mM0vW68NY0g" },
  },
  {
    id: "infraestrutura",
    tag: "Infraestrutura frigorígena",
    title: "Precisão em cada etapa da instalação",
    text: "Tubulação de cobre com isolamento adequado, vácuo, teste de estanqueidade e infraestrutura organizada.",
    service: "instalacao",
    alt: "Profissional sobre plataforma elevatória instalando componentes no teto de uma obra",
    src: "photo-1785682118449-21da8825754d",
    fallback: "/images/hero.webp",
    focus: { desktop: "55% 35%", mobile: "55% 35%" },
    credit: { name: "Valentin Lacoste", url: "https://unsplash.com/photos/construction-worker-on-lift-installing-ceiling-components-5l991aLrCJ8" },
  },
  {
    id: "grande-porte",
    tag: "Chillers e manutenção",
    title: "Confiabilidade que sustenta a operação",
    text: "Manutenção preventiva e corretiva de chillers, fancoils e Self Contained, com medições e relatório técnico.",
    service: "chiller",
    alt: "Chiller de água gelada em cobertura, durante verificação de manutenção",
    src: "photo-1774290331891-5d759056c68d",
    fallback: "/images/condensadoras.webp",
    focus: { desktop: "50% 50%", mobile: "45% 50%" },
    credit: { name: "Carl Wragg", url: "https://unsplash.com/photos/row-of-white-hvac-units-on-a-rooftop-8PuhEqdwaN8" },
  },
];

const WIDTHS = [640, 960, 1280, 1680, 2200];

/** Monta src/srcset otimizados (WebP/AVIF automático pela CDN do Unsplash) */
export function heroImage(s: HeroSlide) {
  if (s.src.startsWith("/")) return { src: s.src, srcSet: undefined };
  const base = `https://images.unsplash.com/${s.src}?auto=format&fit=crop&q=70`;
  return {
    src: `${base}&w=1680`,
    srcSet: WIDTHS.map((w) => `${base}&w=${w} ${w}w`).join(", "),
  };
}
