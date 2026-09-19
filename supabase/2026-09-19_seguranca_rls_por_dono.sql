-- Reino · regras de acesso por dono (aplicada em 2026-09-19 como "seguranca_rls_por_dono")

-- Esquema privado (fora da API) para funções auxiliares
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated;

create or replace function privado.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and situacao = 'admin');
$$;
revoke all on function privado.eh_admin() from public;
grant execute on function privado.eh_admin() to anon, authenticated;

-- Remove as políticas abertas
drop policy if exists "ler perfis" on public.perfis;
drop policy if exists "gravar perfis" on public.perfis;
drop policy if exists "trocar perfis" on public.perfis;
drop policy if exists "ler codigos" on public.codigos;
drop policy if exists "gravar codigos" on public.codigos;
drop policy if exists "trocar codigos" on public.codigos;
drop policy if exists "ler cliques" on public.cliques;
drop policy if exists "inserir clique" on public.cliques;
drop policy if exists "marcar cadastro" on public.cliques;
drop policy if exists "ler cadastros" on public.cadastros;
drop policy if exists "inserir cadastro" on public.cadastros;
drop policy if exists "ler fotos" on public.fotos;
drop policy if exists "gravar fotos" on public.fotos;
drop policy if exists "trocar fotos" on public.fotos;

-- PERFIS: cada conta vê e edita só o seu; admin vê e edita todos. Anônimo: nada.
revoke all on public.perfis from anon;
create policy perfis_ler on public.perfis for select to authenticated
  using (id = (select auth.uid()) or (select privado.eh_admin()));
create policy perfis_criar on public.perfis for insert to authenticated
  with check (id = (select auth.uid()));
create policy perfis_editar on public.perfis for update to authenticated
  using (id = (select auth.uid()) or (select privado.eh_admin()))
  with check (id = (select auth.uid()) or (select privado.eh_admin()));

-- Situação (aguardando/membro/admin) e e-mail só mudam por admin
create or replace function privado.proteger_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not privado.eh_admin() then
    if tg_op = 'INSERT' then
      if new.situacao is null or new.situacao not in ('aguardando', 'pre-cadastro') then new.situacao := 'aguardando'; end if;
      new.email := (select u.email from auth.users u where u.id = new.id);
    else
      new.situacao := old.situacao;
      new.email := old.email;
      new.id := old.id;
    end if;
  end if;
  return new;
end $$;
revoke all on function privado.proteger_perfil() from public, anon, authenticated;
drop trigger if exists perfis_proteger on public.perfis;
create trigger perfis_proteger before insert or update on public.perfis
  for each row execute function privado.proteger_perfil();

-- Toda conta nova ganha perfil "aguardando" (funciona mesmo quando o e-mail ainda não foi confirmado)
create or replace function privado.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao)
  values (new.id, new.raw_user_meta_data->>'nome', new.email, new.raw_user_meta_data->>'titulo',
          new.raw_user_meta_data->>'cidade', new.raw_user_meta_data->>'uf', 'aguardando')
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function privado.criar_perfil() from public, anon, authenticated;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function privado.criar_perfil();

-- CODIGOS: leitura pública (checar se está livre); cada conta só cria/edita os seus
revoke all on public.codigos from anon;
grant select on public.codigos to anon;
create policy codigos_ler on public.codigos for select to anon, authenticated using (true);
create policy codigos_criar on public.codigos for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy codigos_editar on public.codigos for update to authenticated
  using (user_id = (select auth.uid()) or (select privado.eh_admin()))
  with check (user_id = (select auth.uid()) or (select privado.eh_admin()));

-- CLIQUES: sem dado pessoal. Qualquer um registra e lê; só a marca "cadastrou" pode ser alterada.
revoke all on public.cliques from anon, authenticated;
grant select, insert on public.cliques to anon, authenticated;
grant update (cadastrou) on public.cliques to anon, authenticated;
create policy cliques_ler on public.cliques for select to anon, authenticated using (true);
create policy cliques_criar on public.cliques for insert to anon, authenticated with check (true);
create policy cliques_marcar on public.cliques for update to anon, authenticated
  using (cadastrou is not true) with check (cadastrou = true);

-- CADASTROS: qualquer um se cadastra; e-mail só o admin lê.
revoke all on public.cadastros from anon, authenticated;
grant insert on public.cadastros to anon, authenticated;
grant select (id, codigo, visita_id, nome, titulo, cidade, uf, dispositivo, criado_em) on public.cadastros to anon;
grant select on public.cadastros to authenticated;
create policy cadastros_criar on public.cadastros for insert to anon, authenticated with check (true);
create policy cadastros_ler_publico on public.cadastros for select to anon using (true);
create policy cadastros_ler_admin on public.cadastros for select to authenticated using ((select privado.eh_admin()));

-- Ranking respeita as permissões de quem consulta
alter view public.ranking_afiliados set (security_invoker = true);

-- FOTOS: leitura pública; foto nova é de quem enviou; só o dono (ou admin) troca
alter table public.fotos add column if not exists dono uuid default auth.uid();
revoke all on public.fotos from anon, authenticated;
grant select, insert, update on public.fotos to anon, authenticated;
create policy fotos_ler on public.fotos for select to anon, authenticated using (true);
create policy fotos_criar on public.fotos for insert to anon, authenticated
  with check (dono is not distinct from (select auth.uid()));
create policy fotos_trocar on public.fotos for update to authenticated
  using (dono = (select auth.uid()) or (select privado.eh_admin()))
  with check (dono = (select auth.uid()) or (select privado.eh_admin()));

-- Função interna não deve ser chamável pela API
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
