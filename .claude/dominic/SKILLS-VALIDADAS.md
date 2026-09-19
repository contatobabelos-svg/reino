# Skills validadas — registro do Dominic

Toda skill instalada, recusada ou criada passa pelos 4 passos da skill
`dominic-skill-creator` e ganha uma linha aqui, com o motivo. Dados de repositório
lidos na API do GitHub em 19/09/2026.

## Repositórios de origem

| Repositório | ⭐ | Licença | Último push | Observação |
|-------------|----|---------|-------------|------------|
| `anthropics/skills` | 177.063 | sem licença na raiz; cada skill traz `LICENSE.txt` | 2026-09-10 | licença conferida por pasta |
| `obra/superpowers` | 288.598 | MIT | 2026-09-19 | `LICENSE` copiado para cada skill instalada |
| `supabase/agent-skills` | 2.633 | MIT | 2026-08-12 | candidata da área **banco**; ainda não validada (passos 2–4 pendentes) |

## Instaladas

| Skill | Origem | Licença | Passo 3 (comandos de risco) | Decisão |
|-------|--------|---------|-----------------------------|---------|
| `frontend-design` | anthropics/skills | LICENSE.txt | nenhum | sim — direção visual; a identidade do CLAUDE.md prevalece |
| `theme-factory` | anthropics/skills | LICENSE.txt | nenhum | sim — como método, nunca como paleta |
| `canvas-design` | anthropics/skills | LICENSE.txt (fontes OFL) | nenhum | sim — insígnias e peças estáticas |
| `webapp-testing` | anthropics/skills | LICENSE.txt | nenhum | sim — QA com Playwright |
| `doc-coauthoring` | anthropics/skills | **sem arquivo de licença** na pasta nem no repo | nenhum | sim, com ressalva: só uso interno, não redistribuir |
| `skill-creator` | anthropics/skills | LICENSE.txt | `claude -p` em `scripts/run_eval.py` e `improve_description.py` | sim — só roda se executado à mão, para medir descrições; gasta tokens |
| `verification-before-completion` | obra/superpowers | MIT | nenhum | sim — obrigatória para todos |
| `writing-plans` | obra/superpowers | MIT | nenhum | sim |
| `systematic-debugging` | obra/superpowers | MIT | nenhum | sim |
| `dominic-skill-creator` | própria (REINO) | — | nenhum | sim — criada em 19/09/2026 |

## Recusadas

| Skill | Origem | Motivo |
|-------|--------|--------|
| `brand-guidelines` | anthropics/skills | é a marca da Anthropic; conflita com a identidade do Reino |
| `docx`, `pdf`, `pptx`, `xlsx` | anthropics/skills | licença *source-available*, restritiva para material de aluno |
| `web-artifacts-builder` | anthropics/skills | instala dependências globais pesadas; o app não tem build |
