// Cadastro com cidade e UF (TODO AF11): o carrossel do login imersivo ganhou a etapa
// "Em que cidade a empresa fica?" e manda cidade/uf para a função reino-cadastro.
// Nunca escreve nada: a função reino-cadastro é respondida aqui (page.route).
//   node supabase/testes/e2e-cadastro-cidade-uf.cjs
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const PORTA = Number(process.env.REINO_PORTA || 8159);
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-cadastro-prints';
fs.mkdirSync(PRINTS, { recursive: true });

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 240) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQIW2NkYGD4z8DAwMgABXAGNgEAVfgCASYZ9OwAAAAASUVORK5CYII=', 'base64');

const PASSO = (p) => `input.hg-li-campo[data-passo="${p}"]`;
async function erroVisivel(p) {
  const e = p.locator('.hg-li-bolha-in.is-erro');
  try { await e.first().waitFor({ state: 'visible', timeout: 4000 }); return (await e.first().innerText()).trim(); } catch (x) { return ''; }
}
function fotoTeste() {
  const f = '/tmp/claude-1000/reino-foto-teste.jpg';
  if (!fs.existsSync(f)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "testsrc2=s=900x600" -frames:v 1 ${f}`);
  return f;
}

(async () => {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const pasta = '/tmp/claude-1000/reino-site-cadastro';
  execSync(`rm -rf ${pasta} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${pasta}`);
  const servidor = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(SITE + '/'); break; } catch (e) { await espera(150); } }
  const navegador = await chromium.launch({ channel: 'chrome', args: ['--disable-dev-shm-usage'] });
  let enviado = null;
  try {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await ctx.route('**/rest/v1/rpc/usuario_disponivel', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
    await ctx.route('**/functions/v1/reino-cadastro', (r) => {
      const b = r.request().postDataBuffer();
      enviado = b ? b.toString('latin1') : (r.request().postData() || '');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, confirmar: true, email_mascarado: 'do***@te***.local' }) });
    });
    const p = await ctx.newPage();
    const saco = [];
    p.on('console', (m) => { if (m.type() === 'error') saco.push(m.text()); });
    p.on('pageerror', (e) => saco.push('pageerror: ' + e.message));
    await p.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector(PASSO('nome'), { timeout: 60000 });

    const digitar = async (passo, texto) => {
      await p.waitForSelector(PASSO(passo), { timeout: 20000 });
      await p.fill(PASSO(passo), texto);
      await p.press(PASSO(passo), 'Enter');
    };
    await digitar('nome', 'Dono Teste Ourives');
    await digitar('empresa', 'Padaria Coroa');
    await digitar('cnpj', '11222333000181');

    /* a etapa nova */
    await p.waitForSelector(PASSO('cidade'), { timeout: 20000 });
    ok('a etapa de cidade/UF existe, logo depois do CNPJ', true);
    ok('a pergunta explica o mapa', /mapa do Reino/i.test(await p.locator('.hg-li-slide[data-passo="cidade"]').innerText()), (await p.locator('.hg-li-slide[data-passo="cidade"]').innerText()).replace(/\n/g, ' ').slice(0, 120));
    await p.screenshot({ path: PRINTS + '/1-etapa-cidade.png' });

    await p.fill(PASSO('cidade'), 'Campinas');
    await p.press(PASSO('cidade'), 'Enter');
    await espera(300);
    ok('sem a UF, o cadastro não passa', /UF/i.test(await erroVisivel(p)), await erroVisivel(p));

    await p.fill(PASSO('cidade'), 'Campinazzz, SP');
    await p.press(PASSO('cidade'), 'Enter');
    await espera(300);
    ok('cidade que não existe na UF é recusada', /não achei/i.test(await erroVisivel(p)), await erroVisivel(p));

    await p.fill(PASSO('cidade'), 'campinas sp');
    await p.press(PASSO('cidade'), 'Enter');
    await p.waitForSelector('.hg-li-slide[data-passo="foto"]', { timeout: 20000 });
    ok('"campinas sp" é aceito e vira o nome do IBGE', true);

    /* foto: galeria + recorte, como no e2e-login-imersivo-local */
    await p.setInputFiles('input[data-foto="galeria"]', fotoTeste());
    await p.waitForSelector('.hg-li-recorte-quadro img', { timeout: 20000 });
    await espera(500);
    await p.keyboard.press('Enter');

    await digitar('email', 'dono.teste@teste.local');
    await digitar('usuario', 'dono.ourives');
    await digitar('senha', 'SenhaForte123');
    await digitar('senha2', 'SenhaForte123');
    await p.waitForSelector('.hg-li-slide[data-passo="resumo"]', { timeout: 20000 });
    const resumo = (await p.locator('.hg-li-slide[data-passo="resumo"]').innerText()).replace(/\n/g, ' ');
    ok('o resumo mostra a cidade e a UF', /Campinas.*SP/.test(resumo), resumo.slice(0, 200));
    await p.screenshot({ path: PRINTS + '/2-resumo.png' });

    await p.keyboard.press('Enter');
    await espera(3000);
    ok('o cadastro envia cidade e uf para o servidor',
      !!enviado && /name="cidade"[\s\S]{0,80}Campinas/.test(enviado) && /name="uf"[\s\S]{0,80}SP/.test(enviado),
      enviado ? enviado.replace(/\r?\n/g, ' ').replace(/-{5,}\S+/g, '·').slice(0, 220) : 'nada enviado');
    ok('sem erro de JavaScript', saco.filter((t) => !/Failed to load resource|favicon/i.test(t)).length === 0, saco.join(' | '));
    await ctx.close();
  } finally {
    await navegador.close();
    servidor.kill();
  }
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO PASSOU');
  console.log('prints em ' + PRINTS);
  process.exit(falhas ? 1 : 0);
})();
