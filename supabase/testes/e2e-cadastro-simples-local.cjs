// Teste de ponta a ponta do cadastro simples (AJ1) e da apresentação das abas (AJ3) contra o
// Supabase LOCAL (nunca produção). Substitui o e2e-login-imersivo-local.cjs, que dirigia o
// cadastro antigo (empresa, CNPJ, cidade e e-mail com validação).
// Pré-requisitos (ver README.md desta pasta):
//   supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta
//   migração 2026-09-22_cadastro_simples_whatsapp.sql aplicada no banco local
//   supabase functions serve --env-file supabase/functions/.env   (TURNSTILE_SECRET de teste)
// Uso: node supabase/testes/e2e-cadastro-simples-local.cjs
//   REINO_TESTE_PRINTS=/pasta/fora/do/git  (padrão /tmp/claude-1000/reino-cadastro-simples-prints)
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const API = process.env.REINO_API || 'http://127.0.0.1:54361';
const PORTA = 8161;
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-cadastro-simples-prints';
fs.mkdirSync(PRINTS, { recursive: true });

const status = JSON.parse(execSync('supabase status -o json', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const ANON = status.PUBLISHABLE_KEY || status.ANON_KEY;
const psql = (q) => execSync(`docker exec supabase_db_reino psql -U postgres -Atc ${JSON.stringify(q)}`).toString().trim();

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 220) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-simples';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  const idx = path.join(dest, 'index.html');
  let h = fs.readFileSync(idx, 'utf8');
  h = h.replace(/url: "https:\/\/[a-z0-9]+\.supabase\.co"/, `url: "${API}"`).replace(/anon: "sb_publishable_[A-Za-z0-9_]+"/, `anon: "${ANON}"`);
  if (!h.includes(API)) throw new Error('não consegui apontar a cópia do site para o banco local');
  fs.writeFileSync(idx, h);
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
  for (let i = 0; i < 40; i++) { try { await fetch(SITE + '/'); return srv; } catch (e) { await espera(150); } }
  throw new Error('servidor do site não subiu');
}
function fotoTeste() {
  const f = '/tmp/claude-1000/reino-foto-teste.jpg';
  if (!fs.existsSync(f)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "testsrc2=s=900x600" -frames:v 1 ${f}`);
  return f;
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

async function fluxo(b, [w, h], rotulo) {
  psql('delete from privado.tentativas_login');
  const n = Date.now().toString(36).slice(-6) + rotulo.slice(0, 1);
  const usuario = 'simples.' + n;
  const ddd = w < 500 ? '21' : '31';
  const numero = `9${String(Date.now()).slice(-8)}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  await dublarCaptcha(ctx);
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror ' + e.message));

  await p.goto(SITE + '/', { waitUntil: 'networkidle' });
  await p.waitForSelector(PASSO('nome'), { timeout: 15000 });
  await p.waitForTimeout(800);
  ok(`[${rotulo}] abre no cadastro, etapa 1 de 5`, (await p.locator('.hg-li-progresso-rotulo').textContent()).includes('1 de 5'));
  await digitarEnviar(p, 'Maria Teste Simples');
  await p.waitForSelector(PASSO('whatsapp'));
  ok(`[${rotulo}] depois do nome vem o WhatsApp`, true);
  await digitarEnviar(p, '123');
  ok(`[${rotulo}] WhatsApp curto bloqueia`, /DDD/i.test(await erroVisivel(p)));
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  await p.keyboard.type(ddd + numero, { delay: 8 });
  const mascara = await p.inputValue(PASSO('whatsapp'));
  ok(`[${rotulo}] máscara (DD) 9XXXX-XXXX`, /^\(\d{2}\) 9\d{4}-\d{4}$/.test(mascara), mascara);
  await p.keyboard.press('Enter');
  await p.waitForSelector('.hg-li-slide[data-passo="foto"]');
  await p.screenshot({ path: `${PRINTS}/${rotulo}-01-foto.png` });
  await p.setInputFiles('input[data-foto="galeria"]', fotoTeste());
  await p.waitForSelector('.hg-li-recorte-quadro img');
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); // usar esta foto
  await p.waitForSelector(PASSO('usuario'));
  await p.keyboard.type(usuario, { delay: 8 });
  await p.waitForSelector('.hg-li-disp.is-livre', { timeout: 6000 }).catch(() => {});
  ok(`[${rotulo}] usuário livre conferido pela função`, await p.locator('.hg-li-disp.is-livre').count() === 1);
  await p.keyboard.press('Enter');
  await p.waitForSelector(PASSO('senha'));
  await digitarEnviar(p, 'SenhaForte123');
  await p.waitForSelector(PASSO('senha2'));
  await digitarEnviar(p, 'SenhaForte123');
  await p.waitForSelector('.hg-li-slide[data-passo="resumo"]');
  const resumo = await p.locator('.hg-li-resumo').innerText();
  ok(`[${rotulo}] resumo só com nome, WhatsApp, usuário e senha`, /whatsapp/i.test(resumo) && !/cnpj|e-mail|empresa/i.test(resumo), resumo.replace(/\s+/g, ' '));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${PRINTS}/${rotulo}-02-resumo.png` });
  await p.keyboard.press('Enter'); // criar conta
  await p.waitForSelector('.hg-main', { timeout: 20000 });
  ok(`[${rotulo}] entra direto no app, sem validar e-mail`, true);

  const linha = psql(`select coalesce(email,'∅')||'|'||whatsapp||'|'||(foto is not null) from public.perfis where usuario='${usuario}'`);
  ok(`[${rotulo}] perfil: sem e-mail, WhatsApp +55${ddd}…, com foto`, linha === `∅|+55${ddd}${numero}|true`, linha);

  // apresentação do Dashboard
  await p.waitForSelector('.hg-apres', { timeout: 5000 }).catch(() => {});
  ok(`[${rotulo}] apresentação do Dashboard aparece`, await p.locator('.hg-apres h2').count() === 1 && /Dashboard/.test(await p.locator('.hg-apres h2').innerText()));
  const audio = await p.evaluate(() => { const a = document.querySelector('audio'); return a ? a.src : ''; });
  ok(`[${rotulo}] voz do Dashboard carregada`, /assets\/voz\/index\.mp3\?v=/.test(audio), audio);
  const caixa = await p.locator('.hg-apres').boundingBox();
  ok(`[${rotulo}] cartão cabe na tela`, caixa && caixa.x >= 0 && caixa.x + caixa.width <= w + 0.5 && caixa.y + caixa.height <= h + 0.5, JSON.stringify(caixa));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-03-apresentacao.png` });
  await p.click('.hg-apres-ok');
  ok(`[${rotulo}] "Entendi" fecha`, await p.locator('.hg-apres').count() === 0);
  // volta ao Dashboard: não repete
  await p.evaluate(() => window.dispatchEvent(new Event('resize')));
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForSelector('.hg-main', { timeout: 15000 });
  await p.waitForTimeout(1200);
  ok(`[${rotulo}] Dashboard não apresenta de novo depois de recarregar`, await p.locator('.hg-apres').count() === 0);
  // "?" reabre
  await p.click('.hg-apres-ajuda');
  await p.waitForSelector('.hg-apres', { timeout: 3000 }).catch(() => {});
  ok(`[${rotulo}] botão "?" reabre a apresentação`, await p.locator('.hg-apres').count() === 1);
  await p.keyboard.press('Escape');
  ok(`[${rotulo}] Esc fecha`, await p.locator('.hg-apres').count() === 0);

  // Minha conta: completar empresa, CNPJ e cidade
  await p.evaluate(() => { const a = document.querySelector('.hg-user'); if (a) a.click(); });
  await p.waitForSelector('#p-empresa', { timeout: 8000 });
  await p.waitForSelector('.hg-apres', { timeout: 3000 }).catch(() => {});
  ok(`[${rotulo}] Minha conta tem apresentação própria`, /Minha conta/.test(await p.locator('.hg-apres h2').innerText().catch(() => '')));
  if (await p.locator('.hg-apres').count()) await p.click('.hg-apres-ok');
  ok(`[${rotulo}] aviso "Falta completar"`, /Falta completar/.test(await p.locator('.hg-af-aviso').first().innerText()));
  const cnpj = (() => {
    const base = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
    const dv = (b, ps) => { const s = ps.reduce((t, q, i) => t + Number(b[i]) * q, 0) % 11; return s < 2 ? 0 : 11 - s; };
    const d1 = dv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); return base + d1 + dv(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  })();
  await p.fill('#p-empresa', 'Padaria Simples');
  await p.fill('#p-cnpj', cnpj);
  await p.fill('#p-cidade', 'campinas sp');
  await p.click('form.hg-form button[type=submit]');
  await p.waitForTimeout(1500);
  const perfil = psql(`select empresa||'|'||cnpj||'|'||cidade||'|'||uf from public.perfis where usuario='${usuario}'`);
  ok(`[${rotulo}] Minha conta grava empresa, CNPJ e cidade/UF`, perfil === `Padaria Simples|${cnpj}|Campinas|SP`, perfil);
  ok(`[${rotulo}] CNPJ travado depois de gravado`, await p.locator('#p-cnpj').isDisabled());
  await p.screenshot({ path: `${PRINTS}/${rotulo}-04-minha-conta.png`, fullPage: false });

  ok(`[${rotulo}] sem erro de página`, erros.length === 0, erros.join(' | '));
  await ctx.close();
}

(async () => {
  const pasta = montarSite();
  const srv = await servir(pasta);
  const b = await chromium.launch();
  try {
    await fluxo(b, [1440, 900], 'pc');
    await fluxo(b, [390, 844], 'celular');
  } finally {
    await b.close();
    srv.kill();
  }
  console.log(falhas ? `\n${falhas} falha(s). Prints em ${PRINTS}` : `\nTudo passou. Prints em ${PRINTS}`);
  process.exit(falhas ? 1 : 0);
})();
