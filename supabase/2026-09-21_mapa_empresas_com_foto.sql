-- AC · Mapa do Reino: só empresas cadastradas COM foto (21/09).
--
-- Pedido do fundador: "mostrar apenas empresas cadastradas que tem foto, os demais
-- pontos aleatorios pode remover". O mapa deixou de usar dados de demonstração e
-- passa a ler esta função.
--
-- O que a função devolve (e só isto):
--   id, empresa, foto, cidade, uf, titulo
-- Fora: e-mail, CNPJ, nome da pessoa e usuário de login — nada disso vai ao mapa.
--
-- Quem entra:
--   * foto preenchida como endereço http(s) (o pino do mapa é a foto; sem foto não há ponto);
--   * empresa preenchida (o rótulo do pino é o nome da empresa);
--   * situação já aprovada: 'membro' ou 'admin'. 'aguardando' e 'pre-cadastro'
--     NÃO aparecem no mapa (são os dois valores que a própria conta consegue
--     gravar em privado.proteger_perfil; a aprovação é do admin).
--
-- Quem pode chamar: só conta logada (authenticated). A tabela public.perfis
-- continua fechada por RLS (cada conta vê o próprio perfil; admin vê todos), por
-- isso a função é security definer — ela é a única porta para essa lista pública
-- reduzida, e devolve as mesmas linhas para qualquer pessoa logada.
--
-- Idempotente: pode rodar de novo sem erro.

begin;

create or replace function public.empresas_do_mapa()
returns table (
  id uuid,
  empresa text,
  foto text,
  cidade text,
  uf text,
  titulo text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.empresa, p.foto, p.cidade, p.uf, p.titulo
  from public.perfis p
  where p.situacao in ('membro', 'admin')
    and p.foto ~ '^https?://'   -- só foto por endereço (Storage): imagem embutida em base64 ficaria enorme na lista
    and p.empresa is not null and length(btrim(p.empresa)) > 0
  order by p.uf nulls last, p.cidade nulls last, p.empresa
  limit 2000;
$$;

revoke all on function public.empresas_do_mapa() from public, anon;
grant execute on function public.empresas_do_mapa() to authenticated;

commit;
