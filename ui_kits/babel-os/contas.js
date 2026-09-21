/* Reino · Contas — login de verdade e código de afiliado personalizado.
   Usa a API de autenticação do Supabase (e-mail + senha) com a mesma chave
   publicável do app. Só entra quem tem conta no banco: sem Supabase
   configurado ou com o banco fora do ar, ninguém entra (não existe mais modo
   demonstração no login).

   Tabelas usadas (SQL em afiliados.sql): perfis, codigos. */
(function () {
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const base = () => CFG().url.replace(/\/$/, "");
  const SES = "reino.sessao";
  const cab = (extra) => { const c = CFG(); return { apikey: c.anon, "Content-Type": "application/json", ...(extra || {}) }; };

  const lerSessao = () => { try { return JSON.parse(localStorage.getItem(SES) || "null"); } catch (e) { return null; } };
  const gravarSessao = (s) => { try { s ? localStorage.setItem(SES, JSON.stringify(s)) : localStorage.removeItem(SES); } catch (e) {} };
  /* sessão válida = veio do banco (tem id e token). Sessões antigas do modo
     demonstração ({demo:true}, id "local") ou sem token são descartadas ao abrir. */
  const sessaoReal = (s) => !!(s && typeof s === "object" && !s.demo && s.id !== "local" && s.token);
  let sessao = lerSessao();
  if (sessao && !sessaoReal(sessao)) { sessao = null; gravarSessao(null); }

  const SEM_BANCO = "O login do Reino está indisponível: o banco não está configurado neste site. Avise o administrador.";
  const FORA_DO_AR = "Não foi possível falar com o banco do Reino agora. Confira sua internet e tente de novo em instantes.";
  const erroRede = () => { const e = new Error(FORA_DO_AR); e.rede = true; return e; };
  /* fetch que troca a falha de rede (inglês, "Failed to fetch") por mensagem em português */
  async function chamar(url, opcoes) {
    try { return await fetch(url, opcoes); } catch (e) { throw erroRede(); }
  }

  const erroDe = (j, r) => {
    const m = (j && (j.error_description || j.msg || j.message || j.error)) || "";
    if (/invalid login/i.test(m)) return "E-mail ou senha não conferem.";
    if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar — o link está na sua caixa de entrada.";
    if (/rate limit|too many/i.test(m)) return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
    if (/same.*password|different from the old/i.test(m)) return "A nova senha precisa ser diferente da atual.";
    if (/already registered|already been registered/i.test(m)) return "Esse e-mail já tem conta. Use Entrar.";
    if (/password/i.test(m) && /6/.test(m)) return "A senha precisa de pelo menos 6 caracteres.";
    if (/email/i.test(m) && /invalid/i.test(m)) return "E-mail inválido.";
    if (r && r.status >= 500) return FORA_DO_AR;
    return m || "Não foi possível continuar (" + (r && r.status) + ").";
  };

  async function auth(rota, corpo) {
    if (!CFG()) throw new Error(SEM_BANCO);
    const r = await chamar(base() + "/auth/v1/" + rota, { method: "POST", headers: cab(), body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(erroDe(j, r)); if (r.status >= 500) e.rede = true; throw e; }
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
    } catch (e) { if (e.rede) throw e; return null; }
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
    if (!CFG()) throw new Error(SEM_BANCO);
    const j = await auth("token?grant_type=password", { email, password: senha });
    if (!j.access_token || !j.user || !j.user.id) throw new Error("O banco não confirmou o login. Tente de novo.");
    sessao = { id: j.user && j.user.id, email, token: j.access_token, refresh: j.refresh_token, nome: (j.user && j.user.user_metadata && j.user.user_metadata.nome) || email.split("@")[0], situacao: "aguardando" }; /* a situação real vem do perfil no banco, logo abaixo */
    gravarSessao(sessao);
    let conta = null;
    try { conta = await carregarConta(); } catch (e) { sessao = null; gravarSessao(null); throw e; }
    if (!conta) { sessao = null; gravarSessao(null); throw new Error("Não foi possível abrir sua conta agora. Tente entrar de novo."); }
    return conta;
  }
  async function cadastrar({ nome, email, senha, titulo, cidade, uf, indicadoPor, situacao }) {
    const sit = situacao || "aguardando";
    if (!CFG()) throw new Error(SEM_BANCO);
    const j = await auth("signup", { email, password: senha, data: { nome, titulo: titulo || null, cidade: cidade || null, uf: uf || null, indicado_por: indicadoPor || null } });
    const confirmar = !j.access_token;
    sessao = { id: (j.user && j.user.id) || (j.id), email, nome, token: j.access_token || null, refresh: j.refresh_token || null, titulo, cidade, uf, situacao: "aguardando", confirmar };
    gravarSessao(sessao);
    await salvarPerfil({});
    return { sessao, confirmar };
  }
  async function sair() {
    const tk = sessao && sessao.token;
    sessao = null; gravarSessao(null);
    try { localStorage.removeItem("reino.situacao"); } catch (e) {}
    if (CFG() && tk) { try { await fetch(base() + "/auth/v1/logout", { method: "POST", headers: cab({ Authorization: "Bearer " + tk }) }); } catch (e) {} }
  }

  /* dados reais da conta: usuário do Auth + perfil do banco (a situação vem do banco) */
  async function carregarConta() {
    const tk = await token();
    if (!tk) return null;
    const r = await chamar(base() + "/auth/v1/user", { headers: cab({ Authorization: "Bearer " + tk }) });
    if (r.status >= 500) throw erroRede();
    if (!r.ok) return null;
    const u = await r.json();
    sessao = { ...sessao, id: u.id, email: u.email, nome: sessao.nome || (u.user_metadata && u.user_metadata.nome) || u.email.split("@")[0] };
    try { const p = await rest("perfis", "GET", null, "id=eq." + u.id + "&select=*"); if (p && p[0]) sessao = { ...sessao, ...p[0] }; } catch (e) {}
    gravarSessao(sessao);
    try { localStorage.setItem("reino.situacao", sessao.situacao || "aguardando"); } catch (e) {}
    return sessao;
  }

  /* ao abrir o app: trata o link do e-mail (confirmação ou troca de senha) e
     retoma a sessão salva. Devolve { sessao, recuperacao } — sessao null = pedir login. */
  async function iniciar() {
    if (!CFG()) { sessao = null; gravarSessao(null); return { sessao: null, recuperacao: false, aviso: SEM_BANCO }; }
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    let recuperacao = false;
    if (h.get("access_token")) {
      sessao = { token: h.get("access_token"), refresh: h.get("refresh_token") || null };
      recuperacao = h.get("type") === "recovery";
      history.replaceState(null, "", location.pathname + location.search); // tira o token da barra de endereço
    } else if (h.get("error_description")) {
      history.replaceState(null, "", location.pathname + location.search);
      return { sessao: null, recuperacao: false, erro: h.get("error_description").replace(/\+/g, " ") };
    }
    if (!sessao || !sessao.token || sessao.demo || sessao.id === "local") { sessao = null; gravarSessao(null); return { sessao: null, recuperacao: false }; }
    let conta = null;
    try { conta = await carregarConta(); }
    catch (e) {
      /* banco fora do ar: ninguém entra, mas a sessão salva fica para quando ele voltar */
      const salva = sessao; sessao = null;
      if (!recuperacao && salva && salva.id) gravarSessao(salva);
      return { sessao: null, recuperacao: false, aviso: e.message || FORA_DO_AR };
    }
    if (!conta) { sessao = null; gravarSessao(null); }
    return { sessao: conta, recuperacao: recuperacao && !!conta };
  }

  async function recuperarSenha(email) {
    if (!CFG()) throw new Error(SEM_BANCO);
    const r = await chamar(base() + "/auth/v1/recover?redirect_to=" + encodeURIComponent(location.origin + "/"), { method: "POST", headers: cab(), body: JSON.stringify({ email }) });
    if (!r.ok) throw new Error(erroDe(await r.json().catch(() => ({})), r));
    return true;
  }
  window.ReinoContas = {
    sessao: () => sessao, entrar, cadastrar, sair, salvarPerfil, iniciar, carregarConta, recuperarSenha,
    codigoLivre, reservarCodigo, limpar,
    online: () => !!CFG(), token,
    trocarSenha: async (nova) => { if (!CFG() || !sessao || !sessao.token) throw new Error("Entre novamente para trocar a senha."); const r = await fetch(base() + "/auth/v1/user", { method: "PUT", headers: cab({ Authorization: "Bearer " + sessao.token }), body: JSON.stringify({ password: nova }) }); if (!r.ok) throw new Error(erroDe(await r.json().catch(() => ({})), r)); return true; },
  };
})();
