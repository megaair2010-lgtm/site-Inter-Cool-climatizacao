# Escritório 3D Inter-Cool — Auditoria técnica (24/10/2026)

## 1. Repositórios de referência

| Repositório | Licença | Stack | Como obtém estado | Veredito |
|---|---|---|---|---|
| cernadasjuan/agents-office | MIT (package.json; sem arquivo LICENSE) | Vite 8 + three 0.183 | Lê `~/.claude/sessions/` e transcrições do Claude Code, polling de 3 s | Bom para ideias de poses/estações. Acoplado ao Claude Code local, não a Ruflo/Hermes. |
| dian003/virtual-office ("Hermes Virtual Office") | MIT | Next 15 + React 19 + three 0.171 + zustand | Usa o CLI oficial `hermes` (`kanban list/show --json`, `profile`, `cron`, `config get`) | **Melhor base conceitual.** Já é nativo do Hermes, tem máquina de estados "honesta" (agente ocioso não chama modelo), Kanban, aprovações, evidências, modo 2D e celular. ~32 mil linhas, textos em indonésio, 3 andares — grande demais para copiar inteiro. |
| atlassian-labs/roving-office | Apache-2.0 só para o **código**; arte e marca **não** estão cobertas (ver NOTICE) | three vendorizado, sem build, Eleventy | Protocolo próprio de "receiver" HTTP; demo usa agentes **simulados** | Boa referência de protocolo e layout. Não reutilizar artes/personagens. |
| AgentSystemLabs/agent-office | MIT | Node + ws + node-pty/xterm (servidor) + cliente three | Executa agentes de terminal em PTYs e transmite o terminal; o "estado" é a sessão de terminal, não uma tarefa | Bom para ver agentes de terminal ao vivo, mas exige rodar shells no servidor (contrário à regra de não permitir comandos arbitrários pela tela) e não fala com Ruflo/Hermes. Não usado. |
| ajsahni/agents-office | **PolyForm Noncommercial 1.0.0** | Node + d3-force, HTML gerado | Roster e "cérebro" próprios em arquivos JSON | Licença proíbe uso comercial; a Inter-Cool é empresa. **Excluído**, nenhum código ou ideia específica aproveitados. |

**Escolha:** arquitetura própria em TypeScript + three.js (MIT), seguindo os padrões do Hermes Virtual Office (máquina de estados por prioridade, ocioso não gasta IA, Kanban/2D como alternativa). Reaproveito ideias e, onde fizer sentido, trechos MIT com atribuição. Nenhum asset do roving-office.

## 2. Ruflo — o que a versão 3.61.1 realmente expõe (testado nesta sessão)

- CLI `npx ruflo` e servidor MCP com as ferramentas: `agent_spawn`, `agent_list`, `agent_status`, `agent_terminate`, `agent_update`, `agent_logs`, `task_create`, `task_list`, `task_status`, `task_assign`, `task_update` (status + progress), `task_complete`, `task_cancel`, `task_retry`, `task_summary`, `hooks_notify`, `session_*`, `swarm_status`.
- Estados observados: agente `registered` → `idle` → `busy`; tarefa `pending` → `in_progress` (com `progress`) → `completed`/`failed`/`cancelled`.
- Estado persistido em `.claude-flow/agents/store.json` e `.claude-flow/tasks/store.json`.
- **Não existe stream de eventos.** O adaptador consulta `agent_list` + `task_list` (via MCP/CLI oficial) e gera os eventos por diferença entre leituras.
- **`agent_logs` é sintético** — a própria resposta diz "per-agent activity logging is not yet wired" (ruvnet/ruflo#1916). O histórico por agente será o registro de eventos do próprio adaptador, derivado de mudanças reais.
- O servidor MCP do Ruflo não conectou nesta sessão em nuvem (timeout); o CLI funciona.

## 3. Hermes

O Hermes Agent (NousResearch) expõe estado pelo CLI `hermes`: `kanban list --json` (tarefas com `assignee`, `status` queued/running/review/blocked/done/failed), `kanban show <id> --json` (eventos), `kanban assignees --json`, perfis em `~/.hermes/profiles/`. O adaptador Hermes usa só esses comandos. Não há Hermes instalado nesta sessão, então esse adaptador fica sem teste ao vivo até rodar no servidor.

## 4. Projeto atual

Os repositórios acessíveis (`site-Inter-Cool*`) são sites institucionais Vite/React. A identidade visual vem de `site-Inter-Cool-climatizacao` (azul-marinho #071634/#0F2F72, azuis #17468F/#1E55B0/#2A86C2, ciano #5CC3DD). **A plataforma Inter-Cool AI Company não está em nenhum deles.**
