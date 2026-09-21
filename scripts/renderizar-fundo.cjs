#!/usr/bin/env node
/* Pré-renderiza a cena do fundo do login (app/componentes/FundoReino.jsx) em quadros
   PNG 1920×1080 e codifica o vídeo que o app toca em app/assets/login/.

   Por que existe: a cena é React + SVG (feTurbulence/feDisplacementMap na água e nas
   quedas, ~70 divs animados) e redesenha tudo a cada quadro — no notebook do fundador
   o teto é ~20 quadros/s. Tocada como vídeo, a mesma cena fica em 60 quadros/s e
   quase sem custo de CPU. A cena JS continua no arquivo, como reserva.

   Como funciona: abre scripts/render-fundo/index.html (que não vai para o site) no
   Chrome do sistema, fixa o tempo da cena quadro a quadro com window.__fixarT(t) —
   nada de tempo real, então o resultado é sempre igual — e tira um screenshot por
   quadro. O ciclo da cena é fechado (TOTAL segundos), então o quadro TOTAL é igual
   ao quadro 0: o laço do vídeo não tem salto (o script confere isso).

   Uso:
     node scripts/renderizar-fundo.cjs                  # renderiza e codifica
     node scripts/renderizar-fundo.cjs --fps 30
     node scripts/renderizar-fundo.cjs --so-codificar   # reaproveita os PNGs já tirados
     node scripts/renderizar-fundo.cjs --quadros 20     # amostra rápida, para conferir

   Os PNGs ficam fora do repositório (CLAUDE_JOB_DIR/tmp ou /tmp/claude-1000/reino-fundo).
   Saída final: app/assets/login/reino-fundo.webm, .mp4 e reino-fundo-poster.webp. */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const { chromium } = require(process.env.PW_PATH || "/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const RAIZ = path.resolve(__dirname, "..");
const FFMPEG = "/usr/bin/ffmpeg";
const arg = (nome, padrao) => { const i = process.argv.indexOf("--" + nome); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao; };
const tem = (nome) => process.argv.includes("--" + nome);

const FPS = parseInt(arg("fps", "30"), 10);
const PORTA = parseInt(arg("porta", "8152"), 10);
const LIMITE = parseInt(arg("quadros", "0"), 10); // 0 = ciclo inteiro
// CRF escolhido medindo: 34/25 davam 7,97 MB + 6,20 MB (pesado demais para o repositório);
// 40/28 dão ~4 MB cada com PSNR-Y ~37,7 dB e nenhuma faixa visível no degradê do céu.
const CRF_WEBM = arg("crf-webm", "40");
const CRF_MP4 = arg("crf-mp4", "28");
const SAIDA = path.join(RAIZ, "app/assets/login");
const TMP = arg("tmp", path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, "tmp") : "/tmp/claude-1000", "reino-fundo"));
const QUADROS = path.join(TMP, "quadros");

const rodar = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) { console.error(r.stderr.toString().slice(-3000)); throw new Error(cmd + " falhou (" + r.status + ")"); }
  return r.stdout.toString() + r.stderr.toString();
};
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(2) + " MB";

async function renderizar() {
  fs.rmSync(QUADROS, { recursive: true, force: true });
  fs.mkdirSync(QUADROS, { recursive: true });

  const servidor = spawn("python3", ["-m", "http.server", String(PORTA), "--bind", "127.0.0.1"], { cwd: RAIZ, stdio: "ignore" });
  await new Promise((ok) => setTimeout(ok, 1200));

  const navegador = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-lcd-text", "--font-render-hinting=none"],
  });
  const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });

  await pagina.goto(`http://127.0.0.1:${PORTA}/scripts/render-fundo/index.html`, { waitUntil: "load" });
  await pagina.waitForFunction(() => window.__erroRender || (window.__pronto && window.__pronto()), null, { timeout: 90000 });
  const falha = await pagina.evaluate(() => window.__erroRender || null);
  if (falha) throw new Error("página de renderização: " + falha);
  const TOTAL = await pagina.evaluate(() => window.__TOTAL);
  const n = LIMITE || Math.round(TOTAL * FPS);
  console.log(`ciclo ${TOTAL}s · ${FPS} q/s · ${n} quadros · saída ${QUADROS}`);

  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await pagina.evaluate((t) => window.__fixarT(t), (i / FPS) % TOTAL);
    await pagina.screenshot({ path: path.join(QUADROS, "q" + String(i).padStart(5, "0") + ".png"), animations: "disabled" });
    if (i % 30 === 0) process.stdout.write(`  quadro ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }

  // laço perfeito: o quadro TOTAL tem de ser o quadro 0, e o TOTAL+1/FPS tem de ser o 1
  const extra = {};
  for (const [nome, t] of [["laco-total", TOTAL], ["laco-total-mais-1", TOTAL + 1 / FPS]]) {
    await pagina.evaluate((x) => window.__fixarT(x), t);
    const arq = path.join(TMP, nome + ".png");
    await pagina.screenshot({ path: arq, animations: "disabled" });
    extra[nome] = arq;
  }

  await navegador.close();
  servidor.kill();
  if (erros.length) console.log("avisos do navegador:", erros.slice(0, 5));
  return { TOTAL, n, extra };
}

function conferirLaco(extra) {
  const cmp = (a, b) => {
    const s = rodar(FFMPEG, ["-hide_banner", "-loglevel", "info", "-i", a, "-i", b, "-lavfi", "psnr=stats_file=-", "-f", "null", "-"]);
    const m = s.match(/average:([0-9.]+|inf)/);
    return m ? m[1] : "?";
  };
  const q = (i) => path.join(QUADROS, "q" + String(i).padStart(5, "0") + ".png");
  console.log("laço · PSNR quadro TOTAL vs 0:", cmp(extra["laco-total"], q(0)), "dB");
  console.log("laço · PSNR quadro TOTAL+1 vs 1:", cmp(extra["laco-total-mais-1"], q(1)), "dB");
}

function codificar() {
  const entrada = ["-framerate", String(FPS), "-i", path.join(QUADROS, "q%05d.png")];
  // degradê escuro: um ruído fraquinho evita as faixas (banding) na compressão
  const filtro = "noise=alls=2:allf=t+u,format=yuv420p";
  const webm = path.join(SAIDA, "reino-fundo.webm");
  const mp4 = path.join(SAIDA, "reino-fundo.mp4");
  const poster = path.join(SAIDA, "reino-fundo-poster.webp");

  console.log("codificando WebM (VP9, crf " + CRF_WEBM + ")…");
  rodar(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...entrada, "-vf", filtro,
    "-c:v", "libvpx-vp9", "-crf", CRF_WEBM, "-b:v", "0", "-row-mt", "1", "-threads", "8",
    "-deadline", "good", "-cpu-used", "2", "-g", String(FPS * 2), "-pix_fmt", "yuv420p", "-an", webm]);

  console.log("codificando MP4 (H.264, crf " + CRF_MP4 + ")…");
  rodar(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...entrada, "-vf", filtro,
    "-c:v", "libx264", "-preset", "slow", "-crf", CRF_MP4, "-profile:v", "high", "-level", "4.0",
    "-g", String(FPS * 2), "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);

  console.log("poster (primeiro quadro, webp)…");
  rodar(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-i", path.join(QUADROS, "q00000.png"),
    "-vf", "scale=1280:-2", "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", poster]);

  const tot = [webm, mp4, poster].reduce((a, f) => a + fs.statSync(f).size, 0);
  console.log("WebM:", mb(webm), "· MP4:", mb(mp4), "· poster:", mb(poster),
    "· total:", (tot / 1048576).toFixed(2) + " MB");
}

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  if (!tem("so-codificar")) {
    const r = await renderizar();
    conferirLaco(r.extra);
  }
  if (!tem("so-renderizar")) codificar();
})().catch((e) => { console.error(e); process.exit(1); });
