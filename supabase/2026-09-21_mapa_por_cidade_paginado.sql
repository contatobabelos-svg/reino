-- Reino · C8 do Parecer 1: o mapa deixa de truncar em 1.000 empresas.
--
-- Problema medido pelo Cético:
--   public.empresas_do_mapa() tinha `limit 2000` e `order by p.uf`, mas o PostgREST corta em
--   `max_rows = 1000`. Passando de 1.000 membros aprovados com foto, as UFs do fim do alfabeto
--   (SP, TO) sumiriam do mapa **em silêncio** — sem erro nenhum na tela.
--   (A função foi aplicada em produção hoje, 21/09, antes desta correção.)
--
-- Correção: a lista passa a ser pedida por LUGAR e PAGINADA. O mapa já trabalha por cidade e
-- bairro (app/componentes/MapaPanel.jsx só usa as empresas da cidade em que o globo está), então
-- pedir a cidade inteira é, além de correto, mais barato: uma cidade cabe numa página.
--
--   public.empresas_do_mapa(p_uf text default null, p_cidade text default null,
--                           p_limite int default 500, p_pagina int default 0)
--
--   * `p_limite` é preso entre 1 e 500 — sempre abaixo do max_rows de 1.000, então o PostgREST
--     nunca mais corta escondido; quem quiser tudo pede a página seguinte;
--   * cidade compara sem acento e sem caixa (privado.chave_cidade), porque o nome vem do IBGE
--     no cadastro e do globo na consulta, e um "São Paulo"/"Sao Paulo" não pode sumir do mapa;
--   * ordenação estável (uf, cidade, empresa, id) — sem isso a paginação repete e pula linhas.
--
-- COMPATIBILIDADE: todos os parâmetros têm valor padrão, então a chamada antiga
-- `POST /rest/v1/rpc/empresas_do_mapa` com corpo `{}` continua valendo (devolve a 1ª página de
-- 500). O cliente antigo segue funcionando até o site novo subir; por isso esta migração pode
-- ir para produção ANTES do deploy da Vercel.
--
-- Índice: perfis_mapa_lugar cobre exatamente o filtro (situação aprovada + UF + cidade).
--
-- Idempotente: pode rodar de novo sem erro.

begin;

-- chave de comparação de cidade: minúscula e sem acento (imutável, dá para indexar)
create or replace function privado.chave_cidade(t text) returns text
language sql immutable set search_path to '' as $$
  select lower(translate(btrim(coalesce(t, '')),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'));
$$;
revoke all on function privado.chave_cidade(text) from public;
grant execute on function privado.chave_cidade(text) to anon, authenticated, service_role;

create index if not exists perfis_mapa_lugar
  on public.perfis (upper(btrim(uf)), privado.chave_cidade(cidade), empresa, id)
  where situacao in ('membro', 'admin');

-- a assinatura muda: a versão sem argumentos sai e entra a versão com padrões
drop function if exists public.empresas_do_mapa();

create or replace function public.empresas_do_mapa(
  p_uf text default null,
  p_cidade text default null,
  p_limite integer default 500,
  p_pagina integer default 0
)
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
set search_path to ''
as $$
  select p.id, p.empresa, p.foto, p.cidade, p.uf, p.titulo
  from public.perfis p
  where p.situacao in ('membro', 'admin')
    and p.foto ~ '^https?://'   -- só foto por endereço (Storage): base64 ficaria enorme na lista
    and p.empresa is not null and length(btrim(p.empresa)) > 0
    and (p_uf is null or btrim(p_uf) = '' or upper(btrim(p.uf)) = upper(btrim(p_uf)))
    and (p_cidade is null or btrim(p_cidade) = ''
         or privado.chave_cidade(p.cidade) = privado.chave_cidade(p_cidade))
  order by p.uf nulls last, p.cidade nulls last, p.empresa, p.id
  limit least(greatest(coalesce(p_limite, 500), 1), 500)
  offset least(greatest(coalesce(p_pagina, 0), 0), 10000) * least(greatest(coalesce(p_limite, 500), 1), 500);
$$;

revoke all on function public.empresas_do_mapa(text, text, integer, integer) from public, anon;
grant execute on function public.empresas_do_mapa(text, text, integer, integer) to authenticated;

commit;
