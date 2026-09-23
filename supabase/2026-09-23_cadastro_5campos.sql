-- AN (23/09) — cadastro simplificado: nome, WhatsApp, empresa, nicho e cidade.
-- Sem foto, sem usuário, sem senha e sem CAPTCHA.
--
-- O perfil ganha o nicho (a conversa do login imersivo já o perguntava, mas ele
-- nunca era gravado). Quem já tem conta reentra pelo WhatsApp: a função
-- reino-cadastro reconhece o número, atualiza nome/empresa/nicho/cidade e emite
-- uma sessão (magic link sem e-mail) com a situação que o perfil já tinha —
-- "aguardando" (demonstração) ou "membro" (aprovado pelo admin).

alter table public.perfis add column if not exists nicho text;

alter table public.perfis drop constraint if exists perfis_nicho_formato;
alter table public.perfis add constraint perfis_nicho_formato
  check (nicho is null or char_length(nicho) between 2 and 60);

-- a linha de `cadastros` guarda a cadeia do afiliado (adm > afiliado > sub), que a
-- reino-cadastro registra no momento do cadastro (C6/AM6)
alter table public.cadastros add column if not exists pai text null;
alter table public.cadastros add column if not exists cadeia text null;
create index if not exists cadastros_cadeia on public.cadastros (cadeia);

-- o perfil nasce com o nicho do cadastro (igual a empresa e cidade)
create or replace function privado.criar_perfil()
 returns trigger language plpgsql security definer set search_path to '' as
$function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text := lower(btrim(m->>'usuario'));
  c text := regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g');
  e text := nullif(left(btrim(coalesce(m->>'empresa', '')), 120), '');
  n text := nullif(left(regexp_replace(btrim(coalesce(m->>'nicho', '')), '\s+', ' ', 'g'), 60), '');
  cid text := nullif(left(regexp_replace(btrim(coalesce(m->>'cidade', '')), '\s+', ' ', 'g'), 80), '');
  est text := upper(btrim(coalesce(m->>'uf', '')));
  w text := btrim(coalesce(m->>'whatsapp', ''));
begin
  if not privado.usuario_formato_ok(u) or privado.usuario_reservado(u) then u := null; end if;
  if not privado.cnpj_valido(c) then c := null; end if;
  if char_length(e) < 2 then e := null; end if;
  if char_length(n) < 2 then n := null; end if;
  if cid !~ '[[:alpha:]]' or char_length(cid) < 2 then cid := null; end if;
  if not privado.uf_valida(est) then est := null; end if;
  if not privado.whatsapp_ok(w) then w := null; end if;
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao, usuario, empresa, cnpj, whatsapp, nicho)
  values (new.id, new.raw_user_meta_data->>'nome',
          case when privado.email_interno(new.email) then null else new.email end,
          new.raw_user_meta_data->>'titulo', cid, est, 'aguardando', u, e, c, w, n)
  on conflict (id) do nothing;
  return new;
end $function$;