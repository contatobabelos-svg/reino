// Mapa Reino (TODO AC): globo inteiro clicável, faixa de cartões abaixo do globo,
// só empresas cadastradas com foto, pinos girando e fios como os do Cérebro Babel.
// Nunca escreve nada: Auth, perfis e a função empresas_do_mapa são respondidos aqui.
//   node supabase/testes/e2e-mapa-reino.cjs
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const PORTA = Number(process.env.REINO_PORTA || 8158);
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-mapa-prints';
fs.mkdirSync(PRINTS, { recursive: true });

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 240) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// PNG 2x2 azul, serve de foto de empresa
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQIW2NkYGD4z8DAwMgABXAGNgEAVfgCASYZ9OwAAAAASUVORK5CYII=', 'base64');

const FOTO = (i) => 'https://exemplo-teste-reino.com.br/empresa-' + i + '.png';
// 5 empresas com foto em Campinas/SP, 1 sem foto e 1 sem cidade (as duas não podem aparecer)
const EMPRESAS = [
  { id: 'e1', empresa: 'Conta Certa', foto: FOTO(1), cidade: 'Campinas', uf: 'SP', titulo: 'Duque' },
  { id: 'e2', empresa: 'Pulso Marketing', foto: FOTO(2), cidade: 'Campinas', uf: 'SP', titulo: 'Conde' },
  { id: 'e3', empresa: 'Nuvem Azul', foto: FOTO(3), cidade: 'Campinas', uf: 'SP', titulo: 'Barão' },
  { id: 'e4', empresa: 'Pinheiro Tech', foto: FOTO(4), cidade: 'Campinas', uf: 'SP', titulo: 'Visconde' },
  { id: 'e5', empresa: 'Orla Saúde', foto: FOTO(5), cidade: 'Campinas', uf: 'SP', titulo: 'Marquês' },
  { id: 'e6', empresa: 'Sem Foto Ltda', foto: '', cidade: 'Campinas', uf: 'SP', titulo: 'Barão' },
  { id: 'e7', empresa: 'Sem Lugar Ltda', foto: FOTO(7), cidade: null, uf: null, titulo: 'Barão' },
];

function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-mapa';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  return dest;
}
async function servir(pasta) {
  const srv = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(SITE + '/'); return srv; } catch (e) { await espera(150); } }
  throw new Error('servidor do site não subiu');
}
async function preparar(ctx) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = 'aaa.' + Buffer.from(JSON.stringify({ exp, sub: 'u-teste' })).toString('base64url') + '.bbb';
  await ctx.addInitScript((tk) => {
    try { localStorage.setItem('reino.sessao', JSON.stringify({ id: 'u-teste', email: 'teste@teste.local', nome: 'Teste Ourives', situacao: 'membro', token: tk })); } catch (e) { /* bloqueado */ }
  }, token);
  await ctx.route('**/auth/v1/user*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u-teste', email: 'teste@teste.local', user_metadata: { nome: 'Teste Ourives' } }) }));
  /* atenção: no Playwright a rota registrada POR ÚLTIMO vence — a geral vem primeiro */
  await ctx.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/rest/v1/perfis*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'u-teste', nome: 'Teste Ourives', situacao: 'membro', empresa: 'Reino Teste', foto: FOTO(9), titulo: 'Imperador', cidade: 'Campinas', uf: 'SP' }]) }));
  await ctx.route('**/rest/v1/rpc/empresas_do_mapa*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPRESAS) }));
  await ctx.route('**/functions/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await ctx.route('https://exemplo-teste-reino.com.br/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  // nada de rede de verdade (mosaicos de rua, ipwho, nominatim)
  await ctx.route('https://services.arcgisonline.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await ctx.route('https://ipwho.is/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' }));
}
const erroDeJs = (saco) => saco.filter((t) => !/Failed to load resource|favicon/i.test(t));
const caixa = (page, seletor) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; }, seletor);
const nivel = (page) => page.evaluate(() => { const g = document.querySelector('.hg-globo'); return g ? g.dataset.nivel : null; });
async function esperarNivel(page, alvo, ms = 12000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { if ((await nivel(page)) === alvo) return true; await espera(200); }
  return false;
}
/* clique no meio do globo (sem arrastar) */
async function tocarGlobo(page, dx = 0, dy = 0) {
  const c = await caixa(page, '.hg-globo-canvas');
  await page.mouse.move(c.x + c.w / 2 + dx, c.y + c.h / 2 + dy);
  await espera(120);
  await page.mouse.down(); await espera(60); await page.mouse.up();
}

(async () => {
  const pasta = montarSite();
  const servidor = await servir(pasta);
  const navegador = await chromium.launch({ channel: 'chrome', args: ['--disable-dev-shm-usage'] });
  try {
    /* ---------------- Dashboard 1440x900 ---------------- */
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    await preparar(ctx);
    const page = await ctx.newPage(); const saco = [];
    page.on('console', (m) => { if (m.type() === 'error') saco.push(m.text()); });
    page.on('pageerror', (e) => saco.push('pageerror: ' + e.message));
    await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hg-globo-faixa', { timeout: 60000 });
    await espera(1500);

    const cv = await caixa(page, '.hg-globo-canvas');
    const fx = await caixa(page, '.hg-globo-faixa');
    console.log('canvas', JSON.stringify(cv), 'faixa', JSON.stringify(fx));
    ok('[terra] a faixa fica ABAIXO do globo', fx.y >= cv.b - 2, `canvas bottom=${cv.b}, faixa top=${fx.y}`);
    ok('[terra] a faixa tem altura de faixa (96–135 px)', fx.h >= 96 && fx.h <= 135, fx.h + ' px');
    ok('[terra] o globo não tem folha por cima', (await page.locator('.hg-globo-painel').count()) === 0);
    ok('[terra] os botões laterais continuam', (await page.locator('.hg-globo-zoom .hg-icon-btn').count()) >= 3);
    ok('[terra] a trilha do topo continua', (await page.locator('.hg-globo-trilha').count()) === 1);
    const textos = await page.locator('.hg-globo button, .hg-globo a').allInnerTexts();
    const proibidos = textos.filter((t) => /Ir para|Ver o Brasil|Entrar no Brasil|Visitar a torre|Voltar para a Terra/i.test(t));
    ok('[terra] sumiram os botões de "ir"', proibidos.length === 0, proibidos.join(' | '));
    ok('[terra] a dica fala do toque no globo', (await page.locator('.hg-globo-dica').innerText()).toLowerCase().includes('toque no globo'));
    ok('[terra] a faixa mostra o território do usuário', /seu territ/i.test(await page.locator('.hg-globo-faixa-topo').innerText()), (await page.locator('.hg-globo-faixa-topo').innerText()).replace(/\n/g, ' '));
    ok('[terra] cursor de mão sobre o globo', await page.evaluate(() => {
      const c = document.querySelector('.hg-globo-canvas'); const r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent('pointermove', { clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'mouse', bubbles: true }));
      return c.style.cursor === 'pointer';
    }));
    await page.screenshot({ path: PRINTS + '/1-terra-1440.png' });

    /* toque no globo entra no território (Imperador → Brasil) */
    await tocarGlobo(page);
    ok('[terra] tocar no globo entra no território', await esperarNivel(page, 'brasil'), await nivel(page));
    await espera(1800);
    const cartoes = await page.locator('.hg-globo-cartao').count();
    const rola = await page.evaluate(() => { const t = document.querySelector('.hg-globo-trilho'); return t.scrollWidth > t.clientWidth + 4; });
    ok('[brasil] a faixa lista os estados em cartões', cartoes >= 27, cartoes + ' cartões');
    ok('[brasil] a faixa rola na horizontal', rola);
    await page.screenshot({ path: PRINTS + '/2-brasil-1440.png' });

    /* do Brasil até a cidade quem desenha é a cartografia ReinoMapa (MapLibre), agora
       dentro do palco: a faixa continua visível embaixo e é ela que navega. */
    ok('[brasil] a cartografia do Reino entra no palco, sem cobrir a faixa', await page.evaluate(() => {
      const g = document.querySelector('.hg-globo'), f = document.querySelector('.hg-globo-faixa');
      return g.classList.contains('is-com-mapa') && getComputedStyle(f).visibility === 'visible';
    }));
    await page.locator('.hg-globo-cartao[data-uf="SP"]').click();
    ok('[brasil] cartão de estado leva ao estado', await esperarNivel(page, 'estado'), await nivel(page));
    await espera(2500);
    const campinas = page.locator('.hg-globo-cartao', { hasText: 'Campinas' }).first();
    await campinas.scrollIntoViewIfNeeded();
    await campinas.click();
    ok('[estado] cartão de cidade leva à cidade', await esperarNivel(page, 'cidade'), await nivel(page));
    await espera(2500);
    const temBairro = (await page.locator('.hg-globo-cartao[data-bairro]').count()) > 0;
    ok('[cidade] a faixa lista bairros', temBairro, (await page.locator('.hg-globo-faixa').innerText()).replace(/\n/g, ' ').slice(0, 140));
    if (temBairro) {
      await page.locator('.hg-globo-cartao[data-bairro]').first().click();
      ok('[cidade] cartão de bairro leva ao bairro', await esperarNivel(page, 'bairro'), await nivel(page));
      await espera(3000);
      ok('[bairro] o globo volta a mandar (é nele que a rede se apoia)', await page.evaluate(() => !document.querySelector('.hg-globo').classList.contains('is-com-mapa')));
      const pinos = await page.locator('.hg-rede-no').count();
      ok('[bairro] só empresas com foto viram pino (5 da cidade + a própria conta)', pinos === 6, pinos + ' pinos');
      ok('[bairro] todo pino tem foto nas duas faces', pinos > 0 && (await page.locator('.hg-rede-pino img').count()) === pinos * 2, (await page.locator('.hg-rede-pino img').count()) + ' imagens');
      ok('[bairro] a empresa da própria conta aparece marcada', (await page.locator('.hg-rede-no.is-eu').count()) === 1);
      const fios = await page.locator('.hg-rede-raios .hg-fio').count();
      const fotons = await page.locator('.hg-rede-raios .hg-foton').count();
      ok('[bairro] cada empresa liga nas 2 vizinhas mais próximas', pinos > 0 && fios >= pinos && fios <= pinos * 2, fios + ' fios para ' + pinos + ' pinos');
      ok('[bairro] 2 partículas por fio', fios > 0 && fotons === fios * 2, fotons + ' partículas');
      const p1 = await page.evaluate(() => [...document.querySelectorAll('.hg-foton')].map((e) => e.getAttribute('cx')).join(','));
      await espera(500);
      const p2 = await page.evaluate(() => [...document.querySelectorAll('.hg-foton')].map((e) => e.getAttribute('cx')).join(','));
      ok('[bairro] as partículas andam pelo fio', !!p1 && p1 !== p2);
      const gira = await page.evaluate(() => { const e = document.querySelector('.hg-rede-pino'); if (!e) return null; const cs = getComputedStyle(e); return { nome: cs.animationName, dur: cs.animationDuration }; });
      ok('[bairro] o pino gira em torno do eixo vertical (7–9 s)', !!gira && gira.nome === 'hg-pino-gira' && parseFloat(gira.dur) >= 7 && parseFloat(gira.dur) <= 9, JSON.stringify(gira));
      ok('[bairro] a faixa lista as mesmas empresas', (await page.locator('.hg-globo-cartao[data-empresa]').count()) === pinos);
      if (pinos) {
        await page.locator('.hg-globo-cartao[data-empresa]').first().click();
        await espera(500);
        ok('[bairro] o cartão da faixa acende o pino e abre a ficha', (await page.locator('.hg-rede-cartao').count()) === 1 && (await page.locator('.hg-rede-no.is-ativo').count()) === 1);
      }
      await page.screenshot({ path: PRINTS + '/3-bairro-1440.png' });
    }
    const semRolagem = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    ok('[1440] sem rolagem horizontal na página', semRolagem);
    ok('[1440] sem erro de JavaScript', erroDeJs(saco).length === 0, erroDeJs(saco).join(' | '));
    await ctx.close();

    /* ---------------- celular 390x844 ---------------- */
    const ctxC = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await preparar(ctxC);
    const cel = await ctxC.newPage(); const sacoC = [];
    cel.on('console', (m) => { if (m.type() === 'error') sacoC.push(m.text()); });
    cel.on('pageerror', (e) => sacoC.push('pageerror: ' + e.message));
    await cel.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await cel.waitForSelector('.hg-globo-faixa', { timeout: 60000 });
    await espera(1500);
    const cvC = await caixa(cel, '.hg-globo-canvas');
    const fxC = await caixa(cel, '.hg-globo-faixa');
    ok('[celular] a faixa fica abaixo do globo', fxC.y >= cvC.b - 2, `canvas bottom=${cvC.b}, faixa top=${fxC.y}`);
    ok('[celular] a faixa cabe em 390 px', fxC.w <= 390 && fxC.h <= 135, JSON.stringify(fxC));
    await cel.evaluate(() => { const g = document.querySelector('.hg-globo'); g.dataset.nivel = g.dataset.nivel; });
    await cel.locator('.hg-globo-canvas').tap();
    await esperarNivel(cel, 'brasil');
    await espera(1800);
    const rolaC = await cel.evaluate(() => { const t = document.querySelector('.hg-globo-trilho'); t.scrollLeft = 300; return { podeRolar: t.scrollWidth > t.clientWidth + 4, rolou: t.scrollLeft > 0 }; });
    ok('[celular] a faixa rola na horizontal', rolaC.podeRolar && rolaC.rolou, JSON.stringify(rolaC));
    ok('[celular] sem rolagem horizontal na página', await cel.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await cel.screenshot({ path: PRINTS + '/4-celular-390.png' });
    ok('[celular] sem erro de JavaScript', erroDeJs(sacoC).length === 0, erroDeJs(sacoC).join(' | '));
    await ctxC.close();

    /* ---------------- mapa.html (modo imersivo): o globo é dono da tela ---------------- */
    const ctxM = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    await preparar(ctxM);
    const mp = await ctxM.newPage(); const sacoM = [];
    mp.on('console', (m) => { if (m.type() === 'error') sacoM.push(m.text()); });
    mp.on('pageerror', (e) => sacoM.push('pageerror: ' + e.message));
    await mp.goto(SITE + '/mapa.html', { waitUntil: 'domcontentloaded' });
    await mp.waitForSelector('.hg-globo-faixa', { timeout: 60000 });
    await espera(1500);
    const cvM = await caixa(mp, '.hg-globo-canvas');
    const fxM = await caixa(mp, '.hg-globo-faixa');
    ok('[mapa.html] faixa abaixo do globo, tela cheia', fxM.y >= cvM.b - 2 && fxM.w > 1000, JSON.stringify({ cvM, fxM }));
    await mp.screenshot({ path: PRINTS + '/5-mapa-html-terra.png' });

    /* terra → território → estado, pela faixa (o resto já foi coberto no Dashboard) */
    await tocarGlobo(mp);
    ok('[mapa.html] tocar no globo entra no território', await esperarNivel(mp, 'brasil'), await nivel(mp));
    await espera(1800);
    ok('[mapa.html] a faixa lista os 27 estados', (await mp.locator('.hg-globo-cartao[data-uf]').count()) === 27);
    ok('[mapa.html] a faixa rola na horizontal', await mp.evaluate(() => { const t = document.querySelector('.hg-globo-trilho'); return t.scrollWidth > t.clientWidth + 4; }));
    await mp.screenshot({ path: PRINTS + '/6-mapa-html-brasil.png' });
    ok('[mapa.html] sem rolagem horizontal na página', await mp.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    ok('[mapa.html] sem erro de JavaScript', erroDeJs(sacoM).length === 0, erroDeJs(sacoM).join(' | '));
    await ctxM.close();
  } finally {
    await navegador.close();
    servidor.kill();
  }
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO PASSOU');
  console.log('prints em ' + PRINTS);
  process.exit(falhas ? 1 : 0);
})();
