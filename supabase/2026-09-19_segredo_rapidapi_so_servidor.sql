-- A chave da RapidAPI fica no Vault (criada à mão no SQL Editor, NUNCA em arquivo):
--   select vault.create_secret('<chave>', 'rapidapi_key', 'Chave RapidAPI; usar só em Edge Function');
-- Esta função devolve a chave só para a chave de serviço (Edge Functions).
create or replace function public.segredo_rapidapi() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'rapidapi_key' limit 1;
$$;
revoke all on function public.segredo_rapidapi() from public, anon, authenticated;
grant execute on function public.segredo_rapidapi() to service_role;
