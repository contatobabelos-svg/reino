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
4. `2026-09-21_fecha_leitura_cadastros_cliques.sql` — substitui as regras de cliques e cadastros do item 3:
   - público só **registra** clique e cadastro, não lê mais nenhum dos dois;
   - afiliado logado lê só os do próprio código; admin lê todos;
   - e-mail dos cadastros só pela função `admin_cadastros()`; ranking só pela função `ranking_afiliados()` (código + total);
   - o clique vira "cadastrou" por trigger quando entra um cadastro com `visita_id`.
5. `2026-09-21_trigger_ao_criar_usuario.sql` — o gatilho de `auth.users` que cria o perfil (já existia; o dump não o exporta).

Backup: `~/Backups/reino/` (fora do git, tem dado pessoal), com `COMO-RESTAURAR.md`.
Testes: `supabase/testes/` (sempre no Supabase local).

Para tornar alguém administrador: no SQL Editor,
`update perfis set situacao = 'admin' where email = '...';`

## Login imersivo (TODO W) — pronto no local, AINDA NÃO publicado

Arquivos:
- `2026-09-21_login_imersivo_usuario_empresa_cnpj.sql` — perfis ganha `usuario` (único, minúsculo,
  `^[a-z0-9][a-z0-9._]{2,23}$`, lista de reservados), `empresa` e `cnpj` (14 dígitos com dígitos
  verificadores); `criar_perfil` copia os três do `raw_user_meta_data` (valor fora do formato vira null);
  `proteger_perfil` impede a própria conta de trocar `usuario` e `cnpj` (só admin/servidor — a empresa
  continua editável); RPCs `usuario_disponivel` (anon, só boolean), `reino_email_do_usuario`,
  `reino_email_existe` e `reino_limite_login` (só service_role); tabela `privado.tentativas_login`;
  bucket público `avatares` (2 MB, webp/jpeg, sem listagem pública; o dono só mexe em `<uid>.webp|.jpg`).
- `functions/reino-cadastro` — multipart; valida tudo de novo, confere usuário livre e e-mail novo,
  faz o signup normal (o Auth manda o e-mail de confirmação), grava a foto em `avatares/<user_id>.webp`
  e o link em `perfis.foto`. Se a foto falhar, apaga a conta recém-criada.
- `functions/reino-login` — usuário **ou** e-mail + senha; latência mínima 600 ms + jitter; erro genérico
  "Usuário ou senha não conferem."; `email_nao_confirmado` só quando a senha confere; `acao: "reenviar"`
  reenvia o link; limite 60 tentativas/5 min por IP e 10 por IP+usuário.
- `functions/_shared/reino-validar.ts` — regras comuns (iguais às do `app/telas/LoginImersivo.jsx`).
- As duas funções rodam com `verify_jwt = false` (o app chama com a chave publicável, que não é JWT;
  ver `config.toml`). Nenhuma chave secreta vai para o app.

Publicar (nesta ordem, com autorização do fundador):
1. **Migração**: colar `2026-09-21_login_imersivo_usuario_empresa_cnpj.sql` no SQL Editor do projeto
   `fxlansnepokjxdikxocb` (é idempotente) e conferir:
   `select usuario_disponivel('teste.qualquer');` → `true`; `select id, public from storage.buckets where id='avatares';`.
2. **Funções**:
   `supabase functions deploy reino-cadastro --no-verify-jwt --project-ref fxlansnepokjxdikxocb`
   `supabase functions deploy reino-login --no-verify-jwt --project-ref fxlansnepokjxdikxocb`
   (em produção não precisa de `REINO_URL_PUBLICA`: o `SUPABASE_URL` já é o endereço público.)
   Conferir: `curl -X POST https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-login -H "apikey: <publicável>" -H "Content-Type: application/json" -d '{"usuario":"ninguem","senha":"12345678"}'`
   → `{"ok":false,"codigo":"nao_confere",...}`.
3. **Auth** (painel → Authentication): confirmação de e-mail ligada; `Site URL` = `https://o-reino.vercel.app`
   e a mesma URL (e o domínio próprio, se houver) em *Redirect URLs*, para o link do e-mail voltar ao app.
   O SMTP padrão do Supabase manda só poucos e-mails por hora — com cadastro aberto, configurar SMTP próprio.
4. **Site**: push no `main` (Vercel monta com `montar-site.sh`). O App passa a abrir o `LoginImersivo`;
   `PortalLogin` fica de reserva automática se o arquivo novo não carregar.

Teste local: `testes/e2e-login-imersivo-local.cjs` (ver `testes/README.md`).
