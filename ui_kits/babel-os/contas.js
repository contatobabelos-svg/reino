/* Reino · Contas — login de verdade e código de afiliado personalizado.
   Usa a API de autenticação do Supabase (e-mail + senha) com a mesma chave
   publicável do app. Sem Supabase configurado, cai no modo demonstração:
   qualquer login entra e os dados ficam no navegador.

   Tabelas usadas (SQL em afiliados.sql): perfis, codigos. */
(function () {
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const base = () => CFG().url.replace(/\/$/, "");
  const SES = "reino.sessao";
  const cab = (extra) => { const c = CFG(); return { apikey: c.anon, "Content-Type": "application/json", ...(extra || {}) }; };

  const lerSessao = () => { try { return JSON.parse(localStorage.getItem(SES) || "null"); } catch (e) { return null; } };
  const gravarSessao = (s) => { try { s ? localStorage.setItem(SES, JSON.stringify(s)) : localStorage.removeItem(SES); } catch (e) {} };
  let sessao = lerSessao();

  const erroDe = (j, r) => {
    const m = (j && (j.error_description || j.msg || j.message || j.error)) || "";
    if (/invalid login/i.test(m)) return "E-mail ou senha não conferem.";
    if (/already registered|already been registered/i.test(m)) return "Esse e-mail já tem conta. Use Entrar.";
    if (/password/i.test(m) && /6/.test(m)) return "A senha precisa de pelo menos 6 caracteres.";
    if (/email/i.test(m) && /invalid/i.test(m)) return "E-mail inválido.";
    return m || "Não foi possível continuar (" + (r && r.status) + ").";
  };

  async function auth(rota, corpo) {
    const r = await fetch(base() + "/auth/v1/" + rota, { method: "POST", headers: cab(), body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(erroDe(j, r));
    return j;
  }

  /* ---------- token do login ----------
     O Supabase emite o token por 1h. Antes de cada uso, se estiver perto de
     vencer, renova com o refresh_token; sem isso o painel e o perfil param de
     gravar uma hora depois do login. */
  const venceEm = (t) => { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000; } catch (e) { return 0; } };
  async function token() {
    if (!CFG() || !sessao || !sessao.token) return null;
    if (venceEm(sessao.token) - Date.now() > 60000) return sessao.token;
    if (!sessao.refresh) return null;
    try {
      const j = await auth("token?grant_type=refresh_token", { refresh_token: sessao.refresh });
      sessao = { ...sessao, token: j.access_token, refresh: j.refresh_token };
      gravarSessao(sessao);
      return sessao.token;
    } catch (e) { return null; }
  }

  /* ---------- tabelas ---------- */
  async function rest(tabela, metodo, corpo, query, headers) {
    const r = await fetch(base() + "/rest/v1/" + tabela + (query ? "?" + query : ""), {
      method: metodo,
      headers: cab({ Authorization: "Bearer " + ((await token()) || CFG().anon), Prefer: metodo === "POST" ? "return=representation,resolution=merge-duplicates" : "return=representation", ...(headers || {}) }),
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(txt.slice(0, 160));
    return txt ? JSON.parse(txt) : null;
  }

  /* ---------- código de afiliado ---------- */
  const limpar = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  async function codigoLivre(codigo) {
    const c = limpar(codigo);
    if (c.length < 3) return { ok: false, motivo: "Use pelo menos 3 letras." };
    if (!CFG()) return { ok: true, codigo: c, local: true };
    try {
      const r = await rest("codigos", "GET", null, "codigo=eq." + encodeURIComponent(c) + "&select=codigo,user_id");
      const dono = r && r[0];
      if (!dono) return { ok: true, codigo: c };
      if (sessao && dono.user_id === sessao.id) return { ok: true, codigo: c, meu: true };
      return { ok: false, motivo: "Esse código já é de outro afiliado." };
    } catch (e) { return { ok: true, codigo: c, semTabela: true }; }
  }
  async function reservarCodigo(codigo) {
    const v = await codigoLivre(codigo);
    if (!v.ok) return v;
    localStorage.setItem("reino.meuCodigo", v.codigo);
    if (CFG() && sessao) { try { await rest("codigos", "POST", [{ codigo: v.codigo, user_id: sessao.id, nome: sessao.nome || null }]); } catch (e) {} }
    return { ok: true, codigo: v.codigo };
  }

  /* ---------- perfil ---------- */
  async function salvarPerfil(p) {
    const atual = { ...(sessao || {}), ...p };
    sessao = atual; gravarSessao(atual);
    if (CFG() && atual.id) { try { await rest("perfis", "POST", [{ id: atual.id, nome: atual.nome || null, email: atual.email || null, titulo: atual.titulo || null, cidade: atual.cidade || null, uf: atual.uf || null, foto: atual.foto || null }]); } catch (e) {} }
    return atual;
  }

  /* ---------- entrar / cadastrar / sair ---------- */
  async function entrar(email, senha) {
    if (!CFG()) { sessao = { id: "local", email, nome: email.split("@")[0], situacao: "membro", demo: true }; gravarSessao(sessao); return sessao; }
    const j = await auth("token?grant_type=password", { email, password: senha });
    sessao = { id: j.user && j.user.id, email, token: j.access_token, refresh: j.refresh_token, nome: (j.user && j.user.user_metadata && j.user.user_metadata.nome) || email.split("@")[0], situacao: "aguardando" }; /* a situação real vem do perfil no banco, logo abaixo */
    gravarSessao(sessao);
    try { const p = await rest("perfis", "GET", null, "id=eq." + sessao.id + "&select=*"); if (p && p[0]) { sessao = { ...sessao, ...p[0] }; gravarSessao(sessao); } } catch (e) {}
    return sessao;
  }
  async function cadastrar({ nome, email, senha, titulo, cidade, uf, indicadoPor, situacao }) {
    const sit = situacao || "aguardando";
    if (!CFG()) { sessao = { id: "local", email, nome, titulo, cidade, uf, situacao: sit, demo: true }; gravarSessao(sessao); return { sessao, confirmar: false }; }
    const j = await auth("signup", { email, password: senha, data: { nome, titulo: titulo || null, cidade: cidade || null, uf: uf || null, indicado_por: indicadoPor || null } });
    const confirmar = !j.access_token;
    sessao = { id: (j.user && j.user.id) || (j.id), email, nome, token: j.access_token || null, refresh: j.refresh_token || null, titulo, cidade, uf, situacao: "aguardando", confirmar };
    gravarSessao(sessao);
    await salvarPerfil({});
    return { sessao, confirmar };
  }
  function sair() { sessao = null; gravarSessao(null); }
  /* entrada de demonstração: sem checar o banco, para o app poder ser mostrado a qualquer hora */
  function entrarLocal(usuario) {
    const email = /@/.test(usuario) ? usuario : usuario + "@demo.reino";
    sessao = { id: "local", email, nome: String(usuario || "Visitante").split("@")[0], situacao: "membro", demo: true };
    gravarSessao(sessao);
    return sessao;
  }

  window.ReinoContas = {
    sessao: () => sessao, entrar, entrarLocal, cadastrar, sair, salvarPerfil,
    codigoLivre, reservarCodigo, limpar,
    online: () => !!CFG(), token,
    trocarSenha: async (nova) => { if (!CFG() || !sessao || !sessao.token) throw new Error("Entre novamente para trocar a senha."); const r = await fetch(base() + "/auth/v1/user", { method: "PUT", headers: cab({ Authorization: "Bearer " + sessao.token }), body: JSON.stringify({ password: nova }) }); if (!r.ok) throw new Error(erroDe(await r.json().catch(() => ({})), r)); return true; },
  };
})();
