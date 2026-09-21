-- Reino · C3 do Parecer 1: fecha a escrita anônima em public.fotos e limita o tamanho.
--
-- Problema medido pelo Cético:
--   `fotos` tinha `anon=arw` (INSERT, SELECT, UPDATE) e a política fotos_criar aceitava
--   {anon,authenticated} com `dono is not distinct from auth.uid()`. Para anon, auth.uid()
--   é NULL e `dono` NULL também, então a comparação passava: qualquer pessoa da internet,
--   com a chave publicável (que é pública por natureza), gravava linhas sem limite de
--   tamanho na coluna `url` (text livre) até encher o disco do projeto.
--
-- Depois desta migração:
--   * anon não insere nem altera `fotos` (continua LENDO — o app mostra avatares sem login;
--     fechar a leitura é a C12, fora desta rodada);
--   * authenticated insere só com `dono = auth.uid()` (NULL deixa de passar);
--   * `url` limitada a 20 kB e `chave` a 200 caracteres (medido hoje: url_max 8.127, chave_max 14,
--     ou seja, nenhuma linha existente é afetada).
--
-- O app continua funcionando: quem sobe foto pelo FotoAvatar/"Minha conta" está logado e o
-- fotos.js manda o token da conta (app/servicos/fotos.js, função sb()). Sem login, o definir()
-- já cai no catch e guarda só no localStorage — comportamento que sempre existiu.
--
-- Idempotente: pode rodar de novo sem erro.

begin;

-- 1. anon perde INSERT e UPDATE (mantém SELECT)
revoke insert, update on public.fotos from anon;

-- 2. gravar exige conta e dono = a própria conta
drop policy if exists fotos_criar on public.fotos;
create policy fotos_criar on public.fotos for insert to authenticated
  with check (dono = (select auth.uid()));

-- 3. limites de tamanho (a coluna url é text sem teto; foto reduzida a 256px cabe folgada).
--    Entram como NOT VALID e são validadas em seguida se nenhuma linha antiga violar: NOT VALID
--    já barra toda inserção e alteração nova — o que muda é só não travar a migração num banco
--    que já tenha sido envenenado pelo buraco que estamos fechando. Em produção, medido hoje,
--    a maior url tem 8.127 bytes e a maior chave 14, então as duas ficam VALID.
alter table public.fotos drop constraint if exists fotos_url_tamanho;
alter table public.fotos add constraint fotos_url_tamanho check (length(url) <= 20000) not valid;
alter table public.fotos drop constraint if exists fotos_chave_tamanho;
alter table public.fotos add constraint fotos_chave_tamanho check (length(chave) <= 200) not valid;
do $$
begin
  if not exists (select 1 from public.fotos where length(url) > 20000) then
    alter table public.fotos validate constraint fotos_url_tamanho;
  else
    raise notice 'fotos_url_tamanho fica NOT VALID: há linha antiga acima de 20 kB (confira e limpe)';
  end if;
  if not exists (select 1 from public.fotos where length(chave) > 200) then
    alter table public.fotos validate constraint fotos_chave_tamanho;
  end if;
end $$;

commit;
