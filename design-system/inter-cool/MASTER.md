# Design System — Inter-Cool (Master)

> Fonte única de verdade para o visual do site. Se existir `design-system/inter-cool/pages/<pagina>.md`,
> as regras daquela página se sobrepõem a este arquivo.
>
> **Origem:** gerado com UI UX Pro Max v2.15.0 (`search.py --design-system --persist`, dials variance 5 /
> motion 3 / density 3) e **revisado manualmente**. A ferramenta classificou o projeto como "Medical Clinic"
> e sugeriu paleta teal/verde de saúde — isso foi descartado por não corresponder a uma empresa de engenharia
> HVAC. Foram mantidos o padrão de página, a tipografia, as regras de movimento, a escala de espaçamento e o
> checklist. Diretrizes complementares: skill `frontend-design` (github.com/anthropics/skills).
> Tokens implementados em `src/index.css` (`@theme` + `:root`).

**Conceito:** Engineering Precision. Climate Performance.
**Padrão de página (UI UX Pro Max `landing`):** Trust & Authority + Conversion — Hero (missão/credibilidade) →
Prova (fatos verificáveis) → Visão geral das soluções → Caminho claro para o orçamento.
**Estratégia de cor:** azul-marinho/cinza corporativo; o destaque fica reservado à ação principal.

---

## Cores

| Papel | Hex | Token | Uso |
|---|---|---|---|
| Ink (fundo escuro) | `#071634` | `--color-ink` | Hero, rodapé, painéis escuros |
| Graphite (texto) | `#0F1F3D` | `--color-graphite` | Texto principal |
| Brand (ação) | `#1E55B0` | `--color-brand` | Botão primário, links, ícones |
| Brand hover | `#17468F` | — | Hover do botão primário |
| Sky (destaque) | `#5CC3DD` / `#6FCDE6` | `--color-brand-sky` / `--color-brand-light` | Somente realces sobre fundo escuro |
| Mist (fundo claro) | `#F2F6FB` | `--color-mist` | Seções alternadas |
| Steel (linhas) | `#E3E9F1` | `--color-steel` | Divisores e bordas |
| WhatsApp | `#15803D` | — | Botão de WhatsApp (contraste 5,0:1 com branco) |

Regras: texto normal ≥ 4,5:1; nada de gradientes roxo/rosa na interface (a logo é a única exceção, por ser marca);
sem gradientes decorativos em botões.

## Tipografia

- **Família única:** IBM Plex Sans (400, 500, 600, 700) — escolhida pelo UI UX Pro Max (perfil "technical, precise,
  corporate, trustworthy"). Substitui Sora + Inter (Inter é um padrão genérico apontado pela skill frontend-design).
- **Wordmark:** Lora itálico 600 apenas no nome "Inter-Cool" do cabeçalho (coerente com a logo).
- **Escala:** 12 (mínimo) · 14 · 16 (corpo) · 18 · 24 · 30 · 36 · 48 · 64 px. Corpo com line-height 1,5–1,65.
- **Proibido:** rótulos em CAIXA ALTA espaçada acima de cada título, texto < 12 px, monoespaçada em rótulos,
  "→" anexado ao texto de botões, separadores "A · B · C".

## Espaçamento (density 3 — espaçoso)

`4 · 8 · 16 · 24 · 32 · 48 · 64 · 96` px. Seções: 80–112 px verticais. Largura máxima do conteúdo: `--content-max` 1280 px.

## Raios e sombras

`--radius-control` 12 px (botões, campos) · `--radius-card` 16 px · `--radius-panel` 24 px.
Sombras discretas (`--shadow-soft`, `--shadow-lift`), nunca a mesma sombra em todos os cartões.

## Movimento (motion 3 — sutil)

- **Hero em vídeo (decisão do cliente):** loop de 10 s, sem áudio, animação própria (ventilador de condensadora + fluxo de ar frio),
  gerada por script e versionada em `public/video/hero.{webm,mp4}` + pôster `public/images/hero-poster.webp`.
  Regras UI UX Pro Max: sem som, pausa fora da tela / aba oculta, botão de pausa (WCAG 2.2.2), sem autoplay com `prefers-reduced-motion`,
  rotulado "Animação ilustrativa" (não é filmagem de obra).
- Entrada de seções ao rolar (fade + subida, 0,8 s, escalonada), linhas que se desenham, barra de progresso de rolagem, brilho em botões,
  elevação de cartões. Tudo desligado com `prefers-reduced-motion`.
- Vídeo da seção "Ar-condicionado em funcionamento": Pexels (ilustrativo), com botão de pausa.

## Componentes

- **Botão primário:** fundo `--color-brand`, texto branco, 52 px de altura no hero, 44 px no mínimo, raio 12 px.
- **Botão secundário (fundo escuro):** contorno branco 30%, hover com fundo branco 10%.
- **Campos:** 16 px de fonte (evita zoom no iOS), rótulo visível, erro abaixo do campo ligado por `aria-describedby`.
- **Cartões:** composição variada (painel grande + empilhados, lista técnica, grade de serviços), não uma grade de cartões idênticos.

## Checklist de entrega

- [x] Ícones SVG de um único conjunto, sem emojis
- [x] `cursor: pointer` em elementos clicáveis
- [x] Contraste ≥ 4,5:1 em texto normal (auditado automaticamente)
- [x] Foco visível em todos os elementos navegáveis por teclado
- [x] `prefers-reduced-motion` respeitado
- [x] Responsivo: 360, 390, 768, 1024, 1440, 1920 px sem rolagem horizontal
- [x] Conteúdo não fica escondido atrás do cabeçalho fixo (`scroll-padding-top`)
- [x] Alvos de toque ≥ 44 px no hero
