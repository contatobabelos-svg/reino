# TODO — REINO (app Babel OS)

Cada pedido do fundador vira uma seção por letra. `[x]` concluído com evidência no
`logs/LOG.md`; `[ ]` pendente. Nada sai desta lista sem ser feito ou descartado por escrito.

## A — "essa é a pasta atualizada do reino, vamos trabalhar nela com supabase e Vercel com dominio proprio" (18/09)
- [x] A1 Aplicar o zip `Babel OS Design System-4` na pasta (backup em `~/Downloads/Reino-backup-2026-09-18`)
- [x] A2 Repositório `contatobabelos-svg/reino` com a versão nova
- [x] A3 Projeto Vercel `o-reino` (time Babel OS) ligado ao GitHub, deploy a cada push
- [x] A4 Supabase `fxlansnepokjxdikxocb` conectado ao app
- [ ] A5 Domínio próprio — `reino.com` indisponível; opções: `oreino.app`, `reinobabel.com`, `reino.com.br` (Registro.br). **Aguarda escolha do fundador**
- [ ] A6 Apagar projetos duplicados `reino` (time Babel OS e `theus-veyras-projects`). **Aguarda confirmação**

## B — "resolver as questões de segurança e de scroll na tela toda" (19/09)
- [x] B1 RLS por dono no Supabase (`supabase/2026-09-19_seguranca_rls_por_dono.sql`)
- [x] B2 Painel admin com o login do administrador; link `?adm=` removido
- [x] B3 Token do login renovado sozinho; perfil e código voltam a gravar
- [x] B4 Rolagem: globo e mapa deixam a página rolar; roda sobre cabeçalho, menu e barra inferior
- [x] B5 Site servindo os fontes (`montar-site.sh`), não o pacote antigo
- [ ] B6 Testar o painel admin logado como `adm…@reino.app` (fundador)
- [ ] B7 Ligar "proteção contra senhas vazadas" no painel do Supabase (fundador)
- [ ] B8 Restringir a chave `REINO_GOOGLE` ao domínio no Google Cloud (fundador)

## C — "crie uma pasta .claude assim" (19/09)
- [x] C1 `.claude/settings.json` + `hooks/injetar-contexto.sh` nos 4 eventos
- [x] C2 5 agentes (Ourives, Heraldo, Theus, Escudeiro, Escriba)
- [x] C3 9 skills de `anthropics/skills` e `obra/superpowers`
- [x] C4 `CLAUDE.md` com bloco `REGRAS-ESSENCIAIS` e `.claude/README.md`

## D — "use isso também" (aula de 13/09) (19/09)
- [x] D1 Aula guardada em `06-aulas/AULA-COMPLETA-13-09.md`, com nota de origem
- [x] D2 Método da aula no `CLAUDE.md`: TODO por seções, LOG, log por agente, proibições
- [x] D3 Agentes no esqueleto de 5 partes (fontes, padrões/proibido, log, entrega, confirmar modelo)
- [ ] D4 **Conflito para decidir:** o app mostra números que a aula manda não publicar —
      "Bônus acumulado R$ 245,50" no Dashboard e a tabela `COMISSAO` em `ui_kits/babel-os/afiliados.js`
      (Imperador 997 … Visconde 57, Barão)
- [ ] D5 **Conflito para decidir:** o app tem o título **Barão**; a aula define 7 níveis
      (Visconde → Imperador), sem Barão
- [ ] D6 **Conflito para decidir:** a aula usa a paleta heráldica v2 e EB Garamond (site e insígnias);
      o app usa Exo 2 + Inter e o visual holograma. Confirmar que são superfícies diferentes

## F — "pode privar o github" (19/09)
- [x] F1 Repositório `contatobabelos-svg/reino` privado
- [x] F2 Voltou a público: no plano Hobby a Vercel bloqueia deploy de repo privado quando o autor do commit (`diegobabel`) não é o dono da conta (`contatobabelos-svg`). Fundador escolheu voltar a público

## G — "quero que vá atrás das ultimas apis recentes e atualizadas em desing tecnologico e ux. Também preciso de uma skill que gera skills de acordo com o que meu sistema precisar para sempre estar protegido, seguro e anti quebra de código, com backup e limpeza de códigos errados ou mal feitos, nome desse criador de skills é Dominic Skill Creator. ele é uma hook que é ativada sempre que acontece alguma alteração, ele analisa o que é a mudança e tras a melhor skill do mercado para resolver ou criar aquilo." (19/09)
- [x] G1 Pesquisa: APIs e referências recentes de design tecnológico e UX, com fonte e data (`01-contexto/design-ux-2026/RELATORIO.md`)
- [x] G2 Dominic Skill Creator — hook disparado a cada alteração de arquivo (`.claude/dominic/dominic.py`)
- [x] G3 Backup automático antes de cada alteração, com limpeza dos backups antigos (7 dias / 400)
- [x] G4 Anti-quebra: checagem de sintaxe por tipo de arquivo; bloqueia e devolve o erro
- [x] G5 Limpeza: detectar segredo, `debugger`, `console.log` solto e código mal feito
- [x] G6 Análise da mudança → skill certa (instalada, do mercado com validação, ou criada nova)
- [x] G7 Skill `dominic-skill-creator` com o processo de validação de 4 passos da aula (Módulo 1.4)
- [ ] G8 Validar `supabase/agent-skills` (candidata da área banco) — passos 2 a 4 e aprovação do fundador

## H — "use essa chave no app para criar empresas reais nos estados, pelo menos um por estado, 2 por cidade e 3 por bairro: [chave RapidAPI omitida — nunca registrar]" (19/09)
- [x] H1 A chave assina a **Google Search Master Mega** (`/maps`), não a Local Business Data. Plano: 20 req, zera em 21/09 10:02; 1 de reserva
- [x] H2 Chave no Vault do Supabase (`segredo_rapidapi()` só para service_role); nunca no app nem no git
- [x] H3 Tabela `empresas_reais` + 358 empresas: 18 estados, 21 cidades, 29 bairros com 3+
- [ ] H5 Após 21/09 10:02: os 9 estados que faltam (PB, RN, AL, PI, SE, RO, AC, AP, RR); a cota nova tem 20 chamadas
- [ ] H6 Bairros sob demanda (3 por bairro ao abrir no mapa) — exige plano maior
- [x] H4 Mostrar no mapa como camada "empresas da região", separada de "Empresas do Reino" (não é membro)

## I — "isso é para o reino academy poder subir videos via url do youtube, ja montando as estruturas" (API youtube138 na RapidAPI; chave omitida) (19/09)
- [x] I1 Tabelas `academy_trilhas` e `academy_aulas` no Supabase (leitura para todos, escrita só admin)
- [x] I2 Edge Function `academy-importar` (admin): vídeo via oEmbed sem chave; canal via youtube138
- [x] I3 Vídeo → aula na trilha do canal (criada sozinha); canal → trilha com 30 mais recentes
- [ ] I5 **youtube138 não está assinada** (403): assinar para importar canal inteiro; testar a resposta real depois
- [x] I4 AcademyScreen lendo do banco e formulário de admin chamando a função

## J — "essa para o botão que mostra a minha localização" (API ip-to-location4 na RapidAPI; chave omitida) (19/09)
- [x] J1 Testada: assinatura existe (plano 500 mil), mas o fornecedor responde 401 "Invalid API key" nas duas formas — API quebrada do lado deles; não usada
- [x] J2 Botão "minha localização" no globo: GPS do aparelho (com permissão) → OpenStreetMap (bairro/cidade/UF); sem GPS → cidade por IP (ipwho.is); por último, endereço do perfil

## K — Achado do Ourives: `_ds_bundle.js` sobrescrevia `contas.js`/`fotos.js`/`afiliados.js` (19/09)
- [x] K1 Corrigido pela ordem dos scripts em `ui_kits/babel-os/index.html` (os três carregam depois do bundle); em produção `ReinoContas.token` era `undefined` → painel admin e importação da Academy não funcionavam
- [ ] K2 Regenerar o `_ds_bundle.js` sem embutir esses três arquivos (correção de raiz; depende da ferramenta que gera o bundle)
- [x] K3 Confirmado pelo fundador em L ("pode criar tudo"): o Ourives relatou pedidos que não passaram pela Vyra — portal de Notícias (Google News13 + News Briefs), wft-geo-db no mapa, spotify23 e Robomatic AI (chatbot). Código de Notícias guardado fora do repositório, não publicado; APIs testadas responderam "not subscribed"

## L — "pode criar tudo, o que eu não gostar eu tiro" (sobre K3: Notícias, wft-geo-db no mapa, spotify23, Robomatic AI) (19/09)
- [x] L1 Conferido: News13, GeoDB e Spotify23 "not subscribed"; Robomatic assinada mas fornecedor fora do ar (502). Usadas fontes gratuitas: Google News RSS, IBGE, Deezer, base própria
- [x] L2 Edge Function `reino-apis` publicada (rotas fixas: noticias, cidade, musica, assistente; sem chave)
- [x] L3 Notícias do Reino (tela guardada + rotas news13/briefs)
- [x] L4 GeoDB: dados da cidade (população, etc.) no painel do mapa
- [x] L5 Música (spotify23): tela de busca/trilha sonora
- [x] L6 Assistente do Reino (Robomatic AI) com filtro das proibições jurídicas
- [ ] L7 Ligar as APIs da RapidAPI quando assinadas (News13, GeoDB, Spotify23) e Robomatic quando o fornecedor voltar
- [ ] L8 População no globo fica atrás do mapa 2D quando ele abre (MapaPanel troca para ReinoMapa ao sair da Terra) — decidir onde mostrar

## M — "deixe mais cara de site de noticias o app de noticias e deixe um bloco tambem no dasboard, com a musica e o assistente com um rosto em pixels vivos que mexe a boca quando responde" (19/09)
- [x] M1 Notícias com cara de portal (manchete principal, editorias, colunas)
- [x] M2 Blocos no Dashboard: Notícias, Música e Assistente
- [x] M3 Assistente com rosto em pixel art vivo (pisca, respira) que mexe a boca enquanto responde — na tela e no bloco

## N — "crie o sistema de login de usuarios no banco de dados real" (19/09)
- [x] N1 Entrar só com conta real (sem cair em demonstração quando a senha está errada)
- [ ] N2 Sessão real: continua logado ao voltar, renova token, sair de verdade
- [ ] N3 Esqueci a senha (e-mail do Supabase) e troca de senha pelo link
- [ ] N4 Conta nova "aguardando" até aprovação do admin; admin aprova em Contas no banco

## O — "quero antes fazer um teste, mas antes me de a lista de todas as paginas e seus botoes e o que eles fazem, um outro agente fará a tarefa N1, e um outro agente vai criar uma tela de login igual essa aqui: https://uncensored.com/" (21/09)
- [x] O1 Lista de todas as telas do app, seus botões e o que cada um faz (`00-comando/MAPA-TELAS-BOTOES.md`)
- [x] O2 N1 por agente próprio: entrar só com conta real
- [x] O3 Tela de login no estilo da uncensored.com (hero em tela cheia, painel de vidro, definição no canto), com a identidade do Reino — `ui_kits/babel-os/PortalLogin.jsx` + `portal-login.css` + `portal-preview.html` (Ourives, 2026-09-21 01:26; evidência: Playwright 1440×900 e 390×844 sem rolagem horizontal, senha errada mostra "E-mail ou senha não conferem." no painel; troca no App.jsx fica com a Vyra)

## P — "sim para tudo" (21/09, respostas às 3 perguntas da Vyra)
- [x] P1 Tirar `reino-app.html` e `app-standalone.html` do site publicado
- [x] P2 Foto de perfil volta no cadastro da tela nova
- [~] P3 Investigar e corrigir o "Indicado por marcelo" sem link de afiliado — tela corrigida (não mostra o código padrão); atribuição e cliques do código padrão aguardam decisão do fundador
- [x] P4 Trocar LoginScreen por PortalLogin no App.jsx e testar junto
- [x] P5 Apagar a conta de teste teste-n1+1789964715639@exemplo.com

## Q — "podemos colocar um video de fundo na tela do login? eu tenho o video já" (21/09)
- [ ] Q1 Vídeo do fundador como fundo do PortalLogin (aguardando o arquivo certo: "Reino" some e a torre de água sobe) — mecânica pronta com 0.mp4 provisório; troca: `bash ui_kits/babel-os/assets/login/preparar-video.sh <novo.mp4>` + ajustar VIDEO_LOGIN.cardEm/subidaDur no PortalLogin.jsx
- [x] Q2 "vai aparecer o card de login depois que desaparecer o reino, um bom momento é quando sobe a torre da agua e ele sobe junto"
- [x] Q3 "e ai fica com blur o fundo" (depois que o card aparece, o fundo desfoca)

## R — "voce colocou só um video, quero que seja todos. e quero que só apareaça o card de login quando clicar a tela. seja com mouse ou touch" (21/09)
- [ ] R1 Todos os vídeos da pasta `~/Vídeos/video login` no fundo, em sequência (hoje os 7 arquivos são idênticos, md5 734b5c79 — confirmar com o fundador) — estrutura pronta: VIDEO_LOGIN.lista em sequência e loop (2 <video>, próximo pré-carregado) e preparar-video.sh aceita vários arquivos e pula repetidos pelo sha256
- [x] R2 Card de login só aparece ao clicar ou tocar na tela (sem tempo automático) — Playwright 1440/390: 10 s sem clique → card invisível e inerte; clique (mouse) e toque (hasTouch) em cima da pílula abrem o card sem trocar a aba; Enter/Espaço/Tab abrem; vídeo pausa no quadro do clique
