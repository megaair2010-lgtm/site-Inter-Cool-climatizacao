# Integração do escritório com Ruflo e Hermes

## Arquitetura

```
navegador ──HTTPS──► proxy reverso ──► servidor do escritório (Node, 127.0.0.1:4310)
                                          │  API REST + SSE, autenticação, auditoria
                                          ├─ adaptador Ruflo ──stdio MCP──► `ruflo mcp start`
                                          └─ adaptador Hermes ──CLI──────► `hermes kanban … --json`
```

O servidor precisa de um **processo contínuo** na mesma máquina do Ruflo (ele fala com o MCP
por stdio). Por isso não roda como função serverless da Vercel; o site público continua na
Vercel sem alteração. As portas do Ruflo nunca são expostas: o escritório só usa stdio.

## O que vem do Ruflo (3.61.1, verificado no código e em execução)

| Dado no escritório | Origem real |
|---|---|
| Agentes, nome, tipo, status | `agent_list` (`agentId`, `name`, `agentType`, `status`, `domain`) |
| Tarefas, status, progresso, responsáveis | `task_list` |
| Tags, início, fim, resultado | `task_status` (só para tarefas novas, alteradas ou ativas) |
| Ordem ao CEO | `task_create` (`type: directive`, `assignTo: [CEO]`, tags `origin:office`, `requested-by:<usuário>`) |
| Cancelar / repetir | `task_cancel` / `task_retry` |
| Aprovar / intervir | `task_update` com `result` (ver convenções) |

O Ruflo 3.61 **não emite eventos**. O escritório consulta a cada `OFFICE_POLL_MS` e gera os
eventos comparando leituras (`task.received`, `task.delegated`, `task.started`,
`task.progress`, `task.blocked`, `task.awaiting_approval`, `task.review`, `task.completed`,
`task.failed`, `task.cancelled`, `agent.started`, `agent.renamed`, `agent.removed`,
`agent.state`, `agent.disconnected`, `agent.reconnected`, `source.down`, `source.up`).
`agent_logs` é sintético nesta versão (ruvnet/ruflo#1916) e não é usado.

## Convenções que os agentes devem seguir

São o contrato entre o runtime dos agentes e o escritório. Usam só parâmetros que o Ruflo já
aceita.

**Delegar** — ao criar subtarefa, informe a tarefa-mãe e quem delegou:

```json
task_create { "type": "research", "description": "Pesquisar construtoras em Goiânia",
              "assignTo": ["ic-sdr-para-qualificacao-de-leads"],
              "tags": ["parent:<taskId da tarefa-mãe>", "from:<agentId de quem delegou>"] }
```

Sem `from:`, o escritório usa o responsável pela tarefa-mãe.
`type` define a animação: `research` → pesquisando; `analysis` → analisando; `content`/`writing`
→ escrevendo; `proposal` → preparando proposta. Sem tipo reconhecido, vale o título; senão,
"executando tarefa".

**Reunião**: inclua a tag `kind:meeting` e atribua a todos os participantes.

**Progresso**: `task_update { taskId, status: "in_progress", progress: 0–100 }`.

**Bloqueio, aprovação, revisão**: o Ruflo não tem esses status. A tarefa continua
`in_progress` e o agente informa no `result`:

```json
task_update { "taskId": "…", "result": { "officeState": "blocked", "reason": "Falta tabela de preços" } }
```

`officeState` pode ser `blocked`, `awaiting_approval` ou `review`. Ao aprovar pelo painel, o
escritório grava `{ officeState: "approved", approvedBy, note, at }` e a tarefa volta a "em andamento".

**Concluir / falhar**: `task_complete { taskId, result }` ou
`task_update { taskId, status: "failed", result: { error: "…" } }`.

**Hermes**: `created_by: "agent:<perfil>"` indica delegação; `created_by: "meeting:…"` indica
reunião; tarefas `blocked` usam o corpo como motivo; aprovar no painel chama
`hermes kanban unblock`. Cancelar e repetir não existem na CLI do Hermes e ficam desativados.
O adaptador Hermes foi escrito sobre a CLI documentada, mas **não foi testado** aqui por falta de
uma instalação do Hermes.

## Agentes e mesas

`npm run seed:agents` registra no Ruflo os agentes ativos de `agents/hierarquia.json` com ids
estáveis (`ic-ceo`, `ic-gerente-geral`, `ic-diretor-comercial`…) e grava
`data/agents.json` com departamento, papel e título de cada um. Use `-- --todos` para registrar
as 116 funções e `-- --dry-run` para só listar.

A mesa é ligada ao **id real** do agente (`ruflo:<agentId>`), salva em `data/roster.json`.
Renomear não muda a mesa. Um agente removido libera a mesa depois de 24 h. Para fixar alguém,
edite `data/agents.json` (`department`, `role`, `title`, `deskId`). O servidor relê o arquivo
sozinho.

Agentes registrados fora do catálogo são posicionados por palavras-chave do nome e do tipo
(ex.: "SDR" → Comercial; "coder" → Tecnologia). Sem correspondência, vão para o PMO.

## API

Todas as rotas exigem `Authorization: Bearer <token>`, exceto o SSE, que aceita `?token=`
(o `EventSource` do navegador não envia cabeçalhos).

| Rota | Papel mínimo | Descrição |
|---|---|---|
| `GET /api/health` | — | estado do servidor |
| `GET /api/office/me` | viewer | papel do token |
| `GET /api/office/state` | viewer | snapshot: agentes, tarefas, métricas, fontes, eventos recentes |
| `GET /api/office/events` | viewer | SSE: `snapshot` a cada conexão, `patch`, `office-event`, `replay` (eventos perdidos desde `Last-Event-ID`/`since`) |
| `GET /api/office/agents/:key` | viewer | agente, histórico, tarefas, ações suportadas |
| `GET /api/office/tasks/:key` | viewer | tarefa, linha do tempo, subtarefas |
| `POST /api/office/commands` | operator | `order_ceo`, `cancel_task`, `retry_task`, `approve_task`, `intervene` |
| `GET /api/office/audit` | admin | últimas entradas do log de auditoria |

Campos do agente: `id`, `name`, `title`, `department`, `deskId`, `state`, `rawStatus`,
`evidence`, `currentTaskKey`, `currentTask`, `progress`, `delegation {from,to,parentTaskKey}`,
`lastResult`, `lastError`, `updatedAt`.

## Variáveis de ambiente

Veja `.env.example`. As principais: `OFFICE_TOKENS` (`papel:token:rótulo`, separados por
vírgula, tokens com 16+ caracteres), `OFFICE_SOURCES`, `RUFLO_CWD`, `RUFLO_COMMAND`,
`RUFLO_ARGS`, `OFFICE_DATA_DIR`, `OFFICE_POLL_MS`.

## Implantação

1. Na máquina do Ruflo: `npm ci && npm run build`, configure `.env`, rode `npm start` com um
   gerenciador de processos (systemd, pm2).
2. Exponha só pelo proxy reverso com HTTPS (Caddy/Nginx) para `127.0.0.1:4310`, com
   `proxy_buffering off` na rota `/api/office/events`.
3. Não exponha o servidor diretamente nem abra portas do Ruflo.

## Segurança

- Papéis: `viewer` (só vê), `operator` (envia ordens e ações), `admin` (também lê auditoria).
  Comparação de token em tempo constante.
- Comandos por lista fechada: nenhum campo extra, ids validados por expressão regular, textos
  limitados. Não existe rota que execute comando no servidor.
- Limite de requisições e de comandos por minuto; limite de conexões SSE.
- Todo resultado, erro e título passa por redação antes de sair do servidor: chaves de API,
  tokens, JWT, senhas, cartões, CPF, e-mails e telefones são mascarados.
- Auditoria em `data/audit.log.jsonl`: quem, papel, IP, ação, resultado. Sem segredos.
- Cabeçalhos CSP, `nosniff`, `no-referrer`; o servidor escuta só em 127.0.0.1 por padrão.
- A fonte `demo` nunca é combinada com fontes reais e a tela mostra a faixa "DADOS SIMULADOS".

## Limitações conhecidas

- **Execução real dos agentes** depende de um runtime com LLM. No Ruflo, `agent_execute`
  precisa de `ANTHROPIC_API_KEY`. Sem isso, os agentes ficam registrados e ociosos, e o
  escritório mostra exatamente isso.
- Os agentes precisam seguir as convenções acima para que delegação, bloqueio e aprovação
  apareçam. O que o Ruflo não registra, o escritório não mostra.
- Ruflo 3.61 não tem renomeação de agente (`agent_update` não aceita nome). O escritório trata a
  renomeação quando a fonte a reporta (coberto pelos testes unitários; o Hermes informa nomes de perfil).
- Sem eventos nativos: a latência é o intervalo de consulta (2 s por padrão).
- Prazo e prioridade aparecem quando a fonte os fornece. O Ruflo tem prioridade e não tem prazo.
- O adaptador Hermes não foi testado contra uma instalação real.
