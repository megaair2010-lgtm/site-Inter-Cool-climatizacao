# Escritório 3D — Inter-Cool AI Company

Escritório virtual que mostra, em tempo real, os agentes **reais** orquestrados pelo
[Ruflo](https://github.com/ruvnet/ruflo) (e, opcionalmente, pelo Hermes): quem está em cada
mesa, o que cada um está fazendo, quem delegou para quem, o que travou e o que foi entregue.

Regra central: **nenhum agente aparece trabalhando sem uma tarefa registrada na fonte.** Cada
estado visual vem com a evidência que o sustenta (campo `evidence` na API e no painel).

- 3D (three.js) com recepção, sala do CEO, gerente-geral, sala de reuniões, as 12 diretorias,
  PMO e copa. Câmera com zoom, rotação, foco por departamento e "acompanhar agente".
- 2D, Lista e Kanban para celular e máquinas modestas (troca automática quando não há WebGL).
- Painel do agente: tarefa atual, progresso, quem delegou, histórico, resultados, erros,
  e ações (acompanhar, evidências, intervenção, aprovar, cancelar, repetir).
- Chat do CEO: a ordem vira uma tarefa real no Ruflo, atribuída ao CEO; a árvore de
  delegação aparece conforme os agentes criam subtarefas.
- Tempo real por SSE com reconexão, recuperação de estado e reenvio dos eventos perdidos.

## Como rodar

```bash
cd office
npm install
npm run build
cp .env.example .env   # edite os tokens
# com o Ruflo instalado no projeto (npx ruflo) e agentes registrados:
npm run seed:agents    # registra a hierarquia ativa (agents/hierarquia.json) — idempotente
npm start              # http://127.0.0.1:4310
```

Abra o endereço, informe o token e o escritório carrega. Sem agentes cadastrados, ele mostra o
escritório vazio, e não personagens de enfeite.

Demonstração sem Ruflo (dados **simulados**, com faixa amarela permanente na tela):
`OFFICE_SOURCES=demo OFFICE_TOKENS=admin:<token> npm start`.

## Testes

```bash
npm test                                    # 12 testes unitários (motor, segurança, redação)
RUFLO_BIN=node_modules/ruflo/bin/ruflo.js npm run e2e:ruflo   # ponta a ponta contra um Ruflo real
```

O teste ponta a ponta sobe um Ruflo isolado, registra 9 agentes, inicia o servidor do
escritório e verifica os 10 critérios de aceite pelo navegador, pela API e pelo SSE, gerando
capturas de tela em `evidence/`. O "trabalho" dos agentes nesse teste é feito pelo próprio
script chamando as ferramentas MCP do Ruflo (`task_create`, `task_update`, `task_complete`),
**não por um LLM**. Isso prova que o escritório reflete fielmente o Ruflo; não prova a
qualidade do trabalho dos agentes.

## Documentação

- [docs/INTEGRACAO.md](docs/INTEGRACAO.md): como os agentes informam delegação, bloqueio e
  aprovação; API e eventos; variáveis; implantação; segurança; limitações.
- [agents/hierarquia.json](agents/hierarquia.json): catálogo das 116 funções do prompt mestre
  (CEO, gerente-geral, 12 diretorias). 51 marcadas como ativas.
