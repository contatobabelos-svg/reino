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
  ciano no topo. Use os tokens de `design-system/tokens/*.css` e as classes `hg-*`; nunca cor solta.

**Onde fica o quê.**
- App: `app/` (JSX via Babel no navegador), com uma subpasta por tipo de arquivo.
  O site é montado por `montar-site.sh`; `arquivo/` guarda o que é antigo e nunca vai ao ar.
- Deploy: push no `main` de `contatobabelos-svg/reino` → Vercel `o-reino`
  (time Babel OS), https://o-reino.vercel.app.
- Banco: Supabase `fxlansnepokjxdikxocb`. Regras de acesso em `supabase/`.
  Toda mudança de esquema vira arquivo novo em `supabase/` e passa pelo verificador
  de segurança. O app só usa a chave publicável; nunca coloque chave secreta no código.

**Rolagem.** Uma rolagem por tela (`.hg-content`). Globo e mapa só dão zoom com
Ctrl/⌘ + roda ou dois dedos, fora da tela cheia do Mapa Reino.

**Proibido publicar** (risco jurídico: pirâmide, CVM, Banco Central — ver
`docs/aulas/AULA-COMPLETA-13-09.md`, Módulo 5): promessa de renda, "% do lucro",
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

```
app/                  o app do Reino — é o que vai ao ar
├─ index.html         shell do app; mapa.html e pre-cadastro.html são as outras páginas
├─ nucleo/            App.jsx (rotas, sessão) e app-layout.js
├─ telas/             uma tela por arquivo: *Screen.jsx, LoginImersivo.jsx (login atual: cadastro em carrossel + barra de comando), PortalLogin.jsx e LoginScreen.jsx (reservas)
├─ componentes/       peças reaproveitadas: FotoAvatar, Stories, RostoPixel, MapaPanel, ReinoMapa, NetworkMapLocal, globo.js
├─ servicos/          acesso ao banco: contas.js, afiliados.js, fotos.js
├─ estilos/           CSS do shell, do layout e dos logins
├─ dados/             geo-*, municipios-tudo.js, municipios/*.json, data.js
│                     (data.js = só regras do Reino + formato vazio; os dados fictícios foram
│                     apagados em 22/09 e estão em arquivo/dados-demo/)
└─ assets/            imagens e vídeos do login (assets/login/): `reino-fundo.webm`/`.mp4` +
                      `reino-fundo-poster.webp` são a cena do fundo já renderizada (o que toca
                      hoje); `reino-cena.webp`/`reino-neon.png` alimentam a cena JS de reserva,
                      `reino-animado.html` é a página original e `fundo-login.*`, o vídeo antigo
design-system/        tokens/, components/ (babel-ui.css = hg-*), styles.css, _ds_bundle.js, guidelines/, SKILL.md
supabase/             migrações em ordem de data, functions/ e README do banco
scripts/              renderizar-fundo.cjs + render-fundo/ (pré-renderizam a cena do login em
                      vídeo), medir-fundo.cjs (mede a fluidez do fundo no Chrome com GPU) e
                      preparar-video.sh (vídeo do fundador → app/assets/login)
docs/                 contexto/ (pesquisa de design), aulas/ (origem do método), referencias/ (prints e fotos)
00-comando/           TODO.md, PLANO-ENTREGA.md, MAPA-TELAS-BOTOES.md e logs/
arquivo/              fora do ar: produto-original/, index exportado antigo, exports com login demo
.claude/              hooks, agentes e skills do Claude Code (ver .claude/README.md)
montar-site.sh        build da Vercel: copia app/ e o necessário do design-system/ para site/
```

Script ou CSS novo entra na subpasta certa de `app/` e é listado no `app/index.html`
(e em `mapa.html`/`pre-cadastro.html`, se usado lá). O app referencia o design system
por `../design-system/`, que o `montar-site.sh` copia para `site/design-system/`.

## Testar localmente

```sh
sh montar-site.sh && cd site && python3 -m http.server 8123
```

Abra http://localhost:8123. Só entra conta real do Supabase (não há mais modo demonstração no login).
