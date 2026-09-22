-- Reino · C12 do Parecer 1 (partes b e c): fecha a enumeração de usuários e a leitura pública das fotos.
--
-- (b) `public.usuario_disponivel(text)` era executável por `anon`. Com a chave publicável (que é
--     pública por natureza, está no HTML do site) dava para perguntar "existe o usuário X?" quantas
--     vezes quisesse: em algumas horas se monta a lista de quem é do Reino. A pergunta continua
--     existindo — o carrossel de cadastro precisa dela para dizer "disponível/indisponível" enquanto
--     a pessoa digita —, mas passa a entrar pela Edge Function `reino-cadastro`
--     (POST {"acao":"usuario_disponivel","usuario":"..."}), que limita por IP: 60 checagens em 5
--     minutos. Quem digita com debounce de 350 ms não chega perto; quem enumera trava na 61ª.
--     A função continua `security definer` e devolve só um sim/não — o que muda é QUEM pode chamar.
--
-- (c) `fotos_ler` deixava `anon` ler a tabela inteira de fotos (o caminho legado base64, com rosto
--     de gente). O app exige login em toda tela que mostra foto (app/servicos/fotos.js só chama
--     `sincronizar()` de dentro do app logado; sem sessão ele cai no localStorage do aparelho), e o
--     mapa usa `perfis.foto` (endereço do Storage), não esta tabela. Então a leitura passa a exigir
--     conta. O bucket `avatares` continua público por desenho (é a foto que a pessoa escolhe para
--     aparecer no mapa) — isso é decisão de produto, não descuido.
--
-- O que esta migração NÃO faz: a mensagem "Esse e-mail já tem conta no Reino" continua igual. É
-- decisão de UX do fundador (risco aceito e registrado no diário do Salvador de 2026-09-21): a
-- proteção contra enumeração por e-mail passa a ser o CAPTCHA + o limite por IP do cadastro.
--
-- Idempotente: pode rodar de novo sem erro.

begin;

-- ---------------------------------------------------------------- (b) usuario_disponivel
revoke all on function public.usuario_disponivel(text) from public, anon, authenticated;
grant execute on function public.usuario_disponivel(text) to service_role;

-- ---------------------------------------------------------------- (c) leitura de fotos
drop policy if exists fotos_ler on public.fotos;
create policy fotos_ler on public.fotos for select to authenticated using (true);
revoke select on public.fotos from anon;

commit;
