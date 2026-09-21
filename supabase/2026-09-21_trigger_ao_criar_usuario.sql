-- Gatilho que cria o perfil quando nasce um usuário no Auth. Já existe em produção;
-- fica registrado aqui porque o `supabase db dump` não exporta gatilhos do esquema auth,
-- e sem ele um banco restaurado do backup não cria perfis no cadastro.
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function privado.criar_perfil();
