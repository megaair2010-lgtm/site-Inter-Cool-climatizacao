# Site InterCool — Climatização & Refrigeração

React + TypeScript + Tailwind CSS (Vite). Modelo pronto para empresas de climatização,
com foco em conversão (orçamento e WhatsApp), SEO e versão mobile.

> Já configurado com os dados da InterCool (CNPJ, WhatsApp, e-mail, horário, área: todo o estado de SP).
> Itens sem informação real (números de projetos/clientes, depoimentos, antes/depois, marcas, redes sociais,
> endereço) ficam **ocultos** — nada foi inventado. Para ver onde eles entram, use `SHOW_PLACEHOLDERS: true`.

## Fotos

As fotos atuais são **ilustrativas**, de bancos gratuitos (Unsplash — licença permite uso comercial,
sem obrigação de crédito) e aparecem com o selo "Foto ilustrativa". Se alguma foto não carregar,
o site mostra automaticamente uma ilustração técnica do equipamento.
Para trocar por fotos reais: coloque os arquivos em `public/images/`, aponte os caminhos em
`src/config/site.ts` (`IMAGES`) e `src/data/content.ts` (`IMG`) e use `ILLUSTRATIVE_PHOTOS: false`.

## Como rodar

```bash
npm install
cp .env.example .env      # preencha o necessário
npm run dev               # http://localhost:5173
npm run build             # gera /dist para publicar
```

## Estrutura

```
src/
  config/site.ts          ← DADOS DA EMPRESA (nome, WhatsApp, e-mail, endereço, redes, horário…)
  data/content.ts         ← serviços, segmentos, projetos, depoimentos, FAQ, marcas
  types/                  ← tipos (Lead, Cliente, Serviço, Projeto, Depoimento, FAQ, Cidade, Configurações)
  components/
    layout/               ← Header, Footer, WhatsApp flutuante, PageHero
    sections/             ← uma seção por arquivo (Hero, Serviços, Portfólio, Antes/Depois, FAQ, Formulário…)
    seo/                  ← Schema.org LocalBusiness/FAQPage (só aparece com dados reais)
    ui/                   ← botões, ícones, placeholders
  pages/                  ← uma página por arquivo
  services/leads.ts       ← validação e envio do formulário
  hooks/ lib/             ← SEO por página, animações, roteador, analytics
api/leads.ts              ← endpoint do servidor (validação, anti-spam, e-mail)
database/schema.sql       ← tabelas do painel (leads com status, clientes, conteúdo, configurações)
public/                   ← favicon, robots.txt, sitemap.xml, _redirects, images/
```

## Páginas

`/` · `/servicos` · `/servicos/instalacao` · `/servicos/manutencao` · `/servicos/higienizacao` ·
`/servicos/pmoc` · `/servicos/vrf` · `/solucoes` · `/projetos` · `/sobre` · `/faq` · `/contato` ·
`/orcamento` · `/politica-de-privacidade`

## Checklist antes de publicar

**`src/config/site.ts`**
- [ ] `COMPANY_NAME`, `COMPANY_LEGAL_NAME`, `COMPANY_DOCUMENT` (CNPJ)
- [ ] `WHATSAPP_NUMBER` — só dígitos com DDI, ex.: `5511999999999` (sem número, os botões levam ao formulário)
- [ ] `COMPANY_PHONE`, `COMPANY_EMAIL`, `COMPANY_ADDRESS`, `COMPANY_CITY`, `COMPANY_REGION`
- [ ] `SERVICE_AREAS` — somente cidades realmente atendidas
- [ ] `BUSINESS_HOURS`, `INSTAGRAM_URL`, `FACEBOOK_URL`, `LINKEDIN_URL`
- [ ] `GOOGLE_MAPS_URL` e `GOOGLE_MAPS_EMBED_URL` (Google Maps → Compartilhar → Incorporar)
- [ ] `STATS` (projetos, clientes, anos) — deixe `null` se não tiver o número comprovado
- [ ] `IMAGES` — fotos reais em `public/images`
- [ ] `SHOW_BRANDS = true` **somente** com autorização das marcas listadas
- [ ] `SITE_URL` (ativa URL canônica e Schema.org)

**`src/data/content.ts`**
- [ ] Projetos e antes/depois com fotos reais (marcados como "Exemplo" até serem trocados)
- [ ] Depoimentos reais, com autorização (`isPlaceholder: false`)
- [ ] Respostas do FAQ marcadas `needsReview` (prazos e garantia)

**Outros**
- [ ] Texto de `/politica-de-privacidade` revisado por um profissional
- [ ] Domínio em `public/robots.txt` e `public/sitemap.xml`
- [ ] `index.html`: título e descrição padrão

## Formulário de orçamento

O navegador envia `multipart/form-data` para `VITE_LEADS_ENDPOINT` (padrão `/api/leads`).
`api/leads.ts` faz: checagem de origem, limite por IP, honeypot anti-spam, validação de
campos e fotos (até 5 imagens de 5 MB) e envia o pedido por e-mail.

Configure **no painel da hospedagem** (nunca no código):
`ALLOWED_ORIGIN`, `LEADS_NOTIFY_EMAIL`, `LEADS_FROM_EMAIL`, `RESEND_API_KEY` e,
se usar banco, `DATABASE_URL` (rode `database/schema.sql`).

Se o envio falhar, o visitante vê o botão do WhatsApp como alternativa.

## Segurança

- Variáveis `VITE_*` são públicas (vão para o navegador): só IDs de analytics e o caminho do endpoint.
- Chaves, senhas e conexões de banco ficam apenas no servidor.
- Validação no navegador **e** no servidor; honeypot + limite de requisições.
- Fotos devem ir para storage privado; guarde só o necessário (LGPD).

## Publicação

- **Vercel**: importe o projeto; `vercel.json` já cuida das rotas e de `api/leads.ts`.
- **Netlify**: `public/_redirects` cuida das rotas; mova `api/leads.ts` para `netlify/functions`.
- Analytics: preencha `VITE_GA_ID` e `VITE_GSC_VERIFICATION`.
