// Reino · gera a voz pré-gravada do Assistente do Reino para cada aba (AJ3, 22/09).
// Lê app/dados/apresentacoes.js, gera um MP3 por aba em app/assets/voz/ com o edge-tts
// (voz neural pt-BR-AntonioNeural) e escreve app/dados/vozes.js com o caminho + versão de cada
// arquivo. Só refaz o áudio de texto que mudou (compara o hash guardado em vozes.js).
// Uso: node scripts/gerar-vozes.cjs            (só o que mudou)
//      node scripts/gerar-vozes.cjs --tudo     (refaz todos)
//      REINO_VOZ=pt-BR-FranciscaNeural node scripts/gerar-vozes.cjs --tudo   (troca a voz)
// Precisa do edge-tts (pip install edge-tts) e de internet.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const TEXTOS = path.join(RAIZ, 'app/dados/apresentacoes.js');
const SAIDA = path.join(RAIZ, 'app/assets/voz');
const MAPA = path.join(RAIZ, 'app/dados/vozes.js');
const VOZ = process.env.REINO_VOZ || 'pt-BR-AntonioNeural';
const RITMO = process.env.REINO_VOZ_RITMO || '+4%';
const TUDO = process.argv.includes('--tudo');

const ler = (arquivo, chave) => {
  const window = {};
  new Function('window', fs.readFileSync(arquivo, 'utf8'))(window);
  return window[chave] || {};
};
const apresentacoes = ler(TEXTOS, 'REINO_APRESENTACOES');
const antigo = fs.existsSync(MAPA) ? ler(MAPA, 'REINO_VOZES') : {};
fs.mkdirSync(SAIDA, { recursive: true });

const novo = {};
let feitos = 0;
for (const [rota, { texto }] of Object.entries(apresentacoes)) {
  const nome = rota.replace(/\.html$/, '').replace(/[^a-z0-9-]/g, '-');
  const arquivo = path.join(SAIDA, nome + '.mp3');
  const hash = crypto.createHash('sha1').update(VOZ + '|' + RITMO + '|' + texto).digest('hex').slice(0, 10);
  const ja = antigo[rota];
  if (!TUDO && ja && ja.hash === hash && fs.existsSync(arquivo)) { novo[rota] = ja; continue; }
  execFileSync('edge-tts', ['--voice', VOZ, '--rate=' + RITMO, '--text', texto, '--write-media', arquivo], { stdio: 'inherit' });
  novo[rota] = { src: 'assets/voz/' + nome + '.mp3?v=' + hash, hash };
  feitos++;
  console.log('voz', rota, '→', path.relative(RAIZ, arquivo));
}
// áudio de aba que saiu da lista é apagado
for (const f of fs.readdirSync(SAIDA)) {
  if (f.endsWith('.mp3') && !Object.values(novo).some((v) => v.src.startsWith('assets/voz/' + f))) fs.unlinkSync(path.join(SAIDA, f));
}
fs.writeFileSync(MAPA, `/* Gerado por scripts/gerar-vozes.cjs — não edite à mão. Voz: ${VOZ}. */\nwindow.REINO_VOZES = ${JSON.stringify(novo, null, 2)};\n`);
console.log(`${feitos} áudio(s) gerado(s), ${Object.keys(novo).length} no total.`);
