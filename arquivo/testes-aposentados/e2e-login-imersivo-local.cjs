// Teste de ponta a ponta do login imersivo (TODO W) contra o Supabase LOCAL (nunca produção).
// Pré-requisitos (ver README.md desta pasta):
//   supabase start -x studio,imgproxy,logflare,vector,supavisor,realtime,postgres-meta
//   migração 2026-09-21_login_imersivo_usuario_empresa_cnpj.sql aplicada no banco local
//   supabase functions serve --env-file supabase/functions/.env   (REINO_URL_PUBLICA=http://127.0.0.1:54361)
// O próprio teste monta uma cópia do site apontando para o banco local e a serve na porta 8141.
// Uso: node supabase/testes/e2e-login-imersivo-local.cjs
//   REINO_TESTE_PRINTS=/pasta/fora/do/git  (padrão /tmp/claude-1000/reino-login-prints)
//   REINO_PLAYWRIGHT=/caminho/do/playwright
// Só contas fictícias @teste.local.
//
// Atualizado em 2026-09-21 (Parecer 1) para:
//   · a etapa de cidade/UF do carrossel (AF11), que antes travava o teste na etapa da foto;
//   · o CAPTCHA (C2): o navegador usa a Site Key de TESTE da Cloudflare com um dublê local do
//     api.js (o desafio de verdade não fecha em navegador de teste) e as chamadas diretas às
//     funções mandam o token de teste, que a secret de teste aceita;
//   · a checagem de usuário pela função (C12), no lugar da RPC pública.
// Para isso, o supabase/functions/.env local precisa de TURNSTILE_SECRET=1x0000000000000000000000000000000AA.
const PW = process.env.REINO_PLAYWRIGHT || '/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../..');
const API = process.env.REINO_API || 'http://127.0.0.1:54361';
const MAILPIT = process.env.REINO_MAILPIT || 'http://127.0.0.1:54364';
const PORTA = 8141;
const SITE = `http://localhost:${PORTA}`;
const PRINTS = process.env.REINO_TESTE_PRINTS || '/tmp/claude-1000/reino-login-prints';
fs.mkdirSync(PRINTS, { recursive: true });

const status = JSON.parse(execSync('supabase status -o json', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const ANON = status.PUBLISHABLE_KEY || status.ANON_KEY;
const psql = (q) => execSync(`docker exec supabase_db_reino psql -U postgres -Atc ${JSON.stringify(q)}`).toString().trim();

let falhas = 0;
const ok = (nome, cond, info) => { if (!cond) falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (info ? '  → ' + String(info).slice(0, 220) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- site local
function montarSite() {
  execSync('sh montar-site.sh', { cwd: RAIZ });
  const dest = '/tmp/claude-1000/reino-site-local';
  execSync(`rm -rf ${dest} && mkdir -p /tmp/claude-1000 && cp -R ${RAIZ}/site ${dest}`);
  const idx = path.join(dest, 'index.html');
  let h = fs.readFileSync(idx, 'utf8');
  h = h.replace(/url: "https:\/\/[a-z0-9]+\.supabase\.co"/, `url: "${API}"`).replace(/anon: "sb_publishable_[A-Za-z0-9_]+"/, `anon: "${ANON}"`);
  if (!h.includes(API)) throw new Error('não consegui apontar a cópia do site para o banco local');
  fs.writeFileSync(idx, h);
  // telas que têm a URL de produção fixa no código (Dashboard, Notícias, Música, Assistente, Academy,
  // globo): na cópia local apontam para o banco local, para o teste nunca chamar produção
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

// ---------------------------------------------------------------- dados de apoio
function fotoTeste() {
  const f = '/tmp/claude-1000/reino-foto-teste.jpg';
  if (!fs.existsSync(f)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "testsrc2=s=900x600" -frames:v 1 ${f}`);
  return f;
}
// token de teste da Cloudflare: a secret de teste (1x0000...AA) aceita, a de produção rejeita
const TOKEN_CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';
/* CNPJ válido e diferente a cada chamada: desde 2026-09-21 o cadastro exige CNPJ único
   (migração 2026-09-21_cnpj_unico.sql), então repetir o mesmo trava o teste no CNPJ */
function cnpjNovo() {
  const base = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  const dv = (b, pesos) => { const s = pesos.reduce((t, p, i) => t + Number(b[i]) * p, 0) % 11; return s < 2 ? 0 : 11 - s; };
  const d1 = dv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return base + d1 + d2;
}
async function cadastroDireto(n, usuario) {
  const f = new FormData();
  Object.entries({ nome: 'Dono Teste', empresa: 'Empresa Dono', cnpj: cnpjNovo(), cidade: 'Campinas', uf: 'SP', email: `dono${n}@teste.local`, usuario, senha: 'SenhaForte123', captcha_token: TOKEN_CAPTCHA })
    .forEach(([k, v]) => f.append(k, v));
  f.append('foto', new Blob([fs.readFileSync(fotoTeste())], { type: 'image/jpeg' }), 'f.jpg');
  const r = await fetch(API + '/functions/v1/reino-cadastro', { method: 'POST', headers: { apikey: ANON }, body: f });
  return r.json();
}
/* dublê do Turnstile: mesma interface do api.js da Cloudflare, sem depender da rede dela */
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
async function linkConfirmacao(email) {
  for (let i = 0; i < 30; i++) {
    const s = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:' + email)}`)).json();
    const m = s.messages && s.messages[0];
    if (m) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      const corpo = (msg.HTML || '') + ' ' + (msg.Text || '');
      const l = corpo.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/);
      if (l) return l[0].replace(/&amp;/g, '&');
    }
    await espera(300);
  }
  return null;
}

// ---------------------------------------------------------------- ajudantes de página
const PASSO = (p) => `input.hg-li-campo[data-passo="${p}"]`;
async function focoNaBarra(p) {
  return p.evaluate(() => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.hg-li-barra')));
}
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
async function layout(p, nome) {
  return p.evaluate((nome) => {
    const w = innerWidth, h = innerHeight;
    const rolagemX = document.documentElement.scrollWidth > w || document.body.scrollWidth > w;
    const palco = document.querySelector('.hg-fundo-reino-palco');
    const desf = document.querySelector('.hg-fundo-reino-desfoque');
    let cobre = false, modo = 'sem-fundo';
    if (palco) {
      const r = palco.getBoundingClientRect();
      const cobrePalco = r.left <= 0.5 && r.top <= 0.5 && r.right >= w - 0.5 && r.bottom >= h - 0.5;
      if (cobrePalco) { cobre = true; modo = 'cobrir'; }
      else if (desf) {
        const d = desf.getBoundingClientRect();
        cobre = d.left <= 0 && d.top <= 0 && d.right >= w && d.bottom >= h && r.left <= 0.5 && r.right >= w - 0.5 && r.top <= 0.5;
        modo = 'encaixar';
      }
    }
    return { nome, rolagemX, cobre, modo };
  }, nome);
}
// a imagem da cena carregou (se falhasse, a tela cairia no fundo de reserva)
/* desde 2026-09-19 o fundo do login é um VÍDEO pré-renderizado (reino-fundo.webm) com poster;
   antes era uma imagem. Vale qualquer um dos dois: o que não pode é cair na cena de reserva. */
async function cenaCarregada(p) {
  return p.evaluate(() => {
    const palco = document.querySelector('.hg-fundo-reino-palco');
    if (!palco) return false;
    const img = palco.querySelector('img');
    if (img && img.complete && img.naturalWidth > 0) return true;
    const v = palco.querySelector('video');
    return !!(v && (v.videoWidth > 0 || v.readyState >= 1 || v.poster));
  });
}

// ---------------------------------------------------------------- fluxo completo num tamanho de tela
async function fluxo(b, [w, h], rotulo) {
  // no local TUDO sai do mesmo IP (o do Docker), então o limite por IP do cadastro (10 em 5 min,
  // C2 do Parecer 1) se esgota com as cenas do servidor. Zera antes de cada fluxo de navegador.
  psql('delete from privado.tentativas_login');
  // o carrossel digita sempre o mesmo CNPJ e o cadastro exige CNPJ único desde 2026-09-21:
  // solta o CNPJ do teste antes de rodar, senão a segunda execução para em "CNPJ já tem cadastro".
  // Apaga também o PERFIL solto: `public.perfis` não tem chave estrangeira para `auth.users`, então
  // apagar a conta deixa o perfil (e o CNPJ, e o usuário) preso para sempre — achado do Salvador em
  // 2026-09-21, devolvido ao Cético; aqui é só higiene do teste.
  psql("delete from auth.users where id in (select id from public.perfis where cnpj = '11222333000181')");
  psql("delete from public.perfis where cnpj = '11222333000181'");
  const n = Date.now().toString(36) + rotulo;
  const cod = 'luz' + n;
  psql(`insert into public.codigos (codigo, user_id, nome) select '${cod}', id, 'Luz' from auth.users where email like '%@teste.local' limit 1 on conflict do nothing`);
  const dono = 'dono.' + n;
  const rDono = await cadastroDireto(n, dono);
  ok(`[${rotulo}] conta de apoio criada pela função (usuário que já existe)`, rDono.ok === true, JSON.stringify(rDono));

  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  await dublarCaptcha(ctx);
  const p = await ctx.newPage();
  const erros = [], respostas = [];
  p.on('pageerror', (e) => erros.push('pageerror ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 200)); });
  p.on('response', (r) => { if (r.status() >= 400) respostas.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)); });

  await p.goto(`${SITE}/?ref=${cod}`, { waitUntil: 'networkidle' });
  await p.waitForSelector(PASSO('nome'), { timeout: 15000 });
  await p.waitForTimeout(1200);
  ok(`[${rotulo}] abre no cadastro (etapa 1 de 7, nome)`, (await p.locator('.hg-li-progresso-rotulo').textContent()).includes('1 de 7'));
  ok(`[${rotulo}] foco já na barra`, await focoNaBarra(p));
  const l0 = await layout(p, 'abertura');
  ok(`[${rotulo}] sem rolagem horizontal e fundo cobrindo a tela (${l0.modo})`, !l0.rolagemX && l0.cobre, JSON.stringify(l0));
  ok(`[${rotulo}] cena do Reino carregada (sem cair na reserva)`, await cenaCarregada(p));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-01-abertura.png` });

  // nome
  await digitarEnviar(p, '');
  ok(`[${rotulo}] nome vazio bloqueia`, (await erroVisivel(p)).length > 0 && await p.locator(PASSO('nome')).count() === 1);
  await digitarEnviar(p, 'Maria');
  ok(`[${rotulo}] nome sem sobrenome bloqueia`, /sobrenome/i.test(await erroVisivel(p)));
  await digitarEnviar(p, 'Maria Teste Silva');
  await p.waitForSelector(PASSO('empresa'));
  ok(`[${rotulo}] Enter envia e foco segue na barra (empresa)`, await focoNaBarra(p));
  // empresa
  await digitarEnviar(p, 'Padaria Coroa');
  await p.waitForSelector(PASSO('cnpj'));
  // CNPJ
  await p.keyboard.type('11222333000182', { delay: 8 });
  ok(`[${rotulo}] CNPJ com máscara 00.000.000/0000-00`, (await p.inputValue(PASSO('cnpj'))) === '11.222.333/0001-82', await p.inputValue(PASSO('cnpj')));
  await p.keyboard.press('Enter');
  ok(`[${rotulo}] CNPJ com dígito errado bloqueia`, /não é válido/i.test(await erroVisivel(p)));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-02-cnpj-invalido.png` });
  await digitarEnviar(p, '11222333000181');
  // cidade e UF (AF11): é daí que sai o lugar da empresa no mapa
  await p.waitForSelector(PASSO('cidade'), { timeout: 20000 });
  await digitarEnviar(p, 'Campinas');
  ok(`[${rotulo}] cidade sem UF bloqueia`, /UF/i.test(await erroVisivel(p)));
  await digitarEnviar(p, 'campinas sp');
  await p.waitForSelector('.hg-li-slide[data-passo="foto"]');
  // foto
  await p.waitForTimeout(300);
  ok(`[${rotulo}] foco na barra na etapa da foto`, await focoNaBarra(p));
  await p.keyboard.press('Enter');
  ok(`[${rotulo}] sem foto bloqueia`, /foto/i.test(await erroVisivel(p)));
  await p.setInputFiles('input[data-foto="galeria"]', fotoTeste());
  await p.waitForSelector('.hg-li-recorte-quadro img');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${PRINTS}/${rotulo}-03-recorte-foto.png` });
  ok(`[${rotulo}] recorte aberto com foco no enviar`, await focoNaBarra(p));
  await p.keyboard.press('Enter');
  await p.waitForSelector(PASSO('email'));
  // e-mail
  const email = `maria${n}@teste.local`;
  await digitarEnviar(p, 'maria-sem-arroba');
  ok(`[${rotulo}] e-mail inválido bloqueia`, /e-mail válido/i.test(await erroVisivel(p)));
  await digitarEnviar(p, email);
  await p.waitForSelector(PASSO('usuario'));
  // usuário
  await p.keyboard.type(dono, { delay: 8 });
  await p.waitForSelector('.hg-li-disp.is-ocupado', { timeout: 5000 }).catch(() => {});
  ok(`[${rotulo}] usuário repetido aparece indisponível ao digitar`, await p.locator('.hg-li-disp.is-ocupado').count() === 1);
  await p.keyboard.press('Enter');
  ok(`[${rotulo}] usuário repetido bloqueia`, /já existe/i.test(await erroVisivel(p)));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-04-usuario-indisponivel.png` });
  const usuario = 'maria.' + n;
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  await p.keyboard.type('Maria.' + n, { delay: 8 }); // M maiúsculo de propósito
  ok(`[${rotulo}] usuário vira minúsculo`, (await p.inputValue(PASSO('usuario'))) === usuario, await p.inputValue(PASSO('usuario')));
  await p.waitForSelector('.hg-li-disp.is-livre', { timeout: 5000 }).catch(() => {});
  ok(`[${rotulo}] usuário livre aparece disponível`, await p.locator('.hg-li-disp.is-livre').count() === 1);
  await p.keyboard.press('Enter');
  await p.waitForSelector(PASSO('senha'));
  // senha
  await digitarEnviar(p, 'curta');
  ok(`[${rotulo}] senha curta bloqueia`, /8 caracteres/i.test(await erroVisivel(p)));
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  await p.keyboard.type('SenhaForte123', { delay: 5 });
  await p.click('button[aria-label="Mostrar a senha"]');
  ok(`[${rotulo}] olho mostra a senha e o foco volta para a barra`, (await p.getAttribute(PASSO('senha'), 'type')) === 'text' && await focoNaBarra(p));
  await p.keyboard.press('Enter');
  await p.waitForSelector(PASSO('senha2'));
  ok(`[${rotulo}] confirmação começa escondida`, (await p.getAttribute(PASSO('senha2'), 'type')) === 'password');
  await digitarEnviar(p, 'OutraSenha999');
  ok(`[${rotulo}] senhas diferentes bloqueiam`, /não são iguais/i.test(await erroVisivel(p)));
  await digitarEnviar(p, 'SenhaForte123');
  await p.waitForSelector('.hg-li-slide[data-passo="resumo"]');
  await p.waitForTimeout(500);
  const resumo = await p.locator('.hg-li-resumo').innerText();
  ok(`[${rotulo}] resumo com todos os dados e o afiliado`, resumo.includes('Maria Teste Silva') && resumo.includes('Padaria Coroa') && resumo.includes('11.222.333/0001-81') && resumo.includes('@' + usuario) && resumo.includes(email) && resumo.includes(cod), resumo.replace(/\n/g, ' | '));
  ok(`[${rotulo}] foco na barra no resumo`, await focoNaBarra(p));
  const l1 = await layout(p, 'resumo');
  ok(`[${rotulo}] resumo sem rolagem horizontal`, !l1.rolagemX, JSON.stringify(l1));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-05-resumo.png` });
  // voltar etapa pelo botão e retornar
  await p.keyboard.press('Enter');
  try {
    await p.waitForSelector('.hg-li-slide[data-passo="validar"]', { timeout: 20000 });
  } catch (e) {
    ok(`[${rotulo}] o cadastro chegou à tela "valide seu e-mail"`, false, 'erro na tela: ' + (await erroVisivel(p)));
    throw e;
  }
  await p.waitForTimeout(600);
  const links = await p.$$eval('.hg-li-correios a', (as) => as.map((a) => [a.textContent.trim(), a.href, a.target, a.rel, !!a.querySelector('.hg-li-correio-seta svg')]));
  ok(`[${rotulo}] cadastro completo → "valide seu e-mail" com Gmail, Yahoo e Outlook (nova aba, com seta)`,
    links.length === 3 && links[0][1] === 'https://mail.google.com/' && links[1][1] === 'https://mail.yahoo.com/' && links[2][1] === 'https://outlook.live.com/' && links.every((l) => l[2] === '_blank' && /noopener/.test(l[3]) && l[4]), JSON.stringify(links));
  const txtValidar = await p.locator('.hg-li-slide').innerText();
  ok(`[${rotulo}] e-mail aparece mascarado`, txtValidar.includes('ma***@te***.local') && !txtValidar.includes(email), txtValidar.replace(/\n/g, ' | '));
  const l2 = await layout(p, 'validar');
  ok(`[${rotulo}] validar sem rolagem horizontal e fundo cobrindo`, !l2.rolagemX && l2.cobre, JSON.stringify(l2));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-06-validar-email.png` });

  // banco: perfil, foto no Storage, cadastro do afiliado
  const perfil = psql(`select id || '|' || coalesce(usuario,'') || '|' || coalesce(empresa,'') || '|' || coalesce(cnpj,'') || '|' || coalesce(foto,'') || '|' || situacao from public.perfis where email='${email}'`).split('|');
  ok(`[${rotulo}] perfis com usuario, empresa, cnpj e situação aguardando`, perfil[1] === usuario && perfil[2] === 'Padaria Coroa' && perfil[3] === '11222333000181' && perfil[5] === 'aguardando', perfil.join('|'));
  const obj = psql(`select name || '|' || (metadata->>'mimetype') || '|' || (metadata->>'size') from storage.objects where bucket_id='avatares' and name like '${perfil[0]}.%'`);
  ok(`[${rotulo}] foto no Storage em avatares/<user_id>.webp`, obj.startsWith(perfil[0] + '.webp|image/webp'), obj);
  const rFoto = await fetch(perfil[4]);
  const bytesFoto = Buffer.from(await rFoto.arrayBuffer());
  ok(`[${rotulo}] link da foto em perfis.foto abre (público, webp, pequeno)`, rFoto.status === 200 && /webp/.test(rFoto.headers.get('content-type')) && bytesFoto.length < 200000, `${rFoto.status} ${rFoto.headers.get('content-type')} ${bytesFoto.length} B`);
  const lista = await fetch(API + '/storage/v1/object/list/avatares', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: '' }) });
  const listaTxt = await lista.text();
  ok(`[${rotulo}] visitante NÃO lista o bucket avatares`, !listaTxt.includes(perfil[0]), lista.status + ' ' + listaTxt.slice(0, 80));
  const cad = psql(`select codigo || '|' || coalesce(email,'') from public.cadastros where email='${email}'`);
  ok(`[${rotulo}] linha em cadastros com o código de afiliado`, cad === `${cod}|${email}`, cad);
  ok(`[${rotulo}] sem base64 em perfis.foto`, !/^data:/.test(perfil[4]));

  // "já validei" antes de validar
  await p.keyboard.press('Enter');
  ok(`[${rotulo}] "já validei" antes de confirmar mantém a validação`, /ainda não chegou/i.test(await erroVisivel(p)) && await p.locator('.hg-li-slide[data-passo="validar"]').count() === 1);
  // reenviar
  await p.click('.hg-li-barra .hg-li-opcao');
  await p.waitForSelector('.hg-li-bolha-in.is-aviso', { timeout: 6000 }).catch(() => {});
  ok(`[${rotulo}] reenviar confirmação avisa`, /link de novo/i.test(await p.locator('.hg-li-slide').innerText()));

  // "já tenho conta": login antes de confirmar
  await p.click('.hg-li-pilula');
  await p.waitForSelector(PASSO('l-usuario'));
  ok(`[${rotulo}] alterna para "Já tenho conta" (pílula vira "Criar conta")`, (await p.locator('.hg-li-pilula').innerText()).trim() === 'Criar conta');
  await digitarEnviar(p, usuario);
  await p.waitForSelector(PASSO('l-senha'));
  await digitarEnviar(p, 'SenhaErrada999');
  const eGen = await erroVisivel(p);
  ok(`[${rotulo}] senha errada (conta não confirmada) → mensagem genérica, sem revelar nada`, eGen === 'Usuário ou senha não conferem.', eGen);
  await digitarEnviar(p, 'SenhaForte123');
  await p.waitForSelector('.hg-li-slide[data-passo="validar"]', { timeout: 8000 });
  ok(`[${rotulo}] login com senha certa antes de confirmar → validação`, (await p.locator('.hg-li-slide').innerText()).includes('não foi validado'));
  await p.screenshot({ path: `${PRINTS}/${rotulo}-07-login-antes-de-validar.png` });
  // na validação a pílula leva a "Já tenho conta"; de lá, "Criar conta" volta ao começo do cadastro
  await p.click('.hg-li-pilula');
  await p.waitForSelector(PASSO('l-usuario'));
  await p.click('.hg-li-pilula');
  await p.waitForSelector(PASSO('nome'));
  ok(`[${rotulo}] "Criar conta" volta ao cadastro`, (await p.locator('.hg-li-pilula').innerText()).trim() === 'Já tenho conta');

  // confirmar pelo link do Mailpit
  const link = await linkConfirmacao(email);
  ok(`[${rotulo}] e-mail de confirmação chegou no Mailpit`, !!link, link);
  if (link) {
    const rv = await fetch(link, { redirect: 'manual' });
    ok(`[${rotulo}] link de confirmação volta para o site`, rv.status >= 300 && rv.status < 400 && (rv.headers.get('location') || '').startsWith(SITE), rv.status + ' ' + (rv.headers.get('location') || '').slice(0, 60));
  }
  ok(`[${rotulo}] e-mail confirmado no Auth`, psql(`select (email_confirmed_at is not null)::text from auth.users where email='${email}'`) === 'true');

  // login por usuário → entra
  const entrar = async (quem, senha, nomePrint) => {
    const c2 = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
    await dublarCaptcha(c2);
    const q = await c2.newPage();
    q.on('pageerror', (e) => erros.push('pageerror ' + e.message));
    q.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 200)); });
    await q.goto(SITE + '/', { waitUntil: 'networkidle' });
    /* 90 s: nesta altura do teste já há vários contextos abertos e o Docker do Supabase inteiro
       na mesma máquina; a primeira pintura do app (9 MB de JSX compilado no navegador — a C7 do
       Parecer 1) passa de 30 s sob carga. Não é o app em condições normais. */
    await q.waitForSelector(PASSO('nome'), { timeout: 90000 });
    await q.click('.hg-li-pilula');
    await q.waitForSelector(PASSO('l-usuario'));
    await q.waitForTimeout(300);
    await digitarEnviar(q, quem);
    await q.waitForSelector(PASSO('l-senha'));
    await digitarEnviar(q, senha);
    let entrou = false;
    try { await q.waitForSelector('.hg-app', { timeout: 10000 }); entrou = true; } catch (e) { entrou = false; }
    const texto = entrou ? await q.locator('.hg-main').innerText() : await erroVisivel(q);
    if (nomePrint) await q.screenshot({ path: `${PRINTS}/${rotulo}-${nomePrint}.png` });
    const sessao = await q.evaluate(() => { try { return JSON.parse(localStorage.getItem('reino.sessao') || 'null'); } catch (e) { return null; } });
    await c2.close();
    return { entrou, texto, sessao };
  };
  const e1 = await entrar(usuario, 'SenhaForte123', '08-entrou-por-usuario');
  ok(`[${rotulo}] login por usuário entra no app (com aviso de aprovação)`, e1.entrou && /aguarda a aprovação/i.test(e1.texto), e1.texto.slice(0, 120));
  ok(`[${rotulo}] sessão gravada no formato do contas.js (token + refresh + usuario do perfil)`, !!(e1.sessao && e1.sessao.token && e1.sessao.refresh && e1.sessao.usuario === usuario && e1.sessao.empresa === 'Padaria Coroa'), JSON.stringify(e1.sessao && { id: e1.sessao.id, usuario: e1.sessao.usuario }));
  const e2 = await entrar(email, 'SenhaForte123');
  ok(`[${rotulo}] login por e-mail entra no app`, e2.entrou);
  const e3 = await entrar(usuario, 'SenhaErrada999', '09-senha-errada');
  ok(`[${rotulo}] senha errada → mensagem genérica`, !e3.entrou && e3.texto === 'Usuário ou senha não conferem.', e3.texto);
  const e4 = await entrar('ninguem.' + n, 'SenhaForte123');
  ok(`[${rotulo}] usuário inexistente → a mesma mensagem genérica`, !e4.entrou && e4.texto === 'Usuário ou senha não conferem.', e4.texto);

  const errosProprios = erros.filter((e) => !/ipwho\.is/.test(e));
  ok(`[${rotulo}] zero erro de console`, errosProprios.length === 0, JSON.stringify(errosProprios));
  ok(`[${rotulo}] nenhuma resposta HTTP >= 400 na página do cadastro`, respostas.length === 0, JSON.stringify(respostas));
  await ctx.close();
}

// ---------------------------------------------------------------- servidor: regras que o navegador não alcança
async function regrasServidor() {
  const n = Date.now().toString(36) + 'srv';
  const post = async (corpo) => (await fetch(API + '/functions/v1/reino-login', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ captcha_token: TOKEN_CAPTCHA, ...corpo }) })).json();
  const t0 = Date.now(); await post({ usuario: 'nao.existe.' + n, senha: 'qualquer123' }); const t1 = Date.now() - t0;
  ok('[servidor] latência mínima no login (≥ 600 ms mesmo sem usuário)', t1 >= 600, t1 + ' ms');
  const f = new FormData();
  Object.entries({ nome: 'Teste Servidor', empresa: 'X', cnpj: cnpjNovo(), cidade: 'Campinas', uf: 'SP', email: `srv${n}@teste.local`, usuario: 'srv.' + n, senha: 'SenhaForte123', captcha_token: TOKEN_CAPTCHA }).forEach(([k, v]) => f.append(k, v));
  f.append('foto', new Blob(['nao sou imagem'], { type: 'image/webp' }), 'f.webp');
  const r = await (await fetch(API + '/functions/v1/reino-cadastro', { method: 'POST', headers: { apikey: ANON }, body: f })).json();
  ok('[servidor] cadastro recusa empresa curta / arquivo que não é imagem', r.ok === false, JSON.stringify(r));
  const g = new FormData();
  Object.entries({ nome: 'Teste Servidor', empresa: 'Empresa Srv', cnpj: cnpjNovo(), cidade: 'Campinas', uf: 'SP', email: `srv${n}@teste.local`, usuario: 'srv.' + n, senha: 'SenhaForte123', captcha_token: TOKEN_CAPTCHA }).forEach(([k, v]) => g.append(k, v));
  g.append('foto', new Blob(['nao sou imagem, sou texto com tamanho'], { type: 'image/webp' }), 'f.webp');
  const r2 = await (await fetch(API + '/functions/v1/reino-cadastro', { method: 'POST', headers: { apikey: ANON }, body: g })).json();
  ok('[servidor] cadastro confere a assinatura do arquivo (não só o tipo declarado)', r2.ok === false && r2.campo === 'foto', JSON.stringify(r2));
  // e-mail repetido, mesmo não confirmado
  const dono = await cadastroDireto(n, 'dup.' + n);
  const dup = await cadastroDireto(n, 'dup2.' + n);
  ok('[servidor] e-mail repetido (ainda não confirmado) é recusado', dono.ok === true && dup.ok === false && dup.codigo === 'email_em_uso', JSON.stringify(dup));
  // a conta não troca usuário nem cnpj sozinha
  const s = await (await fetch(API + '/auth/v1/signup', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `direto${n}@teste.local`, password: 'SenhaForte123', gotrue_meta_security: { captcha_token: TOKEN_CAPTCHA }, data: { nome: 'Direto', usuario: 'ADMIN', cnpj: '123' } }) })).json();
  const idDireto = (s.user && s.user.id) || s.id;
  ok('[servidor] signup direto com lixo nos metadados não grava usuario/cnpj', psql(`select coalesce(usuario,'-') || coalesce(cnpj,'-') from public.perfis where id='${idDireto}'`) === '--');
  psql(`update auth.users set email_confirmed_at=now() where id='${idDireto}'`);
  const tk = (await (await fetch(API + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `direto${n}@teste.local`, password: 'SenhaForte123', gotrue_meta_security: { captcha_token: TOKEN_CAPTCHA } }) })).json()).access_token;
  await fetch(API + `/rest/v1/perfis?id=eq.${idDireto}`, { method: 'PATCH', headers: { apikey: ANON, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: 'tomado.' + n, cnpj: '11222333000181', empresa: 'Nova Empresa' }) });
  ok('[servidor] a conta troca a empresa mas NÃO troca usuario nem cnpj', psql(`select coalesce(usuario,'-') || '|' || coalesce(cnpj,'-') || '|' || coalesce(empresa,'-') from public.perfis where id='${idDireto}'`) === '-|-|Nova Empresa');
  const rpc = await fetch(API + '/rest/v1/rpc/reino_email_do_usuario', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_usuario: 'dup.' + n }) });
  ok('[servidor] visitante NÃO resolve usuário → e-mail pela RPC', rpc.status >= 400, rpc.status + ' ' + (await rpc.text()).slice(0, 80));
  // C12 do Parecer 1: a RPC saiu do alcance do visitante; a checagem passa pela função, com limite por IP
  const disp = await fetch(API + '/rest/v1/rpc/usuario_disponivel', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_usuario: 'dup.' + n }) });
  ok('[servidor] visitante NÃO chama mais a RPC usuario_disponivel', disp.status >= 400, disp.status + ' ' + (await disp.text()).slice(0, 80));
  const chk = async (u) => (await (await fetch(API + '/functions/v1/reino-cadastro', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'usuario_disponivel', usuario: u }) })).json());
  ok('[servidor] a função responde só sim/não na checagem de usuário', JSON.stringify(await chk('dup.' + n)) === '{"ok":true,"disponivel":false}' && (await chk('livre.' + n)).disponivel === true);
  // C2 do Parecer 1: sem o token do CAPTCHA, a porta não abre
  const semToken = new FormData();
  Object.entries({ nome: 'Sem Captcha', empresa: 'Empresa X', cnpj: '11222333000181', cidade: 'Campinas', uf: 'SP', email: `semcap${n}@teste.local`, usuario: 'semcap.' + n, senha: 'SenhaForte123' }).forEach(([k, v]) => semToken.append(k, v));
  semToken.append('foto', new Blob([fs.readFileSync(fotoTeste())], { type: 'image/jpeg' }), 'f.jpg');
  const rSem = await fetch(API + '/functions/v1/reino-cadastro', { method: 'POST', headers: { apikey: ANON }, body: semToken });
  ok('[servidor] cadastro SEM token do CAPTCHA é recusado', rSem.status === 403 && (await rSem.json()).codigo === 'captcha', rSem.status);
  const rLoginSem = await fetch(API + '/functions/v1/reino-login', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: 'dup.' + n, senha: 'SenhaForte123' }) });
  ok('[servidor] login SEM token do CAPTCHA é recusado', rLoginSem.status === 403 && (await rLoginSem.json()).codigo === 'captcha', rLoginSem.status);
  const rAuth = await fetch(API + '/auth/v1/signup', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `porta${n}@teste.local`, password: 'SenhaForte123' }) });
  ok('[servidor] porta direta /auth/v1/signup sem token é recusada pelo Auth', rAuth.status === 400 && /captcha/i.test(await rAuth.text()), rAuth.status);
}

// ---------------------------------------------------------------- movimento reduzido
async function movimentoReduzido(b) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await dublarCaptcha(ctx);
  const p = await ctx.newPage();
  await p.goto(SITE + '/', { waitUntil: 'networkidle' });
  await p.waitForSelector(PASSO('nome'));
  const a = await p.$eval('.hg-fundo-reino-palco', (e) => e.innerHTML.length + ':' + e.innerHTML.slice(0, 4000));
  await p.waitForTimeout(1200);
  const c = await p.$eval('.hg-fundo-reino-palco', (e) => e.innerHTML.length + ':' + e.innerHTML.slice(0, 4000));
  ok('[movimento reduzido] a cena fica parada', a === c);
  await ctx.close();
}

(async () => {
  // no local todo pedido sai do mesmo IP do Docker: zera o limite de tentativas antes de começar
  psql('delete from privado.tentativas_login');
  const pasta = montarSite();
  const srv = await servir(pasta);
  const b = await chromium.launch();
  try {
    await regrasServidor();
    await fluxo(b, [1440, 900], 'pc');
    psql('delete from privado.tentativas_login');
    await fluxo(b, [390, 844], 'celular');
    await movimentoReduzido(b);
  } finally {
    await b.close();
    srv.kill();
  }
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO PASSOU');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO NO TESTE', e); process.exit(1); });
