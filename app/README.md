# UI kit · Babel OS

Recriação clicável do app do Reino, montada com os componentes deste sistema. O globo, os contornos geográficos e os dados de demonstração são os arquivos originais do produto, carregados sem alteração.

Os arquivos ficam em subpastas: `telas/`, `componentes/`, `servicos/`, `estilos/`, `nucleo/`, `dados/` (os dados de demonstração foram apagados em 22/09 e guardados em `arquivo/dados-demo/`). A tabela cita só o nome do arquivo.

| Arquivo | Tela |
| --- | --- |
| `index.html` | Shell do app (menu, cabeçalho, barra inferior) com as 12 rotas do produto |
| `mapa.html` | Mapa Reino em tela cheia (globo imersivo) |
| `pre-cadastro.html` | Tela pública de pré-cadastro |
| `App.jsx` | Rotas, gavetas, menu recolhível, modo PC/App e sessão de login |
| `LoginScreen.jsx` + `login.css` | Tela de entrada: globo imersivo ao fundo, cartão de vidro azul-claro com Entrar / Criar conta (demonstração: qualquer dado entra) |
| `DashboardScreen.jsx` | Indicadores, rede social, reputação, globo, conquistas e matches |
| `NetworkMapLocal.jsx` | Cópia local de `components/reino/NetworkMap` com a prop `positions` (px ancorados ao globo) |
| `MapaPanel.jsx` | `Globo` (monta o `globo.js` do produto) e o painel de globo do dashboard |
| `MapaScreen.jsx` | Mapa Reino imersivo |
| `GuildasScreen.jsx` | Minha guilda + explorar guildas |
| `Stories.jsx` | Stories: faixa de círculos, visualizador (progresso, curtir, responder, repostar com empresa marcada, apagar) e criador (abre direto na câmera do navegador: toque no obturador = foto, segurar = grava vídeo até 30s com anel de progresso, soltar = prévia; câmera sem espelho e sem corte (`contain`, alternável para Preencher); ferramentas numa barra lateral recolhível por seta que revela os nomes; filtros com miniatura da própria foto; Galeria e câmera nativa via `capture` como alternativas; fundos, filtros, texto arrastável, marcar empresa). Fotos persistem na sessão como Data URL; vídeos ficam só até recarregar. Câmera exige HTTPS. |
| `RedeSocialScreen.jsx` | Rede social em linha do tempo (estilo X): nav do feed, compositor, abas Para você / Seguindo / Grupo, lateral com matches e "Em alta" |
| `MatchScreen.jsx` | Lista de match com compatibilidade |
| `ConquistasScreen.jsx` | Progresso, grade de conquistas e hierarquia |
| `RevistaScreen.jsx` | Edições da revista |
| `VitrineScreen.jsx` | Uma empresa em destaque por região |
| `HierarquiaScreen.jsx` | Títulos e mensalidades |
| `PesquisaScreen.jsx` | Busca com filtros, tabela e painel do Google Maps |
| `ConfiguracoesScreen.jsx` | Conexão com a API e preferências |
| `NiveisScreen.jsx` | Títulos, benefícios por nível e alcance do mapa |
| `AcademyScreen.jsx` | Trilhas do Reino Academy, liberadas por título |
| `EventosScreen.jsx` | Encontros, lives e rodadas de negócios |
| `ClubeScreen.jsx` | Clube de Benefícios: ofertas entre membros |
| `RedeCompletaScreen.jsx` (cartões com ranking, guilda, título, conexões e "Ver no mapa" → voa até a cidade no globo) | Rede Completa: empresas, composição e cidades |
| `AcessosScreen.jsx` | Meus acessos e estatísticas do afiliado |
| `ChatScreen.jsx` | Bate Papo do Reino (envio só de Marquês pra cima) |
| `BolsaScreen.jsx` | Letreiro, banner BabelCoin, destaques, lista de ativos e detalhe |
| `PreCadastroScreen.jsx` | Escolha de título e território |
| `afiliados.js` + `afiliados.sql` + `vercel.json` | Afiliados reais: link `?ref=<codigo>` por padrão (o formato curto `/r/<codigo>` só com `REINO_ROTA_R = true` + a reescrita do `vercel.json`), registro de clique e cadastro (cidade/UF reais por IP via ipwho.is, título, dispositivo, data) no Supabase via REST; SQL das tabelas, políticas e view de ranking em `afiliados.sql`; `vercel.json` reescreve `/r/*` para o app. Sem chave configurada, guarda no navegador. |
| `fotos.js` + `FotoAvatar.jsx` | Foto de perfil de pessoas e empresas: enviada no cadastro (câmera ou galeria) ou arrastada sobre o avatar na Rede Completa; reduzida a 256px e guardada no navegador — e no Supabase quando a tabela `fotos` existe (SQL em `afiliados.sql`). Sem foto, cai nas iniciais. |
| `contas.js` + `PerfilScreen.jsx` | Conta do usuário: login validado pela autenticação do Supabase (e-mail e senha; sem banco, cai em demonstração), perfil salvo na tabela `perfis`, código de afiliado único e personalizado (tabela `codigos`, com verificação de disponibilidade) e links por campanha (`?ref=codigo&c=instagram`). |
| `data.js` | Dados fixos usados pelas telas do kit |
| `app-shell.css` | Shell de 100dvh sem rolagem, copiado de `app/css/app.css` |
| `app-layout.css` + `app-layout.js` | Modo de layout do cliente: menu lateral fixo no desktop, palco travado em 1920px (escala acima disso), telas em 1 coluna e toque ≥44px até 1100px |

## Arquivos do produto usados sem alteração

| Arquivo | O que é |
| --- | --- |
| `globo.js` | Motor do globo em canvas 2D: Terra → Lua (torre Babel) → Brasil → estado → cidade → bairro, com arrastar, pinça, inércia, tooltip e ruas reais em mosaicos |
| `geo-mundo.js` | 177 países (Natural Earth / world-atlas) |
| `geo-brasil.js` | 27 unidades federativas |
| `brasil.js` | Mapa do Brasil em SVG (contornos svg-maps, Victor Cazanave, CC BY 4.0) |
| `dados/municipios/*.json` | Municípios do IBGE, os 27 estados |
| `dados-demo.js` + `demo-brasil.js` | Provedor de demonstração do produto: 2.105 empresas fictícias, bairros, empresários, match, conquistas, revista |

Ajustes mínimos em `globo.js` nesta cópia, marcados com `[UI kit]`: (1) o `IntersectionObserver` que pausa a animação passou a considerar o tamanho do elemento, porque dentro de um preview embutido ele reporta "fora da tela" mesmo visível; (2) o laço não desenha sem área nem com raio inválido e para quando o canvas sai do DOM (o React desmonta o globo ao trocar de página, o que gerava `createRadialGradient … non-finite`); (3) a API expõe `destruir()`, `projetar(lon, lat)` e `bairroAtual()` para o wrapper React, e o laço emite `globo:quadro` a cada quadro desenhado — é assim que a rede de empresas fica ancorada ao mapa (cada empresa tem `dLng/dLat` em relação ao centro do bairro e é reprojetada a cada quadro); (4) interações e voos religam o laço se o observer o tiver pausado, e o laço remede o canvas quando ficou sem área.

## Limites conhecidos

- O painel **Google Maps** da Pesquisa e o **clima** do globo dependem de chaves no servidor (`RAPIDAPI_MAPS_KEY`, HG Brasil); o kit mostra o mesmo estado de indisponibilidade do produto.
- A tabela da Pesquisa mostra as primeiras 80 de 2.105 empresas da demonstração; os filtros refinam.
- Configurações não grava nada: salvar e testar conexão apenas confirmam com o aviso.
- As telas de Reino Academy, Níveis, Eventos, Clube, Rede Completa, Meus acessos e Bate Papo vêm do mapa mental do cliente, não do código do produto: dados fictícios e sem backend.
- O item "Randomizando" do mapa mental não foi construído — falta definição.
