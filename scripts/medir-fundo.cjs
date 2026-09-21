#!/usr/bin/env node
/* Mede a fluidez do fundo do login (app/componentes/FundoReino.jsx) no Chrome do
   sistema, com GPU de verdade — é o número que vale, não o do headless puro.

   Uso:
     node scripts/medir-fundo.cjs [--url http://localhost:8151/] [--modo auto|video|cena]
                                  [--largura 1440] [--altura 900] [--segundos 6]
                                  [--print caminho.png] [--rotulo "antes"]

   O modo é injetado antes do app carregar (window.FUNDO_REINO_MODO), então não
   existe nenhum gatilho por URL no app publicado.

   Saída: quadros/s do requestAnimationFrame, quadros longos (>50 ms), pior quadro,
   e o tempo que o JS da página gastou (long tasks da PerformanceObserver). */
const path = require("path");
const { chromium } = require(process.env.PW_PATH || "/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const arg = (nome, padrao) => {
  const i = process.argv.indexOf("--" + nome);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

(async () => {
  const url = arg("url", "http://localhost:8151/");
  const modo = arg("modo", "auto");
  const largura = parseInt(arg("largura", "1440"), 10);
  const altura = parseInt(arg("altura", "900"), 10);
  const segundos = parseFloat(arg("segundos", "6"));
  const rotulo = arg("rotulo", modo);
  const print = arg("print", "");
  const celular = arg("celular", "") === "sim";

  const navegador = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--autoplay-policy=no-user-gesture-required", "--window-position=0,0"],
  });
  const ctx = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 1,
    hasTouch: celular,
    isMobile: celular,
  });
  if (modo !== "auto") {
    await ctx.addInitScript(`window.FUNDO_REINO_MODO = ${JSON.stringify(modo)};`);
  }
  const pagina = await ctx.newPage();
  const erros = [];
  pagina.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  pagina.on("pageerror", (e) => erros.push("pageerror: " + e.message));

  // "load" esperaria o vídeo inteiro (preload="auto"); o que interessa é a página de pé
  await pagina.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  // Babel compila o JSX no navegador: leva ~8 s até a cena existir
  await pagina.waitForSelector(".hg-fundo-reino", { timeout: 60000 });
  // deixa a página assentar: Babel termina de compilar e, se for vídeo, ele carrega e já está
  // rodando — o que se mede é a fluidez em regime, não o custo de abrir a página
  await pagina.waitForFunction(() => {
    const v = document.querySelector(".hg-fundo-reino video");
    return !v || (v.readyState >= 3 && v.currentTime > 0.5);
  }, null, { timeout: 60000 });
  await pagina.waitForTimeout(3000);

  const medida = await pagina.evaluate((s) => new Promise((ok) => {
    const t = [];
    let longas = 0, tempoLongas = 0;
    let obs = null;
    try {
      obs = new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) { longas++; tempoLongas += e.duration; }
      });
      obs.observe({ entryTypes: ["longtask"] });
    } catch (e) { /* navegador sem longtask */ }
    const inicio = performance.now();
    let antes = inicio;
    const passo = (agora) => {
      t.push(agora - antes); antes = agora;
      if (agora - inicio < s * 1000) requestAnimationFrame(passo);
      else {
        if (obs) obs.disconnect();
        const d = t.slice(1);
        d.sort((a, b) => a - b);
        const soma = d.reduce((a, b) => a + b, 0);
        ok({
          quadros: d.length,
          duracao: +(soma / 1000).toFixed(2),
          fps: +(d.length / (soma / 1000)).toFixed(1),
          medianaMs: +d[Math.floor(d.length / 2)].toFixed(1),
          p95Ms: +d[Math.floor(d.length * 0.95)].toFixed(1),
          piorMs: +d[d.length - 1].toFixed(1),
          longos50: d.filter((x) => x > 50).length,
          longos33: d.filter((x) => x > 33).length,
          longTasks: longas,
          longTasksMs: +tempoLongas.toFixed(1),
        });
      }
    };
    requestAnimationFrame(passo);
  }), segundos);

  const tipo = await pagina.evaluate(() => {
    const v = document.querySelector(".hg-fundo-reino video");
    return {
      video: !!v,
      tocando: v ? !v.paused : null,
      fonte: v ? (v.currentSrc || "").split("/").pop() : null,
      cenaJS: !!document.querySelector(".hg-fundo-reino svg filter"),
      iframe: !!document.querySelector(".hg-fundo-reino-iframe"),
    };
  });

  if (print) { await pagina.screenshot({ path: path.resolve(print) }); }

  console.log(JSON.stringify({ rotulo, modo, viewport: largura + "x" + altura, ...medida, fundo: tipo, erros }, null, 2));
  await navegador.close();
})().catch((e) => { console.error(e); process.exit(1); });
