#!/usr/bin/env node
/* Varredura geral dos botões do Reino: abre cada tela do menu, clica em tudo que é
   clicável e diz o que respondeu, o que não fez nada e o que deu erro.

   Como entra no app: o roteamento é estado do React (App.jsx:85 `ir()`), sem URL, então a
   navegação é feita clicando no próprio menu. E como só entra conta real do banco, o teste
   injeta uma SESSÃO DE MENTIRA no navegador (window.ReinoContas.iniciar devolve uma conta
   fixa) — nada é gravado no Supabase; as telas que leem o banco vão mostrar vazio ou aviso,
   o que basta para saber se o botão responde.

   O que NÃO é clicado (lista `PERIGOSOS`): botões que gravam no banco, apagam, saem da conta
   ou gastam API paga. Ficam relatados como "não clicado".

   Uso: node scripts/testar-botoes.cjs [--url http://localhost:8151/] [--tela perfil.html]
*/
const fs = require("fs");
const { chromium } = require(process.env.PW_PATH || "/home/marcos/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const arg = (n, p) => { const i = process.argv.indexOf("--" + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : p; };
const URL_APP = arg("url", "http://localhost:8151/");
const SO_TELA = arg("tela", "");
const SAIDA = arg("saida", "/tmp/claude-1000/reino-botoes/relatorio.json");

/* rótulos que não podem ser clicados num teste automático */
const PERIGOSOS = [
  "sair", "salvar", "aprovar", "recusar", "remover", "apagar", "excluir", "importar",
  "criar minha conta", "entrar no reino", "trocar", "confirmar ingresso", "resgatar",
  "enviar link", "salvar nova senha", "publicar",
];
const ehPerigoso = (t) => PERIGOSOS.some((p) => t.toLowerCase().includes(p));

const CONTA = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "teste.qa@exemplo.invalido",
  nome: "Teste QA",
  token: "teste-nao-vale-no-banco",
  situacao: arg("situacao", "membro"), // "admin" revela Academy (importar) e Contas no banco
};

(async () => {
  fs.mkdirSync(require("path").dirname(SAIDA), { recursive: true });
  const nav = await chromium.launch({ channel: "chrome", headless: false, args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });

  // a sessão de mentira entra por um setter: vale qualquer que seja a ordem dos <script>
  await ctx.addInitScript(`(() => {
    const CONTA = ${JSON.stringify(CONTA)};
    let real = undefined;
    Object.defineProperty(window, "ReinoContas", {
      configurable: true,
      get() { return real; },
      set(v) {
        real = v;
        try {
          v.iniciar = async () => ({ sessao: CONTA });
          v.sessao = () => CONTA;
          v.token = async () => null;
        } catch (e) {}
      },
    });
  })();`);

  const pagina = await ctx.newPage();
  const erros = [];
  pagina.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  pagina.on("pageerror", (e) => erros.push("EXCEÇÃO: " + e.message));
  // links externos abrem em aba nova: fecha na hora e registra o destino
  const abasNovas = [];
  ctx.on("page", async (p) => { abasNovas.push(p.url()); try { await p.close(); } catch (e) {} });

  await pagina.goto(URL_APP, { waitUntil: "domcontentloaded", timeout: 90000 });
  await pagina.waitForSelector(".hg-moldura, .hg-li, .hg-app", { timeout: 60000 });
  await pagina.waitForTimeout(3000);

  const entrou = await pagina.evaluate(() => !document.querySelector(".hg-li"));
  if (!entrou) { console.error("não entrou no app (ainda está no login) — a sessão de teste não pegou"); await nav.close(); process.exit(2); }

  /* telas do menu lateral. O logo "Reino" fica de fora de propósito: ele é um
     <a href="index.html"> que RECARREGA a página (8 s de Babel), e o teste media a
     tela seguinte antes de ela montar — foi o que gerou "0 clicáveis" falsos. */
  const telas = await pagina.evaluate(() => {
    const itens = [...document.querySelectorAll("nav a, aside a, [class*=sidebar] a, [class*=menu] a")];
    const vistos = new Set();
    return itens
      .filter((a) => !/^\s*reino\s*$/i.test(a.textContent || ""))
      .map((a) => (a.textContent || "").trim())
      .filter((t) => t && !vistos.has(t) && vistos.add(t));
  });

  const relatorio = { url: URL_APP, quando: new Date().toISOString(), telas: [] };

  const abrirTela = async (nome) => {
    const alvo = pagina.locator(`nav a, aside a, [class*=sidebar] a, [class*=menu] a`).filter({ hasText: new RegExp("^\\s*" + nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$") }).first();
    await alvo.click({ timeout: 5000 }).catch(() => {});
    // espera a tela montar de verdade antes de contar botão nenhum
    await pagina.waitForFunction(() => {
      const m = document.querySelector("main.hg-content");
      return m && (m.innerText || "").trim().length > 20;
    }, null, { timeout: 15000 }).catch(() => {});
    await pagina.waitForTimeout(700);
  };

  const impressao = () => pagina.evaluate(() => {
    const m = document.querySelector("main") || document.body;
    return { texto: (m.innerText || "").slice(0, 4000).length + ":" + (m.innerText || "").slice(0, 300), nos: m.querySelectorAll("*").length };
  });

  for (const tela of telas) {
    if (SO_TELA && tela.toLowerCase() !== SO_TELA.toLowerCase()) continue;
    if (pagina.isClosed()) { console.log("(navegador fechou antes de " + tela + ")"); break; }
    await abrirTela(tela);
    const daTela = { tela, botoes: [], erros: [] };
    const antesErros = erros.length;

    const clicaveis = await pagina.evaluate(() => {
      const sel = 'main button, main a[href], main [role="button"], main input[type="submit"], main select, main summary';
      return [...document.querySelectorAll(sel)].map((el, i) => ({
        i,
        tag: el.tagName.toLowerCase(),
        rotulo: ((el.getAttribute("aria-label") || el.textContent || el.value || "").trim().replace(/\s+/g, " ")).slice(0, 60),
        href: el.getAttribute("href") || null,
        desabilitado: !!el.disabled,
      }));
    });

    for (const c of clicaveis) {
      if (c.desabilitado) { daTela.botoes.push({ ...c, resultado: "desabilitado" }); continue; }
      if (ehPerigoso(c.rotulo)) { daTela.botoes.push({ ...c, resultado: "NÃO CLICADO (grava/gasta)" }); continue; }
      const antes = await impressao();
      const nErros = erros.length;
      const nAbas = abasNovas.length;
      let falha = null;
      try {
        await pagina.evaluate((idx) => {
          const sel = 'main button, main a[href], main [role="button"], main input[type="submit"], main select, main summary';
          const el = document.querySelectorAll(sel)[idx];
          if (!el) return;
          if (el.tagName === "SELECT") {
            // select não reage a click: troca a opção e dispara o change, que é o que o app ouve
            const op = [...el.options].find((o) => o.value !== el.value);
            if (op) { el.value = op.value; el.dispatchEvent(new Event("change", { bubbles: true })); }
            return;
          }
          el.scrollIntoView({ block: "center" });
          el.click();
        }, c.i);
        await pagina.waitForTimeout(650);
      } catch (e) { falha = e.message; }
      const depois = await impressao();
      const novosErros = erros.slice(nErros).filter((x) => !/favicon|ERR_FAILED|401|400|403/.test(x));
      const mudou = antes.texto !== depois.texto || antes.nos !== depois.nos;
      const abriuAba = abasNovas.length > nAbas;
      daTela.botoes.push({
        ...c,
        resultado: falha ? "ERRO ao clicar: " + falha
          : novosErros.length ? "EXCEÇÃO: " + novosErros[0].slice(0, 120)
          : abriuAba ? "abriu aba: " + abasNovas[abasNovas.length - 1]
          : mudou ? "respondeu" : "SEM EFEITO",
      });
      // volta para a tela, caso o clique tenha navegado
      await abrirTela(tela);
    }
    daTela.erros = erros.slice(antesErros).filter((x) => !/favicon/.test(x)).slice(0, 5);
    relatorio.telas.push(daTela);
    fs.writeFileSync(SAIDA, JSON.stringify(relatorio, null, 2)); // grava a cada tela: se o navegador cair, não perde tudo
    const vivos = daTela.botoes.filter((b) => b.resultado === "respondeu" || /abriu aba/.test(b.resultado)).length;
    const mortos = daTela.botoes.filter((b) => b.resultado === "SEM EFEITO").length;
    const ruins = daTela.botoes.filter((b) => /ERRO|EXCEÇÃO/.test(b.resultado)).length;
    console.log(`${tela.padEnd(22)} ${String(daTela.botoes.length).padStart(3)} clicáveis · ${vivos} responderam · ${mortos} sem efeito · ${ruins} com erro`);
  }

  fs.writeFileSync(SAIDA, JSON.stringify(relatorio, null, 2));
  console.log("\nrelatório completo em " + SAIDA);
  await nav.close();
})().catch((e) => { console.error(e); process.exit(1); });
