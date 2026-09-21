const { chromium } = require('/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.env.REINO_TESTE_ENV || (__dirname + '/env'), 'utf8').trim().split('\n').map(l => l.split(/=(.*)/s).slice(0, 2)));
const API = env.API, ANON = env.ANON, SITE = 'http://localhost:8140';
const psql = (q) => execSync(`docker exec supabase_db_reino psql -U postgres -Atc "${q}"`).toString().trim();
const rest = async (path, tk) => { const r = await fetch(API + '/rest/v1/' + path, { headers: { apikey: ANON, Authorization: 'Bearer ' + (tk || ANON) } }); return r.status + ' ' + (await r.text()).slice(0, 160); };
const ok = (nome, cond, info) => console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + info : ''));
(async () => {
  const n = Date.now();
  // afiliada Luz
  const su = await (await fetch(API + '/auth/v1/signup', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `luz${n}@teste.local`, password: 'SenhaForte123!', data: { nome: 'Luz' } }) })).json();
  const luzId = su.user.id, luzTk = su.access_token;
  ok('gatilho criou o perfil da Luz', psql(`select count(*) from public.perfis where id='${luzId}'`) === '1');
  psql(`update public.perfis set situacao='aprovado' where id='${luzId}'; insert into public.codigos (codigo,user_id,nome) values ('luz${n}','${luzId}','Luz')`);
  const cod = 'luz' + n;

  const b = await chromium.launch();
  const erros = [];
  const r401 = []; b.on && 0;
  // visitante chega pelo link e cria conta
  const v = await b.newPage({ viewport: { width: 390, height: 844 } });
  v.on('response', r => { if (r.status() >= 400) r401.push('VIS ' + r.status() + ' ' + r.request().method() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)); });
  v.on('pageerror', e => erros.push(e.message)); v.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 140)); });
  await v.goto(`${SITE}/?ref=${cod}`, { waitUntil: 'networkidle' }); await v.waitForTimeout(2500);
  await v.click('.hg-portal-capa'); await v.waitForTimeout(2500);
  await v.click('.hg-portal-pilula'); await v.waitForTimeout(800);
  await v.fill('input[placeholder="Seu nome"]', 'Visitante Teste');
  await v.fill('input[autocomplete="email"]', `visita${n}@teste.local`);
  const senhas = v.locator('input[type=password]');
  for (let i = 0; i < await senhas.count(); i++) await senhas.nth(i).fill('SenhaForte123!');
  await v.click('button.hg-portal-enviar'); await v.waitForTimeout(6000);
  await v.screenshot({ path: (process.env.REINO_TESTE_PRINTS || __dirname) + '/1-visitante-depois-cadastro.png' });
  ok('clique do visitante gravado e marcado como cadastrado pelo gatilho', psql(`select string_agg(cadastrou::text, ',') from public.cliques where codigo='${cod}'`).includes('true'), psql(`select string_agg(cadastrou::text, ',') from public.cliques where codigo='${cod}'`));
  ok('cadastro do visitante gravado', psql(`select count(*) from public.cadastros where codigo='${cod}'`) === '1');
  ok('cadastro NÃO foi guardado só no navegador (sem erro de envio)', !erros.some(e => /cadastro não enviado/.test(e)), erros.filter(e => /afiliados/.test(e)).join(' | '));

  // regras pela API
  const a1 = await rest(`cadastros?select=nome&codigo=eq.${cod}`);
  ok('visitante sem login NÃO lê cadastros', !a1.startsWith('200'), a1);
  const a2 = await rest(`cliques?select=codigo&codigo=eq.${cod}`);
  ok('visitante sem login NÃO lê cliques', !a2.startsWith('200'), a2);
  const a3 = await rest(`cadastros?select=nome,codigo&codigo=eq.${cod}`, luzTk);
  ok('Luz lê o próprio cadastro', a3.startsWith('200') && a3.includes('Visitante Teste'), a3);
  const a4 = await rest(`cadastros?select=nome,codigo`, luzTk);
  ok('Luz não vê cadastros de outros códigos', a4.startsWith('200') && !a4.includes('Visitante X'), a4);
  const a5 = await rest(`cadastros?select=email`, luzTk);
  ok('Luz NÃO lê e-mail', !a5.startsWith('200'), a5);
  const a6 = await rest(`rpc/ranking_afiliados?order=cadastros.desc&limit=10`);
  ok('ranking público só com código e total', a6.startsWith('200') && a6.includes(cod) && !a6.includes('Visitante'), a6);
  const a7 = await rest(`rpc/admin_cadastros?select=nome,email`, luzTk);
  ok('Luz NÃO usa a lista do admin', !a7.startsWith('200'), a7);

  // Luz entra no app e abre Meus acessos
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('response', r => { if (r.status() >= 400) r401.push('LUZ ' + r.status() + ' ' + r.request().method() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)); });
  await p.addInitScript((c) => { try { localStorage.setItem('reino.meuCodigo', c); } catch (e) {} }, cod);
  p.on('pageerror', e => erros.push('LUZ ' + e.message)); p.on('console', m => { if (m.type() === 'error') erros.push('LUZ ' + m.text().slice(0, 140)); });
  await p.goto(SITE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  await p.click('.hg-portal-capa'); await p.waitForTimeout(2500);
  await p.fill('input[autocomplete="username"]', `luz${n}@teste.local`);
  await p.fill('input[type=password]', 'SenhaForte123!');
  await p.click('button.hg-portal-enviar'); await p.waitForTimeout(6000);
  await p.getByText('Meus acessos', { exact: true }).first().click(); await p.waitForTimeout(4000);
  await p.screenshot({ path: (process.env.REINO_TESTE_PRINTS || __dirname) + '/2-luz-meus-acessos.png' });
  const txt = await p.evaluate(() => document.body.innerText);
  const m = txt.match(/Cadastros\s*\n\s*(\d+)/);
  ok('Meus acessos da Luz mostra 1 cadastro', m && m[1] === '1', m ? m[0].replace(/\n/g, ' ') : txt.slice(0, 200));
  console.log('respostas >=400:', r401); console.log('erros de página:', erros.filter(e => !/favicon|404/.test(e)));
  await b.close();
})().catch(e => { console.error('ERRO NO TESTE', e); process.exit(1); });
