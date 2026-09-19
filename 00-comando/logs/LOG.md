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
| F2 | 2026-09-19 03:17 | Vyra | Deploy do repo privado veio BLOCKED (autor `diegobabel` ≠ dono Hobby); repositório voltou a público por escolha do fundador | API da Vercel: `readyState: BLOCKED`; `gh repo view` → PUBLIC |
| G2–G7 | 2026-09-19 03:29 | Vyra | Dominic: hook de backup, sintaxe, segredos, avisos e indicação de skill; skill `dominic-skill-creator`; catálogo e registro de skills validadas | 6 testes simulados (JSX quebrado e segredo bloqueados, restauração ok, Bash detectado); teste ao vivo: Edit no TODO gerou backup e indicação |
| G1 | 2026-09-19 03:31 | pesquisador (Sonnet 5) + Vyra | Relatório de design/UX com 55 fontes; Vyra conferiu o top 5 e corrigiu a data da Popover API | `01-contexto/design-ux-2026/RELATORIO.md`; web.dev/blog/popover-baseline |
| H1–H3 | 2026-09-19 03:48 | Vyra | 17 buscas na Google Search Master Mega /maps (capitais); 358 empresas em `empresas_reais` via função temporária com senha de uso único, apagada em seguida | SQL: 358 linhas, 18 UFs; função removida; get_advisors sem novos alertas |
| I1–I3 | 2026-09-19 03:48 | Vyra | Tabelas da Academy, chave no Vault, Edge Function `academy-importar` publicada | sem login → 401; CORS preflight 200; anon não lê o segredo (42501) |
| J1–J2 | 2026-09-19 03:55 | Vyra | ip-to-location4 recusada pelo fornecedor (401); botão do globo passou a usar GPS → OpenStreetMap → IP → perfil | Chrome headless com GPS simulado: Campinas → SP/Campinas/Cambuí; Recife → PE/Recife/Boa Viagem |
| I4 | 2026-09-19 03:57 | Ourives (Sonnet 5) + Vyra | AcademyScreen lê trilhas/aulas do banco; formulário de admin chama academy-importar; aulas locais antigas preservadas | Vyra conferiu: JSX ok, sem chave no código, chamadas REST + função; screenshots 1440/390/admin sem erros de console |
| H4 | 2026-09-19 04:02 | Ourives (Sonnet 5) + Vyra | Camada "Empresas da região" no ReinoMapa (Supabase, cache por UF, cartão com fonte e "não é membro do Reino") | Vyra: JSX ok; fluxo globo→mapa com GPS em Recife buscou empresas_reais uf=PE e mostrou o chip Região |
