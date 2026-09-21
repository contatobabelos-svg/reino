-- Reino · C6 do Parecer 1: a linha de `cadastros` passa a nascer no servidor.
--
-- Problema medido pelo Cético:
--   `cadastros` tinha `anon=a` e a política cadastros_criar com `with_check: true`. Qualquer
--   pessoa com a chave publicável (pública por natureza) inseria linhas à vontade: o ranking de
--   afiliados (public.ranking_afiliados(), que conta linhas de `cadastros`) e a comissão do
--   painel saem dessas linhas. Dava para inflar o próprio número e, com volume, estourar o
--   statement_timeout de 3 s do papel anon e sumir com o ranking.
--
-- Depois desta migração, só o `service_role` insere — ou seja, a Edge Function `reino-cadastro`,
-- depois de o Auth ter criado a conta de verdade. A linha usa o próprio `user.id` como chave
-- primária: uma conta, um registro de indicação, sem corrida e sem duplicata.
--
-- ORDEM DE APLICAÇÃO (para não derrubar o cadastro ao vivo):
--   1. deploy da reino-cadastro com o insert no servidor;
--   2. deploy do site sem o insert no navegador (app/servicos/afiliados.js);
--   3. só então esta migração.
--
-- `cliques` continua aberto para anon: é o rastreio do link de afiliado (?ref=, /r/), o
-- coração do negócio, e o visitante não tem conta. O que muda nele é higiene de dado, por
-- gatilho que CORTA em vez de recusar — assim nenhum clique legítimo se perde:
--   * `codigo` limpo (minúsculo, só [a-z0-9_-], 40 caracteres) — vazio é recusado;
--   * `origem` 300, `dispositivo` 20, `cidade` 80, `uf` 8 caracteres;
--   * `criado_em` e `cadastrou` passam a ser do servidor (não dá mais para forjar data nem
--     marcar o próprio clique como convertido).
-- O limite por IP em `cliques` continua em aberto: exige a borda (ver "achados" no diário).
--
-- Idempotente: pode rodar de novo sem erro.

begin;

-- ---------------------------------------------------------------- cadastros
drop policy if exists cadastros_criar on public.cadastros;
revoke insert on public.cadastros from anon, authenticated;

-- ---------------------------------------------------------------- cliques (higiene)
create or replace function privado.limpar_clique() returns trigger
language plpgsql security definer set search_path to '' as $$
declare c text;
begin
  c := left(lower(regexp_replace(coalesce(new.codigo, ''), '[^A-Za-z0-9_-]', '', 'g')), 40);
  if c = '' then
    raise exception 'codigo de afiliado invalido' using errcode = '22023';
  end if;
  new.codigo := c;
  new.dispositivo := left(nullif(btrim(coalesce(new.dispositivo, '')), ''), 20);
  new.origem := left(nullif(btrim(coalesce(new.origem, '')), ''), 300);
  new.cidade := left(nullif(btrim(coalesce(new.cidade, '')), ''), 80);
  new.uf := upper(left(nullif(btrim(coalesce(new.uf, '')), ''), 8));
  -- data e conversão são do servidor: o navegador não decide nem uma nem outra
  new.criado_em := now();
  new.cadastrou := false;
  return new;
end $$;
revoke all on function privado.limpar_clique() from public, anon, authenticated;

drop trigger if exists cliques_limpar on public.cliques;
create trigger cliques_limpar before insert on public.cliques
  for each row execute function privado.limpar_clique();

commit;
