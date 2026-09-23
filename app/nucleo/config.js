/* Reino · Config — compartilhada entre index.html (app) e entrar.html (login).
   Ficava embutida só no index.html; virou arquivo à parte para as duas páginas
   nunca ficarem com chaves diferentes por engano. */

/* Afiliados reais — cole aqui a URL e a chave anon do seu projeto Supabase (veja afiliados.sql).
   Enquanto vazio, os registros ficam só no navegador. */
window.REINO_SUPABASE = {
  url: "https://fxlansnepokjxdikxocb.supabase.co", /* projeto do cliente */
  anon: "sb_publishable_qrjZtFZVvByCqBHeTT5ktQ_1RdSulmM" /* chave publicável (Settings → API) — pública por natureza */
};
window.REINO_DOMINIO = "https://networkreino.com"; /* domínio próprio do Reino (Registro.br) */
window.REINO_GOOGLE = "AIzaSyClc0RGBDX7iUhhm_sMs7iukIOX4SP-Zhk"; /* Places (New) + Geocoding */
window.REINO_ROTA_R = false; /* true só quando o servidor reescreve /r/* para o app (vercel.json) */
/* CAPTCHA (C2 do Parecer 1): Site Key do Cloudflare Turnstile — pública por natureza, como a chave
   publicável acima. A secret fica só no Supabase (Auth) e no segredo da Edge Function. Sem esta
   linha o app funciona igual, só sem CAPTCHA. */
window.REINO_CAPTCHA = { siteKey: "0x4AAAAAAE_VWgCH0dB6d3Jq" };

window.onProfile = undefined; /* compatibilidade: versões antigas do pacote citavam esta variável */
