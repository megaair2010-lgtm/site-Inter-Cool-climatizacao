# Captação B2B · Inter-Cool

Tudo o que foi montado para levar a Inter-Cool ao top 10 de climatização em São Paulo, integrado ao site.

## No site
- **/obras/**: landing page de captação para construtoras, arquitetos, engenharia/fit-out e condomínios. Formulário em 2 passos que abre o WhatsApp (11) 97799-0182 com o pedido preenchido, ou o e-mail com assunto `[Obra] Pedido de orçamento - <empresa>`. Linkada no menu e no rodapé.
- **/midia/**: Reels (`reel1-construtoras.mp4`, `reel2-pmoc.mp4`, `reel3-arquitetos.mp4`) e Stories (`story-1..3.jpg`) 1080x1920, prontos para o Instagram, com URL pública para o agente de redes sociais.
- **office/**: Escritório 3D da Inter-Cool AI Company (visualizador dos agentes).

## Painel de controle
Central Inter-Cool (artifact privado no Claude): Visão geral, Comercial (pipeline de leads), Marketing, Licitações e compras, Financeiro e Agentes. É o banco de dados de todos os agentes abaixo.

## Agentes agendados (rodam na nuvem, horário de Brasília)
| Agente | Quando | O que faz |
|---|---|---|
| Prospector B2B | seg e qui 7h41 | Repõe leads quando há menos de 30 novos com e-mail |
| SDR E-mail | seg–sex 9h13 | Envia até 20 e-mails/dia pelo playbook (sequência E1→E4) |
| Atendimento de respostas | seg–sex 10h47, 15h47, 17h47 | Classifica respostas, cria rascunhos no Gmail, atualiza o CRM |
| Relatório do gerente | seg–sex 18h12 | Resumo do dia no painel |
| Social Media | todo dia 7h23 | Agenda 6 posts no Instagram (2 feed + 4 Stories) |
| Licitações e compras | seg–sex 8h26 | Registra pregões, contratos, prazos e cotações do Gmail |
| Financeiro | seg–sex 8h52 | Contas a pagar/receber a partir do Gmail, sem pagar nada |

Regras de e-mail: veja `playbook-email.md`.

## Pendências do dono
1. Autorizar o Instagram no Supermetrics (sem isso o Social Media não publica).
2. Configurar no Vercel `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL`, `LEADS_FROM_EMAIL`, `ALLOWED_ORIGIN` e `DATABASE_URL` para o formulário `/orcamento` entregar os pedidos.
3. Cadastrar a empresa nos portais de fornecedores das construtoras.
