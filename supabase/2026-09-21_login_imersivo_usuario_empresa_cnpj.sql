-- W · Login imersivo (21/09): usuário de login, empresa e CNPJ no perfil, foto no Storage.
--
-- O que muda:
--   1. public.perfis ganha `usuario` (único, minúsculo, 3–24, letras/números/ponto/sublinhado,
--      começando por letra ou número), `empresa` e `cnpj` (14 dígitos com dígitos verificadores).
--   2. privado.criar_perfil copia usuario/empresa/cnpj do raw_user_meta_data do cadastro.
--      Valor fora do formato vira null (o cadastro validado passa pela função reino-cadastro;
--      quem chamar o /auth/v1/signup direto não consegue gravar lixo). Usuário repetido faz o
--      cadastro falhar pelo índice único — a função traduz isso em "usuário indisponível".
--   3. privado.proteger_perfil: a própria conta NÃO troca `usuario` nem `cnpj` (só admin ou
--      servidor). DECISÃO: usuário é a chave de login e o CNPJ identifica a empresa no Reino;
--      deixar a conta trocar sozinha abriria tomada de usuário alheio que vagou e troca de CNPJ
--      depois da aprovação. `empresa` (nome) continua editável pela própria conta.
--   4. RPC public.usuario_disponivel(text) → boolean (anon pode chamar; não devolve nada além do sim/não).
--   5. RPCs public.reino_email_do_usuario(text), public.reino_email_existe(text) e
--      public.reino_limite_login(...) só para o service_role (usadas por reino-login e reino-cadastro).
--   6. Bucket `avatares` (público para LER o arquivo pelo link; sem listagem pública).
--      Caminho: avatares/<user_id>.webp (ou .jpg quando o navegador não gera WebP).
--      Quem grava é o servidor (reino-cadastro, service_role) ou o próprio dono.
--
-- Idempotente: pode rodar de novo sem erro.

begin;

-- ---------------------------------------------------------------- validações reutilizáveis
create or replace function privado.cnpj_valido(p text) returns boolean
language plpgsql immutable set search_path to '' as $$
declare
  d int[]; s int; r int; i int;
  p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  if p is null or p !~ '^[0-9]{14}$' or p ~ '^(\d)\1{13}$' then return false; end if;
  d := array(select substr(p, g, 1)::int from generate_series(1, 14) g);
  s := 0; for i in 1..12 loop s := s + d[i] * p1[i]; end loop;
  r := s % 11; if (case when r < 2 then 0 else 11 - r end) <> d[13] then return false; end if;
  s := 0; for i in 1..13 loop s := s + d[i] * p2[i]; end loop;
  r := s % 11; return (case when r < 2 then 0 else 11 - r end) = d[14];
end $$;

-- nomes que ninguém pega como usuário (mesma lista em functions/_shared/reino-validar.ts)
create or replace function privado.usuario_reservado(p text) returns boolean
language sql immutable set search_path to '' as $$
  select coalesce(p, '') = any (array['admin','administrador','adm','root','reino','babel','babelos','babel.os',
    'suporte','ajuda','contato','sistema','system','api','www','imperador','oficial','moderador','teste']);
$$;

create or replace function privado.usuario_formato_ok(p text) returns boolean
language sql immutable set search_path to '' as $$
  select coalesce(p, '') ~ '^[a-z0-9][a-z0-9._]{2,23}$';
$$;

revoke all on function privado.cnpj_valido(text), privado.usuario_reservado(text), privado.usuario_formato_ok(text) from public;
grant execute on function privado.cnpj_valido(text), privado.usuario_reservado(text), privado.usuario_formato_ok(text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------- colunas novas
alter table public.perfis
  add column if not exists usuario text,
  add column if not exists empresa text,
  add column if not exists cnpj text;

alter table public.perfis drop constraint if exists perfis_usuario_formato;
alter table public.perfis add constraint perfis_usuario_formato
  check (usuario is null or privado.usuario_formato_ok(usuario));
alter table public.perfis drop constraint if exists perfis_cnpj_formato;
alter table public.perfis add constraint perfis_cnpj_formato
  check (cnpj is null or privado.cnpj_valido(cnpj));
alter table public.perfis drop constraint if exists perfis_empresa_tamanho;
alter table public.perfis add constraint perfis_empresa_tamanho
  check (empresa is null or char_length(empresa) between 2 and 120);

create unique index if not exists perfis_usuario_unico on public.perfis (usuario);

-- ---------------------------------------------------------------- perfil nasce com os dados do cadastro
create or replace function privado.criar_perfil() returns trigger
language plpgsql security definer set search_path to '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text := lower(btrim(m->>'usuario'));
  c text := regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g');
  e text := nullif(left(btrim(coalesce(m->>'empresa', '')), 120), '');
begin
  if not privado.usuario_formato_ok(u) or privado.usuario_reservado(u) then u := null; end if;
  if not privado.cnpj_valido(c) then c := null; end if;
  if char_length(e) < 2 then e := null; end if;
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao, usuario, empresa, cnpj)
  values (new.id, new.raw_user_meta_data->>'nome', new.email, new.raw_user_meta_data->>'titulo',
          new.raw_user_meta_data->>'cidade', new.raw_user_meta_data->>'uf', 'aguardando', u, e, c)
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function privado.criar_perfil() from public, anon, authenticated;

-- ---------------------------------------------------------------- a conta não troca usuário nem CNPJ
create or replace function privado.proteger_perfil() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not privado.eh_admin() then
    if tg_op = 'INSERT' then
      if new.situacao is null or new.situacao not in ('aguardando', 'pre-cadastro') then new.situacao := 'aguardando'; end if;
      new.email := (select u.email from auth.users u where u.id = new.id);
      new.usuario := null;  -- usuário e CNPJ só nascem pelo cadastro (metadados) ou por admin
      new.cnpj := null;
    else
      new.situacao := old.situacao;
      new.email := old.email;
      new.id := old.id;
      new.usuario := old.usuario;
      new.cnpj := old.cnpj;
    end if;
  end if;
  return new;
end $$;
revoke all on function privado.proteger_perfil() from public, anon, authenticated;

-- ---------------------------------------------------------------- RPCs
-- disponível = formato certo, não reservado e ninguém usa. Só boolean.
create or replace function public.usuario_disponivel(p_usuario text) returns boolean
language sql stable security definer set search_path to '' as $$
  select privado.usuario_formato_ok(lower(btrim(coalesce(p_usuario, ''))))
     and not privado.usuario_reservado(lower(btrim(coalesce(p_usuario, ''))))
     and not exists (select 1 from public.perfis p where p.usuario = lower(btrim(coalesce(p_usuario, ''))));
$$;
revoke all on function public.usuario_disponivel(text) from public;
grant execute on function public.usuario_disponivel(text) to anon, authenticated, service_role;

-- usuário → e-mail do Auth. Só o servidor (reino-login) chama.
create or replace function public.reino_email_do_usuario(p_usuario text) returns text
language sql stable security definer set search_path to '' as $$
  select u.email from public.perfis p join auth.users u on u.id = p.id
   where p.usuario = lower(btrim(coalesce(p_usuario, ''))) limit 1;
$$;
revoke all on function public.reino_email_do_usuario(text) from public, anon, authenticated;
grant execute on function public.reino_email_do_usuario(text) to service_role;

-- o e-mail já tem conta (confirmada ou não)? Só o servidor (reino-cadastro) chama: evita que um
-- segundo cadastro com o mesmo e-mail ainda não confirmado reaproveite a conta de outra pessoa.
create or replace function public.reino_email_existe(p_email text) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, ''))));
$$;
revoke all on function public.reino_email_existe(text) from public, anon, authenticated;
grant execute on function public.reino_email_existe(text) to service_role;

-- limite de tentativas de login por chave (ip, ip+usuário) numa janela. true = pode tentar.
create table if not exists privado.tentativas_login (
  chave text primary key,
  janela_inicio timestamptz not null default now(),
  total int not null default 0
);
alter table privado.tentativas_login enable row level security;
revoke all on privado.tentativas_login from public, anon, authenticated;

create or replace function public.reino_limite_login(p_chave text, p_max int, p_janela_seg int) returns boolean
language plpgsql security definer set search_path to '' as $$
declare t int;
begin
  insert into privado.tentativas_login as x (chave, janela_inicio, total) values (left(p_chave, 200), now(), 1)
  on conflict (chave) do update set
    total = case when x.janela_inicio < now() - make_interval(secs => p_janela_seg) then 1 else x.total + 1 end,
    janela_inicio = case when x.janela_inicio < now() - make_interval(secs => p_janela_seg) then now() else x.janela_inicio end
  returning total into t;
  -- faxina ocasional das janelas vencidas
  if random() < 0.02 then delete from privado.tentativas_login where janela_inicio < now() - interval '1 day'; end if;
  return t <= p_max;
end $$;
revoke all on function public.reino_limite_login(text, int, int) from public, anon, authenticated;
grant execute on function public.reino_limite_login(text, int, int) to service_role;

-- ---------------------------------------------------------------- bucket de avatares
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- leitura pública é pelo link /object/public/avatares/<arquivo> (bucket público). Sem política de
-- SELECT aberta: ninguém lista o bucket. O dono vê/grava/troca/apaga só o próprio arquivo.
drop policy if exists avatares_dono_ler on storage.objects;
drop policy if exists avatares_dono_criar on storage.objects;
drop policy if exists avatares_dono_trocar on storage.objects;
drop policy if exists avatares_dono_apagar on storage.objects;
create policy avatares_dono_ler on storage.objects for select to authenticated
  using (bucket_id = 'avatares' and name in ((select auth.uid())::text || '.webp', (select auth.uid())::text || '.jpg'));
create policy avatares_dono_criar on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and name in ((select auth.uid())::text || '.webp', (select auth.uid())::text || '.jpg'));
create policy avatares_dono_trocar on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and name in ((select auth.uid())::text || '.webp', (select auth.uid())::text || '.jpg'))
  with check (bucket_id = 'avatares' and name in ((select auth.uid())::text || '.webp', (select auth.uid())::text || '.jpg'));
create policy avatares_dono_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and name in ((select auth.uid())::text || '.webp', (select auth.uid())::text || '.jpg'));

commit;
