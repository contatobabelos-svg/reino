-- Reino · Afiliados — rode no SQL Editor do Supabase (Project → SQL → New query).
-- ATENÇÃO: as políticas abertas abaixo foram substituídas por supabase/2026-09-19_seguranca_rls_por_dono.sql. Não rode este arquivo de novo.
-- Depois, em Settings → API, copie a URL do projeto e a chave "anon public" e cole
-- em app/index.html:  window.REINO_SUPABASE = { url: "...", anon: "..." };

create table if not exists cliques (
  id uuid primary key,
  codigo text not null,
  dispositivo text,
  origem text,
  cadastrou boolean default false,
  criado_em timestamptz default now()
);
create index if not exists cliques_codigo on cliques (codigo, criado_em desc);

create table if not exists cadastros (
  id uuid primary key,
  codigo text,                 -- quem indicou (null = veio sem link)
  visita_id uuid,              -- clique que originou
  nome text not null,
  email text,
  titulo text,                 -- Imperador, Rei, Príncipe, Duque, Marquês, Conde, Visconde, Barão
  cidade text,
  uf text,
  dispositivo text,
  criado_em timestamptz default now()
);
create index if not exists cadastros_codigo on cadastros (codigo, criado_em desc);

-- ranking público de afiliados (só contagens, sem dados pessoais)
create or replace view ranking_afiliados as
  select codigo, count(*)::int as cadastros
  from cadastros where codigo is not null
  group by codigo;

-- Segurança: o app usa a chave anon. Permite inserir cliques/cadastros e ler
-- apenas o necessário. Ajuste se quiser restringir a leitura por afiliado logado.
alter table cliques enable row level security;
alter table cadastros enable row level security;
create policy "inserir clique"    on cliques   for insert to anon with check (true);
create policy "marcar cadastro"   on cliques   for update to anon using (true) with check (true);
create policy "ler cliques"       on cliques   for select to anon using (true);
create policy "inserir cadastro"  on cadastros for insert to anon with check (true);
create policy "ler cadastros"     on cadastros for select to anon using (true);

-- Fotos de perfil (opcional): sem esta tabela, a foto vale só no aparelho de quem enviou.
create table if not exists fotos (
  chave text primary key,     -- nome da pessoa ou id da empresa (minúsculo)
  url text not null,          -- imagem 256px em data URL
  criado_em timestamptz default now()
);
alter table fotos enable row level security;
create policy "ler fotos"    on fotos for select to anon using (true);
create policy "gravar fotos" on fotos for insert to anon with check (true);
create policy "trocar fotos" on fotos for update to anon using (true) with check (true);

-- Contas (login por e-mail e senha usa a autenticação do próprio Supabase).
-- Estas duas tabelas guardam o perfil e o código de afiliado de cada conta.
create table if not exists perfis (
  id uuid primary key,        -- mesmo id do usuário autenticado
  nome text, email text, titulo text, cidade text, uf text, situacao text, foto text,
  criado_em timestamptz default now()
);
create table if not exists codigos (
  codigo text primary key,    -- o que vai em ?ref=
  user_id uuid,
  nome text,
  criado_em timestamptz default now()
);
alter table perfis enable row level security;
alter table codigos enable row level security;
create policy "ler perfis"     on perfis  for select to anon using (true);
create policy "gravar perfis"  on perfis  for insert to anon with check (true);
create policy "trocar perfis"  on perfis  for update to anon using (true) with check (true);
create policy "ler codigos"    on codigos for select to anon using (true);
create policy "gravar codigos" on codigos for insert to anon with check (true);
create policy "trocar codigos" on codigos for update to anon using (true) with check (true);

-- Localização real de quem clica (ipwho.is). Sem estas colunas o app grava o
-- clique sem cidade/UF, então rodar isto é opcional.
alter table cliques add column if not exists cidade text;
alter table cliques add column if not exists uf text;
