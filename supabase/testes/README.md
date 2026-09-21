# Testes do banco

Rodam contra o Supabase **local** (portas 5436x, `supabase/config.toml`), nunca contra produção.

1. `supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,storage-api,realtime,postgres-meta`
2. Restaure o esquema do backup (`~/Backups/reino/reino-schema-*.sql`) e aplique as migrações novas de `supabase/`.
3. `e2e-afiliados-local.cjs`: monta uma cópia do site apontando para o banco local (porta 8140) e confere
   clique → cadastro → gatilho, o que visitante, afiliado e admin conseguem ler, o ranking e o painel "Meus acessos".
   Usa só contas fictícias `@teste.local`.
