# Testes do banco

Rodam contra o Supabase **local** (portas 5436x, `supabase/config.toml`), nunca contra produção.

1. `supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,storage-api,realtime,postgres-meta`
2. Restaure o esquema do backup (`~/Backups/reino/reino-schema-*.sql`) e aplique as migrações novas de `supabase/`.
3. `e2e-afiliados-local.cjs` foi **aposentado em 2026-09-21** (está em `arquivo/testes-aposentados/`,
   com o porquê no `LEIA-ME.md` de lá): dirigia a tela `PortalLogin`, que não é mais renderizada, e
   provava o cadastro inserido pelo navegador, que a C6 do Parecer 1 fechou.
4. `e2e-login-imersivo-local.cjs` (TODO W): precisa também de storage, edge-runtime e Mailpit, então suba com
   `supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta`, aplique
   `2026-09-21_login_imersivo_usuario_empresa_cnpj.sql` e rode as funções com
   `supabase functions serve --env-file supabase/functions/.env` (arquivo fora do git com
   `REINO_URL_PUBLICA=http://127.0.0.1:54361`). O `config.toml` local liga a confirmação de e-mail.
   O teste monta sozinho a cópia do site na porta 8141 (troca inclusive as URLs de produção fixas nas telas),
   cadastra pelo carrossel em 1440×900 e 390×844, confere banco/Storage/cadastros, confirma pelo Mailpit
   (porta 54364) e entra por usuário e por e-mail. Prints em `REINO_TESTE_PRINTS` (padrão
   `/tmp/claude-1000/reino-login-prints`, fora do git).
   Desde 2026-09-21 ele também cobre a etapa de cidade/UF, o CAPTCHA (C2) e a checagem de usuário
   pela função (C12). Para isso o `supabase/functions/.env` local precisa de
   `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` (chave de TESTE da Cloudflare, "sempre
   passa" — a de produção NUNCA entra em arquivo do repositório) e o `config.toml` já sobe o Auth
   local com `[auth.captcha]` ligado no provedor `turnstile` com a mesma chave de teste.
   No navegador o teste troca o `api.js` da Cloudflare por um dublê com a mesma interface: o desafio
   de verdade não fecha em navegador de teste. **A prova com o desafio real é humana**, no site
   publicado.

5. `e2e-noticias.cjs` (TODO Y): tela Notícias do Reino e bloco de notícias do Dashboard. **Não escreve nada**
   — a rota `noticias` da `reino-apis` é pública e só de leitura. Monta sozinho a cópia do site na porta 8152.
   A maior parte roda com respostas simuladas (`page.route`), então funciona sem banco nenhum:
   ```sh
   node supabase/testes/e2e-noticias.cjs                   # simulações + leitura real de produção
   REINO_SEM_PRODUCAO=1 node supabase/testes/e2e-noticias.cjs   # só simulações
   ```
   Para conferir também o formato **real** dos feeds, suba a função localmente antes (não precisa de Docker
   nem de `supabase start` — o Deno roda o arquivo direto; a cópia em `/tmp` só troca a porta):
   ```sh
   sed 's/^Deno.serve(async (req) => {/Deno.serve({ port: 8153 }, async (req) => {/' \
     supabase/functions/reino-apis/index.ts > /tmp/reino-func/index.ts
   npx deno@2 run --allow-net --allow-env /tmp/reino-func/index.ts
   REINO_FUNC_LOCAL=http://127.0.0.1:8153 node supabase/testes/e2e-noticias.cjs
   ```
   Prints em `REINO_TESTE_PRINTS` (padrão `/tmp/claude-1000/reino-noticias-prints`, fora do git).

6. `e2e-cadastro-cidade-uf.cjs`: o carrossel do cadastro sem precisar de Docker nenhum — o banco e a
   função são respondidos por `page.route`. Confere a etapa de cidade/UF, o token do CAPTCHA saindo
   junto do cadastro (C2) e a checagem de usuário passando pela função em vez da RPC pública (C12).
   ```sh
   node supabase/testes/e2e-cadastro-cidade-uf.cjs
   ```
   Prints em `REINO_TESTE_PRINTS` (padrão `/tmp/claude-1000/reino-cadastro-prints`).
