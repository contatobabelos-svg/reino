# LOG — REINO

Uma linha por tarefa, na ordem em que aconteceu. Horários de commit e deploy vêm do git;
os demais, de `date` no momento do registro. O que não tem horário registrado aparece como "não registrado".

| Itens | Horário | Quem | O que foi feito | Evidência |
|-------|---------|------|-----------------|-----------|
| A1 | 2026-09-18 (não registrado) | Vyra | Zip aplicado com `rsync --delete`; backup da pasta anterior | `diff -rq` sem diferenças |
| A2 | 2026-09-18 23:40 | Vyra | Commit `ce507ff` por cima do `main` existente e push | `git log` |
| A3 | 2026-09-19 (não registrado) | Vyra | Pasta ligada ao `o-reino` (Babel OS); GitHub já conectado | `vercel git connect` → "already connected" |
| A4,B1 | 2026-09-19 (não registrado) | Vyra | Migrações `cliques_cidade_uf` e `seguranca_rls_por_dono` | testes anon/membro/admin; verificador sem erros |
| B2–B5 | 2026-09-19 01:49 | Vyra | Commit `0068599` e deploy de produção | rotas 200; teste de roda em produção: 300px em todas as áreas |
| C1–C4 | 2026-09-19 02:20 | Vyra | Pasta `.claude`, `CLAUDE.md`, hook testado nos 4 eventos | primeira linha de `hook-ingestao.tsv` |
| D1–D3 | 2026-09-19 02:35 | Vyra | Aula guardada, método e proibições no `CLAUDE.md`, agentes no esqueleto de 5 partes | este arquivo e `TODO.md` |
| E | 2026-09-19 02:59 | Vyra | Commit e push de `.claude/`, `CLAUDE.md`, `00-comando/` e `06-aulas/` (pedido: "pode subir") | `git log`; deploy de produção conferido |
| F1 | 2026-09-19 03:06 | Vyra | Repositório GitHub tornado privado | `gh repo view` → PRIVATE; acesso anônimo 404; deploy seguinte conferido |
