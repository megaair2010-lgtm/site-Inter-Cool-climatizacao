/**
 * CONTEÚDO EDITÁVEL
 * Estes dados são a "base" que o futuro painel administrativo vai gerenciar.
 * Itens com isPlaceholder / needsReview = true aparecem marcados no site
 * até serem substituídos por informação real.
 */
import type { BeforeAfter, FaqItem, Project, Segment, Service, Testimonial } from "../types";
import { SITE } from "../config/site";

/** Fotos da empresa em /public/images/campo (ver src/data/media.ts). */
const IMG = {
  split: "/images/campo/hi-wall.webp",
  tecnico: "/images/campo/tecnico.webp",
  condensadoras: "/images/campo/vrf-cobertura.webp",
  higienizacao: "/images/campo/cassete.webp",
  pisoTeto: "/images/campo/piso-teto.webp",
  dutos: "/images/campo/duto-forro.webp",
};

export const SERVICES: Service[] = [
  {
    id: "s1", slug: "instalacao", title: "Instalação de Ar-Condicionado", icon: "snow", hasPage: true, order: 1, active: true, image: IMG.split, art: "split",
    short: "Split, Multi Split, Cassete (K7), Piso-Teto, Self Contained e dutados, com gás R-410A e R-32.",
    description: "Dimensionamos o equipamento para o ambiente e executamos a instalação completa: suporte, tubulação frigorígena, dreno, interligação elétrica, vácuo e testes de funcionamento.",
    bullets: ["Avaliação do local e dimensionamento", "Tubulação de cobre com isolamento adequado", "Vácuo e teste de estanqueidade", "Teste de funcionamento e orientação de uso"],
  },
  {
    id: "s2", slug: "manutencao", title: "Manutenção Preventiva", icon: "calendar", hasPage: true, order: 2, active: true, image: IMG.condensadoras, art: "condensadora",
    short: "Manutenção programada para aumentar a vida útil do equipamento, reduzir consumo e evitar falhas.",
    description: "Rotinas periódicas de inspeção, limpeza e medição para manter o sistema eficiente e evitar paradas inesperadas.",
    bullets: ["Plano de manutenção conforme o uso", "Limpeza de filtros e componentes", "Medições elétricas e de pressão", "Relatório do serviço realizado"],
  },
  {
    id: "s3", slug: "manutencao-corretiva", title: "Manutenção Corretiva", icon: "wrench", hasPage: false, order: 3, active: true, image: IMG.tecnico, art: "condensadora",
    short: "Diagnóstico técnico e correção de falhas em sistemas de climatização.",
    description: "Identificamos a causa do problema e apresentamos a solução antes de executar.",
    bullets: ["Diagnóstico técnico", "Orçamento antes do reparo", "Substituição de componentes", "Testes após a correção"],
  },
  {
    id: "s4", slug: "higienizacao", title: "Higienização", icon: "spark", hasPage: true, order: 4, active: true, image: IMG.higienizacao, art: "higienizacao",
    short: "Limpeza técnica de evaporadoras, filtros, turbinas, serpentinas e componentes.",
    description: "Limpeza completa dos componentes internos para melhorar a qualidade do ar e a eficiência do equipamento.",
    bullets: ["Limpeza de filtros, turbina e serpentina", "Desobstrução do dreno", "Aplicação de produtos adequados", "Proteção do ambiente durante o serviço"],
  },
  {
    id: "s5", slug: "pmoc", title: "PMOC", icon: "doc", hasPage: true, order: 5, active: true, image: IMG.pisoTeto, art: "pmoc",
    short: "Soluções para manutenção, controle e documentação de sistemas de climatização conforme as necessidades do ambiente.",
    description: "Plano de Manutenção, Operação e Controle para ambientes climatizados de uso coletivo, com rotinas e registros organizados.",
    bullets: ["Levantamento dos equipamentos", "Elaboração do plano", "Execução das rotinas", "Registros e documentação"],
  },
  {
    id: "s6", slug: "vrf", title: "Sistemas VRF / VRV", icon: "vrf", hasPage: true, order: 6, active: true, image: IMG.condensadoras, art: "vrf",
    short: "Instalação, manutenção e suporte técnico para sistemas de climatização de grande porte.",
    description: "Atendimento a sistemas de fluxo de refrigerante variável para edifícios comerciais e ambientes com muitas zonas.",
    bullets: ["Instalação e comissionamento", "Manutenção preventiva e corretiva", "Diagnóstico de falhas", "Suporte técnico"],
  },
  {
    id: "s7", slug: "chiller", title: "Chillers e Fancoils", icon: "snow", hasPage: true, order: 7, active: true, image: IMG.condensadoras, art: "chiller",
    short: "Manutenção de chillers, fancoils e sistemas de água gelada para prédios e indústrias.",
    description: "Manutenção preventiva e corretiva de centrais de água gelada: chillers, fancoils, bombas e tubulações, com foco em disponibilidade e eficiência energética.",
    bullets: ["Inspeção e medições do chiller", "Limpeza de serpentinas e filtros dos fancoils", "Verificação de bombas, válvulas e isolamento", "Relatório técnico do sistema"],
  },
  {
    id: "s8", slug: "projetos", title: "Projetos HVAC", icon: "duct", hasPage: true, order: 8, active: true, image: IMG.dutos, art: "duto",
    short: "Projetos de climatização: carga térmica, dutos, Self Contained e escolha do sistema ideal.",
    description: "Do levantamento técnico ao projeto executivo: cálculo de carga térmica, definição do sistema (Split, VRF, Self Contained, água gelada), rede de dutos e acompanhamento da execução.",
    bullets: ["Levantamento e cálculo de carga térmica", "Definição do sistema e dos equipamentos", "Projeto de dutos, grelhas e difusores", "Acompanhamento da instalação"],
  },
];

export const SEGMENTS: Segment[] = [
  { id: "g1", title: "Residencial", text: "Conforto e eficiência para sua casa.", icon: "home" },
  { id: "g2", title: "Comercial", text: "Soluções de climatização para lojas, escritórios e empresas.", icon: "store" },
  { id: "g3", title: "Industrial", text: "Projetos e manutenção para ambientes industriais.", icon: "factory" },
  { id: "g4", title: "Clínicas e Consultórios", text: "Climatização adequada para ambientes que exigem maior controle.", icon: "clinic" },
  { id: "g5", title: "Restaurantes", text: "Conforto térmico para clientes e equipes.", icon: "food" },
  { id: "g6", title: "Condomínios", text: "Manutenção e soluções para sistemas de climatização.", icon: "building" },
];

export const DIFFERENTIALS = [
  { n: "01", title: "Experiência", text: "Profissionais preparados para diferentes tipos de sistemas HVAC.", icon: "award" as const },
  { n: "02", title: "Qualidade", text: "Utilização de boas práticas e materiais adequados.", icon: "check" as const },
  { n: "03", title: "Segurança", text: "Execução técnica seguindo procedimentos de segurança.", icon: "shield" as const },
  { n: "04", title: "Transparência", text: "Orçamentos claros e comunicação direta.", icon: "eye" as const },
  { n: "05", title: "Garantia", text: "Compromisso com a qualidade do serviço realizado.", icon: "lock" as const },
  { n: "06", title: "Pós-venda", text: "Suporte após a conclusão do serviço.", icon: "support" as const },
];

export const PROCESS = [
  { n: "01", title: "Você solicita", text: "Entre em contato pelo WhatsApp ou formulário." },
  { n: "02", title: "Analisamos", text: "Nossa equipe entende sua necessidade." },
  { n: "03", title: "Apresentamos a solução", text: "Enviamos orçamento e solução adequada." },
  { n: "04", title: "Executamos", text: "Nossa equipe realiza o serviço com padrão profissional." },
];

export const PROJECT_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "instalacoes", label: "Instalações" },
  { id: "manutencao", label: "Manutenção" },
  { id: "vrf", label: "VRF" },
  { id: "comercial", label: "Comercial" },
  { id: "residencial", label: "Residencial" },
  { id: "industrial", label: "Industrial" },
] as const;

/** Tipos de serviço executados (fotos ilustrativas). Troque por projetos reais com foto quando tiver. */
export const PROJECTS: Project[] = [
  { id: "p1", title: "Instalação de Split Hi-Wall", serviceType: "Instalação", categories: ["instalacoes", "residencial"], location: "", description: "Instalação completa com tubulação de cobre isolada, dreno, vácuo e teste de funcionamento.", image: IMG.split, art: "split", isPlaceholder: false },
  { id: "p2", title: "Sistema VRF para edifício comercial", serviceType: "VRF", categories: ["vrf", "comercial", "instalacoes"], location: "", description: "Várias evaporadoras ligadas a uma única condensadora, com controle independente por ambiente.", image: IMG.condensadoras, art: "vrf", isPlaceholder: false },
  { id: "p3", title: "Manutenção de chiller", serviceType: "Manutenção", categories: ["manutencao", "industrial"], location: "", description: "Rotina preventiva em central de água gelada: medições, limpeza e relatório técnico.", image: IMG.tecnico, art: "chiller", isPlaceholder: false },
  { id: "p4", title: "Contrato de manutenção / PMOC", serviceType: "Manutenção", categories: ["manutencao", "comercial"], location: "", description: "Plano de manutenção com rotinas periódicas e registros para ambientes de uso coletivo.", image: IMG.higienizacao, art: "pmoc", isPlaceholder: false },
  { id: "p5", title: "Climatização de galpão", serviceType: "Projeto", categories: ["industrial", "instalacoes"], location: "", description: "Projeto e instalação com Self Contained e rede de dutos para grandes áreas.", image: IMG.dutos, art: "duto", isPlaceholder: false },
  { id: "p6", title: "Piso-Teto e Cassetes em comércio", serviceType: "Instalação", categories: ["comercial", "instalacoes"], location: "", description: "Distribuição de ar uniforme para salas amplas, lojas e recepções.", image: IMG.pisoTeto, art: "k7", isPlaceholder: false },
];

export const BEFORE_AFTER: BeforeAfter[] = [
  { id: "b1", title: "Equipamento sujo / higienizado" },
  { id: "b2", title: "Instalação desorganizada / instalação organizada" },
  { id: "b3", title: "Tubulação antiga / acabamento profissional" },
];

/** Exibidas somente se SITE.SHOW_BRANDS = true (com autorização da empresa) */
export const BRANDS = ["Daikin", "LG", "Samsung", "Midea", "Gree", "Fujitsu", "Carrier", "Elgin", "Springer"];

/** EXEMPLOS — substitua por avaliações reais (ex.: do Google) */
export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", name: "[Nome do cliente]", city: "[Cidade]", rating: 5, text: "[Depoimento real do cliente. Substitua este texto no painel ou em src/data/content.ts.]", isPlaceholder: true },
  { id: "t2", name: "[Nome do cliente]", city: "[Cidade]", rating: 5, text: "[Depoimento real do cliente. Substitua este texto no painel ou em src/data/content.ts.]", isPlaceholder: true },
  { id: "t3", name: "[Nome do cliente]", city: "[Cidade]", rating: 5, text: "[Depoimento real do cliente. Substitua este texto no painel ou em src/data/content.ts.]", isPlaceholder: true },
];

/** Respostas sugeridas — revise antes de publicar (needsReview) */
export const FAQ: FaqItem[] = [
  { id: "f1", question: "Vocês fazem instalação de ar-condicionado?", answer: "Sim. Instalamos Split, Multi Split, Cassete (K7), Piso-Teto, Self Contained e sistemas dutados, com gás R-410A ou R-32 e avaliação do local antes do serviço.", needsReview: false },
  { id: "f2", question: "Vocês trabalham com manutenção preventiva?", answer: "Sim. Montamos um plano de manutenção de acordo com o tipo de equipamento e a frequência de uso.", needsReview: false },
  { id: "f3", question: "Vocês fazem higienização?", answer: "Sim. Fazemos a limpeza técnica de filtros, turbinas, serpentinas, bandejas e drenos.", needsReview: false },
  { id: "f4", question: "Vocês atendem empresas?", answer: "Sim. Atendemos comércios, escritórios, clínicas, restaurantes, condomínios e indústrias, incluindo contratos de manutenção e PMOC.", needsReview: false },
  { id: "f5", question: "Trabalham com sistemas VRF e chiller?", answer: "Sim. Atuamos com sistemas VRF/VRV e com manutenção de chillers, fancoils e Self Contained.", needsReview: false },
  { id: "f6", question: "Fazem orçamento?", answer: "Sim. Envie sua solicitação pelo formulário ou WhatsApp. Analisamos e retornamos com a proposta.", needsReview: false },
  { id: "f7", question: "Quais regiões vocês atendem?", answer: `Atendemos ${SITE.COMPANY_REGION}: capital, Grande São Paulo, interior e litoral.`, needsReview: false },
  { id: "f8", question: "Qual o prazo para atendimento?", answer: "Respondemos as solicitações em horário comercial (segunda a sexta, das 8h25 às 17h30). O prazo de execução é informado no orçamento, de acordo com o tipo de serviço.", needsReview: false },
  { id: "f9", question: "Existe garantia?", answer: "Sim. As condições de garantia de cada serviço são informadas por escrito no orçamento.", needsReview: false },
  { id: "f10", question: "Quais marcas vocês atendem?", answer: "Atendemos as principais marcas do mercado. Consulte disponibilidade e compatibilidade para o seu equipamento.", needsReview: false },
];
