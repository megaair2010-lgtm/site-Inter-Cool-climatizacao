# Playbook de captação B2B — Inter-Cool Climatização

Fonte de verdade dos agentes. Editável pelo dono. Baseado no skill cold-email (coreyhaines31/marketingskills, MIT), adaptado para HVAC em São Paulo.

## Empresa (só fatos confirmados)
- INTER-COOL CLIMATIZAÇÃO E REFRIGERAÇÃO LTDA, nome de marca Inter-Cool. CNPJ 51.991.844/0001-82. São Paulo-SP, atende todo o estado.
- Serviços: instalação e manutenção de Split, Multi Split, Cassete (K7), Piso-teto, Self Contained, VRF/VRV, Chillers e fancoils, redes de dutos; higienização; PMOC; projetos HVAC (carga térmica, dutos, escolha do sistema). Trabalha com R-410A e R-32.
- Horário: segunda a sexta, 8h25 às 17h30. WhatsApp (11) 97799-0182 → https://wa.me/5511977990182
- Site: https://site-inter-cool-climatizacao-final.vercel.app
- NUNCA inventar: número de obras, clientes, anos de mercado, prazos, preços, descontos, "gratuito", certificações. Se precisar de um número, não use.

## Regras de envio
- Remetente: Gmail intercoolclimatizacao@gmail.com. Texto puro, sem HTML, sem imagem, no máximo 1 link (WhatsApp).
- Limite: 20 e-mails por dia no total (novos + follow-ups). Follow-ups vencidos têm prioridade. Segunda a sexta, entre 9h e 11h30.
- Um e-mail por empresa por vez. Nunca mandar para endereço pessoal (gmail/hotmail) de funcionário; só e-mail corporativo publicado.
- Pular lead com pausado=true, status respondeu/reuniao/proposta/ganho/perdido/descadastrado/bounce, ou sem e-mail.
- Leads da origem "campanha-out-2026" só a partir de 24/11/2026, com texto novo e assunto novo (nunca "Re:").
- Stop-loss: se no dia houver 2 ou mais bounces, ou qualquer resposta de spam/reclamação, parar os envios do dia e registrar no relatório.
- Toda resposta, de qualquer tipo, para a cadência daquele lead.

## Estilo (obrigatório)
- Curto: 50 a 90 palavras no corpo. Tom de colega técnico, não de vendedor. Português do Brasil, "você".
- Abrir pelo mundo deles (o gancho do lead), nunca por "somos a Inter-Cool". O gancho tem que levar ao problema.
- Um único pedido, de baixo atrito, respondível em uma linha.
- Assunto: 2 a 4 palavras, minúsculas, sem pontuação, sem nome da pessoa, sem "Re:"/"Fwd:" falsos.
- Proibido: "espero que esteja bem", "meu nome é", "líder", "solução completa", "alavancar", travessão (—), "não é X, é Y", perguntas que se autorrespondem, emojis, CAIXA ALTA, promessas de prazo/preço.
- Rodapé fixo (sempre, depois da assinatura):
  "Inter-Cool Climatização · CNPJ 51.991.844/0001-82 · São Paulo-SP
  Se não fizer sentido para você, responda "remover" e não envio mais."
- Assinatura: "Jhow\nInter-Cool Climatização\nWhatsApp (11) 97799-0182"

## Ângulos por segmento (e-mail 1)
Construtora/incorporadora — dor: infraestrutura de ar-condicionado por pavimento (tubulação frigorígena, dreno, ponto elétrico) atrasando acabamento; áreas comuns e lojas com VRF/cassete. Pedido: "Posso mandar nossa ficha de fornecedor para quem cuida de suprimentos de instalações?" Se houver portal_fornecedor, cadastrar NÃO é tarefa do agente: registrar nas notas para o dono.
Arquitetura/interiores — dor: compatibilizar ar-condicionado com o projeto (cassete x dutado, posição de condensadoras, forro) sem surpresa na obra. Pedido: "Faz sentido eu ser o contato técnico de climatização no próximo projeto de vocês?"
Engenharia/gerenciadora/fit-out — dor: subcontratar climatização em reforma corporativa com prazo apertado (dutos, VRF, cassete), com equipe que entrega no cronograma. Pedido: "Vocês têm alguma obra de fit-out em orçamento agora em que eu possa cotar a climatização?"
Facilities/administradora/redes — dor: PMOC é obrigatório para ambientes climatizados de uso coletivo (Lei 13.589/2018) e manutenção corretiva custa mais que preventiva. Pedido: "Posso fazer um levantamento dos equipamentos de um dos prédios e mandar uma proposta de PMOC?"

## Cadência
- E-mail 1 (dia 0): gancho + dor + pedido. status → e1
- E-mail 2 (dia 3 úteis): outro ângulo, curto, autossuficiente (não dizer "só passando"). Ex.: um detalhe técnico útil do segmento (dreno subdimensionado, condensadora sem área de manutenção, PMOC sem laudo). status → e2
- E-mail 3 (dia 8): prova concreta: obras de VRF em cobertura, cassete, dutos e rack de compressores no site; convite a ver as fotos. status → e3
- E-mail 4 (dia 15): despedida: "Como não tive retorno, vou parar por aqui. Se precisarem de climatização em alguma obra, é só responder ou chamar no WhatsApp." status → e4. Depois disso, status perdido após 7 dias sem resposta.
- Follow-ups vão no mesmo fio do Gmail (responder a thread original), assunto mantido.

## Respostas
- Positiva/pedido de informação: status respondeu; criar RASCUNHO de resposta no Gmail (não enviar), propondo duas janelas para visita/ligação e o WhatsApp; avisar o dono.
- "Agora não"/data futura: status perdido com proximoPasso na data citada e nota.
- Indicação de outra pessoa/e-mail: registrar novo e-mail no lead (status novo, nota "indicado por"), responder agradecendo em rascunho.
- Fora do escritório: adiar proximoPasso para a data de retorno.
- "remover"/reclamação: status descadastrado imediatamente; não responder.
- Bounce: status bounce.

## WhatsApp
- Só para quem respondeu ou passou telefone, ou para quem clicou e chamou. Nunca disparo frio.

## Registro no CRM (coleção leads)
Campos: nome, segmento, site, email, emailsJaUsados[], telefone, portal_fornecedor, gancho, fonte, porte, status, ultimoContato (ISO), proximoPasso (AAAA-MM-DD), gmailThreadId, historico[{data, evento}], notas, pausado.
