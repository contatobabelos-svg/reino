// Cadastro pelo carrossel do login imersivo desde AN (23/09): exatamente 5 campos
// (nome → WhatsApp → empresa → nicho → cidade), sem foto, sem usuário/senha e sem CAPTCHA.
// O CADASTRO NÃO PASSA NESTE TESTE; a função reino-cadastro é respondida aqui (page.route).
//   node supabase/testes/e2e-cadastro-cidade-uf.cjs
//
// O que se prova aqui é o roteiro do carrossel: os 5 campos na ordem certa, a máscara do
// WhatsApp, as validações locais e o que exatamente o navegador manda ao servidor (nada de
// usuário, senha, foto ou captcha_token). A reentrada pelo WhatsApp e a criação de conta real
// são o teste humano/Playwright no site publicado (as funções são respondidas aqui).
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

const PASSO = (p) => `input.hg-li-campo[data-passo="${p}"]`;
async function erroVisivel(p) {
  const e = p.locator('.hg-li-bolha-in.is-erro');
  try { await e.first().waitFor({ state: 'visible', timeout: 4000 }); return (await e.first().innerText()).trim(); } catch (x) { return ''; }
}

(async () => {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const pasta = '/tmp/claude-1000/reino-site-cadastro';
  execSync(`rm -rf ${pasta} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${pasta}`);
  const servidor = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: pasta, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(SITE + '/'); break; } catch (e) { await espera(150); } }
  const navegador = await chromium.launch({ channel: 'chrome', args: ['--disable-dev-shm-usage'] });
  let enviado = null, chamouRpcUsuario = 0;
  try {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await ctx.route('**/auth/v1/user', (r) => r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', email: 'dono@teste.local', user_metadata: { nome: 'Dono Teste Ourives' } }) }));
    /* AN: a RPC pública saiu do caminho e o CAPTCHA também — ninguém pode chamar nem um nem outro */
    await ctx.route('**/rest/v1/rpc/usuario_disponivel', (r) => { chamouRpcUsuario++; return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' }); });
    await ctx.route('**/functions/v1/reino-cadastro', (r) => {
      const b = r.request().postDataBuffer();
      enviado = b ? b.toString('latin1') : (r.request().postData() || '');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, access_token: 'DUMMY.TOKEN', reentrou: false }) });
    });
    const p = await ctx.newPage();
    const saco = [];
    p.on('console', (m) => { if (m.type() === 'error') saco.push(m.text()); });
    p.on('pageerror', (e) => saco.push('pageerror: ' + e.message));
    await p.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector(PASSO('nome'), { timeout: 60000 });

    /* a tela abre direto no CADASTRO, com só 5 campos a partir de hoje */
    ok('abre no cadastro', await p.locator('input.hg-li-campo').count() === 1);
    const rotulo = await p.locator('.hg-li-progresso-rotulo').innerText();
    ok('primeira etapa: Nome', /1 de 5/i.test(rotulo) && /Nome/i.test(rotulo), rotulo);

    const digitar = async (passo, texto) => {
      await p.waitForSelector(PASSO(passo), { timeout: 20000 });
      await p.fill(PASSO(passo), texto);
      await p.press(PASSO(passo), 'Enter');
    };
    await digitar('nome', 'Dono Teste Ourives');
    await p.waitForSelector(PASSO('whatsapp'), { timeout: 20000 });
    ok('segunda etapa: WhatsApp (máscara)', /2 de 5/i.test(await p.locator('.hg-li-progresso-rotulo').innerText()));
    await p.fill(PASSO('whatsapp'), '1191234567');
    await espera(150);
    ok('a máscara aplica formato brasileiro', (await p.inputValue(PASSO('whatsapp'))).includes('(11)'), await p.inputValue(PASSO('whatsapp')));
    await p.press(PASSO('whatsapp'), 'Enter');

    await p.waitForSelector(PASSO('empresa'), { timeout: 20000 });
    ok('terceira etapa: Empresa', /3 de 5/i.test(await p.locator('.hg-li-progresso-rotulo').innerText()));
    await digitar('empresa', 'Padaria Coroa');
    await p.waitForSelector(PASSO('nicho'), { timeout: 20000 });
    ok('quarta etapa: Nicho', /4 de 5/i.test(await p.locator('.hg-li-progresso-rotulo').innerText()));
    await digitar('nicho', 'Alimentação');
    await p.waitForSelector(PASSO('cidade'), { timeout: 20000 });
    ok('quinta etapa: Cidade (última)', /5 de 5/i.test(await p.locator('.hg-li-progresso-rotulo').innerText()));

    await p.fill(PASSO('cidade'), 'Campinae');
    await p.press(PASSO('cidade'), 'Enter');
    await espera(300);
    ok('a cidade ainda é a última etapa (sem ir para resumo/foto)', await p.locator(PASSO('cidade')).isVisible());
    await p.fill(PASSO('cidade'), 'Campinas');
    await p.press(PASSO('cidade'), 'Enter');
    for (let i = 0; i < 40 && !enviado; i++) await espera(500);

    /* o que o navegador mandou: só os 5 campos + contexto; nada de usuário/senha/foto/captcha */
    const corpo = enviado ? enviado.replace(/\r?\n/g, ' ').slice(0, 400) : '(nada enviado)';
    ok('o cadastro envia os 5 campos para o servidor',
      !!enviado &&
      /name="nome"[\s\S]{0,60}Dono Teste/.test(enviado) &&
      /name="whatsapp"[\s\S]{0,60}119/.test(enviado) &&
      /name="empresa"[\s\S]{0,60}Padaria Coroa/.test(enviado) &&
      /name="nicho"[\s\S]{0,60}Alimenta/.test(enviado) &&
      /name="cidade"[\s\S]{0,80}Campinas/.test(enviado),
      corpo);
    ok('não envia usuário, senha, foto ou CAPTCHA',
      !!enviado && !/name="(usuario|senha|foto|captcha_token)"/.test(enviado), corpo);
    ok('nada mais chama a RPC pública usuario_disponivel', chamouRpcUsuario === 0, 'chamadas: ' + chamouRpcUsuario);
    ok('sem erro de JavaScript', saco.filter((t) => !/Failed to load resource|favicon/i.test(t)).length === 0, saco.join(' | '));
    await p.screenshot({ path: PRINTS + '/1-fin-cadastro.png' });
    await ctx.close();
  } finally {
    await navegador.close();
    servidor.kill();
  }
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO PASSOU');
  console.log('prints em ' + PRINTS);
  process.exit(falhas ? 1 : 0);
})();