-- Reino · apaga as contas de TESTE e tudo o que elas criaram (TODO AI).
-- Mensagens, pedidos, membros de guilda, matches e status saem em cascata com o usuário;
-- as guildas de teste saem pela marcação `teste`. Membros reais não são tocados.
begin;
delete from public.guildas where teste;
delete from public.matches where teste;
delete from public.perfis where id in (select id from privado.contas_teste);
delete from auth.users where id in (select id from privado.contas_teste);
commit;
