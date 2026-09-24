-- Auditoria 24/09 (CRÍTICA): reentrada por WhatsApp não pode mais sobrescrever a senha de
-- uma conta que já tem a dela. A marca `senha_definida` separa:
--   true  → conta com senha de verdade (escolhida no cadastro, na troca ou na reentrada):
--           reentrar exige a senha ATUAL (signInWithPassword na reino-cadastro).
--   false → conta legada que nasceu com senha ALEATÓRIA no período AJ/AN (e-mail interno
--           m-<uuid>@contas.reino.invalid, sem usuário): reentrar UMA vez grava a senha
--           digitada e a conta fica madura (true).
-- A própria conta não consegue voltar de true para false (proteger_perfil) — só o admin/servidor.
--
-- Ordem de deploy: aplique ESTE arquivo antes de republicar a função reino-cadastro.

-- Coluna de maturidade de senha (nova conta nasce "madura": default true)
alter table public.perfis add column if not exists senha_definida boolean not null default true;

-- Backfill da coorte legada: contas com e-mail interno (não recebem mensagem) que ainda NÃO
-- reentraram (perfis.usuario vazio = ninguém digitou usuário/senha reais) ficam com false e
-- ganham a chance única de adotar a senha na próxima reentrada. Quem JÁ reentrou no período
-- AJ/AN tem usuário preenchido e senha de verdade → true. Contas novas (AN+) também nascem
-- com usuário+senha escolhidos → true.
update public.perfis p
   set senha_definida = (p.usuario is not null)
 where (select u.email from auth.users u where u.id = p.id) like 'm-%@contas.reino.invalid';

-- proteger_perfil: a própria conta não se rebaixa para "senha não definida"; gravada por ela,
-- uma conta nova nasce madura. (admin e service_role não passam por este trecho do gatilho)
create or replace function privado.proteger_perfil()
 returns trigger language plpgsql security definer set search_path to '' as
$function$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not privado.eh_admin() then
    if tg_op = 'INSERT' then
      if new.situacao is null or new.situacao not in ('aguardando', 'pre-cadastro') then new.situacao := 'aguardando'; end if;
      new.email := (select case when privado.email_interno(u.email) then null else u.email end from auth.users u where u.id = new.id);
      new.usuario := null;
      new.cnpj := null;
      new.senha_definida := true;
      if not privado.whatsapp_ok(new.whatsapp) then new.whatsapp := null; end if;
    else
      new.situacao := old.situacao;
      new.email := old.email;
      new.id := old.id;
      new.usuario := old.usuario;
      -- só admite mover para true (senha trocada/definida); true → false fica bloqueado
      new.senha_definida := old.senha_definida or (new.senha_definida is true);
      if old.cnpj is not null or new.cnpj is null or not privado.cnpj_valido(new.cnpj) then new.cnpj := old.cnpj; end if;
      if new.whatsapp is distinct from old.whatsapp and new.whatsapp is not null and not privado.whatsapp_ok(new.whatsapp) then
        new.whatsapp := old.whatsapp;
      end if;
    end if;
  end if;
  return new;
end $function$;

-- criar_perfil agora também filtra o título pelos títulos oficiais do Reino (a auditoria deu
-- bandeira: o título escolhido vinha direto do raw_user_meta_data, que o cliente podia forjar
-- dando à própria conta um título de fala/rank); valor fora da lista vira null.
create or replace function privado.criar_perfil()
 returns trigger language plpgsql security definer set search_path to '' as
$function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text := lower(btrim(m->>'usuario'));
  c text := regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g');
  e text := nullif(left(btrim(coalesce(m->>'empresa', '')), 120), '');
  n text := nullif(left(regexp_replace(btrim(coalesce(m->>'nicho', '')), '\s+', ' ', 'g'), 60), '');
  cid text := nullif(left(regexp_replace(btrim(coalesce(m->>'cidade', '')), '\s+', ' ', 'g'), 80), '');
  est text := upper(btrim(coalesce(m->>'uf', '')));
  w text := btrim(coalesce(m->>'whatsapp', ''));
  t text := nullif(btrim(coalesce(m->>'titulo', '')), '');
begin
  if not privado.usuario_formato_ok(u) or privado.usuario_reservado(u) then u := null; end if;
  if not privado.cnpj_valido(c) then c := null; end if;
  if char_length(e) < 2 then e := null; end if;
  if char_length(n) < 2 then n := null; end if;
  if cid !~ '[[:alpha:]]' or char_length(cid) < 2 then cid := null; end if;
  if not privado.uf_valida(est) then est := null; end if;
  if not privado.whatsapp_ok(w) then w := null; end if;
  if t is not null and t not in ('Barão', 'Visconde', 'Conde', 'Marquês', 'Duque', 'Príncipe', 'Rei', 'Imperador') then t := null; end if;
  insert into public.perfis (id, nome, email, titulo, cidade, uf, situacao, usuario, empresa, cnpj, whatsapp, nicho)
  values (new.id, new.raw_user_meta_data->>'nome',
          case when privado.email_interno(new.email) then null else new.email end,
          t, cid, est, 'aguardando', u, e, c, w, n)
  on conflict (id) do nothing;
  return new;
end $function$;