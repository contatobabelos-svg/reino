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
6. `2026-09-21_cadastro_cidade_uf.sql` — cidade e UF no cadastro (o lugar da empresa no mapa).
7. `2026-09-21_cnpj_unico.sql` — índice único parcial em `perfis.cnpj` + `reino_cnpj_existe` (só service_role).
8. `2026-09-21_mapa_empresas_com_foto.sql` — primeira versão de `empresas_do_mapa()`. **Substituída pela 12**; não rode de novo.

### Rodada do Parecer 1 (Analista Cético), 21/09 — o que o Salvador aplicou

9. `2026-09-21_fotos_so_logado_com_limite.sql` — **C3**: `public.fotos` não aceita mais INSERT/UPDATE de
   `anon` (com a chave publicável qualquer pessoa gravava linha sem teto de tamanho e enchia o disco).
   Gravar exige conta e `dono = auth.uid()`; `url` limitada a 20 kB e `chave` a 200. Ler continua público.
10. `2026-09-21_cadastros_so_servidor.sql` — **C6**: `public.cadastros` só recebe INSERT do `service_role`,
    ou seja, da `reino-cadastro`, depois que o Auth criou a conta (a linha usa o próprio `user.id` como
    chave primária). Antes qualquer um forjava indicação, e é daí que saem ranking e comissão.
    Em `cliques` (que continua aberto, é o link de afiliado) entra o gatilho `cliques_limpar`, que **corta**
    em vez de recusar: código limpo (40), origem 300, cidade 80, uf 8, e `criado_em`/`cadastrou` do servidor.
11. `2026-09-21_email_existe_usa_indice.sql` — **C9**: `reino_email_existe` filtra `instance_id` e passa a
    usar `users_instance_id_email_idx` em vez de varrer `auth.users` a cada cadastro.
12. `2026-09-21_mapa_por_cidade_paginado.sql` — **C8**: `empresas_do_mapa(p_uf, p_cidade, p_limite, p_pagina)`.
    A versão anterior tinha `limit 2000`, mas o PostgREST corta em `max_rows = 1000`: passando de mil
    empresas as UFs do fim do alfabeto sumiam do mapa em silêncio. Agora o limite tem teto de 500 por
    página e o mapa pede só a cidade em que o globo está. Todos os parâmetros têm padrão, então a chamada
    antiga (`{}`) continua valendo. Auxiliar `privado.chave_cidade` + índice `perfis_mapa_lugar`.

### Bate Papo (22/09)

13. `2026-09-22_chat_grupo_e_privado.sql` — `chat_mensagens` (sala `reino` = grupo único; `p:<uuid>:<uuid>` =
    privado) e `network_pedidos` (pendente → aceito | recusado), ambas no Realtime. Leitura e escrita decididas
    por `privado.chat_sala_liberada` / `chat_pode_falar_grupo`; pedir/responder só pelas RPCs
    `chat_pedir_network(p_para)` e `chat_responder_network(p_id, p_aceitar)`. Autor, nome, empresa e título
    preenchidos por gatilho a partir do perfil; 8 mensagens por conta a cada 30 s. `perfis` continua fechado.

14. `2026-09-22_guildas_matches_status_e_contas_teste.sql` — `guildas` + `guilda_membros`, `matches`, `status`
    (some em 24 h) e `privado.contas_teste`. Tudo que vem de conta de teste some para membro real
    (`privado.vejo_teste()` = admin ou conta de teste); admin lê os privados entre contas de teste, sem escrever.
    Semente das 77 contas fictícias: `semente-teste/gerar-contas-teste.py` (determinístico) e
    `semente-teste/remover-contas-teste.sql` (apaga tudo delas). Aplicada em prod em 22/09.

Ordem obrigatória do item 10, para não derrubar o cadastro ao vivo: publicar a `reino-cadastro` com o
insert no servidor → publicar o site sem o insert no navegador → só então rodar a migração.

### Domínio networkreino.com

- Registrado e configurado na Vercel (nameservers: `ns1.vercel-dns.com` / `ns2.vercel-dns.com`) ✔
- **Auth Site URL**: `https://networkreino.com` (via Supabase Management API)
- **Redirect URLs**: `https://networkreino.com/**`, `https://o-reino.vercel.app/**`, `http://localhost:8123/**`
- **`REINO_DOMINIO`**: `https://networkreino.com` em `app/nucleo/config.js`

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
3. **Auth** (painel → Authentication): confirmação de e-mail ligada; `Site URL` = `https://networkreino.com`
    e `https://o-reino.vercel.app` em *Redirect URLs*, para o link do e-mail voltar ao app.
   O SMTP padrão do Supabase manda só poucos e-mails por hora — com cadastro aberto, configurar SMTP próprio.
4. **Site**: push no `main` (Vercel monta com `montar-site.sh`). O App passa a abrir o `LoginImersivo`;
   `PortalLogin` fica de reserva automática se o arquivo novo não carregar.

Teste local: `testes/e2e-login-imersivo-local.cjs` (ver `testes/README.md`).
