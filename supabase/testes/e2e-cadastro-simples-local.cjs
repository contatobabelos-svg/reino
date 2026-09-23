// Teste de ponta a ponta do cadastro simples (desde AN, 23/09: nome → WhatsApp → empresa →
// nicho → cidade) e da apresentação das abas contra o Supabase LOCAL (nunca produção).
// Pré-requisitos (ver README.md desta pasta):
//   supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta
//   migrações 2026-09-22_cadastro_simples_whatsapp.sql, 2026-09-23_afiliados_hierarquia.sql e
//   2026-09-23_cadastro_5campos.sql aplicadas no banco local
//   supabase functions serve --env-file supabase/functions/.env   (sem CAPTCHA desde AN)
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
  // a configuração do app vive em nucleo/config.js e também inline em index.html/mapa.html/entrar.html
  ['nucleo/config.js', 'index.html', 'mapa.html', 'entrar.html'].forEach((rel) => {
    const f = path.join(dest, rel);
    if (!fs.existsSync(f)) return;
    let t = fs.readFileSync(f, 'utf8');
    const antes = t;
    t = t.replace(/url: "https:\/\/[a-z0-9]+\.supabase\.co"/, `url: "${API}"`)
         .replace(/anon: "sb_publishable_[A-Za-z0-9_]+"/, `anon: "${ANON}"`)
         .replace(/anon: "eyJ[A-Za-z0-9_\-.]*"/, `anon: "${ANON}"`);
    if (t !== antes) fs.writeFileSync(f, t);
  });
  // nucleo/config.js é a fonte da configuração: sem ele apontado, nada roda
  if (!fs.readFileSync(path.join(dest, 'nucleo/config.js'), 'utf8').includes(API))
    throw new Error('não consegui apontar a cópia do site (nucleo/config.js) para o banco local');
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
  const ddd = w < 500 ? '21' : '31';
  const numero = `9${String(Date.now()).slice(-8)}`;
  const whatsapp = `+55${ddd}${numero}`;
  // ---- primeiro cadastro (cria a conta) ----
  await cadastroUnico(b, [w, h], rotulo, whatsapp, 'Maria Teste Simples', 'Padaria Simples', 'Alimentação', 'Campinas');
  // ---- reentrada pelo WhatsApp (reconhece e atualiza; não cria outra conta) ----
  await reentrada(b, [w, h], rotulo, whatsapp);
}

async function cadastroUnico(b, [w, h], rotulo, whatsapp, nome, empresa, nicho, cidade) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror ' + e.message));

  await p.goto(SITE + '/', { waitUntil: 'networkidle' });
  await p.waitForSelector(PASSO('nome'), { timeout: 15000 });
  await p.waitForTimeout(800);
  ok(`[${rotulo}] abre no cadastro, etapa 1 de 5`, (await p.locator('.hg-li-progresso-rotulo').textContent()).includes('1 de 5'));
  await digitarEnviar(p, nome);
  await p.waitForSelector(PASSO('whatsapp'));
  ok(`[${rotulo}] depois do nome vem o WhatsApp`, true);
  await digitarEnviar(p, '123');
  ok(`[${rotulo}] WhatsApp curto bloqueia`, /DDD/i.test(await erroVisivel(p)));
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  const ddd = whatsapp.slice(3, 5), numero = whatsapp.slice(5);
  await p.keyboard.type(ddd + numero, { delay: 8 });
  const mascara = await p.inputValue(PASSO('whatsapp'));
  ok(`[${rotulo}] máscara (DD) 9XXXX-XXXX`, /^\(\d{2}\) 9\d{4}-\d{4}$/.test(mascara), mascara);
  await p.keyboard.press('Enter');
  await p.waitForSelector(PASSO('empresa'));
  ok(`[${rotulo}] depois do WhatsApp vem a empresa`, true);
  await digitarEnviar(p, empresa);
  await p.waitForSelector(PASSO('nicho'));
  ok(`[${rotulo}] depois da empresa vem o nicho`, true);
  await digitarEnviar(p, nicho);
  await p.waitForSelector(PASSO('cidade'));
  ok(`[${rotulo}] depois do nicho vem a cidade (última etapa, sem resumo)`,
    /5 de 5/i.test(await p.locator('.hg-li-progresso-rotulo').textContent()));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${PRINTS}/${rotulo}-02-cidade.png` });
  await digitarEnviar(p, cidade);
  await p.waitForSelector('.hg-main', { timeout: 20000 });
  ok(`[${rotulo}] entra direto no app, sem validar e-mail`, true);

  const linha = psql(`select coalesce(email,'∅')||'|'||whatsapp||'|'||empresa||'|'||nicho||'|'||cidade||'|'||situacao||'|'||(usuario is not null)||'|'||(foto is not null) from public.perfis where whatsapp='${whatsapp}'`);
  ok(`[${rotulo}] perfil: sem e-mail, sem usuário/senha/foto, com dados e aguardando`,
    linha === `∅|${whatsapp}|${empresa}|${nicho}|${cidade}|aguardando|false|false`, linha);
  // a linha de cadastro nasce com a cadeia do afiliado padrão
  const cad = psql(`select codigo||'|'||coalesce(cadeia,'∅')||'|'||nome from public.cadastros where id in (select id from public.perfis where whatsapp='${whatsapp}')`);
  ok(`[${rotulo}] linha de cadastro nasce com afiliado padrão (cadeia sem pai)`, cad === 'marcelo|marcelo|' + nome, cad);

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

  // Minha conta: os dados do cadastro já vêm preenchidos; falta só CNPJ
  await p.evaluate(() => { const a = document.querySelector('.hg-user'); if (a) a.click(); });
  await p.waitForSelector('#p-empresa', { timeout: 8000 });
  const falta = await p.locator('.hg-af-aviso b').first().innerText().catch(() => '');
  ok(`[${rotulo}] aviso só pede CNPJ (empresa/WhatsApp/cidade já vieram do cadastro)`, falta === 'CNPJ', falta);
  const cnpj = (() => {
    const base = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
    const dv = (b, ps) => { const s = ps.reduce((t, q, i) => t + Number(b[i]) * q, 0) % 11; return s < 2 ? 0 : 11 - s; };
    const d1 = dv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); return base + d1 + dv(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  })();
  await p.fill('#p-empresa', 'Padaria Simples');
  await p.fill('#p-nicho', 'Alimentação');
  await p.fill('#p-cnpj', cnpj);
  await p.fill('#p-cidade', 'campinas sp');
  await p.click('form.hg-form button[type=submit]');
  await p.waitForTimeout(1500);
  const perfil = psql(`select empresa||'|'||nicho||'|'||cnpj||'|'||cidade||'|'||uf from public.perfis where whatsapp='${whatsapp}'`);
  ok(`[${rotulo}] Minha conta mantém empresa/nicho e grava CNPJ e cidade/UF`, perfil === `Padaria Simples|Alimentação|${cnpj}|Campinas|SP`, perfil);
  ok(`[${rotulo}] CNPJ travado depois de gravado`, await p.locator('#p-cnpj').isDisabled());
  await p.screenshot({ path: `${PRINTS}/${rotulo}-04-minha-conta.png`, fullPage: false });

  ok(`[${rotulo}] sem erro de página`, erros.length === 0, erros.join(' | '));
  await ctx.close();
}

async function reentrada(b, [w, h], rotulo, whatsapp) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror ' + e.message));
  const contasAntes = Number(psql(`select count(*) from public.perfis`));

  // volta para o login (deslogado) e redigita os 5 campos com o MESMO WhatsApp
  await p.goto(SITE + '/', { waitUntil: 'networkidle' });
  await p.keyboard.press('Control+Shift+R');
  await p.waitForTimeout(400);
  await p.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForSelector(PASSO('nome'), { timeout: 15000 });
  await digitarEnviar(p, 'Maria Teste Renomeada');
  await p.waitForSelector(PASSO('whatsapp'));
  const ddd = whatsapp.slice(3, 5), numero = whatsapp.slice(5);
  await digitarEnviar(p, ddd + numero);
  await p.waitForSelector(PASSO('empresa'));
  await digitarEnviar(p, 'Empresa Nova');
  await p.waitForSelector(PASSO('nicho'));
  await digitarEnviar(p, 'Consultoria');
  await p.waitForSelector(PASSO('cidade'));
  await digitarEnviar(p, 'São Paulo');
  // o "Bem-vindo de volta" aparece na bolha do login antes da transição para o app
  let msg = '';
  for (let i = 0; i < 60 && !msg; i++) {
    const estado = await p.evaluate(() => {
      const t = document.querySelector('.hg-li-msg .hg-li-bolha-in');
      const txt = t ? t.innerText.trim() : '';
      const entrou = !!(document.querySelector('.hg-main') && document.querySelector('.hg-main').offsetHeight);
      return { txt, entrou };
    }).catch(() => ({ txt: '', entrou: false }));
    if (estado.entrou) break;
    if (/reconhecem|bem-vindo de volta/i.test(estado.txt)) msg = estado.txt;
    else await p.waitForTimeout(80);
  }
  ok(`[${rotulo}] reentrada: aviso "reconhecemos" ou "bem-vindo de volta"`,
    /reconhecem|bem-vindo de volta/i.test(msg), msg || '(sem bolha)');
  await p.waitForSelector('.hg-main', { timeout: 20000 });
  ok(`[${rotulo}] reentrada: mesmo WhatsApp abre a conta direto`, true);
  await p.waitForTimeout(1200);

  const contasDepois = Number(psql(`select count(*) from public.perfis`));
  ok(`[${rotulo}] reentrada: não cria outra conta`, contasDepois === contasAntes, `${contasAntes} → ${contasDepois}`);
  const linha = psql(`select nome||'|'||empresa||'|'||nicho||'|'||cidade||'|'||situacao from public.perfis where whatsapp='${whatsapp}'`);
  ok(`[${rotulo}] reentrada: dados atualizados no perfil`, linha === 'Maria Teste Renomeada|Empresa Nova|Consultoria|São Paulo|aguardando', linha);
  await p.screenshot({ path: `${PRINTS}/${rotulo}-05-reentrada.png` });
  ok(`[${rotulo}] reentrada: sem erro de página`, erros.length === 0, erros.join(' | '));
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
