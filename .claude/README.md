# .claude

## O que é esta pasta
É a configuração do Claude Code para o projeto REINO: hooks, equipe de agentes e skills.

## O que tem aqui
| Arquivo ou pasta | Para que serve |
|------------------|----------------|
| `settings.json` | Configuração compartilhada do projeto. Liga o hook de contexto em 4 eventos: `SessionStart` (início, retomada, limpeza ou compactação) e `SubagentStart` recebem o `CLAUDE.md` **completo**; `UserPromptSubmit` (cada mensagem) e `PreToolUse` (antes de cada ferramenta) recebem só o **resumo**. |
| `settings.local.json` | Ajuste local desta máquina (fora do git): desliga os servidores MCP `computer-control` e `supabase` do `.mcp.json` (o Supabase já vem pelo conector do claude.ai). |
| `hooks/injetar-contexto.sh` | Script do hook. Lê o `CLAUDE.md` da raiz e devolve ao Claude Code como `additionalContext`. No modo `completo`, manda o arquivo inteiro; no modo `resumo`, só o trecho entre as marcas `REGRAS-ESSENCIAIS`, para gastar menos tokens. Cada execução é registrada em `00-comando/logs/hook-ingestao.tsv` (data, evento, modo, bytes). |
| `dominic/` | **Dominic** — guardião de alterações (veja a seção abaixo). |
| `agents/` | A equipe de subagentes (tabela abaixo). Cada arquivo tem um frontmatter com nome, modelo, ferramentas e skills. |
| `skills/` | 10 skills: as 9 do mercado (tabela abaixo) e a `dominic-skill-creator`, própria. Cada pasta tem um `SKILL.md` e a licença. |

### Equipe (`agents/`)
A líder é a Vyra (Opus 5), que conversa com o usuário e distribui as tarefas.

| Arquivo | Agente | Modelo | Papel | Skills |
|---------|--------|--------|-------|--------|
| `ourives.md` | Ourives | Sonnet | Operário de frontend e motion: páginas HTML/CSS/JS, mapa do Brasil, escada de níveis, formulário | frontend-design, theme-factory, webapp-testing, systematic-debugging, verification-before-completion |
| `heraldo.md` | Heraldo | Sonnet | Operário de identidade visual: insígnias SVG e manual de marca | canvas-design, theme-factory, verification-before-completion |
| `theus.md` | Theus | Sonnet | Professor: organização didática, aulas e histórico para alunos | doc-coauthoring, writing-plans, skill-creator, verification-before-completion |
| `escudeiro.md` | Escudeiro | Haiku | Auxiliar do Ourives: QA simples (servidor local, screenshots, links, console, contraste); não edita código, só relata | webapp-testing, verification-before-completion |
| `escriba.md` | Escriba | Haiku | Auxiliar de documentação: READMEs, índices, conferência de logs e do TODO | verification-before-completion |

### Skills (`skills/`)
| Pasta | Para que serve | Origem |
|-------|----------------|--------|
| `frontend-design` | Direção visual para interfaces que não pareçam modelo pronto | anthropics/skills |
| `theme-factory` | Aplicar temas de cor e fonte a documentos e páginas | anthropics/skills |
| `canvas-design` | Criar peças visuais estáticas em PNG e PDF (inclui fontes com licença OFL) | anthropics/skills |
| `webapp-testing` | Testar páginas locais com Playwright e tirar screenshots | anthropics/skills |
| `doc-coauthoring` | Fluxo para escrever documentação em conjunto | anthropics/skills |
| `skill-creator` | Criar, melhorar e medir skills | anthropics/skills |
| `verification-before-completion` | Exigir evidência antes de dizer que algo está pronto | obra/superpowers |
| `writing-plans` | Escrever plano antes de tarefas com vários passos | obra/superpowers |
| `systematic-debugging` | Investigar a causa de um erro antes de corrigir | obra/superpowers |

As skills da obra/superpowers receberam uma cópia do `LICENSE` do repositório (MIT). A `doc-coauthoring` não traz arquivo de licença nem no repositório de origem.

### Dominic (`dominic/` + skill `dominic-skill-creator`)
Hook que roda a cada alteração de arquivo (Edit, Write, MultiEdit, NotebookEdit e Bash):

| Momento | O que faz |
|---------|-----------|
| antes (`PreToolUse`) | Backup do arquivo em `dominic/backups/` (7 dias, até 400 pontos); em Bash, marca o horário para achar o que mudou |
| depois (`PostToolUse`) | Checa sintaxe (JS com `node --check`, JSX com o mesmo Babel 7.29.0 do app, JSON, CSS, SH, PY, SVG); **bloqueia** segredo no código e SQL que desliga RLS; avisa `console.log`, `debugger`, `eval`, `innerHTML` com `${}`, cor fora dos tokens, fonte fora da identidade e texto com risco jurídico; indica a skill da área pelo `dominic/catalogo.json` |

| Arquivo | Para que serve |
|---------|----------------|
| `dominic/dominic.py` | O hook. Também: `python3 .claude/dominic/dominic.py restaurar <arquivo> [n]` e `backups <arquivo>` |
| `dominic/checar-jsx.js` + `vendor/` | Checagem de JSX com o Babel do app (hash igual ao `integrity` do `index.html`) |
| `dominic/catalogo.json` | Áreas do projeto → skills instaladas e candidatas do mercado |
| `dominic/SKILLS-VALIDADAS.md` | Registro de cada skill aceita, recusada ou criada, com o motivo |
| `skills/dominic-skill-creator/` | Como achar, validar (4 passos), instalar com aprovação ou criar uma skill |

O Dominic **não instala nada do mercado sozinho**: ele indica, e a instalação passa pela validação e pela aprovação do fundador. O registro de cada alteração fica em `00-comando/logs/dominic.tsv`.

Atenção: a identidade do Reino no `CLAUDE.md` prevalece sobre qualquer skill que sugira outras fontes ou cores.

## Por onde começar
1. Abra `settings.json` e veja quais eventos disparam o hook.
2. Leia `hooks/injetar-contexto.sh` (é curto e comentado).
3. Abra um agente, por exemplo `agents/escriba.md`, e compare o frontmatter com a tabela acima.
4. Para entender as regras que o hook injeta, leia o `CLAUDE.md` da raiz (o resumo é o bloco entre `REGRAS-ESSENCIAIS:INICIO` e `REGRAS-ESSENCIAIS:FIM`).

## Quem criou
Hook, `settings.json`, agentes, skills instaladas e README: Vyra (Opus 5), 19/09/2026.
