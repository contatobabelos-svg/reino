// Teste de ponta a ponta do pré-aquecimento (AL): entrar.html carrega só o login, aquece o
// Reino inteiro (index.html?aquecendo=1) num iframe oculto em segundo plano, e ao logar acorda
// esse iframe em vez de recarregar a página — contra o Supabase LOCAL (nunca produção).
// Pré-requisitos:
//   supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta
//   supabase functions serve --env-file supabase/functions/.env   (TURNSTILE_SECRET de teste)
//   uma conta de teste com e-mail confirmado (crie com o Auth admin, veja README.md desta pasta)
// Uso: REINO_TESTE_EMAIL=... REINO_TESTE_SENHA=... node supabase/testes/e2e-preaquecimento-local.cjs
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const API = process.env.REINO_API || 'http://127.0.0.1:54361';
const PORTA = 8172;
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-preaquecimento-prints';
const EMAIL = process.env.REINO_TESTE_EMAIL || 'qa-preaquecimento@teste.local';
const SENHA = process.env.REINO_TESTE_SENHA || 'TesteQA123!';
fs.mkdirSync(PRINTS, { recursive: true });

const status = JSON.parse(execSync('supabase status -o json', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const ANON = status.PUBLISHABLE_KEY || status.ANON_KEY;
const psql = (q) => execSync(`docker exec supabase_db_reino psql -U postgres -Atc ${JSON.stringify(q)}`).toString().trim();

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 220) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-preaquecimento';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  const cfg = path.join(dest, 'nucleo/config.js');
  let c = fs.readFileSync(cfg, 'utf8');
  c = c.replace(/url: "https:\/\/[a-z0-9]+\.supabase\.co"/, `url: "${API}"`).replace(/anon: "sb_publishable_[A-Za-z0-9_]+"/, `anon: "${ANON}"`);
  if (!c.includes(API)) throw new Error('não consegui apontar a cópia do site para o banco local (nucleo/config.js)');
  fs.writeFileSync(cfg, c);
  const PROD = /https:\/\/fxlansnepokjxdikxocb\.supabase\.co/g;
  const trocar = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return trocar(f);
    if (!/\.(jsx?|html)$/.test(e.name)) return;
    const t = fs.readFileSync(f, 'utf8');
    if (PROD.test(t)) fs.writeFileSync(f, t.replace(PROD, API));
    PROD.lastIndex = 0;
  });
  trocar(dest);
  return dest;
}
async function servir(pasta) {
  const srv = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(SITE + '/entrar.html'); return srv; } catch (e) { await espera(150); } }
  throw new Error('servidor do site não subiu');
}
async function ouvirMensagens(ctx) {
  // registrado antes de qualquer navegação para não perder o "reino:pronto", que pode chegar
  // antes do teste ter chance de anexar um listener depois da página já ter carregado
  await ctx.addInitScript(() => { window.__msgs = []; window.addEventListener('message', (e) => { try { window.__msgs.push(e.data && e.data.tipo); } catch (x) {} }); });
}
async function dublarCaptcha(ctx) {
  await ctx.addInitScript(() => { window.REINO_CAPTCHA = { siteKey: '1x00000000000000000000AA' }; });
  await ctx.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (r) => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: `window.turnstile = {
      render: function (el, opcoes) { this._o = opcoes; return 'dublê'; },
      execute: function () { var o = this._o; setTimeout(function () { o.callback('XXXX.DUMMY.TOKEN.XXXX'); }, 30); },
      reset: function () {}, remove: function () {},
    };`,
  }));
}
const PASSO = (p) => `input.hg-li-campo[data-passo="${p}"]`;
async function digitarEnviar(p, texto) {
  await p.keyboard.press('Control+A');
  await p.keyboard.press('Backspace');
  if (texto) await p.keyboard.type(texto, { delay: 8 });
  await p.keyboard.press('Enter');
}
async function erroVisivel(p) {
  const e = p.locator('.hg-li-bolha-in.is-erro');
  try { await e.first().waitFor({ state: 'visible', timeout: 4000 }); return (await e.first().innerText()).trim(); } catch (x) { return ''; }
}

(async () => {
  psql('delete from privado.tentativas_login');
  const pasta = montarSite();
  const srv = await servir(pasta);
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ouvirMensagens(ctx);
    await dublarCaptcha(ctx);
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', (e) => erros.push('pageerror ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') erros.push('console.error ' + m.text()); });

    const pedidos = [];
    p.on('request', (r) => pedidos.push(r.url()));

    await p.goto(SITE + '/entrar.html', { waitUntil: 'networkidle' });
    await p.waitForSelector(PASSO('nome'), { timeout: 15000 });
    ok('entrar.html abre direto no login (modo cadastro por padrão)', true);
    await p.screenshot({ path: path.join(PRINTS, '1-entrar-abriu.png') });

    // pré-aquecimento: o iframe oculto com index.html?aquecendo=1 deve existir e já ter sido pedido
    const temIframeAquecendo = pedidos.some((u) => u.includes('index.html?aquecendo=1'));
    ok('iframe de pré-aquecimento pediu index.html?aquecendo=1', temIframeAquecendo);
    const iframeNoDom = await p.evaluate(() => !!document.querySelector('iframe[src*="aquecendo=1"]'));
    ok('iframe de pré-aquecimento está no DOM', iframeNoDom);
    const iframeOculto = await p.evaluate(() => {
      const f = document.querySelector('iframe[src*="aquecendo=1"]');
      return f && getComputedStyle(f).opacity === '0' && getComputedStyle(f).pointerEvents === 'none';
    });
    ok('iframe de pré-aquecimento está oculto (opacity 0, sem clique)', iframeOculto);

    // espera o Reino (dentro do iframe) avisar "pronto" antes de seguir pro login
    await p.waitForFunction(() => window.__msgs && window.__msgs.includes('reino:pronto'), { timeout: 20000 }).catch(() => {});
    const prontoAntesDoLogin = await p.evaluate(() => window.__msgs.includes('reino:pronto'));
    ok('Reino avisou "reino:pronto" (terminou de carregar/transpilar dormindo)', prontoAntesDoLogin);

    // troca para o modo "entrar" (login) e faz o login de verdade
    await p.click('.hg-li-pilula');
    await p.waitForSelector(PASSO('l-usuario'), { timeout: 5000 });
    ok('trocou para o modo "entrar"', true);
    await digitarEnviar(p, EMAIL);
    await p.waitForSelector(PASSO('l-senha'), { timeout: 5000 }).catch(() => {});
    const erroUsuario = await erroVisivel(p);
    ok('e-mail de teste aceito (sem erro na etapa usuário)', !erroUsuario, erroUsuario);
    await digitarEnviar(p, SENHA);

    // login OK → a barra de endereço continua em entrar.html e o Reino aparece por cima (acordou)
    await p.waitForFunction(() => {
      const f = document.querySelector('iframe[src*="aquecendo=1"]');
      return f && getComputedStyle(f).opacity === '1';
    }, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(PRINTS, '2-depois-do-login.png') });

    ok('URL continua em entrar.html (não recarregou para index.html)', p.url().includes('/entrar.html'), p.url());
    const iframeVisivel = await p.evaluate(() => {
      const f = document.querySelector('iframe[src*="aquecendo=1"]');
      return f && getComputedStyle(f).opacity === '1' && getComputedStyle(f).pointerEvents === 'auto';
    });
    ok('iframe do Reino ficou visível (acordou)', iframeVisivel);

    const frame = p.frames().find((f) => f.url().includes('aquecendo=1'));
    let dashboardOk = false, erroDashboard = '';
    if (frame) {
      try { await frame.waitForSelector('.hg-side, .hg-topbar, .hg-app', { timeout: 8000 }); dashboardOk = true; }
      catch (e) { erroDashboard = e.message; }
    }
    ok('dashboard do Reino renderizou dentro do iframe acordado', dashboardOk, erroDashboard);

    ok('sem erro de JavaScript na página', erros.length === 0, erros.join(' | '));

    console.log(falhas === 0 ? `\nTUDO PASSOU (prints em ${PRINTS})` : `\n${falhas} FALHA(S) (prints em ${PRINTS})`);
    process.exitCode = falhas === 0 ? 0 : 1;
  } finally {
    await b.close();
    srv.kill();
  }
})();
