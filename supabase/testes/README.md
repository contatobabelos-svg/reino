# Testes do banco

Rodam contra o Supabase **local** (portas 5436x, `supabase/config.toml`), nunca contra produção.

1. `supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,storage-api,realtime,postgres-meta`
2. Restaure o esquema do backup (`~/Backups/reino/reino-schema-*.sql`) e aplique as migrações novas de `supabase/`.
3. `e2e-afiliados-local.cjs`: monta uma cópia do site apontando para o banco local (porta 8140) e confere
   clique → cadastro → gatilho, o que visitante, afiliado e admin conseguem ler, o ranking e o painel "Meus acessos".
   Usa só contas fictícias `@teste.local`.
4. `e2e-login-imersivo-local.cjs` (TODO W): precisa também de storage, edge-runtime e Mailpit, então suba com
   `supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta`, aplique
   `2026-09-21_login_imersivo_usuario_empresa_cnpj.sql` e rode as funções com
   `supabase functions serve --env-file supabase/functions/.env` (arquivo fora do git com
   `REINO_URL_PUBLICA=http://127.0.0.1:54361`). O `config.toml` local liga a confirmação de e-mail.
   O teste monta sozinho a cópia do site na porta 8141 (troca inclusive as URLs de produção fixas nas telas),
   cadastra pelo carrossel em 1440×900 e 390×844, confere banco/Storage/cadastros, confirma pelo Mailpit
   (porta 54364) e entra por usuário e por e-mail. Prints em `REINO_TESTE_PRINTS` (padrão
   `/tmp/claude-1000/reino-login-prints`, fora do git).
