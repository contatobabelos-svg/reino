# Babel OS — Design System

Recriação do sistema de design do **Babel OS · Reino**, feita a partir do código do produto.

## O que é o produto

O Babel OS é uma rede de negócios brasileira montada como um reino. Uma empresa entra no "Reino", recebe um **título de nobreza** que define o **território** que ela comanda (de Barão, uma entrada simples, até Imperador, o Brasil inteiro), e a partir daí acumula **reputação em estrelas**, entra em **guildas**, recebe **matches** com empresas de nichos complementares e aparece no **mapa/globo** do Reino. Em volta disso existem módulos de conteúdo e mercado: rede social, revista, vitrine, hierarquia, pesquisa com busca inteligente, programa de afiliados e uma **Bolsa de Valores** com cotações da B3 (via HG Brasil Finance) e a marca própria **BabelCoin**.

A interface é um app único em pt-BR, servido como PWA, que caiba inteiro na tela sem rolagem — só as listas internas rolam. O visual é **holograma + neon**: fundo azul-quase-preto com halos, painéis de vidro com borda em gradiente, uma faixa de luz ciano no topo de cada painel e números que acendem.

### Superfícies

| Superfície | O que é | Onde vive no repositório de origem |
| --- | --- | --- |
| App do Reino | 12 módulos com menu lateral, cabeçalho e barra inferior no celular | `app/index.html`, `app/guildas.html`, `app/bolsa.html`, `app/conquistas.html`, `app/rede-social.html`, `app/mapa.html`, `app/match.html`, `app/revista.html`, `app/vitrine.html`, `app/hierarquia.html`, `app/pesquisa.html`, `app/configuracoes.html` |
| Pré-cadastro público | Escolha de título e território no mapa do Brasil, sem menu lateral | `app/pre-cadastro.html` |

## Fontes usadas nesta recriação

- **Repositório:** <https://github.com/bjorn0208/vyzor> (branch `main`). Vale a pena explorá-lo direto: quanto mais do código original você ler, melhores ficam os designs feitos com este sistema.
- Base do sistema: **`app/`** — o produto próprio. `app/css/app.css` (1.386 linhas, tokens e componentes `hg-*`), `app/js/shell.js` (menu, cabeçalho, conjunto de ícones e logo), `app/js/app.js` e `app/js/bolsa.js` (marcação de cada componente em tempo de execução), `app/js/dados-demo.js` (dados fictícios), `app/API.md`.
- **Fora do escopo:** a maior parte do repositório (`html/`, `assets/`, 180 páginas) é a cópia local de um **template comercial de terceiros** — o admin "Vyzor", da Spruko — usado como referência de estudo. Ele não pertence à marca, não concede licença de redistribuição e **não foi recriado** aqui. Nada em `components/`, `tokens/` ou `ui_kits/` vem dele.

## Índice

| Arquivo | Conteúdo |
| --- | --- |
| `styles.css` | Entrada única de CSS (só `@import`). Consumidores linkam este arquivo. |
| `tokens/colors.css` | Cores base e aliases semânticos, gradientes de marca, fundo da app. |
| `tokens/typography.css` | Famílias, escala de tamanhos, pesos e letter-spacing. |
| `tokens/spacing.css` | Escala de espaço, paddings em uso, larguras de layout, breakpoints. |
| `tokens/effects.css` | Raios, brilhos neon, halos de painel, vidro, borda-gradiente. |
| `tokens/motion.css` | Durações, curvas e transformações de pressionar. |
| `tokens/fonts.css` | Import dos webfonts (Exo 2 + Inter). |
| `tokens/base.css` | Reset, fundo da aplicação, linhas de varredura, foco, links. |
| `components/babel-ui.css` | As regras `hg-*` do produto, copiadas de `app/css/app.css`. |
| `components/<grupo>/` | Componentes React (`.jsx` + `.d.ts` + `.prompt.md`) e o card do grupo. |
| `guidelines/*.html` | Cards de fundamentos (cor, tipo, espaço, marca). |
| `../app/` | Recriação clicável do app e do pré-cadastro. |
| `assets/` | Logo, ícones, emblema e banner BabelCoin, ícones de PWA. |
| `produto-original/` | O produto `app/` do repositório, cópia verbatim (56 arquivos): páginas, CSS, JS, municípios do IBGE, imagens e `API.md`. Referência de comparação — não é parte do sistema compilado. |
| `SKILL.md` | Empacotamento como Agent Skill. |
| `github.md` | Associação com o repositório de origem e mapa de telas. |

## Fundamentos visuais

**Fundo.** `#030817` com três halos radiais fixos (azul no topo, violeta à direita, ciano embaixo à esquerda) e `background-attachment: fixed`. Sobre tudo, uma camada fixa de **linhas de varredura** (`repeating-linear-gradient` de 1px a cada 4px, azul a 2,2%) com `z-index: 1000` e `pointer-events: none` — é ela que dá a textura de holograma. Sem imagens de fundo, sem padrões desenhados, sem ilustrações; o único bitmap de marca é o banner do BabelCoin.

**Cor.** Quatro cores acendem a interface — ciano `#3fe3ff` (ação, foco, destaque), azul `#3b82ff` (estrutura), violeta `#8b5cff` (botão principal) e magenta `#e04bff` (novidade). Semânticas: verde `#34e6a6` (alta, afiliado), vermelho `#ff4d7a` (baixa), âmbar `#ffb547` (demonstração, aviso). O **dourado** `#f5c76a`/`#e0a33c` é reservado a título, reputação e conquista — nunca use dourado para uma ação. Superfícies são todas translúcidas sobre o fundo; não existe superfície opaca clara.

**Tipografia.** **Exo 2** (600/700) em títulos, números, marca e códigos de ativo; **Inter** (400/500/600) em todo o texto corrido; mono do sistema apenas no campo de link de afiliado. Corpo 14px/1,5. Títulos de tela 1,75rem (1,4rem no modo sem rolagem), título de painel 1,02rem, subtítulo 0,78rem. Rótulos de coluna em caixa alta com `letter-spacing` de .06em a .14em. Números sempre `font-variant-numeric: tabular-nums`, formatados em pt-BR (`4,6`, `R$ 48,95`, `2.041`).

**Painéis e cards.** Raio 20px, fundo `linear-gradient(145deg, rgba(14,30,64,.8), rgba(8,15,40,.72))`, borda de 1px azul a 26%, e três camadas próprias: uma **borda-gradiente** em `::before` (ciano → magenta, com `mask-composite: exclude`), uma **faixa de luz neon** de 64×2px em `::after` no topo esquerdo, e o halo `--glow`. No hover o halo cresce (`--glow-2`) e a borda clareia. Nunca borda colorida só de um lado, nunca sombra escura projetada no estilo material.

**Vidro e transparência.** Três usos, sempre com `backdrop-filter`: cabeçalho (16px), listas da bolsa e painel do globo (18px + `saturate(160%)`), menu lateral do desktop (26px + `saturate(170%)`). O menu de vidro tem reflexo próprio em `::before` e as linhas da bolsa têm um reflexo que corre em loop. Tooltips, dock do mapa e trilha de navegação também usam vidro.

**Bordas e filetes.** `--line` (azul 26%) é a borda padrão; `--line-2` (azul 55%) é o hover. Tracejado só em estado vazio e no pé do menu. Tabelas usam filetes de 10% e um cabeçalho com filete ciano a 35%.

**Raios.** 20px painel · 18px globo · 16px mapa, brasão, estado vazio, linha da bolsa · 14px linha de lista, gaveta, toast · 12px botão, ícone-botão, abas · 10px campo · 8px logo de ativo · 999px cápsulas e barras.

**Movimento.** Curva padrão `cubic-bezier(.2,.8,.2,1)`. Entrada de painel: 0,6s subindo 10px, saindo de `blur(3px) brightness(1.5)`, com atraso de 50ms por filho. Listas entram com atraso de 30–35ms por item (`--i`). Hover de card/linha usa `cubic-bezier(.34,1.56,.64,1)` (sobe 3px ou desliza 4px). Animações contínuas: varredura do mapa (5s), ícone de estado vazio respirando (3,2s), letreiro da bolsa (5s por ativo), filete da linha pulsando com força proporcional à variação, ponto "ao vivo" (1,2s). Tudo desligado em `prefers-reduced-motion`.

**Hover e press.** Hover acende, nunca escurece: `brightness(1.15)` e halo maior nos botões; fundo azul a 10–22% nos itens de menu e ícone-botões; no menu de vidro o item **cresce** (`scale(1.08) translateX(4px)`) e o texto ganha brilho. Press: botão desce 1px; controles circulares encolhem para 0,94.

**Foco.** `outline: 2px solid var(--cyan)` com 2px de deslocamento em qualquer elemento; campos trocam a borda por ciano e ganham `0 0 0 3px rgba(63,227,255,.15)` mais brilho.

**Layout.** Grade de duas colunas (`--side 248px` + conteúdo) que vira uma só até 1100px; no desktop com mouse o menu fica escondido e desliza como vidro quando o ponteiro chega numa faixa de 18px na borda esquerda. A página inteira ocupa `100dvh` com `overflow: hidden` — quem rola é a lista interna (`.hg-rolar`). Fixos: cabeçalho, menu, barra inferior do celular (62px + safe area), letreiro da bolsa, selo de demonstração, gavetas. Indicadores em quatro colunas no desktop, duas até 991px, carrossel com scroll-snap no celular.

**Imagens.** Praticamente não há fotografia. Avatares são iniciais sobre gradiente azul→violeta. A única imagem de marca é o banner do BabelCoin (frio, escuro, violeta/azul), tratado com `object-fit: cover`, respiração lenta de escala, reflexo de vidro atravessando e gradiente de proteção na base para o texto.

**Gradientes de proteção vs cápsulas.** Sobre imagem, gradiente de proteção (`linear-gradient(180deg, transparent 60%, rgba(3,8,23,.95))`). Sobre mapa ou globo, cápsula de vidro com desfoque — nunca texto solto sobre o mapa.

## Fundamentos de conteúdo

Tudo em **pt-BR**, tratando o usuário por **você**, e falando do produto na terceira pessoa ("o Reino", "o Babel OS"). O produto fala como um painel de controle educado, não como um jogo gritado — a metáfora de reino aparece no vocabulário, não no tom.

- **Títulos de tela:** substantivo curto, sem artigo. "Guildas", "Conquistas", "Bolsa de Valores", "Escolha seu território no Reino".
- **Subtítulos:** uma frase afirmativa com ponto final, explicando o que a tela faz por você. "Grupos de empresas e membros do Reino que somam pontos juntos." · "Evolua no Reino avaliando, cadastrando empresas e fazendo matches." · "O seu título define o tamanho do mapa que você comanda."
- **Botões:** verbo no infinitivo, uma a três palavras. "Criar guilda", "Adicionar", "Entrar", "Copiar", "Abrir rede social", "Ver todos os matches", "Continuar cadastro →" (a seta aparece só em avanço de fluxo).
- **Estados vazios e erros:** dizem a causa e o próximo passo, sem pedir desculpas. "Não foi possível carregar as cotações / Defina `HGBRASIL_KEY` no servidor e reinicie-o."
- **Honestidade sobre os dados:** é regra do produto. O rodapé do menu diz "Modo demonstração · Dados fictícios. Conectar API"; a bolsa avisa "⚠ Cotações **fictícias** de demonstração"; toda tela de demonstração carrega o selo âmbar. Créditos de fonte aparecem em texto de 0,64rem no canto ("Dados: HG Brasil Finance · B3", "Contornos: svg-maps (Victor Cazanave), CC BY 4.0").
- **Caixa:** frase normal em tudo; caixa alta só em rótulos de coluna e sobretítulos, via CSS.
- **Números:** formato pt-BR, milhar com ponto e decimal com vírgula; variação sempre com sinal e seta (▲ ▼ ■); tempo relativo curto ("8 min", "3 h", "ontem").
- **Metadados** são encadeados com ` · ` — "Contabilidade · Campinas", "4 membros · 3.840 pts", "Nº 3 · setembro 2026".
- **Emoji:** praticamente não. Só três, em lugares fixos: ♥ e 💬 nos contadores do feed e ⚠ no aviso da bolsa. Ícones de módulo nunca são emoji. Símbolos unicode como ★, ▲, ▼, ■, →, ✕ e — (travessão para "sem dado") são usados livremente e fazem parte do estilo.

## Iconografia

O produto tem **conjunto próprio de ícones**, declarado em `app/js/shell.js` como `window.BabelIcones`: SVG inline em grade 24×24, `fill: none`, `stroke: currentColor`, `stroke-width: 1.8` (1.9 na barra inferior do celular), pontas e junções redondas. Não há biblioteca de terceiros, não há fonte de ícones, não há PNG de ícone na interface. Os 35 ícones foram copiados para `assets/icons/*.svg` e para o componente `Icon`, com o path data idêntico ao do produto.

- **Módulos:** `visao` (dashboard), `guilda`, `mapa`, `social`, `match`, `trofeu`, `revista`, `bolsa`, `busca`, `vitrine`, `coroa`, `config`.
- **Interface:** `menu`, `x`, `mais`, `sino`, `msg`, `filtro`, `baixar`, `link`, `alerta`, `pin`, `camadas`, `rota`, `plug`, `grafico`, `estrela`, `buscaIA` (lupa com faísca), `noticias`.
- **Herdados do módulo de serviços:** `ordens`, `tecnicos`, `agenda`, `clientes`, `analises`, `relatorios`.
- Tamanhos em uso: 16px no botão, 18px no ícone-botão, 19px no menu lateral, 21–22px no dock e na barra inferior, 24px no estado vazio, 28px no brasão de guilda.
- Ícone ativo fica branco com `drop-shadow` na cor do módulo; inativo, azul acinzentado `#7fa6f0`.
- **Marca do app (set/2026, decisão do cliente):** o app se chama **Reino** e sua marca é a **coroa** — o ícone `coroa` do conjunto do produto, num quadrado com gradiente ciano→violeta — seguida da palavra "Rei**no**" com "no" em ciano aceso. É o que `Sidebar` e o pré-cadastro mostram. "Babel OS" fica como nome do sistema/plataforma.
- **Ícone de instalação / BabelCoin:** o arquivo oficial é `assets/icone-512.png` (de `app/img/icone-512.png`) — a torre da Babel dentro de um "B" em neon ciano/violeta sobre fundo escuro, com o letreiro "BABELCOIN · BEYOND BORDERS". Variantes: `assets/apple-touch-icon.png` e `assets/babelcoin-emblema.webp` (emblema) e `assets/babelcoin-banner.webp` (faixa). **Nunca redesenhe o mark** — use sempre um desses arquivos. A assinatura ao lado dele é "Babel **OS**", com "OS" em ciano aceso. O emblema e o banner do **BabelCoin** (`assets/babelcoin-emblema.webp`, `assets/babelcoin-banner.webp`) são os outros dois ativos de marca.

## Componentes

Inventário derivado das classes `hg-*` de `app/css/app.css` e da marcação gerada em `app.js`/`bolsa.js`. Cada pasta tem um card `@dsCard` com os estados principais.

**`components/core/`** — `Panel`, `SectionHead`, `PageHead`, `Button`, `IconButton`, `Pill`, `Avatar`, `GlowNumber`, `Icon`.

**`components/forms/`** — `Input`, `Select`, `Field`, `Switch`, `Toolbar`.

**`components/data/`** — `KpiCard`, `ListRow`, `Table`, `ProgressBar`, `MetricRow`, `ProgressRing`, `Stars`, `Sparkline`, `DonutChart`, `LineChart`, `BarMetric`.

**`components/feedback/`** — `EmptyState`, `Toast`, `Drawer`, `AchievementBadge`, `DemoBadge`.

**`components/navigation/`** — `Sidebar`, `TopBar`, `TabBar`, `Tabs`, `MapDock`.

**`components/reino/`** — `FeedPost`, `GuildSummary`, `TitleChip`, `RankList`, `MarketStatus`, `StockRow`, `TickerTape`, `AffiliateLink`, `AffiliateLevel`, `NetworkMap`, `Accordion`.

### Adições intencionais

- **`Icon`** — o produto insere os SVG direto na marcação; um componente é a única forma de expor o mesmo conjunto no React.
- **`SectionHead`, `PageHead`, `Toolbar`, `Field`** — eram padrões repetidos de marcação (`.hg-head`, `.hg-page-head`, `.hg-toolbar`, `.hg-field`) sem componente próprio no produto.
- **`SocialPost` e `SocialComposer`** (`components/reino/`) — rede social em linha do tempo (estilo X): publicação sem caixa, separada por filete, com avatar, @arroba, coroa do título e ações; compositor com contador de 280. `FeedPost` (lista compacta) permanece para resumos.
- **`Globo` e `MapaPanel`** (no UI kit, não em `components/`) — invólucro React para o `globo.js` do produto, e o painel que o enquadra no dashboard.
- **`DonutChart`, `LineChart`, `BarMetric`** — pedidos pelo mapa mental do APP REINO para a faixa de Analytics (Score de reputação, Bolsa de Valores, Vendas). O produto só tinha anel, barra fina e sparkline.
- **`AffiliateLevel`** — o "Emblema e nível do Afiliado" da barra superior.
- **`NetworkMap`** — a "Rede ao vivo" pedida na referência de layout: empresas como pinos sobre o mapa, ligadas por raios de luz animados. Posições em porcentagem, então acompanha qualquer tamanho de painel.

### Motor do globo

O **globo** não foi reimplementado: o `globo.js` do produto (canvas 2D, projeção ortográfica, sem bibliotecas) roda no kit sem alteração, junto com `geo-mundo.js`, `geo-brasil.js`, `brasil.js` e os municípios do IBGE. Ele cobre Terra → Lua com a torre Babel → Brasil → estado → cidade → bairro, com arrastar, pinça, inércia, tooltip e mosaicos de rua reais. Consumir o globo no React é o componente `Globo` do kit (`../app/componentes/MapaPanel.jsx`) — não recrie esse desenho à mão.

## Escopo ampliado pelo cliente (setembro 2026)

Um mapa mental do **APP REINO** e uma referência de layout entregues pelo cliente ampliaram o produto além do que existe no repositório. Estes módulos e regras **não têm contrapartida no código de origem** — foram construídos a partir dessas especificações, e os números são fictícios coerentes com a escala do Reino:

- **Hierarquia ampliada:** entram **Visconde** e **Marquês** entre Barão e Duque. Benefícios por título: **Conde** ganha e-mail próprio, Gestor Financeiro, perfil verificado e vitrine destacada; **Marquês** ganha a Inteligência de Mercado do Reino e o direito de falar no Bate Papo. As mensalidades de Visconde (R$ 57) e Marquês (R$ 77) foram **interpoladas** entre as do produto — confirme os valores reais.
- **Alcance do mapa pelo título:** Imperador vê o Brasil; Rei, o Brasil por regiões; Príncipe, a região com os estados; Duque e abaixo, o estado com as cidades.
- **Bate Papo do Reino:** só Marquês para cima envia mensagem; os outros títulos apenas leem.
- **Busca Inteligente:** a **Vitrine Premium** aparece no topo dos resultados.
- **Feed por grupo de título:** Grupo de Duque, de Príncipe, de Rei e de Imperador.
- **Módulos novos:** Reino Academy, Níveis, Eventos, Clube de Benefícios, Rede Completa, Meus acessos e estatísticas, Bate Papo do Reino.
- **Faixa de Analytics no Dashboard:** Score de reputação (com comentários e classificação), Bolsa de Valores e Vendas (Faturamento total, Faturamento mensal, CPL, CVR).
- **Barra inferior:** Dashboard · Guildas por segmento · Clube de Benefícios · Rede Completa · Meus acessos e estatísticas.

Uma ideia do mapa mental ficou **sem construir** porque não deu para interpretar com segurança: o item "**Randomizando**" no centro da tela. Diga o que ele deve fazer e eu implemento.

## UI kit

`../app/` — recriação clicável, com `app-shell.css` (o shell de 100dvh sem rolagem, copiado do produto) e dados fictícios em `data.js`.

- `index.html` — app com menu, cabeçalho, barra inferior e **19 rotas**: Dashboard, Reino Academy, Níveis, Eventos, Guildas por segmento, Mapa Reino, Rede social, Bate Papo do Reino, Match Reino, Conquistas, Clube de Benefícios, Rede Completa, Meus acessos, Bolsa de Valores, Busca Inteligente, Vitrine, Revista, Hierarquia e Configurações.
- `mapa.html` — Mapa Reino em tela cheia, com o globo navegável.
- `pre-cadastro.html` — tela pública de escolha de título e território.

O kit carrega os arquivos originais do produto para geografia e dados (`globo.js`, `geo-mundo.js`, `geo-brasil.js`, `brasil.js`, `dados/municipios/*.json`, `dados-demo.js`, `demo-brasil.js`). Detalhes e limites em `../app/README.md`.

## Fontes: substituição pendente

Nenhum arquivo de fonte acompanha o repositório de origem — o produto carrega **Exo 2** e **Inter** do Google Fonts, e `tokens/fonts.css` faz o mesmo. Se a marca tiver licença de arquivos próprios (woff2), me envie: troco o `@import` por `@font-face` local.
