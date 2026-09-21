-- Fecha a leitura pública de cadastros e cliques (Fase 1 do 00-comando/PLANO-ENTREGA.md).
-- Antes: qualquer visitante, sem login, lia nome, título, cidade, UF e dispositivo de
-- todos os cadastros e todos os cliques (o e-mail já estava fora, por grant de coluna).
-- Depois:
--   * cada afiliado logado lê só os cadastros e cliques do próprio código;
--   * o admin lê tudo; o e-mail dos cadastros só sai pela função admin_cadastros();
--   * o ranking expõe só código + total, pela função ranking_afiliados();
--   * "clique virou cadastro" é marcado por trigger no banco, e não mais pelo navegador.
-- Inserir clique e cadastro continua aberto para o visitante (é o link de afiliado).

begin;

-- códigos de afiliado do usuário logado
create or replace function privado.meus_codigos() returns setof text
  language sql stable security definer set search_path = '' as $$
  select c.codigo from public.codigos c where c.user_id = (select auth.uid());
$$;
revoke all on function privado.meus_codigos() from public;
grant execute on function privado.meus_codigos() to authenticated;

-- ---------- cadastros ----------
drop policy if exists cadastros_ler_publico on public.cadastros;
drop policy if exists cadastros_ler_admin on public.cadastros;
drop policy if exists cadastros_ler on public.cadastros;
create policy cadastros_ler on public.cadastros for select to authenticated
  using ((select privado.eh_admin()) or codigo in (select privado.meus_codigos()));

revoke select on public.cadastros from anon;
revoke select (id, codigo, visita_id, nome, titulo, cidade, uf, dispositivo, criado_em) on public.cadastros from anon;
revoke select on public.cadastros from authenticated;
grant select (id, codigo, visita_id, nome, titulo, cidade, uf, dispositivo, criado_em) on public.cadastros to authenticated;

-- lista completa, com e-mail, só para o admin
create or replace function public.admin_cadastros() returns setof public.cadastros
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.eh_admin() then
    raise exception 'só administrador' using errcode = '42501';
  end if;
  return query select * from public.cadastros;
end $$;
revoke all on function public.admin_cadastros() from public, anon;
grant execute on function public.admin_cadastros() to authenticated;

-- ---------- cliques ----------
drop policy if exists cliques_ler on public.cliques;
drop policy if exists cliques_marcar on public.cliques;
create policy cliques_ler on public.cliques for select to authenticated
  using ((select privado.eh_admin()) or codigo in (select privado.meus_codigos()));

revoke select on public.cliques from anon;
revoke update (cadastrou) on public.cliques from anon, authenticated;

create or replace function privado.marcar_clique_cadastrou() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.visita_id is not null then
    update public.cliques set cadastrou = true where id = new.visita_id and cadastrou is not true;
  end if;
  return new;
end $$;
revoke all on function privado.marcar_clique_cadastrou() from public;

drop trigger if exists cadastros_marca_clique on public.cadastros;
create trigger cadastros_marca_clique after insert on public.cadastros
  for each row execute function privado.marcar_clique_cadastrou();

-- ---------- ranking: só código e total ----------
drop view if exists public.ranking_afiliados;
create or replace function public.ranking_afiliados() returns table (codigo text, cadastros integer)
  language sql stable security definer set search_path = '' as $$
  select c.codigo, count(*)::integer from public.cadastros c where c.codigo is not null group by c.codigo;
$$;
revoke all on function public.ranking_afiliados() from public;
grant execute on function public.ranking_afiliados() to anon, authenticated;

commit;
