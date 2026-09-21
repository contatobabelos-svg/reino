-- CNPJ único (21/09): uma empresa, um cadastro. Decisão do fundador ("2 único").
--
--   1. Índice único parcial em public.perfis.cnpj (perfis sem CNPJ, os antigos, continuam valendo).
--   2. public.reino_cnpj_existe(text) → boolean: só o servidor (service_role) chama, na função
--      reino-cadastro, para responder com mensagem clara antes de criar a conta. O índice é a rede
--      de segurança contra duas pessoas cadastrando o mesmo CNPJ ao mesmo tempo.
--
-- Antes de rodar em produção conferi: nenhum CNPJ repetido (9 perfis, 1 com CNPJ).
-- Idempotente: pode rodar de novo sem erro.

begin;

create unique index if not exists perfis_cnpj_unico on public.perfis (cnpj) where cnpj is not null;

create or replace function public.reino_cnpj_existe(p_cnpj text) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from public.perfis p
     where p.cnpj = regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g')
  );
$$;
revoke all on function public.reino_cnpj_existe(text) from public, anon, authenticated;
grant execute on function public.reino_cnpj_existe(text) to service_role;

commit;
