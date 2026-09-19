repo: bjorn0208/vyzor
branch: main
path: app

## Last sync

date: 2026-09-15T20:33:04Z

### Updated in this project

- Sistema de design criado a partir de `app/` (produto Babel OS · Reino); o template comercial de terceiros no repositório foi deixado de fora.
- Tokens, reset e regras `hg-*` extraídos de `app/css/app.css`; shell de app separado para os UI kits.
- Conjunto próprio de 35 ícones e o logo copiados de `app/js/shell.js` para `assets/`.
- UI kit clicável com as 12 rotas do produto, mais pré-cadastro e Mapa Reino em tela cheia.
- Globo do produto (`globo.js`) rodando no kit com `geo-mundo`, `geo-brasil`, `brasil.js` e os municípios do IBGE dos 27 estados.
- `produto-original/` guarda o `app/` do repositório em cópia verbatim, para comparação.
- Dashboard refeito e sete módulos novos (Academy, Níveis, Eventos, Clube, Rede Completa, Meus acessos, Bate Papo) a partir do mapa mental do cliente — sem contrapartida no repositório.

## Screen map

| Tela do projeto | Arquivos de origem |
| --- | --- |
| `ui_kits/babel-os/index.html` (shell) | `app/index.html`, `app/js/shell.js`, `app/css/app.css` |
| `ui_kits/babel-os/DashboardScreen.jsx` | `app/index.html`, `app/js/app.js`, `app/js/dados-demo.js` |
| `ui_kits/babel-os/GuildasScreen.jsx` | `app/guildas.html`, `app/js/app.js` |
| `ui_kits/babel-os/RedeSocialScreen.jsx` | `app/rede-social.html`, `app/js/app.js` |
| `ui_kits/babel-os/ConquistasScreen.jsx` | `app/conquistas.html`, `app/hierarquia.html`, `app/js/app.js` |
| `ui_kits/babel-os/BolsaScreen.jsx` | `app/bolsa.html`, `app/js/bolsa.js` |
| `ui_kits/babel-os/PreCadastroScreen.jsx` | `app/pre-cadastro.html`, `app/js/app.js` |
| `ui_kits/babel-os/MapaScreen.jsx`, `mapa.html` | `app/mapa.html`, `app/js/globo.js`, `app/js/app.js` |
| `ui_kits/babel-os/MatchScreen.jsx` | `app/match.html`, `app/js/app.js` (`blocoMatch`) |
| `ui_kits/babel-os/RevistaScreen.jsx` | `app/revista.html`, `app/js/app.js` |
| `ui_kits/babel-os/VitrineScreen.jsx` | `app/vitrine.html`, `app/js/app.js` |
| `ui_kits/babel-os/HierarquiaScreen.jsx` | `app/hierarquia.html`, `app/js/app.js` |
| `ui_kits/babel-os/PesquisaScreen.jsx` | `app/pesquisa.html`, `app/js/app.js` |
| `ui_kits/babel-os/ConfiguracoesScreen.jsx` | `app/configuracoes.html`, `app/js/app.js` |
| `ui_kits/babel-os/globo.js`, `geo-*.js`, `brasil.js`, `dados/municipios/` | `app/js/globo.js`, `app/js/geo-mundo.js`, `app/js/geo-brasil.js`, `app/js/brasil.js`, `app/dados/municipios/*` |
| `ui_kits/babel-os/dados-demo.js`, `demo-brasil.js` | `app/js/dados-demo.js`, `app/js/demo-brasil.js` |
| `produto-original/` | `app/` (cópia verbatim, 56 arquivos) |
| `NiveisScreen`, `AcademyScreen`, `EventosScreen`, `ClubeScreen`, `RedeCompletaScreen`, `AcessosScreen`, `ChatScreen` | sem origem no repositório — mapa mental do APP REINO (cliente, set/2026) |
| `ui_kits/babel-os/app-shell.css` | `app/css/app.css` (seção "APP SEM ROLAGEM" e seguintes) |
| `components/babel-ui.css` | `app/css/app.css` (componentes `hg-*`) |
| `tokens/*.css` | `app/css/app.css` (`:root`) |
| `assets/icons/*` | `app/js/shell.js` (`window.BabelIcones`) |
| `assets/babelcoin-*.webp`, `assets/icone-512.png` | `app/img/` |
