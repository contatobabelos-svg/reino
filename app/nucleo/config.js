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

window.onProfile = undefined; /* compatibilidade: versões antigas do pacote citavam esta variável */
