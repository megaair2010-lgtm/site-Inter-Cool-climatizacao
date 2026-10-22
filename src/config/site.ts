/**
 * CONFIGURAÇÃO CENTRAL DO SITE — InterCool
 * ------------------------------------------------------------------
 * Dados da empresa usados em todo o site. Campos vazios ("") ou entre
 * [colchetes] são tratados como "não informado": o item correspondente
 * é escondido do site (ou marcado, se SHOW_PLACEHOLDERS = true).
 *
 * NÃO coloque senhas, tokens ou chaves de API neste arquivo — ele vai
 * para o navegador. Use variáveis de ambiente no servidor (.env).
 */


export const SITE = {
  COMPANY_NAME: "Inter-Cool",
  COMPANY_LEGAL_NAME: "INTER-COOL CLIMATIZAÇÃO E REFRIGERAÇÃO LTDA",
  COMPANY_TAGLINE: "Climatização e refrigeração com padrão profissional em todo o estado de São Paulo.",
  COMPANY_DOCUMENT: "51.991.844/0001-82",

  /** Telefone para exibição */
  COMPANY_PHONE: "(11) 97799-0182",
  /** Somente números com DDI e DDD */
  WHATSAPP_NUMBER: "5511977990182",
  COMPANY_EMAIL: "intercoolclimatizacao@gmail.com",
  /** Endereço completo. Vazio = não exibe */
  COMPANY_ADDRESS: "",
  COMPANY_CITY: "São Paulo",
  COMPANY_STATE: "SP",
  COMPANY_REGION: "todo o estado de São Paulo",
  SERVICE_AREAS: ["Capital", "Grande São Paulo", "ABC Paulista", "Interior de SP", "Litoral de SP"] as string[],

  INSTAGRAM_URL: "",
  FACEBOOK_URL: "",
  LINKEDIN_URL: "",
  GOOGLE_MAPS_URL: "https://www.google.com/maps/search/?api=1&query=Estado+de+S%C3%A3o+Paulo",
  /** URL "incorporar mapa" do Google Maps (https://www.google.com/maps/embed?...) — opcional */
  GOOGLE_MAPS_EMBED_URL: "",
  BUSINESS_HOURS: "Segunda a sexta, das 8h25 às 17h30",

  /** Endereço do site em produção, usado no SEO */
  SITE_URL: "https://inter-cool.vercel.app",

  /** Indicadores numéricos. Preencha somente com números comprovados; null = não exibe */
  STATS: {
    projects: null as number | null,
    clients: null as number | null,
    years: null as number | null,
  },

  /** Destaques exibidos no topo quando não há números em STATS */
  HIGHLIGHTS: [
    { value: "Todo SP", label: "Capital, interior e litoral" },
    { value: "R-410A", label: "e R-32 (gases ecológicos)" },
    { value: "Seg–Sex", label: "8h25 às 17h30" },
  ],

  /**
   * Fotos ilustrativas (geradas para o site, em /public/images). Mostram o selo "Imagem ilustrativa".
   * Troque por fotos reais da InterCool em /public/images (ex.: "/images/hero.jpg")
   * e marque ILLUSTRATIVE_PHOTOS = false.
   */
  ILLUSTRATIVE_PHOTOS: true,
  IMAGES: {
    hero: "/images/hero.webp",
    about: "/images/campo/vrf-cobertura.webp",
    team: "",
  },

  /** Mostrar nomes de marcas somente com autorização da empresa */
  SHOW_BRANDS: false,
  /** true = mostra marcações amarelas e seções ainda sem conteúdo real (modo edição) */
  SHOW_PLACEHOLDERS: false,
} as const;


export const WHATSAPP_DEFAULT_MESSAGE = `Olá! Vim pelo site da ${SITE.COMPANY_NAME} e gostaria de solicitar um orçamento de HVAC/climatização.`;
