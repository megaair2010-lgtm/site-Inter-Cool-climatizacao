/* Tipos de dados do site e do futuro painel administrativo. */

export type ID = string;

/** Ilustrações técnicas disponíveis (src/components/ui/EquipArt.tsx) */
export type ArtName =
  | "split" | "pisoteto" | "k7" | "duto" | "fancoil" | "chiller" | "self" | "vrf" | "multi" | "condensadora" | "pmoc" | "higienizacao";

export type ClientType = "residencial" | "comercial" | "industrial" | "condominio";

export type ServiceRequested =
  | "instalacao"
  | "manutencao-preventiva"
  | "manutencao-corretiva"
  | "higienizacao"
  | "pmoc"
  | "vrf"
  | "chiller"
  | "projeto"
  | "outro";

export const LEAD_STATUSES = [
  "novo",
  "em_analise",
  "orcamento_enviado",
  "negociacao",
  "agendado",
  "concluido",
  "cancelado",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  orcamento_enviado: "Orçamento enviado",
  negociacao: "Negociação",
  agendado: "Agendado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/** Solicitação de orçamento (lead) */
export interface Lead {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  city: string;
  clientType: ClientType;
  service: ServiceRequested;
  equipmentCount?: number;
  equipmentBrand?: string;
  message?: string;
  /** URLs das fotos já armazenadas (o upload é feito pelo servidor) */
  photos: string[];
  createdAt: string; // ISO 8601
  status: LeadStatus;
  source?: "site-form" | "whatsapp" | "telefone" | "outro";
}

/** Dados enviados pelo formulário antes de virar Lead */
export interface LeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  clientType: ClientType;
  service: ServiceRequested;
  equipmentCount: string;
  equipmentBrand: string;
  message: string;
  photos: File[];
  /** Campo-isca contra robôs: precisa chegar vazio */
  website: string;
}

export interface Client {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  clientType: ClientType;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: ID;
  slug: string;
  title: string;
  short: string;
  description: string;
  bullets: string[];
  icon: IconName;
  /** Tem página própria em /servicos/:slug */
  hasPage: boolean;
  /** Foto do serviço (URL ou /images/...) */
  image?: string;
  /** Ilustração usada se a foto não carregar */
  art?: ArtName;
  order: number;
  active: boolean;
}

export type ProjectCategory = "instalacoes" | "manutencao" | "vrf" | "comercial" | "residencial" | "industrial";

export interface Project {
  id: ID;
  title: string;
  serviceType: string;
  categories: ProjectCategory[];
  location: string;
  description: string;
  image?: string;
  art?: ArtName;
  /** true = exemplo de layout, deve ser substituído por um projeto real */
  isPlaceholder: boolean;
}

export interface Testimonial {
  id: ID;
  name: string;
  city: string;
  text: string;
  rating: 1 | 2 | 3 | 4 | 5;
  isPlaceholder: boolean;
}

export interface FaqItem {
  id: ID;
  question: string;
  answer: string;
  /** true = resposta sugerida, o administrador deve revisar */
  needsReview: boolean;
}

export interface Segment {
  id: ID;
  title: string;
  text: string;
  icon: IconName;
}

export interface BeforeAfter {
  id: ID;
  title: string;
  before?: string;
  after?: string;
}

export interface CityServed {
  id: ID;
  name: string;
  region?: string;
}

export interface Settings {
  companyName: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  cities: CityServed[];
  businessHours: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
}

export type IconName =
  | "snow" | "wrench" | "calendar" | "tool" | "spark" | "doc" | "vrf" | "duct" | "fan"
  | "home" | "store" | "factory" | "clinic" | "food" | "building" | "check" | "shield"
  | "clock" | "receipt" | "team" | "award" | "lock" | "eye" | "support" | "pin"
  | "phone" | "mail" | "whatsapp" | "arrow" | "menu" | "close" | "star" | "upload"
  | "instagram" | "facebook" | "linkedin" | "chevron" | "camera" | "quote";
