# Testes aposentados

Ficam aqui os testes que não valem mais (nunca voltam ao ar). Não são apagados para que dê para
consultar o que eles provavam.

## `e2e-afiliados-local.cjs` — aposentado em 2026-09-21 (Salvador, Parecer 1)

Dois motivos, cada um sozinho suficiente:

1. **Dirige uma tela que não existe mais.** O teste usa `.hg-portal-capa` e `.hg-portal-pilula`, da
   `PortalLogin`, que o `App.jsx` não renderiza desde que o `LoginImersivo` passou a ter precedência
   (`window.LoginImersivo || window.PortalLogin || LoginScreen`). Ele falharia hoje sem nenhuma
   mudança de código.
2. **Provava justamente o que a C6 do Parecer 1 fechou**: a linha de `public.cadastros` inserida
   pelo NAVEGADOR com a chave publicável. Agora quem insere é a Edge Function `reino-cadastro`, com
   a chave de serviço, depois que o Auth criou a conta.

O que cobre o mesmo terreno hoje:
- `supabase/testes/e2e-cadastro-cidade-uf.cjs` — o carrossel de cadastro (cidade/UF, token do
  CAPTCHA, checagem de usuário pela função);
- `supabase/testes/e2e-login-imersivo-local.cjs` — cadastro → e-mail → login ponta a ponta contra o
  Supabase local, incluindo a linha de `cadastros` gravada pelo servidor;
- `supabase/testes/e2e-dashboard-lateral.cjs` — o painel "Meus acessos".
