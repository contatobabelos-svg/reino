/* Reino · Fotos — foto de perfil de pessoas e empresas.
   Guarda a imagem já reduzida (256px, JPEG) por chave: nome da pessoa ou id da
   empresa. Fica no navegador (localStorage) e, quando a tabela "fotos" existe no
   Supabase, também no banco — assim a foto aparece em qualquer aparelho.

   Regra de acesso desde 2026-09-21 (C3 do Parecer 1, migração
   supabase/2026-09-21_fotos_so_logado_com_limite.sql): GRAVAR exige conta — a linha é do
   dono (dono = auth.uid()) e a url tem teto de 20 kB. Visitante sem login continua LENDO,
   mas o que ele escolher fica só no localStorage deste aparelho (o POST volta 401/403 e o
   definir() cai no catch de sempre). Antes disso qualquer pessoa da internet gravava linhas
   sem limite de tamanho com a chave publicável, o que enchia o disco do projeto. */
(function () {
  const LS = "reino.fotos";
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const chave = (v) => String(v || "").trim().toLowerCase();
  let mapa = {};
  try { mapa = JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { mapa = {}; }
  const ouvintes = new Set();
  const avisar = (k) => ouvintes.forEach((fn) => { try { fn(k); } catch (e) {} });

  const salvarLocal = () => { try { localStorage.setItem(LS, JSON.stringify(mapa)); } catch (e) { console.warn("[fotos] armazenamento cheio; a foto vale só nesta aba"); } };

  /* reduz para caber no banco e carregar rápido (avatar: quadrado, 256px) */
  function reduzir(file, lado = 256) {
    return new Promise((ok, falha) => {
      const fr = new FileReader();
      fr.onerror = () => falha(new Error("leitura"));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => falha(new Error("imagem"));
        img.onload = () => {
          const m = Math.min(img.width, img.height);
          const c = document.createElement("canvas"); c.width = c.height = lado;
          const g = c.getContext("2d");
          g.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado);
          ok(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* compressor geral — qualquer foto do app (stories, capas, anexos) passa por
     aqui antes de subir: redimensiona ao maior lado (sem cortar) e tenta WebP,
     que pesa uma fração do arquivo original; cai para JPEG se o navegador não
     souber gravar WebP. Uma foto de 3-4 MB do celular sai com 80-200 KB. */
  function comprimir(file, { lado = 1280, qualidade = 0.82 } = {}) {
    return new Promise((ok, falha) => {
      if (!file || !file.type || !file.type.startsWith("image")) return falha(new Error("não é imagem"));
      const fr = new FileReader();
      fr.onerror = () => falha(new Error("leitura"));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => falha(new Error("imagem"));
        img.onload = () => {
          const escala = Math.min(1, lado / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * escala)), h = Math.max(1, Math.round(img.height * escala));
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          const testeWebp = c.toDataURL("image/webp", qualidade);
          const suporta = testeWebp.startsWith("data:image/webp");
          const url = suporta ? testeWebp : c.toDataURL("image/jpeg", qualidade);
          ok({ url, largura: w, altura: h, bytes: Math.round(url.length * 0.75), formato: suporta ? "webp" : "jpeg", original: file.size });
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  async function sb(metodo, corpo, query) {
    const c = CFG(); if (!c) return null;
    /* logado, a foto fica em nome da conta (só ela ou um admin troca depois) */
    const tk = (window.ReinoContas && window.ReinoContas.token && (await window.ReinoContas.token())) || c.anon;
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/fotos" + (query ? "?" + query : ""), {
      method: metodo, headers: { apikey: c.anon, Authorization: "Bearer " + tk, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (!r.ok) throw new Error("fotos " + r.status);
    return metodo === "GET" ? r.json() : null;
  }

  const obter = (k) => mapa[chave(k)] || null;
  async function definir(k, url) {
    const c = chave(k); if (!c || !url) return null;
    mapa[c] = url; salvarLocal(); avisar(c);
    try { await sb("POST", [{ chave: c, url }]); } catch (e) { /* sem tabela: fica local */ }
    return url;
  }
  async function definirArquivo(k, file) {
    if (!file || !file.type.startsWith("image")) return null;
    return definir(k, await reduzir(file));
  }
  function remover(k) { const c = chave(k); delete mapa[c]; salvarLocal(); avisar(c); }

  /* busca no banco as fotos que este aparelho ainda não tem */
  async function sincronizar(chaves) {
    if (!CFG() || !chaves || !chaves.length) return;
    const faltam = [...new Set(chaves.map(chave))].filter((c) => c && !mapa[c]).slice(0, 60);
    if (!faltam.length) return;
    try {
      const lista = await sb("GET", null, "chave=in.(" + faltam.map((c) => '"' + c.replace(/"/g, "") + '"').join(",") + ")&select=chave,url");
      (lista || []).forEach((r) => { mapa[r.chave] = r.url; });
      if (lista && lista.length) { salvarLocal(); avisar(null); }
    } catch (e) { /* silencioso */ }
  }

  /* abre a galeria/câmera e guarda a escolha */
  function escolher(k, { camera } = {}) {
    return new Promise((ok) => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; if (camera) inp.capture = "user"; inp.hidden = true;
      inp.onchange = async () => { const url = await definirArquivo(k, inp.files[0]); inp.remove(); ok(url); };
      document.body.appendChild(inp); inp.click();
    });
  }

  window.ReinoFotos = { obter, definir, definirArquivo, remover, escolher, reduzir, comprimir, sincronizar,
    ouvir: (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); } };
})();
