# REINO · Babel OS

Rede de negócios brasileira montada como um reino: cada empresa recebe um título
de nobreza (Barão → Imperador) que define o território que comanda, entra em
guildas, recebe matches e aparece no globo/mapa do Reino. App único em pt-BR.

<!-- REGRAS-ESSENCIAIS:INICIO -->
## Regras essenciais

**Equipe.** A líder é a Vyra (sessão principal, Opus 5): conversa com o usuário e
distribui tarefas. Operários: Ourives (frontend e motion), Heraldo (identidade
visual), Theus (professor). Auxiliares: Escudeiro (QA simples) e Escriba (docs).

**Idioma.** Tudo em português do Brasil: interface, comentários, commits e docs.

**Identidade do Reino (prevalece sobre qualquer skill).**
- Fontes: **Exo 2** (títulos, `--font-d`) e **Inter** (texto, `--font`). Nenhuma outra.
- Cores: fundo `--bg #030817`; ciano `--cyan #3fe3ff`; azul `--blue #3b82ff`;
  violeta `--violet #8b5cff`; magenta `#e04bff`; verde `#34e6a6`; âmbar `#ffb547`;
  vermelho `#ff4d7a`; ouro `--gold #f5c76a`. Texto `#e6efff`.
- Visual holograma + neon: painéis de vidro com borda em gradiente e faixa de luz
  ciano no topo. Use os tokens de `tokens/*.css` e as classes `hg-*`; nunca cor solta.

**Onde fica o quê.**
- App: `ui_kits/babel-os/` (JSX via Babel no navegador). O `index.html` da raiz é
  um pacote exportado antigo — não edite; o site é montado por `montar-site.sh`.
- Deploy: push no `main` de `contatobabelos-svg/reino` → Vercel `o-reino`
  (time Babel OS), https://o-reino.vercel.app.
- Banco: Supabase `fxlansnepokjxdikxocb`. Regras de acesso em `supabase/`.
  Toda mudança de esquema vira arquivo novo em `supabase/` e passa pelo verificador
  de segurança. O app só usa a chave publicável; nunca coloque chave secreta no código.

**Rolagem.** Uma rolagem por tela (`.hg-content`). Globo e mapa só dão zoom com
Ctrl/⌘ + roda ou dois dedos, fora da tela cheia do Mapa Reino.

**Proibido publicar** (risco jurídico: pirâmide, CVM, Banco Central — ver
`06-aulas/AULA-COMPLETA-13-09.md`, Módulo 5): promessa de renda, "% do lucro",
fundo, banco ou crédito próprio, escassez ou urgência falsa, contador inflado,
insígnia inventada, dados de `_privado/`. Preços de mensalidade e percentuais de
comissão estão **em disputa** entre os sócios: não crie nem altere número novo;
os que já existem no app estão listados como pendência em `00-comando/TODO.md`.

**Método.** Todo pedido do fundador entra literal em `00-comando/TODO.md`, numa
seção nova por letra (A, B, C...). Cada tarefa concluída vira uma linha em
`00-comando/logs/LOG.md`; cada agente loga em `00-comando/logs/agente-<nome>.md`
com horário real (`date "+%Y-%m-%d %H:%M"`). Decisão de identidade, preço ou
permissão é da Vyra com o fundador, nunca do operário.

**Agentes.** Dispare sem `name` e com `model` explícito; na primeira resposta o
agente confirma o próprio modelo. Agente novo em `.claude/agents/` só vale depois
de reiniciar a sessão. Testes de navegador em paralelo: cada agente com sua porta.

**Dominic.** Toda alteração passa pelo hook `.claude/dominic/dominic.py`: backup
antes, sintaxe e segredos depois. Bloqueou → corrija ou `python3 .claude/dominic/dominic.py
restaurar <arquivo>`. Indicou skill do mercado ou lacuna → skill `dominic-skill-creator`
(nada do mercado entra sem validação de 4 passos e aprovação do fundador).

**Antes de dizer "pronto".** Mostre evidência: teste rodado, screenshot, resposta
da API. Sem evidência, diga o que falta verificar.
<!-- REGRAS-ESSENCIAIS:FIM -->

## Estrutura

| Caminho | Conteúdo |
|---------|----------|
| `ui_kits/babel-os/` | App do Reino: telas `*Screen.jsx`, `App.jsx`, `contas.js`, `afiliados.js`, `fotos.js`, `globo.js`, CSS do shell |
| `tokens/`, `styles.css` | Tokens de cor, tipo, espaço, efeitos e movimento |
| `components/` | Componentes React do design system e `babel-ui.css` (`hg-*`) |
| `_ds_bundle.js` | Design system compilado, carregado pelo app |
| `supabase/` | Migrações aplicadas e README do banco |
| `montar-site.sh`, `vercel.json` | Build da Vercel: copia o app para `site/` |
| `produto-original/` | Cópia do `app/` original do repositório vyzor, só para comparação |
| `.claude/` | Hooks, agentes e skills do Claude Code (ver `.claude/README.md`) |
| `00-comando/` | `TODO.md` (pedidos por seção) e `logs/` (`LOG.md`, log de cada agente, contador do hook) |
| `06-aulas/` | Material de aula; `AULA-COMPLETA-13-09.md` é a origem do método |

## Testar localmente

```sh
sh montar-site.sh && cd site && python3 -m http.server 8123
```

Abra http://localhost:8123. Só entra conta real do Supabase (não há mais modo demonstração no login).
