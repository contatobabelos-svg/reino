/* Reino · CAPTCHA (Cloudflare Turnstile) — C2 do Parecer 1.

   window.ReinoCaptcha.token() devolve um token NOVO a cada chamada (o Turnstile só aceita cada token
   UMA vez: repetir dá "timeout-or-duplicate"), ou null se o CAPTCHA não estiver configurado, o script
   da Cloudflare não carregar ou o desafio não terminar. Modo "interaction-only": o widget é invisível e
   só aparece, no centro da tela, quando a Cloudflare achar o acesso suspeito.

   Quem valida o token:
     · cadastro, login e reenvio  → a Edge Function (reino-cadastro / reino-login), que fala com o
       siteverify da Cloudflare com a secret guardada no segredo TURNSTILE_SECRET;
     · login por e-mail direto, recuperar senha e cadastro antigo → o próprio Auth do Supabase
       (campo gotrue_meta_security.captcha_token).
   Uma porta, uma validação. A Site Key é pública por natureza; a secret NUNCA aparece aqui.

   Configuração (no index.html, antes deste arquivo):
     window.REINO_CAPTCHA = { siteKey: "0x4AAA..." };
   Sem siteKey, token() devolve null e tudo continua funcionando como antes (as funções aceitam
   pedido sem token enquanto o TURNSTILE_SECRET não existir).

   Enquanto o desafio estiver na tela, dispara no window o evento "reino-captcha" com
   detail.estado = "desafio" | "fim", para a tela avisar a pessoa ("Confirme que você é humano"). */
(function () {
  const cfg = () => window.REINO_CAPTCHA || null;
  const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  let carregando = null, widget = null, caixa = null, pendente = null, mostrando = false;

  const avisar = (estado) => {
    if (estado === "desafio" && mostrando) return;
    if (estado === "fim" && !mostrando) return;
    mostrando = estado === "desafio";
    if (caixa) caixa.classList.toggle("hg-captcha--ativo", mostrando);
    try { window.dispatchEvent(new CustomEvent("reino-captcha", { detail: { estado } })); } catch (e) { /* navegador antigo */ }
  };

  function carregarScript() {
    if (window.turnstile) return Promise.resolve(true);
    if (carregando) return carregando;
    carregando = new Promise((ok) => {
      const s = document.createElement("script");
      s.src = SCRIPT; s.async = true; s.defer = true;
      s.onload = () => ok(!!window.turnstile);
      s.onerror = () => { carregando = null; ok(false); };
      document.head.appendChild(s);
    });
    return carregando;
  }

  function preparar() {
    if (widget !== null) return true;
    const c = cfg();
    if (!c || !c.siteKey || !window.turnstile) return false;
    caixa = document.createElement("div");
    caixa.className = "hg-captcha";
    caixa.setAttribute("aria-live", "polite");
    document.body.appendChild(caixa);
    const fim = (v) => { avisar("fim"); if (pendente) { pendente.ok(v); pendente = null; } };
    widget = window.turnstile.render(caixa, {
      sitekey: c.siteKey,
      execution: "execute",           // só roda quando pedimos (token())
      appearance: "interaction-only", // invisível, a não ser que precise de um clique
      theme: "dark",
      language: "pt-br",
      callback: (t) => fim(t),
      "error-callback": () => { fim(null); return true; },
      "timeout-callback": () => fim(null),
      "before-interactive-callback": () => avisar("desafio"),
      "after-interactive-callback": () => avisar("fim"),
    });
    return true;
  }

  async function token(limiteMs) {
    const c = cfg();
    if (!c || !c.siteKey) return null;
    if (!(await carregarScript())) return null;
    if (!preparar()) return null;
    if (pendente) { pendente.ok(null); pendente = null; }   // uma pergunta por vez
    return new Promise((ok) => {
      const t = setTimeout(() => { if (pendente && pendente.ok === fim) { pendente = null; avisar("fim"); ok(null); } }, limiteMs || 25000);
      const fim = (v) => { clearTimeout(t); ok(v); };
      pendente = { ok: fim };
      try { window.turnstile.reset(widget); window.turnstile.execute(widget); } catch (e) { pendente = null; avisar("fim"); fim(null); }
    });
  }

  window.ReinoCaptcha = { token, ativo: () => !!(cfg() && cfg().siteKey), desafiando: () => mostrando };
})();
