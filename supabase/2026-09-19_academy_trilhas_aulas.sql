-- Reino Academy: trilhas e aulas importadas do YouTube. Leitura para todos; escrita só admin.
create table if not exists public.academy_trilhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  capa text,
  fonte text not null default 'manual' check (fonte in ('manual', 'youtube_canal', 'youtube_playlist')),
  fonte_id text,
  ordem integer not null default 0,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  unique (fonte, fonte_id)
);

create table if not exists public.academy_aulas (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid references public.academy_trilhas (id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  titulo text not null,
  descricao text,
  canal text,
  capa text,
  duracao_seg integer,
  publicado_em timestamptz,
  nivel text,
  ordem integer not null default 0,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  unique (trilha_id, youtube_id)
);
create index if not exists academy_aulas_trilha on public.academy_aulas (trilha_id, ordem);

alter table public.academy_trilhas enable row level security;
alter table public.academy_aulas enable row level security;
revoke all on public.academy_trilhas, public.academy_aulas from anon, authenticated;
grant select on public.academy_trilhas, public.academy_aulas to anon, authenticated;
grant insert, update, delete on public.academy_trilhas, public.academy_aulas to authenticated;

create policy trilhas_ler on public.academy_trilhas for select to anon, authenticated using (true);
create policy trilhas_admin on public.academy_trilhas for all to authenticated
  using ((select privado.eh_admin())) with check ((select privado.eh_admin()));
create policy aulas_ler on public.academy_aulas for select to anon, authenticated using (true);
create policy aulas_admin on public.academy_aulas for all to authenticated
  using ((select privado.eh_admin())) with check ((select privado.eh_admin()));
