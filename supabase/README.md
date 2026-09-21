# Supabase do Reino

Projeto: `fxlansnepokjxdikxocb` (sa-east-1).

Migrações aplicadas, em ordem:

1. `2026-09-16_afiliados.sql` — tabelas originais (as políticas abertas dele foram substituídas pela 3).
2. `2026-09-19_cliques_cidade_uf.sql` — colunas de localização nos cliques.
3. `2026-09-19_seguranca_rls_por_dono.sql` — regras de acesso por dono:
   - perfis: cada conta vê/edita só o seu; `situacao` e `email` só mudam por admin;
     conta nova ganha perfil `aguardando` automaticamente (trigger em `auth.users`).
   - codigos: leitura pública; só o dono cria/edita.
   - cliques: sem dado pessoal; público registra e lê; só `cadastrou` pode ser marcado.
   - cadastros: público se cadastra e lê sem e-mail; e-mail só para admin.
   - fotos: leitura pública; só o dono (ou admin) troca.

Para tornar alguém administrador: no SQL Editor,
`update perfis set situacao = 'admin' where email = '...';`
