-- AJ1/AJ2 (22/09) — cadastro simples: nome, WhatsApp, foto, usuário e senha.
-- Empresa, CNPJ, cidade/UF passam a ser preenchidos depois, em Minha conta.
--
-- Sem e-mail no cadastro: a função reino-cadastro cria a conta no Auth com um e-mail INTERNO
-- (m-<uuid>@contas.reino.invalid — domínio reservado pela RFC 2606, nunca recebe mensagem) já
-- confirmado. O login continua por usuário (reino_email_do_usuario resolve o e-mail interno).
-- perfis.email fica vazio para essas contas.
--
-- WhatsApp: guardado em E.164 do Brasil (+55 + DDD + número), um por conta (índice único),
-- visível só para o dono e para o admin (mesma RLS de perfis).

alter table public.perfis add column if not exists whatsapp text;

alter table public.perfis drop constraint if exists perfis_whatsapp_formato;
alter table public.perfis add constraint perfis_whatsapp_formato
  check (whatsapp is null or whatsapp ~ '^\+55[1-9][0-9][0-9]{8,9}$');

create unique index if not exists perfis_whatsapp_unico on public.perfis (whatsapp) where whatsapp is not null;

create or replace function privado.whatsapp_ok(p text) returns boolean
  language sql immutable set search_path to '' as
$$ select coalesce(p ~ '^\+55[1-9][0-9][0-9]{8,9}$', false) $$;

create or replace function privado.email_interno(p text) returns boolean
  language sql immutable set search_path to '' as
$$ select coalesce(lower(p) like '%@contas.reino.invalid', false) $$;

-- perfil nasce com o WhatsApp do cadastro; e-mail interno não vai para perfis.email
create or replace function privado.criar_perfil()
 returns trigger language plpgsql security definer set search_path to '' as
$function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text := lower(btrim(m->>'usuario'));
  c text := regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g');
  e text := nullif(left(btrim(coalesce(m->>'empresa', '')), 120), '');
  cid text := nullif(left(regexp_replace(btrim(coalesce(m->>'cidade', '')), '\s+', ' ', 'g'), 80), '');
  est text := upper(btrim(coalesce(m->>'uf', '')));
  w text := btrim(coalesce(m->>'whatsapp', ''));
begin
  if not privado.usuario_formato_ok(u) or privado.usuario_reservado(u) then u := null; end if;
  if not privado.cnpj_valido(c) then c := null; end if;
  if char_length(e) < 2 then e := null; end if;
  if cid !~ '[[:alpha:]]' or char_length(cid) < 2 then cid := null; end if;
  if not privado.uf_valida(est) then est := null; end if;
  if not privado.whatsapp_ok(w) then w := null; end if;
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao, usuario, empresa, cnpj, whatsapp)
  values (new.id, new.raw_user_meta_data->>'nome',
          case when privado.email_interno(new.email) then null else new.email end,
          new.raw_user_meta_data->>'titulo', cid, est, 'aguardando', u, e, c, w)
  on conflict (id) do nothing;
  return new;
end $function$;

-- o dono agora completa a empresa no perfil: o CNPJ pode ser gravado UMA vez (de vazio para um
-- CNPJ válido; depois só o admin troca) e o WhatsApp pode ser trocado, desde que no formato.
-- Usuário, e-mail e situação continuam travados.
create or replace function privado.proteger_perfil()
 returns trigger language plpgsql security definer set search_path to '' as
$function$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not privado.eh_admin() then
    if tg_op = 'INSERT' then
      if new.situacao is null or new.situacao not in ('aguardando', 'pre-cadastro') then new.situacao := 'aguardando'; end if;
      new.email := (select case when privado.email_interno(u.email) then null else u.email end from auth.users u where u.id = new.id);
      new.usuario := null;
      new.cnpj := null;
      if not privado.whatsapp_ok(new.whatsapp) then new.whatsapp := null; end if;
    else
      new.situacao := old.situacao;
      new.email := old.email;
      new.id := old.id;
      new.usuario := old.usuario;
      if old.cnpj is not null or new.cnpj is null or not privado.cnpj_valido(new.cnpj) then new.cnpj := old.cnpj; end if;
      if new.whatsapp is distinct from old.whatsapp and new.whatsapp is not null and not privado.whatsapp_ok(new.whatsapp) then
        new.whatsapp := old.whatsapp;
      end if;
    end if;
  end if;
  return new;
end $function$;

-- a função de cadastro pergunta antes de criar (a corrida entre dois envios fica com o índice)
create or replace function public.reino_whatsapp_existe(p_whatsapp text) returns boolean
  language sql stable security definer set search_path to '' as
$$ select exists (select 1 from public.perfis where whatsapp = btrim(coalesce(p_whatsapp, ''))) $$;
revoke all on function public.reino_whatsapp_existe(text) from public, anon, authenticated;
grant execute on function public.reino_whatsapp_existe(text) to service_role;
