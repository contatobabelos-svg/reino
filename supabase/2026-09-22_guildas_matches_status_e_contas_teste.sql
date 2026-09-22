-- Reino · guildas, matches e status no banco + contas de teste isoladas (TODO AI, 22/09)
--
-- Pedido do fundador: apagar os dados de demonstração e ter 77 empresas usando o app (grupo,
-- network, privado, guildas, matches, status). Decisão com o fundador: as 77 são FICTÍCIAS e
-- marcadas como teste; empresas reais só aparecem como vitrine (empresas_reais), nunca como
-- conta falando em nome de alguém.
--
-- Contas de teste (privado.contas_teste):
--   * membro real NÃO vê nada que venha delas: mensagens, pedidos, guildas, matches, status;
--   * admin e as próprias contas de teste veem (é o ambiente de demonstração do fundador);
--   * não têm senha nem usuário: ninguém entra com elas;
--   * saem de uma vez com supabase/semente-teste/remover-contas-teste.sql.

create table if not exists privado.contas_teste (
  id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table privado.contas_teste enable row level security;
revoke all on privado.contas_teste from public, anon, authenticated;

create or replace function privado.eh_teste(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from privado.contas_teste t where t.id = p_id);
$$;
-- quem está olhando pode ver conteúdo de teste? (admin ou conta de teste)
create or replace function privado.vejo_teste() returns boolean
language sql stable security definer set search_path = '' as $$
  select privado.eh_admin() or privado.eh_teste((select auth.uid()));
$$;
revoke all on function privado.eh_teste(uuid), privado.vejo_teste() from public, anon;
grant execute on function privado.eh_teste(uuid), privado.vejo_teste() to authenticated;

-- ---------- Bate Papo: esconder o que é de teste ----------
create or replace function privado.chat_sala_liberada(p_sala text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_sala = 'reino' then privado.chat_pode_ler_grupo()
    else exists (
      select 1 from public.network_pedidos n
      where n.estado = 'aceito'
        and privado.chat_sala_privada(n.de, n.para) = p_sala
        and (n.de = (select auth.uid()) or n.para = (select auth.uid())
             -- admin acompanha as conversas entre contas de teste (só leitura: a escrita exige ser ponta)
             or (privado.eh_admin() and privado.eh_teste(n.de) and privado.eh_teste(n.para))))
  end;
$$;

drop policy if exists chat_ler on public.chat_mensagens;
create policy chat_ler on public.chat_mensagens for select to authenticated
  using ((select privado.chat_sala_liberada(sala)) and (not privado.eh_teste(autor) or (select privado.vejo_teste())));

drop policy if exists chat_escrever on public.chat_mensagens;
create policy chat_escrever on public.chat_mensagens for insert to authenticated
  with check (
    autor = (select auth.uid())
    and case when sala = 'reino' then (select privado.chat_pode_falar_grupo())
             else exists (select 1 from public.network_pedidos n
                          where n.estado = 'aceito' and privado.chat_sala_privada(n.de, n.para) = sala
                            and (n.de = (select auth.uid()) or n.para = (select auth.uid()))) end
  );

drop policy if exists network_ler on public.network_pedidos;
create policy network_ler on public.network_pedidos for select to authenticated
  using (de = (select auth.uid()) or para = (select auth.uid())
         or ((select privado.eh_admin()) and privado.eh_teste(de) and privado.eh_teste(para)));

-- a semente grava com horário do passado; só o app (authenticated) tem autor e hora forçados
create or replace function privado.chat_preencher() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.perfis;
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.autor := auth.uid();
    new.criado_em := now();
    if (select count(*) from public.chat_mensagens m
         where m.autor = new.autor and m.criado_em > now() - interval '30 seconds') >= 8 then
      raise exception 'Calma: muitas mensagens seguidas. Espere alguns segundos.';
    end if;
  end if;
  select * into p from public.perfis where id = new.autor;
  new.autor_nome := coalesce(p.nome, p.usuario, 'Membro');
  new.autor_empresa := p.empresa;
  new.autor_titulo := case when p.situacao = 'admin' then 'Imperador' else p.titulo end;
  new.texto := btrim(new.texto);
  new.criado_em := coalesce(new.criado_em, now());
  return new;
end $$;

-- network com conta de teste só para quem vê teste
create or replace function public.chat_pedir_network(p_para uuid)
returns public.network_pedidos
language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := auth.uid();
  r public.network_pedidos;
  pe public.perfis; pp public.perfis;
begin
  if eu is null then raise exception 'Entre na sua conta para fazer network.'; end if;
  select * into pe from public.perfis where id = eu;
  select * into pp from public.perfis where id = p_para;
  if pe.situacao not in ('membro', 'admin') then raise exception 'Sua conta ainda aguarda aprovação para fazer network.'; end if;
  if pp.id is null or pp.situacao not in ('membro', 'admin') then raise exception 'Essa conta não está disponível para network.'; end if;
  if privado.eh_teste(p_para) and not privado.vejo_teste() then raise exception 'Essa conta não está disponível para network.'; end if;
  if eu = p_para then raise exception 'Você não pode fazer network com você mesmo.'; end if;

  select * into r from public.network_pedidos
   where least(de, para) = least(eu, p_para) and greatest(de, para) = greatest(eu, p_para);
  if r.id is not null then
    if r.estado = 'pendente' and r.para = eu then
      update public.network_pedidos set estado = 'aceito', respondido_em = now() where id = r.id returning * into r;
    elsif r.estado = 'recusado' then
      update public.network_pedidos
         set de = eu, para = p_para, estado = 'pendente', criado_em = now(), respondido_em = null,
             de_nome = coalesce(pe.nome, pe.usuario), de_empresa = pe.empresa, de_titulo = pe.titulo,
             para_nome = coalesce(pp.nome, pp.usuario), para_empresa = pp.empresa, para_titulo = pp.titulo
       where id = r.id returning * into r;
    end if;
    return r;
  end if;

  insert into public.network_pedidos (de, para, de_nome, de_empresa, de_titulo, para_nome, para_empresa, para_titulo)
  values (eu, p_para, coalesce(pe.nome, pe.usuario), pe.empresa, pe.titulo, coalesce(pp.nome, pp.usuario), pp.empresa, pp.titulo)
  returning * into r;
  return r;
end $$;

-- ---------- Guildas ----------
create table if not exists public.guildas (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 3 and 60),
  nicho text, regiao text, descricao text check (char_length(descricao) <= 400),
  lider uuid references auth.users(id) on delete set null,
  pontos integer not null default 0,
  teste boolean not null default false,
  criado_em timestamptz not null default now()
);
create table if not exists public.guilda_membros (
  guilda_id bigint not null references public.guildas(id) on delete cascade,
  membro uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'membro' check (papel in ('lider', 'membro')),
  nome text, empresa text, titulo text, cidade text, uf text,
  entrou_em timestamptz not null default now(),
  primary key (guilda_id, membro)
);
create index if not exists guilda_membros_membro on public.guilda_membros (membro);
alter table public.guildas enable row level security;
alter table public.guilda_membros enable row level security;
revoke all on public.guildas, public.guilda_membros from anon, authenticated;
grant select on public.guildas, public.guilda_membros to authenticated;
drop policy if exists guildas_ler on public.guildas;
create policy guildas_ler on public.guildas for select to authenticated
  using (not teste or (select privado.vejo_teste()));
drop policy if exists guilda_membros_ler on public.guilda_membros;
create policy guilda_membros_ler on public.guilda_membros for select to authenticated
  using (exists (select 1 from public.guildas g where g.id = guilda_id and (not g.teste or (select privado.vejo_teste()))));

-- ---------- Matches ----------
create table if not exists public.matches (
  id bigint generated always as identity primary key,
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  compatibilidade integer not null check (compatibilidade between 0 and 100),
  motivo text,
  a_nome text, a_empresa text, a_nicho text, a_cidade text, a_uf text, a_titulo text,
  b_nome text, b_empresa text, b_nicho text, b_cidade text, b_uf text, b_titulo text,
  teste boolean not null default false,
  criado_em timestamptz not null default now(),
  check (a <> b)
);
create unique index if not exists matches_par on public.matches (least(a, b), greatest(a, b));
create index if not exists matches_a on public.matches (a);
create index if not exists matches_b on public.matches (b);
alter table public.matches enable row level security;
revoke all on public.matches from anon, authenticated;
grant select on public.matches to authenticated;
drop policy if exists matches_ler on public.matches;
create policy matches_ler on public.matches for select to authenticated
  using (((a = (select auth.uid()) or b = (select auth.uid())) and (not teste or (select privado.vejo_teste())))
         or (teste and (select privado.eh_admin())));

-- ---------- Status (stories de 24 h) ----------
create or replace function privado.sou_membro() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(privado.situacao_de((select auth.uid())) in ('membro', 'admin'), false);
$$;
revoke all on function privado.sou_membro() from public, anon;
grant execute on function privado.sou_membro() to authenticated;
create table if not exists public.status (
  id bigint generated always as identity primary key,
  autor uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor_nome text, autor_empresa text,
  texto text not null check (char_length(btrim(texto)) between 1 and 280),
  fundo text not null default 'aurora' check (fundo ~ '^[a-z]{2,20}$'),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '24 hours'
);
create index if not exists status_expira on public.status (expira_em desc);
alter table public.status enable row level security;
revoke all on public.status from anon, authenticated;
grant select, insert (texto, fundo), delete on public.status to authenticated;
drop policy if exists status_ler on public.status;
create policy status_ler on public.status for select to authenticated
  using (expira_em > now() and (select privado.sou_membro())
         and (not privado.eh_teste(autor) or (select privado.vejo_teste())));
drop policy if exists status_criar on public.status;
create policy status_criar on public.status for insert to authenticated
  with check (autor = (select auth.uid()) and (select privado.sou_membro()));
drop policy if exists status_apagar on public.status;
create policy status_apagar on public.status for delete to authenticated using (autor = (select auth.uid()));

create or replace function privado.status_preencher() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.perfis;
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.autor := auth.uid(); new.criado_em := now(); new.expira_em := now() + interval '24 hours';
    if (select count(*) from public.status s where s.autor = new.autor and s.criado_em > now() - interval '1 hour') >= 10 then
      raise exception 'Muitos status seguidos. Espere um pouco.';
    end if;
  end if;
  select * into p from public.perfis where id = new.autor;
  new.autor_nome := coalesce(p.nome, p.usuario, 'Membro');
  new.autor_empresa := p.empresa;
  new.texto := btrim(new.texto);
  return new;
end $$;
revoke all on function privado.status_preencher() from public, anon, authenticated;
drop trigger if exists status_preencher on public.status;
create trigger status_preencher before insert on public.status for each row execute function privado.status_preencher();
