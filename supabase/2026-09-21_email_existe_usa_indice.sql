-- Reino · C9 do Parecer 1: public.reino_email_existe passa a usar o índice de auth.users.
--
-- Problema medido pelo Cético:
--   o corpo era `where lower(u.email) = lower(...)`. O único índice que serve é
--   `users_instance_id_email_idx (instance_id, lower((email)::text))`, cuja PRIMEIRA coluna é
--   `instance_id`. Sem filtrar `instance_id`, o Postgres não usa o índice e varre auth.users
--   inteira — a cada cadastro, para 20 mil linhas de ~538 bytes.
--
-- Correção: filtrar `instance_id = '00000000-0000-0000-0000-000000000000'` (conferido em
-- produção: 100% dos usuários têm esse instance_id, que é o valor fixo de projeto único no
-- Supabase). A checagem continua respondendo o mesmo sim/não.
--
-- Medido no ensaio local com 20.000 usuários sintéticos (ver diário de 2026-09-21):
--   antes:  Seq Scan on users  (rows=20008)          ~2,6 ms
--   depois: Index Scan using users_instance_id_email_idx  ~0,06 ms
--
-- Idempotente: pode rodar de novo sem erro.

begin;

create or replace function public.reino_email_existe(p_email text) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from auth.users u
     where u.instance_id = '00000000-0000-0000-0000-000000000000'::uuid
       and lower(u.email) = lower(btrim(coalesce(p_email, '')))
  );
$$;
revoke all on function public.reino_email_existe(text) from public, anon, authenticated;
grant execute on function public.reino_email_existe(text) to service_role;

commit;
