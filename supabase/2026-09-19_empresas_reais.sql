-- Empresas reais (Google Maps via RapidAPI), exibidas no mapa como "Empresas da região".
-- Não são membros do Reino. O app só lê; a gravação é feita pela importação (fora do app).
create table if not exists public.empresas_reais (
  place_id text primary key,
  cid text,
  nome text not null,
  categoria text,
  tipos text[],
  endereco text,
  bairro text,
  cidade text,
  uf char(2) not null,
  lat double precision not null,
  lng double precision not null,
  nota numeric(2,1),
  avaliacoes integer,
  telefone text,
  site text,
  horario jsonb,
  foto_url text,
  fonte text not null default 'Google Maps (via RapidAPI)',
  buscado_em timestamptz not null default now()
);
create index if not exists empresas_reais_local on public.empresas_reais (uf, cidade, bairro);

alter table public.empresas_reais enable row level security;
revoke all on public.empresas_reais from anon, authenticated;
grant select on public.empresas_reais to anon, authenticated;
create policy empresas_reais_ler on public.empresas_reais for select to anon, authenticated using (true);
