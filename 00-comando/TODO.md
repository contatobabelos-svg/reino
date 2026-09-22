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

## S — "tarefa, junte os 7 videos em só. apos isso, coloque ele de tela de login no site." (21/09)
- [x] S1 Juntar 0.mp4…6.mp4 de `~/Vídeos/video login` num vídeo só
- [x] S2 Esse vídeo como fundo da tela de login no site

## T — "Vamos criar um plano passo a passo para entregar esse projeto de forma profissional. Estou falando de sistema de login funcional, pastas do projeto reino bem organizdas com tudo separado certo, tudo tem uma pasta, sistema suportando 300 pessoas simultaneamente usando o grupo e a rede social do reino e estar tudo legal, o app ser super responsivo a celular, o app ser rapido, o app ser seguro e nunca perder os dados do usuario, somente o stories" (21/09)
- [x] T1 Plano em `00-comando/PLANO-ENTREGA.md` (fases 0–9 e decisões do fundador)

## U — "arrume essa bagunça antes de prosseguirmos" (sobre as pastas do projeto; Fase 3 do PLANO-ENTREGA, sem a migração para o Vite) (21/09)
- [x] U1 App sai de `ui_kits/babel-os/` para `app/`, com subpastas por tipo (telas, componentes, serviços, estilos, dados)
- [x] U2 Design system inteiro em `design-system/`
- [x] U3 Exports antigos, produto original e dados sem uso em `arquivo/`; contexto, aulas e referências em `docs/`
- [x] U4 `montar-site.sh`, CLAUDE.md, README, agentes e hook Dominic apontando para os caminhos novos
- [x] U5 Site montado com os mesmos arquivos de antes (hash) e teste de navegador igual ao de antes

## V — "sim" (21/09, começar a Fase 0 do PLANO-ENTREGA: backup completo e fechar o vazamento de `cadastros`)
- [x] V1 Backup do banco (papéis, esquema, dados) em `~/Backups/reino/`, fora do git, com `COMO-RESTAURAR.md`; gatilho de `auth.users` que o dump não traz salvo à parte
- [x] V2 Ambiente de teste local: Supabase local do Reino (portas 5436x) com o esquema restaurado do backup
- [x] V3 Cadastros e cliques deixam de ser legíveis pelo público; afiliado vê só o próprio código; e-mail só pelo admin; ranking só código + total
- [x] V4 K2 (parcial): cópias antigas de afiliados/contas/fotos retiradas do `_ds_bundle.js` (a de afiliados registrava o clique antes da versão atual)
- [ ] V5 Ambiente de teste na nuvem (branch do Supabase Pro ou projeto separado): custa por hora, aguardando decisão do fundador

## W — "esse é o video de fundo do login do reino. a barra de login é igual da babel os mas das cores do reino. é um sistema de carrosel de cadastro imersivo. sempre vai começar com tela de cadastro. nome, nome da empresa, cnpj, foto de perfil, email, usuario de login e senha. todos os dados sao necessarios. atenção, nao quero que faça em caixa, faça igual da babel os babel-os.com caso ja possuir cadastro, poder alternar "ja tenho conta" e ai é so colocar usuario - enviar - senha - enviar. caso ele tenha validado o email dele, o login entra, se nao, aparece para validade e tem um botao que leva ao gmail, yahoo, outlock em lista com uma seta que leva a esses sites." (21/09; vídeo = `~/Downloads/Reino Animado.html`; só local, publicação depois pela Vyra com o fundador)
- [x] W1 Fundo: cena "Reino Animado" (letreiro neon no lago com castelo) em tela cheia cobrindo tudo, sem faixas pretas, no PC e no celular; respeita movimento reduzido; vídeo antigo fica de reserva
- [x] W2 Barra de login igual à do Babel OS (conversa com bolhas + barra de comando embaixo, uma pergunta por vez), com cores e fontes do Reino — nada de caixa/card
- [x] W3 Carrossel de cadastro (sempre abre no cadastro): nome, empresa, CNPJ, foto, e-mail, usuário, senha — todos obrigatórios, validados no navegador e no servidor; resumo e "criar conta"; código de afiliado continua
- [x] W4 "Já tenho conta": usuário → enviar → senha → enviar (aceita e-mail no lugar do usuário)
- [x] W5 E-mail não validado: aviso com e-mail mascarado, reenviar e lista Gmail / Yahoo / Outlook com seta (nova aba)
- [x] W6 Banco: perfis ganha usuario/empresa/cnpj, bucket `avatares`, funções `reino-cadastro` e `reino-login`, checagem de usuário disponível
- [x] W7 Testes locais (Playwright 1440×900 e 390×844) e passos de publicação documentados
- [x] W8 Publicar (Vyra, com autorização do fundador): migração → funções reino-cadastro/reino-login (--no-verify-jwt) → Auth (Site URL/Redirect URLs, SMTP próprio) → push do site. Passo a passo em `supabase/README.md` (Ourives, pronto e testado no local em 2026-09-21 06:53) — publicado em 21/09 (migração, funções reino-cadastro e reino-login, Site URL e redirects do Auth corrigidos, senha mínima 8)

## X — "deixe mais rápido o vídeo de fundo, para parecer fluido." (21/09)
- [x] X1 Pré-renderizar a cena do fundo do login em vídeo (WebM VP9 + MP4 H.264 + poster webp) e tocar o vídeo no lugar da cena JS, com a cena JS de reserva e o iframe de última reserva (Ourives, 2026-09-21 09:03; no mesmo notebook e no mesmo Chrome: cena JS 12–20 quadros/s com 23–64 quadros longos em 6 s; vídeo 60 quadros/s com 0 quadro longo. Falta a Vyra conferir e publicar)

## Z — "nao ter animação de giroflex na caixa de texto da tela inicial. manter o aspecto de vidro de é trasnparente, usando as cores de fundo. e deixe mais leve a tela de login." (21/09)
- [x] Z1 Tirar o anel de luz girando (conic-gradient animado) e o brilho desfocado da barra de comando do login
- [x] Z2 Barra em vidro transparente tingido com as cores do fundo (ciano/violeta/azul-noite), borda fina, foco por borda estática
- [x] Z3 Tela mais leve: remover todos os backdrop-filter (custo alto sobre vídeo) do login-imersivo.css; vidro só por transparência

## Y — "melhore ao maximo o app de noticias" + "deixar responsivo a tela de noticias. trazer mais cara de blog tecnologico com as imagems que vem de do site." (21/09)
- [x] Y1 Notícias deixa de depender do Google Notícias como fonte única: a função `reino-apis` passa a ler o RSS **dos próprios veículos** (14 feeds públicos: InfoMoney, EXAME, Brazil Journal, NeoFeed, Startups, Agência Brasil, g1 Economia, g1 Tecnologia, Canaltech, Tecnoblog, Olhar Digital, Mobile Time, TI Inside, AdNews) — de lá vêm link direto, resumo curto e **a foto da matéria**
- [x] Y2 Imagem que vem do site da notícia em cada cartão (`loading=lazy`, `decoding=async`, `referrerpolicy=no-referrer`, proporção 16:9 fixa) e capa do Reino (degradê por veículo + inicial) quando o feed não traz foto ou a imagem falha
- [x] Y3 Cara de blog de tecnologia: manchete grande com título sobre degradê, cartões com foto no topo, etiqueta de editoria, veículo + horário relativo, trecho curto, "Em alta agora" e lista de veículos na lateral
- [x] Y4 Editorias para dono de empresa: Destaques, Negócios, Economia, Tecnologia, Marketing, Crédito e juros, Empreendedorismo, Política e empresas — mais busca livre (o Google Notícias entra só na busca e para completar as abas mais estreitas)
- [x] Y5 Responsivo de verdade por *container query*: 1 coluna até 540 px, 2 até 1180, 3 até 1500, 4 acima; abas rolam na horizontal no celular; alvos de toque de 44 px; sem rolagem horizontal em 390×844, 768×1024 e 1440×900
- [x] Y6 Abre instantâneo: cache no navegador com "mostra o que tinha e atualiza por trás" (localStorage com try/catch), esqueleto no lugar de tela vazia, atualização sozinha a cada 4 min sem piscar
- [x] Y7 Salvar para ler depois (aba Salvas), marcar lidas, compartilhar (Web Share ou copiar link), filtro por veículo, ordenação, atalhos "/" e "r", `aria-live`, foco visível, links em nova aba com `rel="noopener noreferrer"`
- [x] Y8 Serviço único `app/servicos/noticias.js`: a tela e o bloco do Dashboard dividem busca, cache, salvos e lidos — o bloco do Dashboard ganhou manchete com foto e lista com miniaturas
- [x] Y9 Teste `supabase/testes/e2e-noticias.cjs` (50 conferências): respostas simuladas (sucesso, vazio, erro, timeout, cache velho, salvar/lida/compartilhar, editoria, busca, imagem que falha), dados reais da função rodando local e leitura real da função em produção; 390×844, 768×1024 e 1440×900 sem rolagem horizontal e sem erro de JavaScript
- [ ] Y10 **Publicar (Vyra):** `supabase functions deploy reino-apis` e push do site. Enquanto a função não subir, a tela funciona com o formato antigo (sem foto nem resumo) — testado
- [ ] Y11 **Decisão do fundador:** a lista de veículos é fixa no servidor. Incluir, tirar ou trocar algum? (hoje não há veículo com paywall nem conteúdo pago na lista)

## AA — "quero que o card de noticias seja menor pela metade e encaixe aonde fica "conquistas" em dashboard. no app de noticias, só ir para o topo as noticias que tem imagem. quero que a seção principal a se mostrar no dashboard seja de tecnologia. preencha um espaço na lateral com um rank de quem tem mais afiliados." (21/09)
- [x] AA1 Bloco de notícias do Dashboard pela metade (481 → 246 px, 2 manchetes com miniatura) e no topo da coluna da direita, onde ficava Conquistas
- [x] AA2 Conquistas passa para o centro (onde ficava o bloco de notícias); continua ocultável pelo ✕
- [x] AA3 Tela Notícias: só as matérias com foto sobem (as sem foto vão para o fim, ordem mantida); não vale para "Ordem por veículo"
- [x] AA4 Seção principal do Dashboard = Tecnologia (pedido `tema: "tecnologia"`)
- [x] AA5 Novo bloco "Ranking de afiliados" na coluna da direita (top 5 pela função ranking_afiliados, a própria conta em dourado, widget ocultável em Personalizar)
- [ ] AA6 Decisão do fundador: Conquistas fica no centro ou some do Dashboard?

## AB — "no dashboard não ter buracos, todos os espaços são preenchidos com uma informação." (21/09)
- [x] AB1 Painéis redistribuídos nas 3 colunas (esquerda: Rede social, Conquistas, Bate Papo; centro: Mapa, Música, Assistente; direita: Notícias, Ranking, Match) e o último painel de cada coluna estica até o fim; o mapa cresce com a folga
- [x] AB2 Se alguém oculta painéis em Personalizar, a distribuição se refaz sozinha (altura estimada por painel)
- [x] AB3 Fileira de baixo: Bolsa ganha resumo calculado (total, média, melhor dia) e gráfico que cresce; Vendas distribui as barras; botões no rodapé
- [x] AB4 Bate Papo mostra 3 conversas; gaveta do território do mapa mostra o conteúdo inteiro
- [ ] AB5 Pendente: cenário "ocultar Rede social + Conquistas" foi corrigido (painel de lista vai por último) mas não foi retestado — o fundador pediu para parar os testes

## AD — "pode subir o cerebro pra produção" (21/09)
- [x] AD1 Cérebro do Reino (grafo 3D das tabelas do banco) publicado: tela `telas/CerebroReinoScreen.jsx` + `estilos/cerebro-reino.css`, rota `cerebro.html` no menu
- [x] AD2 Decisão do fundador: **só conta admin** vê o item no menu e abre a tela; membro cai em "Em breve"
- [x] AD3 three.js e 3d-force-graph saem do unpkg (o endereço do three dava 404) e passam a vir de `app/vendor/`, baixados só quando o Cérebro abre (~1,3 MB a menos para todo mundo)
- [x] AD4 Ícone `brain` incluído no `_ds_bundle.js` (antes só estava no fonte `Icon.jsx`)
- [ ] AD5 O esquema mostrado é fixo no código (10 tabelas); não acompanha migrações novas sozinho

## AE — "remova de lá. vamos iniciar outro projeto." (21/09)
- [x] AE1 Cérebro do Reino fora do ar: rota, item do menu e scripts saem do app; tela, estilo e bibliotecas vão para `arquivo/cerebro-reino/` (guardados, não publicados). O ícone `brain` fica no bundle, sem uso

## AC — "ao criar minha conta, esta aparecendo 'Olá, Marcelo' precisa mostrar meu nome. o scroll está bugado, nao rola a tela toda. Match e alertas esta com espaço muito longo entre eles, crie mais. não ter botao de ir pro brasil. o globo agora é todo clicavel. manter apenas os botoes laterais e o card que mostra as cidades e bairros ficam abaixo do globo em horizontal. mostrar apenas empresas cadastradas que tem foto, os demais pontos aleatorios pode remover. quero que o pinos no modo bairro girem e o fio de coneçao entre eles ser igual do cerebro da babel." (21/09)
- [x] AC1 Cumprimento e código de afiliado usam o nome da conta logada (antes: perfil de demonstração "Marcelo"); o código guardado no navegador só vale para a conta dona (reino.meuCodigo.dono)
- [x] AC2 Rolagem "bugada": NÃO reproduzida no Chrome nem no Firefox 155 (roda do mouse em 8 tamanhos de janela, modo App, conta "aguardando", cadastro em 1366×768, menu lateral). Falta o fundador dizer onde/como trava (aparelho, navegador, tamanho, mouse/touchpad/toque)
- [x] AC3 Match e alertas: lista mede a altura livre e mostra só as linhas inteiras que cabem (ListaQueEnche), matches e alertas intercalados; mais dados de demonstração (matches 9, alertas 6, conversas 7); Bate Papo e Match usam o mesmo mecanismo
- [x] AC3b Colunas: esquerda = Rede social, Música, Bate Papo; centro = Mapa, Conquistas, Assistente; direita = Notícias, Ranking, Match
- [x] AC4 (agente do mapa) sem botões "Ir para…"; globo todo clicável; faixa horizontal abaixo do globo; só empresas cadastradas com foto; pinos girando e fios estilo Cérebro Babel no modo bairro — entregue pelo Ourives na seção AF

## AF — "não ter botao de ir pro brasil. o globo agora é todo clicavel. manter apenas os botoes laterais e o card que mostra as cidades e bairros ficam abaixo do globo em horizontal. mostrar apenas empresas cadastradas que tem foto, os demais pontos aleatorios pode remover. quero que o pinos no modo bairro girem e o fio de coneçao entre eles ser igual do cerebro da babel." (21/09)
- [x] AF1 Folha sobre o globo sai: nada de "Ir para X", "Ver o Brasil inteiro", "Entrar no Brasil", "Visitar a torre Babel na Lua", "Voltar para a Terra". Ficam os botões laterais (`.hg-globo-zoom`) e o voltar/trilha do topo
- [x] AF2 Globo inteiro clicável: toque na Terra entra no território do título (Imperador/Rei → Brasil, Príncipe → estado, demais → cidade/endereço), toque na Lua abre a torre Babel; clique separado do arrasto por 5 px, cursor, brilho no hover, Enter no canvas e `prefers-reduced-motion`
- [x] AF3 Faixa horizontal abaixo do globo (`.hg-globo-faixa`, ~112 px): cabeçalho curto + cartões lado a lado com scroll-snap, um por nível (terra: seu território; brasil: estados; estado: cidades; cidade: bairros; bairro: empresas com foto)
- [x] AF4 Só empresas cadastradas com foto no mapa: saem os nós de demonstração (`BABEL_DEMO.rede`), os empresários orbitando sem foto e os marcadores do Google sem foto
- [x] AF5 Migração `supabase/2026-09-21_mapa_empresas_com_foto.sql` com `public.empresas_do_mapa()` (só perfis com foto + empresa e situação aprovada; devolve id, empresa, foto, cidade, uf, titulo) e serviço `app/servicos/empresas.js`
- [x] AF6 Pinos do modo bairro giram em torno do eixo vertical (rotateY 360°, 7–9 s, duas faces legíveis, mais lento no hover, parados com `prefers-reduced-motion`)
- [x] AF7 Fios como os do Cérebro Babel: fio fino ciano semitransparente, sem halo grosso, 2 partículas por fio animadas por `requestAnimationFrame` sobre as coordenadas reprojetadas; cada empresa liga nas 2 vizinhas mais próximas
- [x] AF10 Achado: do Brasil para baixo a cartografia ReinoMapa (MapLibre, vem no `_ds_bundle.js`) escondia o globo inteiro — as listas de estados/cidades/bairros e a rede de raios estavam mortas no produto. Agora o MapLibre entra por portal dentro do palco, a faixa continua visível e navega, e no nível bairro o globo reassume (é nele que os pinos e os fios se apoiam)
- [ ] AF8 **Publicar (Vyra):** primeiro a migração no Supabase, depois o site. Enquanto a função não existir, o mapa mostra só a empresa da própria conta
- [x] AF9 **Decisão do fundador (21/09): "incluir cidade e UF"** — feito no AF11
- [x] AF11 Cidade e UF no cadastro: etapa nova no carrossel do login imersivo ("Em que cidade a empresa fica?", uma linha do tipo "Campinas, SP"), nome conferido na lista de municípios do IBGE com sugestão quando não bate; `contas.js` envia cidade/uf; a função `reino-cadastro` valida os dois; migração `supabase/2026-09-21_cadastro_cidade_uf.sql` faz `privado.criar_perfil` limpar cidade e UF (quem chama o signup direto não grava lixo)
- [x] AF12 **Publicado (21/09, a pedido do fundador "publique pelo 1 depois o 2")**: 1) banco — `empresas_do_mapa` conferida no ar e `cadastro_cidade_uf` aplicada; função `reino-cadastro` na versão 2 (testada em produção: exige cidade e UF, nenhuma conta criada). 2) site — o mapa já tinha subido no commit `f12a80c`; o cadastro com cidade/UF vai no commit seguinte

## AD — decisões do fundador sobre as pendências (21/09) — "2 unico - 3 como esta agora - 4 manter - nos dois"
- [x] AD1 CNPJ único: índice perfis_cnpj_unico + public.reino_cnpj_existe (só servidor) + checagem na função reino-cadastro (mensagem "Esse CNPJ já tem cadastro no Reino…", volta à etapa do CNPJ). Em produção: banco e função aplicados; testado sem criar conta (CNPJ novo passa; existente com e sem máscara é barrado)
- [x] AD2 Letreiro do login no celular: fica como está (inteiro no alto, fundo desfocado embaixo — FUNDO_REINO.retrato = "encaixar")
- [x] AD3 Lista dos 14 veículos de notícias: mantida
- [x] AD4 Card Conquistas: mantido onde está (coluna do centro do Dashboard) — leitura de "nos dois"
- [x] AD5 SMTP próprio: Resend, domínio babel-os.com (já verificado na conta), remetente Reino <nao-responda@babel-os.com>, limite 60 e-mails/h, e-mails de confirmação e de senha em português. Login e envio SMTP testados. Falta o teste de ponta a ponta com um cadastro real do fundador
- [ ] AD6 Aberto: CNPJ repetido barra também quem já tem conta em outro e-mail; falta fluxo de suporte para "o CNPJ é meu mas o cadastro é de outra pessoa"

## AG — "o sistema de chat esta funcional entre os chats?" → "pode montar e ogrupo tambem." (22/09)
- [x] AG1 Bate Papo real: grupo único do Reino + pedido de network + chat privado 1:1, tudo no banco (`supabase/2026-09-22_chat_grupo_e_privado.sql`, `app/servicos/chat.js`, `ChatScreen.jsx`); sai a demonstração com respostas falsas por setTimeout
- [x] AG2 Tempo real (Supabase Realtime, cliente oficial 2.116.0 via jsdelivr com SRI): mensagem, pedido e aceite chegam na hora para a outra conta
- [x] AG3 Regras no banco: aguardando só lê o grupo; membro/admin falam; título Barão/Visconde/Conde só lê (regra `chatFala`); "título a definir" fala; privado só entre as duas pontas de um network aceito; 8 msgs/30 s por conta; nome/empresa/título do autor vêm do perfil
- [ ] AG4 Decisão do fundador: manter "título a definir" falando no grupo até os títulos serem atribuídos? (hoje nenhum membro tem título; se aplicar a regra do Marquês à risca, só os 2 admins falam)
- [ ] AG5 Sem anexo, sem apagar mensagem e sem contador de não lidas (o botão de anexo, que não fazia nada, saiu)

## AH — "Ter como alterar o modo mocado para real para fazer um teste real" · "quero que ao alternar os dados falsos sumam" (22/09)
- [x] AH1 Selo do topo vira interruptor: "Dados fictícios · ligado" ↔ "Só dados reais" (lembrado no navegador, `reino.dadosFicticios`; a troca recarrega). Padrão: ligado, como era
- [x] AH2 Desligado, `app/dados/modo-dados.js` esvazia `BABEL_DEMO` e as respostas de `BabelDemo` mantendo o formato; ficam títulos, regras e grupos do feed. Somem também os fixos no código: stories de exemplo, tendências da Rede social, KPIs "Negócios fechados"/"Cidades ativas", campos de exemplo em Configurações, território Campinas/Cambuí (vira a cidade da conta)
- [x] AH3 `TelaSegura` no App: tela que quebra sem dado mostra estado vazio em vez de branco (hoje só a Bolsa de Valores cai nele)
- [ ] AH4 Decisão do fundador: o padrão deve passar a ser "Só dados reais" para todo mundo?

## AI — "quero que você primeiro exclua os dados mocados e apos isso, me gere 77 usuarios que usam o app de nivel moderado, chats geral, chat de network e status. ele não precisam de usuario e nem confirmação de email. espalhe eles pelo brasil. crie guildas, crie matchs e networks entre os 77. todos eles sao empresas reais, entao use mesmo os  dados dos 77 pesquisando no google maps e fazendo  uma varredura das empresas reis." (22/09)
Decisão do fundador (pergunta da Vyra): as 77 são **fictícias** e marcadas como teste; empresas reais só como vitrine (empresas_reais, já no mapa). Mocados: **apagar de vez**.
- [x] AI1 Dados de demonstração apagados do app: `dados-demo.js`, `demo-brasil.js`, `demo-municipios.js` (850 kB) → `arquivo/dados-demo/`; `data.js` só com regras + formato vazio; sai o interruptor AH; saem os exemplos fixos das telas
- [x] AI2 Banco: `guildas`, `guilda_membros`, `matches`, `status` (24 h) + `privado.contas_teste`; membro real não vê nada de teste; admin vê tudo e lê os privados entre contas de teste (sem escrever)
- [x] AI3 77 contas de teste em produção (27 UFs, 18 nichos, Barão→Rei), sem senha/usuário: 72 mensagens no grupo, 55 pedidos de network (38 aceitos, 217 mensagens privadas), 12 guildas, 150 matches, 45 status. Gerador: `supabase/semente-teste/gerar-contas-teste.py`; remoção: `remover-contas-teste.sql`
- [x] AI4 Telas ligadas ao banco: Guildas, Match, Stories/status e "Quem combina com você" (Rede social); Bate Papo mostra ao admin as conversas de teste como só leitura
- [ ] AI5 Os status da semente vencem em 24 h (regra do status); rodar o gerador de novo renova — ou pedir para eu gerar só status novos
- [ ] AI6 Ainda sem tabela no banco (tela vazia): feed da Rede social, Vitrine, Revista, Eventos, Conquistas, Bolsa, Clube, Rede Completa, Busca
- [x] AI7 "agora duplique o teste" (22/09): lote 2 com mais 77 contas de teste (teste-078 a teste-154), empresa com cidade no nome e pessoa com dois sobrenomes, 12 guildas próprias; total 154 contas, 147 msgs no grupo, 110 pedidos, 423 privadas, 24 guildas, 300 matches, 89 status. `gerar-contas-teste.py 2`

## AJ — "sistema de login ser mais simples. Pedir Nome, whatsapp, Usuário e senhas e uma foto. As demais configurações vão para seu perfil. Ter uma notificação pop up que mostra uma vez a cada aba resumidamente o que é aquela aba. vá na internet e pegue referencias de sites que fazem esses tutorias de apresentação de apps ou sites. Tava pensando que o avatar  poderia ser o assistente do reino, e como ele falaria  a mesma coisas sempre, pensei de ter uma voz pré pronta." (22/09)
- [x] AJ1 Cadastro só com nome, WhatsApp, foto, usuário, senha + confirmação (sem e-mail, sem validação por e-mail)
- [x] AJ2 Empresa, CNPJ, cidade/UF e e-mail passam para Minha conta (com aviso do que falta para aparecer no mapa)
- [x] AJ3 Apresentação de cada aba, uma vez por aba, com o rosto do Assistente do Reino e voz pré-gravada (pt-BR)
- [x] AJ4 Referências de tours de apresentação (docs/contexto/)

## AK — "Vamos trocar o usuario e senha do adm para: usuario: <omitido> - senha: <omitida>" (22/09)
- [x] AK1 usuário e senha escolhidos pelo fundador (fora do git) aplicados na conta admin ccc087dd (a outra linha admin, 11111111-…, não tem login)
