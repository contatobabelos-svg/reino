> **Revisão da Vyra (19/09/2026):** conferi por amostragem as fontes do top 5. A linha da Popover API estava errada (dizia "widely available desde abril/2025") e foi corrigida pela própria fonte citada. Demais itens do top 5 mantidos; itens "não confirmado" seguem assim.

# Design tecnológico e UX — levantamento set/2025 → set/2026

Pesquisador: agente de pesquisa de design/UX (Claude Sonnet 5), a pedido da Vyra.
Data da pesquisa: 19/09/2026. Todas as fontes foram acessadas nesta data.

---

## Resumo executivo (10 linhas)

O Reino é um app React 18 sem build (Babel no navegador), com uma rolagem única por
tela e visual holograma/neon. As APIs mais maduras e que já valem a pena hoje são:
**View Transitions (mesmo documento)**, **Popover API**, **`:has()`**, **`@starting-style`
+ `transition-behavior: allow-discrete`**, **container queries**, **`text-wrap: balance`**
e **`light-dark()`** — todas Baseline "widely" ou "newly available" em 2025/2026, sem
build e com fallback trivial (o navegador ignora a regra e mostra a versão simples).
**Anchor Positioning**, **Navigation API** e **`scrollend`** acabaram de virar Baseline
em 2026 e servem para os menus/popovers do app e para a rolagem única do `.hg-content`.
**Scroll-driven animations**, **customizable `<select>`**, **`interestfor`**, **CSS
`if()`** e **Speculation Rules** ainda não são Baseline (faltam Firefox e/ou Safari) —
dá para usar como reforço opcional, nunca como base. Para motion, **GSAP é 100% grátis
com todos os plugins** desde abril/2025 (bom para o globo/mapa); **Lenis** e **Motion**
seguem leves e sem build via CDN/ESM. O formato **DTCG de design tokens** virou padrão
estável em outubro/2025 — vale adotar a estrutura de `tokens/*.css` do Reino aos poucos.
Em conformidade: **WCAG 2.2** é o padrão vigente (WCAG 3 ainda é rascunho) e a
**European Accessibility Act** está em vigor desde 28/06/2025 para conteúdo novo — o
Reino, sendo pt-BR/Brasil, não é alvo direto da EAA, mas é boa prática seguir WCAG 2.2 AA.

---

## Tabela por item

| Nome | Categoria | Status/suporte | Data da fonte | Fonte (URL) | Serve para o Reino? Onde | Esforço |
|---|---|---|---|---|---|---|
| View Transitions API (mesmo documento) | API de plataforma | Baseline **newly available** (cross-browser desde Firefox 144, out/2025) | out/2025 | [web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available) | Sim — troca de telas no `App.jsx` (`ui_kits/babel-os/App.jsx`) | Baixo |
| View Transitions entre documentos (`@view-transition`) | API de plataforma | **Não é Baseline** — só Chromium; Firefox 144 e Safari 18 ignoram a regra | 2026 | [MDN via matéria](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Não agora — o Reino é SPA, não navega entre documentos | — |
| Scroll-driven animations (`animation-timeline: scroll()/view()`) | CSS | **Não é Baseline** — bloqueado por Firefox estável (Firefox 152, jun/2026, ainda atrás de flag); Safari 26 (set/2025) já suporta | jun/2026 | [web-features-explorer](https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/) | Progressive enhancement no `DashboardScreen.jsx` (indicador de progresso de rolagem) | Médio |
| CSS Anchor Positioning | CSS | **Baseline 2026** — Chrome 125+, Firefox 147 (jan/2026), Safari 26 (`@position-try` completo requer 18.4+) | jan/2026 | [oddbird.net](https://www.oddbird.net/2025/10/13/anchor-position-area-update/), [GitHub web-features#3558](https://github.com/web-platform-dx/web-features/issues/3558) | Sim — tooltips/menus ancorados ao invés de Popper/Floating UI, útil nos menus do `ReinoMapa.jsx` e cards do `MapaPanel.jsx` | Médio |
| Popover API (`popover`, `popovertarget`) | HTML/API | **Baseline newly available** desde 27/01/2025 (Safari 18.3 corrigiu o fechamento no iOS; o anúncio de abr/2024 foi retirado) — *corrigido pela Vyra em 19/09/2026* | jan/2025 | [web.dev](https://web.dev/blog/popover-baseline) | Sim — menus, tooltips e modais em várias `*Screen.jsx` sem lib de terceiros | Baixo |
| `interestfor` (Interest Invokers) | HTML | **Experimental, só Chromium** (Chrome 139+); posição da Mozilla ainda em aberto | 2026 | [Intent to Ship blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/bX1G_yDt6W4), [mozilla/standards-positions#1181](https://github.com/mozilla/standards-positions/issues/1181) | Não agora — reforço opcional futuro para hover-cards | — |
| `@starting-style` + `transition-behavior: allow-discrete` | CSS | **Baseline 2025** — Chrome 117+, Firefox 129+, Safari 17.4+ | 2025 | [web.dev](https://web.dev/blog/baseline-entry-animations) | Sim — animações de entrada/saída de modais e popovers (troca `display:none` sem JS) | Baixo |
| Container queries (tamanho) | CSS | **Baseline widely available** desde 2023 | 2023 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) | Sim — cards do `DashboardScreen.jsx`, `VitrineScreen.jsx` que mudam de layout por celular/tablet | Baixo |
| Container **style** queries (`style()`) | CSS | **Baseline newly available** desde 19/05/2026 (Chrome 148, Safari 26.5, Firefox 138/151) | mai/2026 | [drop times / MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) | Médio prazo — variar estilo de componente conforme token de cor herdado | Médio |
| `:has()` | CSS | **Baseline widely available** desde fim de 2023 | 2023 | [MDN Glossary Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility) | Sim — estados de formulário e validação sem JS extra | Baixo |
| Customizable `<select>` (`appearance: base-select`) | CSS | **Não é Baseline** — só Chromium 134+/Chrome 135+; Safari em Technology Preview, Firefox atrás de flag | set/2026 | [Chrome for Developers](https://developer.chrome.com/blog/a-customizable-select) | Progressive enhancement em formulários de cadastro (`PreCadastroScreen.jsx`) — cai para `<select>` nativo em outros navegadores | Médio |
| `field-sizing` | CSS | **Baseline 2026** (newly available, jun/2026, Firefox 152) | jun/2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing) | Sim — textareas de perfil/chat (`ChatScreen.jsx`, `PerfilScreen.jsx`) crescendo sem JS | Baixo |
| Speculation Rules API | API de plataforma | **Limited availability / experimental** — só Chromium com suporte amplo; Safari 26.2 atrás de flag, Firefox sem suporte | 2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) | Baixo valor — app é SPA sem build, pouco a prerenderizar | — |
| Navigation API | API de plataforma | **Baseline newly available** início de 2026 — Chrome, Edge, Firefox 147, Safari 26.2 (falta `precommitHandler` no Safari) | 2026 | [web.dev](https://web.dev/blog/baseline-navigation-api) | Sim — substituir o roteamento manual do `App.jsx`/`app-layout.js` por API nativa | Alto |
| `scrollend` (evento) | API de plataforma | **Baseline** completo desde dez/2025 (Safari 26.2 foi o último a entrar) | dez/2025 | [InfoQ](https://www.infoq.com/news/2026/04/safari-scrollend-support/) | Sim — detectar fim de rolagem em `.hg-content` para lazy-load/paginação | Baixo |
| CSS `if()` | CSS | **Experimental, só Chromium** (Chrome 137+); Firefox em progresso, Safari no roadmap 2026–2027 | mai-jun/2026 | [Chrome for Developers](https://developer.chrome.com/blog/if-article) | Não agora — usar só atrás de `@supports`, sem urgência | — |
| `sibling-index()` / `sibling-count()` | CSS | **Baseline newly available** desde ago/2026 (Chrome 138, Firefox 154, Safari 26.2) | ago/2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index) | Médio — atrasos de animação escalonada (stagger) em listas/rankings sem JS | Baixo |
| `text-wrap: balance` | CSS | **Baseline widely available** desde mai/2024 | 2025 | [LogRocket](https://blog.logrocket.com/css-text-wrap-balance-vs-text-wrap-pretty/) | Sim — títulos em Exo 2 nos cards e headers | Baixo |
| `text-wrap: pretty` | CSS | **Não é Baseline** — falta Firefox | 2026 | [WebKit blog](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/) | Sim como reforço, sem fallback quebrado (Firefox ignora) — parágrafos longos em `AcademyScreen.jsx` | Baixo |
| `light-dark()` | CSS | **Baseline newly available** (2024–2026, 83% de uso global) | mai/2026 | [web.dev](https://web.dev/articles/baseline-in-action-color-theme) | Baixo valor imediato — Reino é tema único escuro (`--bg #030817`), não tem modo claro | — |
| Relative color syntax (`oklch(from ...)`) | CSS | Definido na especificação CSS Color 5; suporte não confirmado em detalhe nesta pesquisa | — | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Using_relative_colors) | Possível — gerar variações de `--cyan`/`--violet` a partir de um token só | Médio |
| `@scope` | CSS | Baseline — não confirmado com data exata nesta pesquisa (citado como parte do CSS Nesting) | — | [W3C CSS Nesting](https://www.w3.org/TR/css-nesting-1/) | Não confirmado — verificar suporte exato antes de usar | — |
| CSS Nesting | CSS | **Baseline** confirmado como suportado nos browsers atuais | 2025 | [conradresearch.com](https://conradresearch.com/articles/css-nesting-is-now-baseline-supported) | Sim — já reduz necessidade de pré-processador no CSS do Reino | Baixo |
| `reading-flow` / `reading-order` | CSS | **Não é Baseline** — experimental, só parcialmente implementado | 2025 | [Chrome for Developers](https://developer.chrome.com/blog/reading-flow) | Não agora — foco em navegação por teclado seria bom, mas sem suporte cross-browser | — |
| OffscreenCanvas + WebGPU | API de plataforma | **WebGPU é Baseline desde jan/2026** em todos os engines principais (Chrome 113+, Firefox 147+, Safari 26+ no macOS/iOS) | jan/2026 | [VR.org](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default) | Médio prazo — acelerar o globo (`globo.js`, hoje canvas 2D) com fallback para 2D | Alto |
| `prefers-reduced-motion` | Media query | **Baseline widely available**, suporte excelente e estável | 2025 | [Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) | Sim, obrigatório — respeitar em todas as animações do globo/mapa/transições | Baixo |
| `prefers-reduced-transparency` | Media query | **Não é Baseline** — limited availability, suporte parcial | 2025 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency) | Sim como reforço — painéis de vidro (`hg-*`) ficando mais opacos para quem pediu menos transparência | Baixo |
| Web Animations API | API de plataforma | Estável, sem mudanças grandes confirmadas nesta pesquisa para 2025/2026 além de integração com scroll-driven animations | 2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) | Sim — já é base nativa para animações JS sem lib pesada | Baixo |
| Design Tokens Format Module (DTCG) | Padrão de design system | **Primeira versão estável 2025.10**, lançada 28/10/2025, com 40+ organizações (Figma, Adobe, Google, Microsoft, Shopify...) | 28/10/2025 | [W3C DTCG](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) | Sim, a médio prazo — migrar `tokens/*.css` para JSON no formato DTCG facilita interoperar com Figma/Style Dictionary | Alto |
| GSAP (motion) | Biblioteca | **100% grátis, todos os plugins incluídos** desde abril/2025 (Webflow adquiriu e liberou em out/2024→abr/2025) | abr/2025 | [css-tricks](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/), [webflow.com](https://webflow.com/blog/gsap-becomes-free) | Sim — animações do globo/mapa e do App shell, funciona via CDN sem build | Médio |
| Motion (ex-Framer Motion) | Biblioteca | Estável, core "vanilla JS" desde a v11, disponível via `npm`/CDN (jsDelivr) | 2025/2026 | [motion.dev](https://motion.dev/) | Possível — mas GSAP já cobre a necessidade e é mais leve para uso sem build | Médio |
| Lenis (smooth scroll) | Biblioteca | Ativa, versão 1.3.26 em ago/2026, CDN via jsDelivr | ago/2026 | [jsDelivr](https://www.jsdelivr.com/package/npm/lenis), [lenis.dev](https://lenis.dev/) | **Não usar** — o Reino já tem regra de rolagem única nativa (`.hg-content`); Lenis substitui o scroll nativo e pode conflitar com o zoom Ctrl/⌘ do globo/mapa | — |
| Rive | Biblioteca de animação | Runtime web em Canvas, com script via CDN sem build | 2025/2026 | [rive.app docs](https://rive.app/docs/runtimes/web/web-js) | Possível para brasões/insígnias animadas do Heraldo, mas exige arquivos `.riv` (novo formato de asset) | Alto |
| dotLottie / Lottie | Biblioteca de animação | Player WASM (Rust + ThorVG), disponível via CDN (`+esm`) sem build | 2026 | [GitHub LottieFiles/dotlottie-web](https://github.com/lottiefiles/dotlottie-web) | Possível para ícones/insígnias animadas exportadas do After Effects/Lottie, sem build | Médio |
| Nielsen Norman Group — Agentes de IA como usuários | UX / evidência | Artigo "AI Agents as Users" cobre design pensando também em agentes de IA como usuários da interface | 2026 | [nngroup.com](https://www.nngroup.com/articles/ai-agents-as-users/) | Referência de leitura, não muda telas do Reino agora | — |
| Nielsen Norman Group — UX Reset 2025 / State of UX 2026 | UX / evidência | Relatórios sobre o papel de curadoria humana em produtos com IA | 2025/2026 | [nngroup.com](https://www.nngroup.com/articles/ux-reset-2025/) | Referência estratégica para o Theus (aulas) | — |
| Baymard — Checkout UX 2025 | UX / evidência | Até 35% de aumento de conversão possível melhorando checkout; 65% dos sites líderes têm checkout "mediano ou pior" | 2025 | [baymard.com](https://baymard.com/blog/current-state-of-checkout-ux) | Referência para telas de assinatura/pagamento do Reino (quando o preço for definido pelos sócios) | — |
| Baymard — Mobile UX 2026 | UX / evidência | 75% dos sites de e-commerce mobile são só "medianos" em UX | 2026 | [baymard.com](https://baymard.com/blog/mobile-ux-ecommerce) | Sim — Reino tem uso forte em celular; vale revisão de toque/alvo mínimo nas telas | — |
| WCAG 2.2 | Acessibilidade | **Recomendação W3C vigente**, padrão de conformidade atual | 2026 (confirmação) | [accesstive.com](https://accesstive.com/blog/wcag-2-2-vs-wcag-3-0/) | Sim — checklist mínimo de acessibilidade para todas as telas | Médio |
| WCAG 3.0 | Acessibilidade | **Working Draft**, última publicação 10/09/2026, ainda não é padrão, sem previsão de virar Recomendação nos próximos anos | 10/09/2026 | [w3.org/WAI](https://www.w3.org/WAI/news/2026-09-10/wcag3/) | Não agora — monitorar, não implementar | — |
| European Accessibility Act (EAA) | Regulação | Em vigor desde **28/06/2025** para conteúdo novo (2030 para conteúdo existente); exige WCAG 2.1 AA para produtos/serviços digitais vendidos na UE | 2025 | [Wikipedia/levelaccess.com — ver nota](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/) | Não é alvo direto (Reino é rede B2B brasileira), mas WCAG 2.1/2.2 AA é boa prática de qualquer forma | — |
| LGPD/ANPD — Agenda Regulatória 2025-2026 | Regulação | ANPD vai publicar diretrizes sobre consentimento de cookies, dark patterns e IA/tecnologias emergentes como eixo prioritário de fiscalização 2026 | 2025/2026 | [migalhas.com.br](https://www.migalhas.com.br/coluna/migalhas-de-protecao-de-dados/423103/destaques-da-agenda-regulatoria-2025-2026-da-anpd) | Sim — cuidado com banners de consentimento e qualquer padrão de interface que pareça dark pattern nas telas de cadastro | Médio |
| React 18 UMD (contexto do Reino) | Infraestrutura | Ainda disponível via unpkg, mas **React está removendo builds UMD** a partir da v19 — risco de longo prazo para o padrão "sem build" do Reino | 2025/2026 | [React 19 upgrade guide, citado em busca](https://github.com/facebook/react) | Aviso técnico — não é item novo de UX, mas afeta arquitetura do `App.jsx` | — |

---

## Aplicar no Reino primeiro (top 5)

1. **Popover API (`popover`, `popovertarget`) — Baseline desde abril/2025.**
   Problema que resolve: hoje qualquer menu, tooltip ou modal do Reino precisa de
   JS manual para abrir/fechar, controlar z-index e fechar ao clicar fora. A
   Popover API resolve isso nativamente, sem lib, com foco e teclado corretos de
   graça. Onde aplicar: menus de navegação e modais em `App.jsx` e nas telas
   `*Screen.jsx` que hoje simulam popover com `useState` + `onClick` fora.
   Fallback: navegadores sem suporte simplesmente não têm o atributo `popover`
   reconhecido — é preciso manter o JS de abrir/fechar como fallback controlado
   por feature-detection (`if (HTMLElement.prototype.hasOwnProperty('popover'))`).

2. **View Transitions API, mesmo documento — Baseline newly available (out/2025).**
   Problema que resolve: troca de tela no `App.jsx` hoje é abrupta (sem transição
   suave), e qualquer solução em JS custaria uma lib de animação. `document.
   startViewTransition()` dá a transição nativa entre estados da SPA. Onde
   aplicar: troca de `Screen` no roteador central do `App.jsx`. Fallback: se
   `document.startViewTransition` não existir, a troca de tela simplesmente
   acontece sem animação (comportamento atual) — checar com
   `if (document.startViewTransition) {...} else {...}`.

3. **`@starting-style` + `transition-behavior: allow-discrete` — Baseline 2025.**
   Problema que resolve: animar a entrada/saída de um popover, modal ou toast
   hoje exige truques com `setTimeout` para não animar de `display:none` direto.
   Essas duas regras CSS resolvem isso puro em CSS. Onde aplicar: toasts e
   modais em `hg-*` classes (`components/babel-ui.css`). Fallback: em navegador
   sem suporte, o elemento aparece/desaparece sem animação de entrada, mas
   funciona normalmente (não quebra).

4. **`scrollend` + Navigation API — Baseline 2025/2026.**
   Problema que resolve: a regra de "uma rolagem por tela" do `.hg-content` e o
   controle de zoom do globo/mapa hoje dependem de listeners de `scroll` com
   debounce manual. `scrollend` dá o fim de rolagem de graça, e a Navigation API
   dá um jeito nativo e mais previsível de interceptar troca de tela dentro da
   SPA (hoje provavelmente feito à mão em `app-layout.js`). Onde aplicar: `app-
   layout.js`, `app-shell.css`. Fallback: sem `scrollend`, manter o debounce
   atual; sem Navigation API, manter o roteamento manual.

5. **`text-wrap: balance` + `field-sizing` — Baseline widely/2026.**
   Problema que resolve: títulos em Exo 2 quebrando de forma feia (órfã) nos
   cards, e textareas de chat/perfil que crescem via JS a cada tecla. Ambas as
   regras resolvem só com CSS, zero JS. Onde aplicar: títulos `--font-d` em
   cards (`DashboardScreen.jsx`, `VitrineScreen.jsx`) e textareas em
   `ChatScreen.jsx`/`PerfilScreen.jsx`. Fallback: sem suporte, texto quebra do
   jeito atual e textarea usa altura fixa/scroll — nada quebra.

Bônus de infraestrutura (fora do top 5, mas relevante): **GSAP agora é 100%
grátis com todos os plugins** (abril/2025) — vale considerar para as animações
do globo (`globo.js`) e do mapa, no lugar de código de animação manual em
canvas, sem precisar de build.

---

## Não usar agora

- **Scroll-driven animations (`animation-timeline`)** — bloqueado por Firefox
  estável até pelo menos meados de 2026; usar só como progressive enhancement
  atrás de `@supports`, nunca como base de uma interação essencial.
- **Customizable `<select>` (`appearance: base-select`)** — só Chromium; Safari
  em Technology Preview e Firefox atrás de flag em set/2026. Não travar nenhum
  formulário nisso.
- **`interestfor` (Interest Invokers)** — experimental, só Chrome 139+, posição
  da Mozilla ainda em discussão. Interessante para o futuro (hover-cards
  declarativos), mas não agora.
- **CSS `if()`** — só Chromium (Chrome 137+); Firefox "em progresso", Safari no
  roadmap 2026–2027. Esperar.
- **Speculation Rules API** — Firefox sem suporte, Safari atrás de flag; e o
  Reino é uma SPA sem navegação entre documentos, então o ganho seria pequeno
  mesmo se suportado.
- **Lenis (smooth scroll)** — o Reino já tem uma regra deliberada de rolagem
  nativa única por tela, com zoom controlado por Ctrl/⌘ no globo/mapa; um scroll
  "smoothing" de terceiros pode entrar em conflito com essa regra e com
  acessibilidade (usuários de teclado/leitor de tela dependem de scroll nativo
  previsível). Não recomendado.
- **`light-dark()` e relative color syntax para tema claro** — o Reino tem tema
  único escuro por identidade (`--bg #030817`); não há necessidade de suportar
  modo claro agora, então o ganho é baixo.
- **Rive** — exige um novo formato de asset (`.riv`) e pipeline de criação
  fora do stack atual do Heraldo; maior custo de adoção do que o benefício
  imediato.
- **WCAG 3.0** — ainda é rascunho (Working Draft de 10/09/2026), sem previsão de
  virar padrão nos próximos anos; seguir WCAG 2.2 AA por enquanto.
- **Migração completa dos tokens para o formato DTCG** — a especificação é
  nova (estável desde 28/10/2025); vale acompanhar as ferramentas (Style
  Dictionary, Tokens Studio) amadurecerem antes de reescrever `tokens/*.css`.

---

## Itens sem confirmação (marcados no relatório)

- Suporte exato e data de `@scope` como Baseline (a busca só confirmou que faz
  parte do CSS Nesting Module, sem número de versão de browser).
- Suporte detalhado de relative color syntax (`oklch(from ...)`) por browser —
  a busca confirmou a especificação, não uma tabela de suporte com datas.
- Detalhes de mudanças específicas na Web Animations API entre 2025 e 2026 além
  da integração com scroll-driven animations — não encontrei changelog dedicado.
- Data exata de quando o `prefers-reduced-transparency` deve virar Baseline —
  a busca só confirmou "suporte parcial, limited availability".

---

## Fontes (com data de acesso: 19/09/2026)

- https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/
- https://developer.chrome.com/blog/scroll-triggered-animations
- https://www.oddbird.net/2025/10/13/anchor-position-area-update/
- https://github.com/web-platform-dx/web-features/issues/3558
- https://web.dev/blog/popover-baseline
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
- https://groups.google.com/a/chromium.org/g/blink-dev/c/bX1G_yDt6W4
- https://github.com/mozilla/standards-positions/issues/1181
- https://web.dev/blog/baseline-entry-animations
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style
- https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries
- https://www.thedroptimes.com/70900/css-container-style-queries-drupal
- https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility
- https://bugzilla.mozilla.org/show_bug.cgi?id=1958445
- https://developer.chrome.com/blog/a-customizable-select
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing
- https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
- https://web.dev/blog/baseline-navigation-api
- https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API
- https://www.infoq.com/news/2026/04/safari-scrollend-support/
- https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollend_event
- https://developer.chrome.com/blog/if-article
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count
- https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/
- https://blog.logrocket.com/css-text-wrap-balance-vs-text-wrap-pretty/
- https://web.dev/articles/baseline-in-action-color-theme
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Using_relative_colors
- https://www.w3.org/TR/css-nesting-1/
- https://conradresearch.com/articles/css-nesting-is-now-baseline-supported
- https://developer.chrome.com/blog/reading-flow
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-flow
- https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default
- https://www.w3.org/TR/webgpu/
- https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- https://www.designtokens.org/tr/drafts/format/
- https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- https://webflow.com/blog/gsap-becomes-free
- https://motion.dev/
- https://www.jsdelivr.com/package/npm/lenis
- https://lenis.dev/
- https://rive.app/docs/runtimes/web/web-js
- https://github.com/lottiefiles/dotlottie-web
- https://www.nngroup.com/articles/ai-agents-as-users/
- https://www.nngroup.com/articles/ux-reset-2025/
- https://baymard.com/blog/current-state-of-checkout-ux
- https://baymard.com/blog/mobile-ux-ecommerce
- https://accesstive.com/blog/wcag-2-2-vs-wcag-3-0/
- https://www.w3.org/WAI/news/2026-09-10/wcag3/
- https://www.w3.org/TR/wcag-3.0/
- https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/
- https://www.migalhas.com.br/coluna/migalhas-de-protecao-de-dados/423103/destaques-da-agenda-regulatoria-2025-2026-da-anpd
- https://fuselabcreative.com/ui-design-for-ai-agents/
- https://hatchworks.com/blog/ai-agents/agent-ux-patterns/
