-- Reino · Bate Papo de verdade (TODO: chat entre contas, pedido do fundador em 22/09)
--
-- O que era: ChatScreen.jsx guardava tudo no estado do navegador, com respostas falsas por
-- setTimeout. Nada saía de uma conta para outra.
--
-- O que passa a existir:
--   chat_mensagens   — uma linha por mensagem. `sala` = 'reino' (o grupo único do Reino) ou
--                      'p:<uuid menor>:<uuid maior>' (conversa privada entre duas contas).
--   network_pedidos  — pedido de network entre duas contas (pendente → aceito | recusado).
--                      O chat privado só existe depois de aceito.
--
-- Quem pode o quê (tudo no banco, o app só mostra):
--   ler o grupo        — conta membro, admin ou aguardando (aguardando só lê).
--   falar no grupo     — membro ou admin. Regra de título do app (data.js → chatFala): quem tem
--                        título abaixo de Marquês (Barão, Visconde, Conde) só lê. "Título a definir"
--                        (nulo) fala, enquanto os títulos não são atribuídos às contas.
--   pedir network      — membro ou admin, para outra conta membro/admin.
--   chat privado       — só as duas pontas de um pedido aceito leem e escrevem.
--   nome/empresa/título do autor vêm do perfil (gatilho), nunca do navegador. perfis continua
--   fechado: ninguém lê o perfil do outro, só o que ele mostrou numa mensagem ou pedido.
--   Anti-enxurrada: no máximo 8 mensagens por conta a cada 30 segundos; texto de 1 a 2000.
--
-- Tempo real: as duas tabelas entram na publicação supabase_realtime; o Realtime aplica as
-- mesmas políticas de leitura (cada um só recebe o que pode ler).

-- ---------- auxiliares ----------
create or replace function privado.situacao_de(p_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select situacao from public.perfis where id = p_id;
$$;
revoke all on function privado.situacao_de(uuid) from public, anon, authenticated;

create or replace function privado.chat_pode_ler_grupo() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(privado.situacao_de((select auth.uid())) in ('membro', 'admin', 'aguardando'), false);
$$;

create or replace function privado.chat_pode_falar_grupo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfis p
    where p.id = (select auth.uid())
      and (p.situacao = 'admin'
           or (p.situacao = 'membro' and (p.titulo is null or p.titulo not in ('Barão', 'Visconde', 'Conde'))))
  );
$$;

create or replace function privado.chat_sala_privada(a uuid, b uuid) returns text
language sql immutable set search_path = '' as $$
  select 'p:' || least(a, b)::text || ':' || greatest(a, b)::text;
$$;

-- ---------- pedidos de network ----------
create table if not exists public.network_pedidos (
  id bigint generated always as identity primary key,
  de uuid not null references auth.users(id) on delete cascade,
  para uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'pendente' check (estado in ('pendente', 'aceito', 'recusado')),
  de_nome text, de_empresa text, de_titulo text,
  para_nome text, para_empresa text, para_titulo text,
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  check (de <> para)
);
create unique index if not exists network_pedidos_par on public.network_pedidos (least(de, para), greatest(de, para));
create index if not exists network_pedidos_para on public.network_pedidos (para);
create index if not exists network_pedidos_de on public.network_pedidos (de);
alter table public.network_pedidos enable row level security;
alter table public.network_pedidos replica identity full;

revoke all on public.network_pedidos from anon, authenticated;
grant select on public.network_pedidos to authenticated;
drop policy if exists network_ler on public.network_pedidos;
create policy network_ler on public.network_pedidos for select to authenticated
  using (de = (select auth.uid()) or para = (select auth.uid()));
-- escrita só pelas funções abaixo

create or replace function privado.chat_sala_liberada(p_sala text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_sala = 'reino' then privado.chat_pode_ler_grupo()
    else exists (
      select 1 from public.network_pedidos n
      where n.estado = 'aceito'
        and (n.de = (select auth.uid()) or n.para = (select auth.uid()))
        and privado.chat_sala_privada(n.de, n.para) = p_sala)
  end;
$$;

grant usage on schema privado to authenticated;
grant execute on function privado.chat_pode_ler_grupo(), privado.chat_pode_falar_grupo(),
  privado.chat_sala_liberada(text), privado.chat_sala_privada(uuid, uuid) to authenticated;
revoke all on function privado.chat_pode_ler_grupo(), privado.chat_pode_falar_grupo(),
  privado.chat_sala_liberada(text) from anon;

-- pedir network: devolve o pedido (novo ou o que já existe entre os dois)
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
  if eu = p_para then raise exception 'Você não pode fazer network com você mesmo.'; end if;

  select * into r from public.network_pedidos
   where least(de, para) = least(eu, p_para) and greatest(de, para) = greatest(eu, p_para);
  if r.id is not null then
    -- ele já tinha pedido para mim: pedir de volta = aceitar
    if r.estado = 'pendente' and r.para = eu then
      update public.network_pedidos set estado = 'aceito', respondido_em = now() where id = r.id returning * into r;
    elsif r.estado = 'recusado' then
      -- recusado pode ser pedido de novo (vira um pedido meu, pendente)
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

-- responder: só quem recebeu o pedido
create or replace function public.chat_responder_network(p_id bigint, p_aceitar boolean)
returns public.network_pedidos
language plpgsql security definer set search_path = '' as $$
declare r public.network_pedidos;
begin
  update public.network_pedidos
     set estado = case when p_aceitar then 'aceito' else 'recusado' end, respondido_em = now()
   where id = p_id and para = auth.uid() and estado = 'pendente'
  returning * into r;
  if r.id is null then raise exception 'Esse pedido não está mais esperando resposta.'; end if;
  return r;
end $$;

revoke all on function public.chat_pedir_network(uuid), public.chat_responder_network(bigint, boolean) from public, anon;
grant execute on function public.chat_pedir_network(uuid), public.chat_responder_network(bigint, boolean) to authenticated;

-- ---------- mensagens ----------
create table if not exists public.chat_mensagens (
  id bigint generated always as identity primary key,
  sala text not null check (sala = 'reino' or sala ~ '^p:[0-9a-f-]{36}:[0-9a-f-]{36}$'),
  autor uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor_nome text, autor_empresa text, autor_titulo text,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_em timestamptz not null default now()
);
create index if not exists chat_mensagens_sala_id on public.chat_mensagens (sala, id desc);
create index if not exists chat_mensagens_autor_criado on public.chat_mensagens (autor, criado_em desc);
alter table public.chat_mensagens enable row level security;

revoke all on public.chat_mensagens from anon, authenticated;
grant select, insert (sala, texto) on public.chat_mensagens to authenticated;

drop policy if exists chat_ler on public.chat_mensagens;
create policy chat_ler on public.chat_mensagens for select to authenticated
  using ((select privado.chat_sala_liberada(sala)));
drop policy if exists chat_escrever on public.chat_mensagens;
create policy chat_escrever on public.chat_mensagens for insert to authenticated
  with check (
    autor = (select auth.uid())
    and case when sala = 'reino' then (select privado.chat_pode_falar_grupo())
             else (select privado.chat_sala_liberada(sala)) end
  );

-- autor, nome, empresa, título e horário vêm do servidor; anti-enxurrada
create or replace function privado.chat_preencher() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.perfis;
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.autor := auth.uid();
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
  new.criado_em := now();
  return new;
end $$;
revoke all on function privado.chat_preencher() from public, anon, authenticated;
drop trigger if exists chat_mensagens_preencher on public.chat_mensagens;
create trigger chat_mensagens_preencher before insert on public.chat_mensagens
  for each row execute function privado.chat_preencher();

-- ---------- tempo real ----------
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_mensagens') then
    alter publication supabase_realtime add table public.chat_mensagens;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'network_pedidos') then
    alter publication supabase_realtime add table public.network_pedidos;
  end if;
end $$;
