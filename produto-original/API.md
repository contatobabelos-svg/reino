# Babel OS · Reino — contrato da API

O app não tem dados embutidos. Em **Configurações** informe a URL base e, se houver, um token
(enviado como `Authorization: Bearer <token>`). A API precisa liberar CORS para a origem do app.
Todos os endpoints são `GET` e respondem JSON; lista vazia (`[]`) mostra o estado "nenhum registro".

Legenda da origem: **✅ existe no Babel OS** (tabelas `reino_*`) · **🟡 derivável** · **🆕 módulo novo, sem tabela ainda**

## Dashboard

| Endpoint | Painel | Formato | Origem |
|---|---|---|---|
| `/reino/kpis` | KPIs | `{ "empresas":{"valor":412,"variacao":6}, "avaliacoes":{...}, "cidades":{...}, "notaMedia":{"valor":4.6,"variacao":0.1,"unidadeVariacao":""} }` | ✅ `count(reino_empresas)`, `count(reino_avaliacoes)`, `count(distinct cidade_id)`, `avg(estrelas)` |
| `/reino/regioes` | Mapa Reino, Geografia | `[ {"nome":"Sudeste","empresas":190,"nota":4.7,"cidades":[{"nome":"…","estado":"SP","empresas":12}], "x":0.6,"y":0.66} ]` — `x`/`y` opcionais (0–1) | ✅ `reino_regioes` › `reino_estados` › `reino_cidades` + contagem de `reino_empresas` |
| `/social/feed?limite=N` | Rede social | `[ {"autor":"…","empresa":"…","quando":"5 min","texto":"…","curtidas":12,"comentarios":3} ]` | 🆕 não existe tabela de posts |
| `/conquistas/resumo` | Conquistas | `{ "progresso":68, "tituloAtual":"Barão", "proximoTitulo":"Visconde", "metricas":[{"nome":"Avaliações feitas","rotulo":"34 / 50","percentual":68}] }` | 🆕 títulos existem (`reino_titulos`), mas nada liga usuário ↔ título |
| `/reino/match?limite=N` | Match Reino | `[ {"nome":"…","nicho":"…","cidade":"…","compatibilidade":94} ]` | 🟡 hoje é `empresasRecomendadas` + `NICHOS_COMPLEMENTARES`, só no front de `Reino.tsx` |
| `/reino/reputacao` | Score de Reputação | `{ "media":4.6, "total":1893, "distribuicao":[{"estrelas":5,"quantidade":1300}] }` | ✅ agregação de `reino_avaliacoes.estrelas` |
| `/reino/analises?periodo=mes` | Cadastros, Nichos | `{ "cadastros":[{"rotulo":"S1","valor":20}], "nichos":[{"nome":"Advocacia","percentual":32}] }` | ✅ `reino_empresas.criado_em`, `nicho_id` › `reino_nichos` |
| `/perfil` | Cabeçalho | `{ "titulo":"Barão" }` | 🆕 |
| `/afiliado` | Link de afiliado (topo) | `{ "codigo":"a1b2c3d4", "link":"https://www.babel-os.com/cadastro?ref=a1b2c3d4", "indicados":7, "comissoesPendentes":245.5 }` | ✅ `profiles.referral_code` (link `/cadastro?ref=`), `count(profiles where referred_by = auth.uid())` ou RPC `get_minha_rede`, `sum(multinivel_comissoes.valor_comissao) where beneficiario_id = auth.uid() and status='pendente'` |

## Páginas

| Endpoint | Página | Formato | Origem |
|---|---|---|---|
| `/reino/filtros` | Pesquisa | `{ "nichos":[{"nome":"…"}], "estados":[…], "cidades":[…] }` | ✅ `reino_nichos`, `reino_estados`, `reino_cidades` |
| `/reino/empresas?q=&nicho=&estado=&cidade=&regiao=` | Pesquisa | `[ {"nome":"…","nicho":"…","cidade":"…","estado":"…","abrangencia":"Local","nota":4.5,"avaliacoes":12} ]` | ✅ `reino_empresas` + média de `reino_avaliacoes` |
| `/reino/vitrine` | Vitrine | `[ {"regiao":"…","nome":"…","nicho":"…","cidade":"…","nota":4.8} ]` | ✅ 1 empresa por região (hoje sorteada no front) |
| `/reino/titulos` | Hierarquia | `[ {"nome":"…","descricao":"…","mensalidade":99.9} ]` em `ordem` | ✅ `reino_titulos` |
| `/guildas/minha` | Guildas | `{ "nome":"…", "lider":"…", "pontos":1280, "membros":[{"nome":"…","titulo":"Barão"}] }` | 🆕 sugestão: `reino_guildas (id, nome, nicho_id, regiao_id, lider_id, criado_em)` |
| `/guildas?q=` | Guildas | `[ {"id":"…","nome":"…","nicho":"…","regiao":"…","membros":12,"pontos":3400} ]` | 🆕 sugestão: `reino_guilda_membros (guilda_id, usuario_id, papel, entrou_em)` |
| `/conquistas` | Conquistas | `[ {"nome":"…","descricao":"…","desbloqueada":false,"progresso":40} ]` | 🆕 |
| `/revista` | Revista | `[ {"edicao":"Nº 1","data":"…","titulo":"…","resumo":"…","url":"…"} ]` | 🆕 |
| `/notificacoes`, `/mensagens` | Cabeçalho | `[ {"autor":"…","titulo":"…","texto":"…","quando":"…"} ]` | 🆕 |

## Widgets (preferências)

Todo painel é um widget, no mesmo modelo do desktop do Babel OS (`DESKTOP_WIDGETS` + `preferencias_ui.widgets_ativos` / `widgets_posicoes`).
Sem API, o layout fica salvo no navegador (`localStorage["babel.widgets.<pagina>"]`). Com API:

| Método | Endpoint | Corpo / resposta |
|---|---|---|
| `GET` | `/preferencias?pagina=inicio` | `{ "widgets_ativos":["kpi-empresas","mapa",…], "widgets_layout":{"kpis":[…],"esquerda":["rede-social"],"centro":["mapa"],"direita":["conquistas","match"],"analitico":["reputacao","cadastros","nichos"]} }` |
| `PUT` | `/preferencias` | `{ "pagina":"inicio", "widgets_ativos":[…], "widgets_layout":{…} }` (enviado 400 ms após cada mudança) |

IDs dos widgets do Dashboard: `afiliado`, `kpi-empresas`, `kpi-avaliacoes`, `kpi-cidades`, `kpi-notaMedia`, `rede-social`, `mapa`, `conquistas`, `match`, `reputacao`, `cadastros`, `nichos`.
Zonas e o que aceitam: `topo` (afiliado) · `kpis` (kpi) · `esquerda`, `direita`, `analitico` (coluna) · `centro` (largo, coluna).
Sugestão no Supabase: coluna `widgets_layout jsonb` em `preferencias_ui`, ao lado das que já existem.

## Pré-cadastro (`pre-cadastro.html`)

Tela pública, antes do cadastro. Aceita `?ref=<codigo>` (link de afiliado), `?titulo=`, `?regiao=` e `?estado=`.
O botão "Continuar cadastro" leva para `https://www.babel-os.com/cadastro?ref=…&titulo=…&territorio=…`.
Regra do mapa por título (pelo nome, sem acento): **Imperador** → Brasil · **Rei** → Brasil com regiões · **Príncipe** → região com estados · **qualquer outro (Duque pra baixo)** → estado com cidades.

| Endpoint | Uso | Formato | Origem |
|---|---|---|---|
| `/reino/titulos` | Seletor de título | já descrito acima (usa `nome` e `mensalidade`) | ✅ `reino_titulos` |
| `/afiliado/resolver?ref=` | "Você foi indicado por…" | `{ "nome":"…" }` | ✅ RPC `resolver_codigo_indicacao` + `profiles.full_name` |
| `/reino/mapa?nivel=&regiao=&estado=&nicho=` | Números no mapa | `{ "total":412, "regioes":{"sudeste":190,…}, "estados":{"SP":120,…}, "cidades":[{"nome":"Campinas","lat":-22.91,"lng":-47.06,"empresas":22}] }` | ✅ contagens de `reino_empresas`; 🆕 `lat`/`lng` das cidades (`reino_cidades` não tem coordenadas) |
| `/noticias?temas=afiliados,financas` | Opção "Notícias" | `[ {"tema":"afiliados\|financas","titulo":"…","resumo":"…","fonte":"…","data":"…","url":"…"} ]` | 🆕 |
| `/busca-inteligente?q=&regiao=&estado=` | Opção "Busca IA" | `{ "resposta":"texto", "empresas":[{"nome":"…","nicho":"…","cidade":"…","estado":"…","nota":4.5}] }` | 🆕 (pode usar um agente de IA do Babel sobre `reino_empresas`) |

Contornos dos estados: `js/brasil.js`, gerado de `@svg-maps/brazil` 2.0.0 (Victor Cazanave, CC BY 4.0). Cidades são posicionadas por aproximação linear de lat/lng.

## Globo do Reino (Dashboard e Mapa Reino)

Navegação: **Terra → Brasil → Estado → Cidade → Bairro → Empresários**, e a **Lua** com a torre da Babel (sede).
Contornos locais: `js/geo-mundo.js` (Natural Earth via world-atlas, ISC), `js/geo-brasil.js` e `dados/municipios/<UF>.json` (malha IBGE, 5.570 municípios; carregados só ao entrar no estado).

| Endpoint | Nível | Formato | Origem |
|---|---|---|---|
| `/reino/mapa` | Brasil | `{ "total":29, "estados":{"SP":7,…} }` (já descrito) | ✅ contagem de `reino_empresas` por `estado_id` |
| `/reino/mapa?estado=SP` | Estado | `{ "cidades":[{"nome":"Campinas","empresas":3}] }` — nomes iguais aos do IBGE | ✅ contagem por `cidade_id` › `reino_cidades.nome` |
| `/reino/bairros?cidade=&estado=` | Cidade | `[ {"nome":"Cambuí","lat":-22.89,"lng":-47.05,"empresas":1,"empresarios":1} ]` | 🟡 `reino_empresas.bairro` existe; 🆕 faltam `lat`/`lng` (geocodificar o endereço) |
| `/reino/empresarios?cidade=&bairro=&estado=` | Bairro | `[ {"nome":"…","titulo":"Duque","empresas":[{"nome":"…","nicho":"…","nota":4.6}]} ]` | ✅ `reino_empresas.criado_por` › `profiles.full_name`; 🆕 título do usuário |

## Rotas do servidor local (`servir.mjs`) — chaves só no servidor

Rode a partir de `Downloads/`: `node --env-file=vyzor-local/.env vyzor-local/servir.mjs` (veja `vyzor-local/.env.example`).

| Rota | Variável | Fonte | Resposta |
|---|---|---|---|
| `GET /api/cotacao?simbolo=B3SA3` | `BRAPI_TOKEN` | brapi `v2/stocks/quote` | `results[0].data` da brapi |
| `GET /api/clima?cidade=Campinas,SP` | `HGBRASIL_KEY` | HG Brasil `weather` | `results` (temp, description, humidity, forecast…) |
| `GET /api/bolsa?tickers=B3:PETR4,B3:VALE3` | `HGBRASIL_KEY` | HG Brasil `v2/finance/quotes` | lista `results` (ticker, quote, market, dividends…), cache de 15 s |

Erros: `400` parâmetro inválido · `404` não encontrado · `429` limite · `503` variável não definida · `502` fonte recusou (credencial) · `504` tempo esgotado.
Atenção: a HG Brasil responde **HTTP 200 mesmo com chave inválida** (`valid_key:false` no clima, que ainda devolve São Paulo; `key_status:"invalid"` nas cotações) — os clientes em `servidor/hgbrasil.mjs` tratam isso como erro.

## Hook de login (front)

`window.BabelSessao.aoLogar((perfil, { novo }) => …)` — dispara quando `/perfil` responde (ou há endereço salvo em Configurações).
`novo` é `true` só no primeiro carregamento da sessão ou após salvar Configurações. O Dashboard usa esse hook para o globo voar até `perfil.uf › perfil.cidade › perfil.bairro`.
`/perfil` passa a aceitar: `{ "nome":"…", "titulo":"Duque", "cidade":"Campinas", "uf":"SP", "bairro":"Cambuí" }`.
