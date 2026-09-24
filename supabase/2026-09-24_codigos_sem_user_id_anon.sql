-- Auditoria 24/09 (ALTA): `codigos` era legível por anônimo com TODAS as colunas — quem quisesse
-- sabia de cada código qual é o user_id (uuid) e o nome do afiliado, permitindo enumerar contas
-- e cruzar códigos com cadastros. Agora anônimo só lê a coluna `codigo` (para checar se o código
-- está livre); `user_id`/`nome` ficam para o dono (logado) e o admin.
--
-- E o with check de `codigos_editar` ganhava um `or pai is null` que deixava QUALQUER autenticado
-- editar a linha cujo pai é nulo (o código raiz do admin, por exemplo) — a hierarquia virava
-- bagunça e um código alheio podia ser reatribuído. Removido: só o dono ou o admin edita.

-- anônimo: só vê se o código está livre (coluna codigo), nunca de quem é
revoke select on public.codigos from anon;
grant select (codigo) on public.codigos to anon;

-- dono (ou admin) edita o próprio código; sem a brecha do `pai is null`
drop policy if exists codigos_editar on public.codigos;
create policy codigos_editar on public.codigos for update to authenticated
  using (user_id = (select auth.uid()) or (select privado.eh_admin()))
  with check (user_id = (select auth.uid()) or (select privado.eh_admin()));

-- o app depende disto em app/servicos/contas.js (codigoLivre): sem sessão pede só `codigo`;
-- logado pede `codigo,user_id`. Quem ainda chamasse `select=*` como anônimo passa a levar
-- PGRST205 (coluna inexistente) — os chamadores foram ajustados junto.