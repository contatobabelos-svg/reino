-- AF11 · Cidade e UF no cadastro (21/09).
--
-- Pedido do fundador, depois de ver o mapa: "incluir cidade e UF". Sem elas a
-- empresa não tem lugar no mapa do Reino (public.empresas_do_mapa só entrega
-- quem tem foto, empresa e situação aprovada; a posição sai da cidade/UF).
--
-- O carrossel do login imersivo passou a perguntar "Em que cidade a empresa
-- fica?" e a função reino-cadastro valida cidade e UF antes de criar a conta.
-- Aqui o banco faz a última guarda: privado.criar_perfil deixa de copiar
-- cidade/UF cruas do raw_user_meta_data (quem chama /auth/v1/signup direto podia
-- gravar qualquer coisa) e passa a limpar, como já fazia com usuario, cnpj e
-- empresa:
--   * uf  → 2 letras, maiúsculas, dentro das 27 unidades federativas; senão null;
--   * cidade → sem espaços sobrando, no máximo 80 caracteres, tem de ter letra;
--     senão null. O nome certo (IBGE) é conferido no app e na função.
--
-- Idempotente: pode rodar de novo sem erro.

begin;

create or replace function privado.uf_valida(p text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(p, '') = any (array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);
$$;
revoke all on function privado.uf_valida(text) from public;
grant execute on function privado.uf_valida(text) to anon, authenticated, service_role;

create or replace function privado.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text := lower(btrim(m->>'usuario'));
  c text := regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g');
  e text := nullif(left(btrim(coalesce(m->>'empresa', '')), 120), '');
  cid text := nullif(left(regexp_replace(btrim(coalesce(m->>'cidade', '')), '\s+', ' ', 'g'), 80), '');
  est text := upper(btrim(coalesce(m->>'uf', '')));
begin
  if not privado.usuario_formato_ok(u) or privado.usuario_reservado(u) then u := null; end if;
  if not privado.cnpj_valido(c) then c := null; end if;
  if char_length(e) < 2 then e := null; end if;
  if cid !~ '[[:alpha:]]' or char_length(cid) < 2 then cid := null; end if;
  if not privado.uf_valida(est) then est := null; end if;
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao, usuario, empresa, cnpj)
  values (new.id, new.raw_user_meta_data->>'nome', new.email, new.raw_user_meta_data->>'titulo',
          cid, est, 'aguardando', u, e, c)
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function privado.criar_perfil() from public, anon, authenticated;

commit;
