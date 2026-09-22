# Apresentação das abas — referências (AJ4, 22/09)

Pesquisa feita para o pop-up que aparece uma vez por aba, com o Assistente do Reino falando.

## Quem faz bem (e o que copiamos)

| Referência | Padrão | O que copiamos |
|---|---|---|
| Duolingo (Duo) — userguiding.com/blog/duolingo-onboarding-ux · goodux.appcues.com/blog/duolingo-user-onboarding | mascote fala dentro da tela, uma frase por vez | personagem fixo (o RostoPixel), tom encorajador, frase curta |
| Slack — stonly.com/blog/user-onboarding-examples | robô conversando no lugar de um tour estático | o assistente "fala", não é um manual |
| Notion — contentsquare.com/guides/user-onboarding/examples | dica curta de ~20 s, pouco atrito | 15–20 s de áudio por aba, 2–3 frases |
| Linear — mobbin.com (fluxos do Linear) | uma dica por conceito, sem tour pesado | um cartão por aba, só na primeira vez |
| Headspace — mobbin.com (fluxos do Headspace) | voz calma e coerente com a marca | uma voz só para o app inteiro |
| Adobe (coachmarks) — medium.com/@harsh.designsuiux | mais visual, texto mínimo, ação clara | botão "Entendi" em destaque |
| Appcues — appcues.com/blog/choosing-the-right-onboarding-ux-pattern | quando usar modal, tooltip, hotspot, checklist | cartão no canto (não bloqueia a tela) + aviso "Falta completar" em Minha conta |
| Clippy (o que NÃO fazer) — thenewstack.io/humanity-vs-clippy… | interrompia, repetia, sem saída | aparece uma vez, "Não mostrar mais", Esc fecha, "?" reabre quando a pessoa quiser |

## Regras que seguimos

- Curto: 2–3 frases, 9–17 s falados.
- Sempre com saída: "Entendi", "Não mostrar mais", Esc. Reabre pelo "?" da barra de cima; Configurações
  liga todas de novo.
- Texto sempre na tela (a voz é extra); botão de mudo lembrado.
- Áudio só depois de um gesto da pessoa (política de autoplay do Chrome —
  developer.chrome.com/blog/autoplay). A apresentação abre logo depois de um clique numa aba, então
  quase sempre toca; se o navegador bloquear, aparece "Ouvir".

## Biblioteca ou componente próprio

driver.js (MIT, ~5 KB) e Shepherd.js (MIT) servem para tours de vários passos; intro.js é AGPL (evitar).
Para um cartão por aba com o nosso visual, fizemos componente próprio: `app/componentes/Apresentacao.jsx`.

## Voz

Gerada uma vez por `scripts/gerar-vozes.cjs` com o edge-tts (voz neural `pt-BR-AntonioNeural`, a
mesma do Azure). O edge-tts usa o serviço de leitura do navegador Edge, sem contrato comercial.
Para uso comercial garantido, gerar os mesmos arquivos pela API oficial do Azure Speech
(≈ US$ 15 por milhão de caracteres, 500 mil/mês grátis; os 24 textos somam ~4 mil caracteres).
Alternativas: ElevenLabs (voz mais expressiva, pode ter voz própria do Reino), OpenAI TTS,
Piper (grátis e offline, qualidade menor).
