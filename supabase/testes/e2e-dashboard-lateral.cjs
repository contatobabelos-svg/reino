// Dashboard (TODO AA): notícias de tecnologia compactas no lugar de "Conquistas",
// ranking de afiliados na lateral e, na tela Notícias, matérias com foto no topo.
// Nunca escreve nada: Auth, perfis, ranking e a função de notícias são respondidos aqui.
//   node supabase/testes/e2e-dashboard-lateral.cjs [--medir-antes]
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const PORTA = Number(process.env.REINO_PORTA || 8154);
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-dashboard-prints';
fs.mkdirSync(PRINTS, { recursive: true });

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 240) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const agora = Date.now();
// matérias: as 3 primeiras SEM foto, depois COM foto, para provar que a foto sobe
const PALAVRAS = ['chip', 'nuvem', 'robô', 'satélite', 'drone', 'blockchain', 'câmera', 'fibra', 'bateria'];
// títulos bem diferentes: o app junta matérias parecidas (dedupe), então o teste não pode repetir palavras
const noticia = (i, foto) => ({
  id: 'n' + i, titulo: (foto ? 'Com foto: ' : 'Sem foto: ') + PALAVRAS[i] + ' ' + ['revoluciona', 'encolhe', 'barateia', 'acelera', 'protege', 'reinventa', 'conecta', 'ameaça', 'liberta'][i] + ' ' + ['lojas', 'fábricas', 'escolas', 'bancos', 'clínicas', 'fazendas', 'gráficas', 'oficinas', 'hotéis'][i],
  resumo: 'Resumo curto da matéria ' + i + '.', link: 'https://exemplo-teste-reino.com.br/m' + i,
  fonte: ['Tecnoblog', 'Canaltech', 'Olhar Digital'][i % 3], fonteId: 'f' + (i % 3), site: 'exemplo.com.br',
  publicado: new Date(agora - i * 600000).toUTCString(), imagem: foto ? 'https://exemplo-teste-reino.com.br/foto-' + i + '.png' : '',
  temas: ['tecnologia'], tambemEm: [],
});
const ITENS = [0, 1, 2].map((i) => noticia(i, false)).concat([3, 4, 5, 6, 7, 8].map((i) => noticia(i, true)));
const RANKING = [{ codigo: 'marcelo', cadastros: 41 }, { codigo: 'teste.ourives', cadastros: 27 }, { codigo: 'ana.lima', cadastros: 19 }, { codigo: 'joao', cadastros: 8 }, { codigo: 'bia', cadastros: 3 }];

function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-dashboard';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  return dest;
}
async function servir(pasta) {
  const srv = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(SITE + '/'); return srv; } catch (e) { await espera(150); } }
  throw new Error('servidor do site não subiu');
}
async function preparar(ctx, opcoes = {}) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = 'aaa.' + Buffer.from(JSON.stringify({ exp, sub: 'u-teste' })).toString('base64url') + '.bbb';
  await ctx.addInitScript((tk) => {
    try { localStorage.setItem('reino.sessao', JSON.stringify({ id: 'u-teste', email: 'teste@teste.local', nome: 'Teste Ourives', situacao: 'membro', token: tk })); localStorage.setItem('reino.meuCodigo', 'teste.ourives'); } catch (e) { /* bloqueado */ }
  }, token);
  await ctx.route('**/auth/v1/user*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u-teste', email: 'teste@teste.local', user_metadata: { nome: 'Teste Ourives' } }) }));
  await ctx.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/rest/v1/perfis*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'u-teste', nome: 'Teste Ourives', situacao: 'membro', empresa: 'Reino Teste' }]) }));
  await ctx.route('**/rest/v1/rpc/ranking_afiliados*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(opcoes.ranking === undefined ? RANKING : opcoes.ranking) }));
  await ctx.route('https://exemplo-teste-reino.com.br/foto-*', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  ctx.temas = [];
  await ctx.route('**/functions/v1/reino-apis', (r) => {
    let c = {}; try { c = JSON.parse(r.request().postData() || '{}'); } catch (e) { /* vazio */ }
    if (c.rota === 'noticias') { ctx.temas.push(c.tema || ''); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fonte: 'teste', editoria: c.tema || 'destaques', atualizado: new Date().toISOString(), editorias: [], itens: ITENS }) }); }
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fonte: 'teste', itens: [] }) });
  });
}
const erroDeJs = (saco) => saco.filter((t) => !/Failed to load resource/i.test(t));
const caixa = (page, seletor) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, seletor);
const painelPorTitulo = (page, texto) => page.evaluate((t) => {
  const h = [...document.querySelectorAll('.hg-panel h2, .hg-panel h3')].find((e) => e.textContent.trim().indexOf(t) >= 0);
  const p = h && h.closest('.hg-panel'); if (!p) return null; const r = p.getBoundingClientRect();
  const col = p.closest('.hg-col');
  return { zona: col ? col.getAttribute('data-zona') : null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}, texto);

(async () => {
  const pasta = montarSite();
  const servidor = await servir(pasta);
  const navegador = await chromium.launch({ channel: 'chrome', args: ['--disable-dev-shm-usage'] });
  try {
    for (const [w, h, nome] of [[1440, 900, 'pc'], [1280, 800, 'pc-1280'], [1920, 1080, 'pc-1920'], [768, 1024, 'tablet'], [390, 844, 'celular']]) {
      const ctx = await navegador.newContext({ viewport: { width: w, height: h } });
      await preparar(ctx);
      const page = await ctx.newPage(); const saco = [];
      page.on('console', (m) => { if (m.type() === 'error') saco.push(m.text()); });
      page.on('pageerror', (e) => saco.push('pageerror: ' + e.message));
      await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.hg-nt-mini', { timeout: 60000 });
      await page.waitForSelector('.hg-rank-lista li, .hg-rank-vazio', { timeout: 20000 });
      await espera(800);
      const nt = await painelPorTitulo(page, 'Notícias de tecnologia');
      const cq = await painelPorTitulo(page, 'Conquistas');
      const rk = await painelPorTitulo(page, 'Ranking de afiliados');
      console.log(`--- ${nome} ${w}x${h}`, JSON.stringify({ noticias: nt, conquistas: cq, ranking: rk }));
      ok(`[${nome}] bloco de notícias é o de Tecnologia`, !!nt && ctx.temas.indexOf('tecnologia') >= 0, 'temas pedidos: ' + ctx.temas.join(','));
      ok(`[${nome}] ranking de afiliados aparece com as linhas`, (await page.locator('.hg-rank-lista li').count()) === 5, await page.locator('.hg-rank-lista li').allInnerTexts().then((t) => t.slice(0, 2).join(' | ').replace(/\n/g, ' ')));
      ok(`[${nome}] a própria conta aparece marcada "(você)"`, (await page.locator('.hg-rank-lista .hg-gold').innerText().catch(() => '')).indexOf('você') >= 0);
      if (w >= 1100) {  // colunas lado a lado
        ok(`[${nome}] notícias e ranking ficam na coluna da direita`, nt && rk && nt.zona === 'direita' && rk.zona === 'direita', `${nt && nt.zona}/${rk && rk.zona}`);
        ok(`[${nome}] Conquistas está na coluna da esquerda`, cq && cq.zona === 'esquerda', cq && cq.zona);
        ok(`[${nome}] notícias ocupam o topo da coluna direita (onde ficava Conquistas)`, nt && nt.y < (rk ? rk.y : 9e9), `notícias y=${nt && nt.y}, ranking y=${rk && rk.y}`);
        console.log('ALTURA do bloco de notícias:', nt && nt.h, 'px (antes: 481 px no centro)');
        ok(`[${nome}] bloco de notícias tem no máximo ~55% da altura de antes (481 px)`, nt && nt.h <= 270, nt && nt.h + ' px');
        globalThis.__alturaNoticias = nt && nt.h;
      }
      // sem buraco: colunas lado a lado terminam juntas e nenhum painel tem faixa vazia por dentro
      const oco = await page.evaluate(() => {
        const ops = document.querySelector('.hg-ops'); const fim = ops.getBoundingClientRect().bottom;
        const cols = [...ops.querySelectorAll(':scope > .hg-col')].filter((c) => c.querySelector('.hg-panel') && getComputedStyle(c).display !== 'contents');
        const lado = cols.length > 1 && new Set(cols.map((c) => Math.round(c.getBoundingClientRect().top))).size === 1;
        const abaixo = lado ? cols.map((c) => { const u = [...c.querySelectorAll(':scope > .hg-panel')].pop(); return { zona: c.dataset.zona, vazio: Math.round(fim - u.getBoundingClientRect().bottom) }; }) : [];
        const internos = [...document.querySelectorAll('.hg-ops .hg-panel, .hg-analytics .hg-panel')].filter((pn) => !pn.classList.contains('hg-globo-panel')).map((pn) => {
          const r = pn.getBoundingClientRect(); const cs = getComputedStyle(pn);
          const ultimo = Math.max(...[...pn.children].map((c) => c.getBoundingClientRect().bottom));
          return { t: ((pn.querySelector('h2,h3') || {}).textContent || '?').trim().slice(0, 24), vazio: Math.round(r.bottom - ultimo - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth)) };
        });
        return { lado, abaixo, internos };
      });
      ok(`[${nome}] colunas lado a lado terminam juntas (sem buraco no fim de coluna)`, !oco.lado || oco.abaixo.every((c) => Math.abs(c.vazio) <= 2), JSON.stringify(oco.abaixo));
      const folgas = oco.internos.filter((x) => x.vazio > 40);
      ok(`[${nome}] nenhum painel com faixa vazia por dentro (mais de 40 px)`, folgas.length === 0, folgas.length ? JSON.stringify(folgas) : 'maior folga: ' + Math.max(...oco.internos.map((x) => x.vazio)) + ' px');
      const rol = await page.evaluate(() => { const d = document.documentElement; const c = document.querySelector('.hg-content') || d; return d.scrollWidth <= d.clientWidth + 1 && c.scrollWidth <= c.clientWidth + 1; });
      ok(`[${nome}] sem rolagem horizontal`, rol);
      await page.screenshot({ path: `${PRINTS}/dashboard-${nome}.png` });
      // tela Notícias: as com foto sobem
      await page.evaluate(() => document.querySelector('a[href="noticias.html"]').click());
      await page.waitForSelector('.hg-nt', { timeout: 30000 });
      await page.waitForSelector('.hg-nt-hero, .hg-nt-card', { timeout: 20000 });
      await espera(600);
      const ordem = await page.evaluate(() => [...document.querySelectorAll('.hg-nt-hero, .hg-nt-card')].map((c) => ({ foto: !!c.querySelector('.hg-nt-foto img'), t: (c.querySelector('h2, h3') || {}).textContent })).filter((x) => x.t));
      const primeiroSemFoto = ordem.findIndex((x) => !x.foto);
      const ultimoComFoto = ordem.map((x) => x.foto).lastIndexOf(true);
      ok(`[${nome}] Notícias: nenhuma matéria sem foto antes de uma com foto`, ordem.length >= 6 && (primeiroSemFoto === -1 || ultimoComFoto < primeiroSemFoto), ordem.map((x) => (x.foto ? 'F' : '-')).join(''));
      ok(`[${nome}] Notícias: a manchete tem foto`, ordem.length > 0 && ordem[0].foto);
      await page.screenshot({ path: `${PRINTS}/noticias-${nome}.png` });
      ok(`[${nome}] sem erro de JavaScript`, erroDeJs(saco).length === 0, erroDeJs(saco).join(' | '));
      await ctx.close();
    }
    // widgets ocultos em "Personalizar": a distribuição se refaz e continua sem buraco
    for (const ocultos of [['match'], ['mapa'], ['noticias', 'ranking'], ['musica', 'assistente', 'chat'], ['social', 'conquistas'], ['noticias']]) {
      const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
      await preparar(ctx);
      await ctx.addInitScript((lista) => { try { localStorage.setItem('reino.widgets.ocultos', JSON.stringify(lista)); } catch (e) { /* bloqueado */ } }, ocultos);
      const page = await ctx.newPage(); const saco = [];
      page.on('pageerror', (e) => saco.push(e.message));
      await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.hg-ops', { timeout: 60000 });
      await espera(2500);
      const r = await page.evaluate(() => {
        const ops = document.querySelector('.hg-ops'); const fim = ops.getBoundingClientRect().bottom;
        const cols = [...ops.querySelectorAll(':scope > .hg-col')].filter((c) => c.querySelector('.hg-panel'));
        return { n: cols.length, abaixo: cols.map((c) => { const u = [...c.querySelectorAll(':scope > .hg-panel')].pop(); return c.dataset.zona + ':' + Math.round(fim - u.getBoundingClientRect().bottom); }), internos: [...ops.querySelectorAll('.hg-panel')].filter((pn) => !pn.classList.contains('hg-globo-panel')).map((pn) => { const q = pn.getBoundingClientRect(); const cs = getComputedStyle(pn); return { t: ((pn.querySelector('h2,h3') || {}).textContent || '?').trim().slice(0, 22), v: Math.round(q.bottom - Math.max(...[...pn.children].map((c) => c.getBoundingClientRect().bottom)) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth)) }; }) };
      });
      const folgas = r.internos.filter((x) => x.v > 90);
      ok(`ocultando [${ocultos.join(', ')}]: colunas terminam juntas`, r.abaixo.every((x) => Math.abs(Number(x.split(':')[1])) <= 2), r.abaixo.join(' '));
      ok(`ocultando [${ocultos.join(', ')}]: nenhum painel com faixa vazia grande por dentro (>90 px)`, folgas.length === 0, folgas.length ? JSON.stringify(folgas) : 'maior folga: ' + Math.max(...r.internos.map((x) => x.v)) + ' px');
      ok(`ocultando [${ocultos.join(', ')}]: sem erro de JavaScript`, saco.length === 0, saco.join(' | '));
      await ctx.close();
    }
    // ranking vazio e offline
    for (const [rotulo, ranking] of [['vazio', []], ['erro do banco', null]]) {
      const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
      await preparar(ctx, { ranking: []});
      if (ranking === null) await ctx.route('**/rest/v1/rpc/ranking_afiliados*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"erro"}' }));
      const page = await ctx.newPage(); const saco = [];
      page.on('pageerror', (e) => saco.push(e.message));
      await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.hg-rank-vazio', { timeout: 60000 });
      ok(`ranking ${rotulo}: mostra mensagem útil, sem quebrar`, (await page.locator('.hg-rank-vazio').innerText()).length > 10 && saco.length === 0, await page.locator('.hg-rank-vazio').innerText());
      await ctx.close();
    }
  } finally { await navegador.close(); servidor.kill(); }
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO PASSOU');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
