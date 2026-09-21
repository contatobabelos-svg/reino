// Teste de ponta a ponta da tela Notícias do Reino e do bloco de notícias do
// Dashboard (TODO X). Nunca escreve nada: a rota "noticias" da reino-apis é só
// leitura e pública.
//
// O que ele cobre:
//   1. respostas SIMULADAS (page.route na URL da função): sucesso, lista vazia,
//      erro, timeout, cache velho + atualização por trás, salvar/lida/compartilhar,
//      troca de editoria, busca, imagem que falha virando capa do Reino;
//   2. uma chamada REAL à função rodando LOCAL (deno run da própria index.ts),
//      para conferir o formato de verdade dos feeds dos veículos;
//   3. uma chamada REAL de LEITURA à função em produção (a mesma que a página já
//      fazia), só para garantir que o formato publicado continua funcionando.
//
// Uso:
//   node supabase/testes/e2e-noticias.cjs
//   REINO_FUNC_LOCAL=http://127.0.0.1:8153   função local (suba antes; ver README)
//   REINO_TESTE_PRINTS=/pasta/fora/do/git    (padrão /tmp/claude-1000/reino-noticias-prints)
//   REINO_PLAYWRIGHT=/caminho/do/playwright
//   REINO_SEM_PRODUCAO=1                     pula o passo 3
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const PORTA = 8152;
const SITE = `http://localhost:${PORTA}`;
const FUNC_LOCAL = process.env.REINO_FUNC_LOCAL || '';
const PROD = 'https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis';
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-noticias-prints';
fs.mkdirSync(PRINTS, { recursive: true });

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 220) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------ site local
function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-noticias';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  if (FUNC_LOCAL) {
    // aponta a cópia para a função local, para nenhum teste bater em produção
    const base = FUNC_LOCAL.replace(/\/functions\/v1\/reino-apis$/, '');
    const trocar = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) return trocar(f);
      if (!/\.(jsx?|html)$/.test(e.name)) return;
      const t = fs.readFileSync(f, 'utf8');
      if (t.includes('fxlansnepokjxdikxocb.supabase.co')) fs.writeFileSync(f, t.split('https://fxlansnepokjxdikxocb.supabase.co').join(base));
    });
    trocar(dest);
  }
  return dest;
}
async function servir(pasta) {
  const srv = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(SITE + '/'); return srv; } catch (e) { await espera(150); } }
  throw new Error('servidor do site não subiu');
}

// ------------------------------------------------- respostas de mentira
const AGORA = new Date();
const hMenos = (h) => new Date(AGORA.getTime() - h * 3600e3).toUTCString();
/* Títulos bem diferentes de propósito: o app junta manchetes repetidas, e
   assuntos iguais sumiriam da lista (foi assim que o dedupe foi conferido). */
const ASSUNTOS = [
  'Indústria paulista contrata mais no trimestre', 'Franquias de alimentação abrem lojas no interior',
  'Exportação de café bate recorde histórico', 'Varejo online amplia entrega no mesmo dia',
  'Cooperativas gaúchas investem em energia solar', 'Marketplace anuncia centro logístico no Nordeste',
  'Setor de software contrata programadores juniores', 'Turismo receptivo cresce no litoral catarinense',
  'Confecções mineiras exportam para o Mercosul', 'Transportadoras testam caminhões elétricos',
  'Pequenos mercados adotam etiqueta digital', 'Construtoras retomam obras paradas em capitais',
  'Laboratórios ampliam produção de genéricos', 'Bancos digitais abrem agências de atendimento',
];
const materia = (i, extra) => Object.assign({
  titulo: ASSUNTOS[(i - 1) % ASSUNTOS.length] + ' (caso ' + i + ')',
  resumo: 'Resumo curto de teste da matéria ' + i + ', do jeito que o feed do veículo entrega.',
  link: 'https://exemplo-teste-reino.com.br/materia-' + i,
  fonte: ['EXAME', 'InfoMoney', 'Canaltech', 'NeoFeed'][i % 4],
  fonteId: ['exame', 'infomoney', 'canaltech', 'neofeed'][i % 4],
  site: 'exemplo-teste-reino.com.br',
  publicado: hMenos(i),
  imagem: 'https://exemplo-teste-reino.com.br/foto-' + i + '.jpg',
  temas: ['negocios'], tambemEm: i === 1 ? ['g1 Economia'] : [],
}, extra || {});
const respostaOk = (n = 12, extra) => ({
  fonte: 'Reino · feeds dos veículos', editoria: 'destaques', atualizado: AGORA.toISOString(),
  editorias: [{ id: 'destaques', rotulo: 'Destaques' }, { id: 'negocios', rotulo: 'Negócios' }, { id: 'tecnologia', rotulo: 'Tecnologia' }],
  itens: Array.from({ length: n }, (_, i) => materia(i + 1, i === 2 ? { imagem: '' } : null)),
  ...(extra || {}),
});

async function simular(page, fn) { await page.route('**/functions/v1/reino-apis', fn); }
const corpoDe = (req) => { try { return JSON.parse(req.postData() || '{}'); } catch (e) { return {}; } }

// ------------------------------------------------------------------ apoio
function vigiarConsole(page, saco) {
  page.on('console', (m) => { if (m.type() === 'error') saco.push(m.text()); });
  page.on('pageerror', (e) => saco.push('pageerror: ' + e.message));
}
/* "Failed to load resource" é recurso que não veio (o próprio teste derruba a
   função de propósito, e o Dashboard busca mapa e avatar de fora). O que não
   pode aparecer é erro de JavaScript. */
const erroDeJs = (saco) => saco.filter((t) => !/Failed to load resource/i.test(t));
const semRolagemH = (page) => page.evaluate(() => {
  const d = document.documentElement;
  const alvo = document.querySelector('.hg-content') || d;
  return { doc: d.scrollWidth <= d.clientWidth + 1, conteudo: alvo.scrollWidth <= alvo.clientWidth + 1, largura: d.scrollWidth, janela: d.clientWidth };
});
/* O app é uma tela só (o menu troca a tela por estado, não por URL): abre a
   raiz e clica no item "Notícias do Reino" do menu. */
async function abrirNoticias(page) {
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
  // o Babel do navegador compila os JSX na hora (leva alguns segundos); no
  // celular o menu fica fora da tela, por isso basta o elemento existir
  await page.waitForSelector('a[href="noticias.html"]', { state: 'attached', timeout: 40000 });
  await page.evaluate(() => document.querySelector('a[href="noticias.html"]').click());
  await page.waitForSelector('.hg-nt', { timeout: 30000 });
}
/* Espera as fotos terminarem de carregar: sem isso o print sai com o espaço da
   imagem ainda vazio e a conferência visual engana. */
async function esperarFotos(page) {
  await page.waitForFunction(() => {
    const fotos = [...document.querySelectorAll('.hg-nt-foto img')].slice(0, 6);
    return fotos.length === 0 || fotos.every((i) => i.complete);
  }, null, { timeout: 15000 }).catch(() => { /* alguma foto não veio: segue */ });
}
/* As fotos de teste não existem na internet: o navegador recebe um PNG daqui.
   Assim o teste confere a foto sem depender de rede nem do site de ninguém. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
async function simularFotos(ctx) {
  await ctx.route('https://exemplo-teste-reino.com.br/foto-*', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
}
/* Conta de teste: nenhuma conta de verdade e nenhuma escrita — o Auth e a
   tabela perfis são respondidos aqui mesmo, só para o app sair do login. */
async function entrarComoConta(ctx) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = 'aaa.' + Buffer.from(JSON.stringify({ exp, sub: 'u-teste' })).toString('base64url') + '.bbb';
  await ctx.addInitScript((tk) => {
    try {
      localStorage.setItem('reino.sessao', JSON.stringify({
        id: 'u-teste', email: 'teste@teste.local', nome: 'Teste Ourives', situacao: 'membro', token: tk,
      }));
    } catch (e) { /* armazenamento bloqueado */ }
  }, token);
  await ctx.route('**/auth/v1/user*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u-teste', email: 'teste@teste.local', user_metadata: { nome: 'Teste Ourives' } }) }));
  await ctx.route('**/rest/v1/perfis*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'u-teste', nome: 'Teste Ourives', situacao: 'membro', empresa: 'Reino Teste' }]) }));
  await ctx.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

// ------------------------------------------------------------------- main
(async () => {
  const pasta = montarSite();
  const servidor = await servir(pasta);
  // --disable-dev-shm-usage: sem isso o Chrome pode morrer ("Target crashed")
  // em máquina com /dev/shm pequeno, e o teste recarrega o app muitas vezes
  const navegador = await chromium.launch({ channel: 'chrome', args: ['--disable-dev-shm-usage'] });
  const tamanhos = [
    { nome: '1440x900', width: 1440, height: 900 },
    { nome: '768x1024', width: 768, height: 1024 },
    { nome: '390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
  ];
  try {
    // ---------------------------------------------------------- 1. sucesso
    for (const t of tamanhos) {
      const ctx = await navegador.newContext({ viewport: { width: t.width, height: t.height }, deviceScaleFactor: 1, hasTouch: !!t.hasTouch, permissions: ['clipboard-read', 'clipboard-write'] });
      await entrarComoConta(ctx); await simularFotos(ctx);
      const page = await ctx.newPage();
      const erros = []; vigiarConsole(page, erros);
      await simular(page, (rota) => rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respostaOk(14)) }));
      await abrirNoticias(page);
      await page.waitForSelector('.hg-nt-hero', { timeout: 15000 });
      const cartoes = await page.locator('.hg-nt-card').count();
      const rolagem = await semRolagemH(page);
      ok(`[${t.nome}] manchete e cartões aparecem`, cartoes >= 5, 'cartões: ' + cartoes);
      ok(`[${t.nome}] sem rolagem horizontal`, rolagem.doc && rolagem.conteudo, JSON.stringify(rolagem));
      ok(`[${t.nome}] sem erro de console`, erros.length === 0, erros.join(' | '));
      // colunas da grade mudam com a largura
      const grade = await page.evaluate(() => ({
        colunas: getComputedStyle(document.querySelector('.hg-nt-grade')).gridTemplateColumns.split(' ').length,
        largura: Math.round(document.querySelector('.hg-nt').getBoundingClientRect().width),
      }));
      const esperado = grade.largura >= 1500 ? 4 : grade.largura >= 1180 ? 3 : grade.largura >= 540 ? 2 : 1;
      ok(`[${t.nome}] grade se reorganiza pela largura do bloco`, grade.colunas === esperado, JSON.stringify(grade) + ' esperado ' + esperado);
      // capa de reserva no item sem imagem
      const semFoto = await page.locator('.hg-nt-semfoto').count();
      ok(`[${t.nome}] capa do Reino no item sem foto`, semFoto >= 1, 'capas de reserva: ' + semFoto);
      await esperarFotos(page);
      await page.screenshot({ path: path.join(PRINTS, `noticias-${t.nome}.png`), fullPage: t.width < 800 });
      await ctx.close();
    }

    // contexto único para o resto
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await entrarComoConta(ctx); await simularFotos(ctx);
    const page = await ctx.newPage();
    const erros = []; vigiarConsole(page, erros);

    // ------------------------------------------------------ 2. lista vazia
    await simular(page, (rota) => rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respostaOk(0), itens: [] }) }));
    await abrirNoticias(page);
    await page.waitForSelector('.hg-empty', { timeout: 15000 });
    ok('lista vazia mostra estado vazio com "Tentar de novo"',
      (await page.getByRole('button', { name: /tentar de novo/i }).count()) === 1,
      await page.locator('.hg-empty').innerText());

    // ------------------------------------------------------------ 3. erro
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, (rota) => rota.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ erro: 'A fonte não respondeu agora. Tente de novo em instantes.' }) }));
    await abrirNoticias(page);
    await page.waitForSelector('.hg-empty', { timeout: 15000 });
    const textoErro = await page.locator('.hg-empty').innerText();
    ok('erro da função vira aviso com botão de tentar de novo', /não respondeu/i.test(textoErro), textoErro.replace(/\n/g, ' '));
    ok('ponto de estado fica vermelho no erro', (await page.locator('.hg-nt-ponto[data-estado="erro"]').count()) === 1);
    await page.screenshot({ path: path.join(PRINTS, 'noticias-erro.png') });

    // --------------------------------------------------------- 4. timeout
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, async (rota) => { await espera(2500); await rota.abort('timedout'); });
    await abrirNoticias(page);
    await page.waitForSelector('.hg-nt-esq', { timeout: 5000 });
    ok('enquanto demora, aparece esqueleto (não tela em branco)', true);
    await page.waitForSelector('.hg-empty', { timeout: 20000 });
    ok('timeout também cai no estado de erro', (await page.locator('.hg-empty').count()) === 1);

    // ------------------------- 5. cache velho na tela + atualização atrás
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, (rota) => rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respostaOk(10)) }));
    await abrirNoticias(page);
    await page.waitForSelector('.hg-nt-hero');
    const guardado = await page.evaluate(() => {
      const chave = Object.keys(localStorage).find((k) => k.indexOf('reino.noticias.v1.t:destaques') === 0);
      return chave ? JSON.parse(localStorage.getItem(chave)).itens.length : 0;
    });
    ok('cache gravado no navegador', guardado >= 10, 'itens guardados: ' + guardado);
    // envelhece o cache e faz a rede demorar: o que estava guardado tem de aparecer na hora
    await page.evaluate(() => {
      const chave = Object.keys(localStorage).find((k) => k.indexOf('reino.noticias.v1.t:destaques') === 0);
      const v = JSON.parse(localStorage.getItem(chave));
      v.em = Date.now() - 60 * 60 * 1000;
      v.itens[0].titulo = 'MANCHETE GUARDADA DE ONTEM';
      localStorage.setItem(chave, JSON.stringify(v));
    });
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, async (rota) => { await espera(2200); await rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respostaOk(12, { atualizado: new Date().toISOString() })) }); });
    const t0 = Date.now();
    await abrirNoticias(page);
    await page.waitForSelector('.hg-nt-hero', { timeout: 15000 });
    const textoAntes = await page.locator('.hg-nt-hero-texto h2').innerText();
    const demorou = Date.now() - t0;
    ok('abre com o que estava guardado, sem esperar a rede', /GUARDADA DE ONTEM/.test(textoAntes), textoAntes + ' em ' + demorou + 'ms');
    ok('cache velho é sinalizado no cabeçalho', (await page.locator('.hg-nt-ponto[data-estado="velho"]').count()) === 1);
    await page.screenshot({ path: path.join(PRINTS, 'noticias-cache-velho.png') });
    await page.waitForFunction(() => { const h = document.querySelector('.hg-nt-hero-texto h2'); return h && !/GUARDADA DE ONTEM/.test(h.textContent); }, null, { timeout: 15000 });
    ok('a atualização chega por trás e troca a manchete', true);

    // ------------------------------ 6. salvar, lida, compartilhar, busca
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, (rota) => {
      const c = corpoDe(rota.request());
      if (c.busca) return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respostaOk(4), editoria: 'busca', itens: [materia(99, { titulo: 'Resultado de busca por inteligência artificial' })] }) });
      if (c.tema === 'tecnologia') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respostaOk(6), editoria: 'tecnologia', itens: [materia(50, { titulo: 'Matéria só da editoria Tecnologia', temas: ['tecnologia'] })] }) });
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respostaOk(10)) });
    });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* bloqueado */ } });
    await abrirNoticias(page);
    await page.waitForSelector('.hg-nt-hero');

    const salvar = page.locator('.hg-nt-acoes button[aria-pressed]').first();
    await salvar.click();
    ok('botão salvar vira "salva"', (await salvar.getAttribute('aria-pressed')) === 'true');
    const nasSalvas = await page.evaluate(() => JSON.parse(localStorage.getItem('reino.noticias.salvas') || '[]').length);
    ok('matéria salva no armazenamento', nasSalvas === 1, 'salvas: ' + nasSalvas);
    await page.getByRole('tab', { name: /salvas/i }).click();
    await page.waitForSelector('.hg-nt-hero');
    ok('aba Salvas mostra a matéria guardada', (await page.locator('.hg-nt-hero-texto h2').count()) === 1);
    await page.screenshot({ path: path.join(PRINTS, 'noticias-salvas.png') });
    await page.getByRole('tab', { name: 'Destaques' }).click();
    await page.waitForSelector('.hg-nt-hero');

    // lida: clicar no título marca (sem abrir aba nova no teste)
    const link = page.locator('.hg-nt-card h3 a').first();
    const href = await link.getAttribute('href');
    ok('link abre em nova aba com rel seguro',
      (await link.getAttribute('target')) === '_blank' && /noopener/.test(await link.getAttribute('rel') || ''),
      (await link.getAttribute('rel')) || '');
    await page.evaluate((h) => {
      const a = [...document.querySelectorAll('.hg-nt-card h3 a')].find((x) => x.href === h);
      a.removeAttribute('target'); a.addEventListener('click', (ev) => ev.preventDefault(), true); a.click();
    }, href);
    await page.waitForTimeout(300);
    const lidasGuardadas = await page.evaluate(() => JSON.parse(localStorage.getItem('reino.noticias.lidas') || '[]'));
    ok('abrir a matéria marca como lida', lidasGuardadas.includes(href), JSON.stringify(lidasGuardadas).slice(0, 120));
    ok('cartão lido fica marcado na tela', (await page.locator('.hg-nt-card[data-lida="1"]').count()) >= 1);

    // compartilhar → copia o link
    await page.locator('.hg-nt-acoes button[title="Compartilhar"]').first().click();
    await page.waitForTimeout(400);
    const copiado = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    ok('compartilhar copia o link da matéria', /exemplo-teste-reino/.test(copiado), copiado);
    ok('aviso de "link copiado" aparece', /copiado/i.test(await page.locator('.hg-nt-status').innerText()));

    // troca de editoria
    await page.getByRole('tab', { name: 'Tecnologia' }).click();
    // sem cache dessa aba, a tela passa pelo esqueleto antes da manchete existir
    await page.waitForFunction(() => { const h = document.querySelector('.hg-nt-hero-texto h2'); return h && /Tecnologia/.test(h.textContent); }, null, { timeout: 20000 });
    ok('troca de editoria busca a aba certa', true);

    // busca
    await page.locator('.hg-nt-busca input').fill('inteligência artificial');
    await page.locator('.hg-nt-busca button[type="submit"]').click();
    await page.waitForFunction(() => { const h = document.querySelector('.hg-nt-hero-texto h2'); return h && /busca/i.test(h.textContent); }, null, { timeout: 20000 });
    ok('busca livre traz o resultado da função', true);
    await page.screenshot({ path: path.join(PRINTS, 'noticias-busca.png') });

    // atalho "/" leva o foco para a busca
    await page.keyboard.press('Escape');
    await page.locator('.hg-nt-abas button').first().focus();
    await page.keyboard.press('/');
    ok('atalho "/" foca o campo de busca', await page.evaluate(() => document.activeElement && document.activeElement.type === 'search'));

    // imagem que falha vira capa do Reino
    await page.unroute('**/functions/v1/reino-apis');
    await simular(page, (rota) => rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respostaOk(3), itens: [materia(1, { imagem: 'https://exemplo-teste-reino.com.br/nao-existe.jpg' })] }) }));
    await page.route('**/nao-existe.jpg', (r) => r.abort());
    await abrirNoticias(page);
    await page.waitForSelector('.hg-nt-hero');
    await page.waitForSelector('.hg-nt-semfoto', { timeout: 10000 });
    ok('imagem que não carrega vira a capa do Reino', true);
    await page.unroute('**/nao-existe.jpg');

    ok('nenhum erro de JavaScript nos casos simulados', erroDeJs(erros).length === 0, erroDeJs(erros).join(' | '));

    // ------------------------------------- 7. bloco do Dashboard (simulado)
    const errosDash = [];
    const pageDash = await ctx.newPage();
    vigiarConsole(pageDash, errosDash);
    await simular(pageDash, (rota) => {
      const c = corpoDe(rota.request());
      if (c.rota === 'noticias') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respostaOk(8)) });
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fonte: 'teste', itens: [] }) });
    });
    await pageDash.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await pageDash.waitForSelector('.hg-nt-mini', { timeout: 30000 });
    ok('bloco do Dashboard usa o mesmo serviço e mostra foto',
      (await pageDash.locator('.hg-nt-mini .hg-nt-foto').count()) >= 3,
      'fotos no bloco: ' + (await pageDash.locator('.hg-nt-mini .hg-nt-foto').count()));
    const rolDash = await semRolagemH(pageDash);
    ok('Dashboard sem rolagem horizontal', rolDash.doc && rolDash.conteudo, JSON.stringify(rolDash));
    ok('Dashboard sem erro de JavaScript', erroDeJs(errosDash).length === 0, erroDeJs(errosDash).join(' | '));
    await esperarFotos(pageDash);
    // o bloco fica na coluna do meio, abaixo do mapa: rola até ele para o print
    await pageDash.locator('.hg-nt-mini').scrollIntoViewIfNeeded();
    await pageDash.waitForTimeout(400);
    await pageDash.screenshot({ path: path.join(PRINTS, 'dashboard-bloco-noticias.png') });
    await pageDash.close();

    // ---------------------------------- 8. dados REAIS da função local
    if (FUNC_LOCAL) {
      const errosReais = [];
      // contexto novo: sem cache do teste, sem resposta simulada e sem foto de
      // mentira — o que aparecer aqui veio mesmo dos feeds dos veículos
      const ctxReal = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
      await entrarComoConta(ctxReal);
      const pageReal = await ctxReal.newPage();
      vigiarConsole(pageReal, errosReais);
      await abrirNoticias(pageReal);
      await pageReal.waitForSelector('.hg-nt-hero', { timeout: 40000 });
      const reais = await pageReal.evaluate(() => ({
        cartoes: document.querySelectorAll('.hg-nt-card').length,
        fotos: [...document.querySelectorAll('.hg-nt-foto img')].filter((i) => i.currentSrc || i.src).length,
        veiculos: new Set([...document.querySelectorAll('.hg-nt-veiculo')].map((v) => v.textContent)).size,
        titulo: document.querySelector('.hg-nt-hero-texto h2').textContent,
      }));
      ok('função local: manchete e cartões reais', reais.cartoes >= 8, JSON.stringify(reais).slice(0, 200));
      ok('função local: fotos vindas dos sites dos veículos', reais.fotos >= 5, 'fotos: ' + reais.fotos);
      ok('função local: mais de um veículo na edição', reais.veiculos >= 3, 'veículos: ' + reais.veiculos);
      // uma imagem real carrega mesmo?
      const carregou = await pageReal.evaluate(() => {
        const img = [...document.querySelectorAll('.hg-nt-foto img')].find((i) => i.naturalWidth > 0);
        return img ? { largura: img.naturalWidth, de: img.src.slice(0, 80) } : null;
      });
      ok('função local: pelo menos uma foto real desenhada na tela', !!carregou, JSON.stringify(carregou));
      await esperarFotos(pageReal);
      await pageReal.screenshot({ path: path.join(PRINTS, 'noticias-dados-reais-1440.png') });
      await pageReal.setViewportSize({ width: 390, height: 844 });
      await pageReal.waitForTimeout(600);
      const rolReal = await semRolagemH(pageReal);
      ok('dados reais em 390x844 sem rolagem horizontal', rolReal.doc && rolReal.conteudo, JSON.stringify(rolReal));
      await esperarFotos(pageReal);
      await pageReal.screenshot({ path: path.join(PRINTS, 'noticias-dados-reais-390.png'), fullPage: true });
      ok('dados reais sem erro de JavaScript', erroDeJs(errosReais).length === 0, erroDeJs(errosReais).join(' | '));

      // e o mesmo conteúdo real no bloco do Dashboard
      await pageReal.setViewportSize({ width: 1440, height: 900 });
      await pageReal.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
      await pageReal.waitForSelector('.hg-nt-mini .hg-nt-foto img', { timeout: 40000 });
      await esperarFotos(pageReal);
      const fotosBloco = await pageReal.evaluate(() => [...document.querySelectorAll('.hg-nt-mini .hg-nt-foto img')].filter((i) => i.naturalWidth > 1).length);
      ok('bloco do Dashboard com fotos reais dos veículos', fotosBloco >= 3, 'fotos reais no bloco: ' + fotosBloco);
      await pageReal.locator('.hg-nt-mini').scrollIntoViewIfNeeded();
      await pageReal.waitForTimeout(400);
      await pageReal.screenshot({ path: path.join(PRINTS, 'dashboard-bloco-dados-reais.png') });
      await ctxReal.close();
    } else {
      console.log('AVISO: função local não informada (REINO_FUNC_LOCAL) — passo dos dados reais pulado.');
    }
    await ctx.close();

    // ------------------------- 9. leitura REAL da função em produção
    if (!process.env.REINO_SEM_PRODUCAO) {
      const anon = (fs.readFileSync(path.join(RAIZ, 'app/index.html'), 'utf8').match(/anon:\s*"([^"]+)"/) || [])[1];
      const r = await fetch(PROD, {
        method: 'POST', headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rota: 'noticias' }),
      });
      const j = await r.json().catch(() => ({}));
      const itens = j.itens || [];
      ok('produção responde a rota de leitura', r.ok && itens.length > 0, 'status ' + r.status + ' · itens ' + itens.length);
      ok('formato de produção tem título, link e fonte', itens[0] && itens[0].titulo && /^https:/.test(itens[0].link || ''), JSON.stringify(itens[0] || {}).slice(0, 160));
      // o serviço do app precisa aguentar o formato antigo (sem imagem/resumo)
      const limpou = itens.every((n) => n.titulo && n.link);
      ok('todos os itens de produção passam pela limpeza do app', limpou);
    }
  } catch (e) {
    falhas++;
    console.log('FALHOU (exceção) → ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e));
  } finally {
    await navegador.close();
    servidor.kill();
  }
  console.log(falhas ? `\n${falhas} falha(s). Prints em ${PRINTS}` : `\nTudo passou. Prints em ${PRINTS}`);
  process.exit(falhas ? 1 : 0);
})();
