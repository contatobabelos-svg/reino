-- Reino · Afiliados hierárquicos: adm > afiliado > sub-afiliado
-- Adiciona colunas de cadeia à tabela codigos.
-- Link: https://networkreino.com/r/<adm>/<afiliado>/<sub>
-- Cada nível armazena seu pai e a cadeia completa.

-- Colunas de hierarquia na tabela codigos
alter table codigos add column if not exists pai text null;
alter table codigos add column if not exists cadeia text null;

-- Índice para buscar por cadeia completa
create index if not exists codigos_cadeia on codigos (cadeia);
create index if not exists codigos_pai on codigos (pai);

-- Política atualizada: dono edita o próprio código e pode definir o pai
-- (somente o dono do código pode alterar o pai)
drop policy if exists "codigos_editar" on public.codigos;
create policy codigos_editar on public.codigos for update to authenticated
  using (user_id = (select auth.uid()) or (select privado.eh_admin()))
  with check (
    user_id = (select auth.uid()) or (select privado.eh_admin())
    or pai is null  -- admin pode definir o pai (primeiro nível)
  );

-- Função auxiliar: construir a cadeia completa a partir do pai
create or replace function privado.cadeia_completa(p_codigo text, p_pai text)
returns text as $func$
declare
  v_pai_codigo text;
  v_pai_cadeia text;
begin
  if p_pai is null then
    return p_codigo;
  end if;
  select c.cadeia into v_pai_cadeia from codigos c where c.codigo = p_pai;
  if v_pai_cadeia is not null then
    return v_pai_cadeia || '/' || p_codigo;
  else
    return p_pai || '/' || p_codigo;
  end if;
end;
$func$ language plpgsql security definer;

-- Gatilho: atualizar a cadeia quando o pai é definido
create or replace function privado.trigger_cadeia_codigo()
returns trigger as $func$
begin
  if new.pai is not null then
    new.cadeia := privado.cadeia_completa(new.codigo, new.pai);
  else
    new.cadeia := new.codigo;
  end if;
  return new;
end;
$func$ language plpgsql security definer;

drop trigger if exists trigger_cadeia_codigo on public.codigos;
create trigger trigger_cadeia_codigo
  before insert or update of pai on public.codigos
  for each row
  execute function privado.trigger_cadeia_codigo();

-- Exemplo de uso:
-- insert into codigos (codigo, user_id, nome, pai) values ('marcelo', '<admin-id>', 'Admin', null);
-- insert into codigos (codigo, user_id, nome, pai) values ('joao', '<affiliate-id>', 'João', 'marcelo');
-- resulta em cadeia 'joao' = 'marcelo/joao'
