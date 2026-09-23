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

  /* CAPTCHA removido por decisão do fundador (AN, 23/09): o cadastro e o login voltam a ser
     diretos; os limites por IP e por WhatsApp (na reino-cadastro) seguram scripts. */

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
    const pai = (window.ReinoAfiliados && window.ReinoAfiliados.paiDaUrl) ? window.ReinoAfiliados.paiDaUrl() : null;
    const cadeia = (window.ReinoAfiliados && window.ReinoAfiliados.cadeiaDaUrl) ? window.ReinoAfiliados.cadeiaDaUrl() : codigo;
    localStorage.setItem("reino.meuCodigo", v.codigo);
    if (cadeia) localStorage.setItem("reino.cadeia", cadeia);
    if (sessao && sessao.id) localStorage.setItem("reino.meuCodigo.dono", String(sessao.id));
    if (CFG() && sessao) { try { await rest("codigos", "POST", [{ codigo: v.codigo, user_id: sessao.id, nome: sessao.nome || null, pai, cadeia }]); } catch (e) {} }
    return { ok: true, codigo: v.codigo };
  }

  /* ---------- perfil ---------- */
  /* grava só os campos que vieram (PATCH): o perfil já existe desde o cadastro. O banco ignora o
     que o dono não pode trocar (usuário, e-mail, situação; CNPJ só de vazio para válido) e devolve
     a linha como ficou — é ela que vale na sessão. Erro do banco sobe para a tela mostrar. */
  const CAMPOS_PERFIL = ["nome", "titulo", "cidade", "uf", "foto", "empresa", "cnpj", "whatsapp", "nicho"];
  async function salvarPerfil(p) {
    const muda = {};
    CAMPOS_PERFIL.forEach((k) => { if (p && k in p) muda[k] = p[k] === "" ? null : p[k]; });
    let atual = { ...(sessao || {}), ...muda };
    if (CFG() && atual.id && Object.keys(muda).length) {
      const r = await rest("perfis", "PATCH", muda, "id=eq." + atual.id);
      if (r && r[0]) atual = { ...atual, ...r[0] };
    }
    sessao = atual; gravarSessao(atual);
    return atual;
  }

  /* ---------- entrar / cadastrar / sair ---------- */
  async function entrar(email, senha) {
    if (!CFG()) throw new Error(SEM_BANCO);
    /* porta direta do Auth: quem valida o CAPTCHA aqui é o próprio Auth */
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
  /* ---------- login imersivo (W): funções reino-cadastro / reino-login ----------
     Mesma sessão de sempre (id, email, token, refresh); só muda quem fala com o Auth: o
     servidor valida o cadastro, resolve usuário → e-mail e devolve access/refresh. */
  async function funcao(nome, corpo) {
    if (!CFG()) throw new Error(SEM_BANCO);
    const multipart = typeof FormData !== "undefined" && corpo instanceof FormData;
    const headers = { apikey: CFG().anon, Authorization: "Bearer " + CFG().anon };
    if (!multipart) headers["Content-Type"] = "application/json";
    const r = await chamar(base() + "/functions/v1/" + nome, { method: "POST", headers, body: multipart ? corpo : JSON.stringify(corpo) });
    const j = await r.json().catch(() => null);
    if (!j) throw erroRede();
    if (r.status >= 500 && !j.mensagem) throw erroRede();
    return j;
  }
  /* guarda a sessão devolvida pela função e carrega a conta (perfil do banco) */
  async function abrirSessao(j) {
    if (!j.access_token || !j.user || !j.user.id) throw new Error("O banco não confirmou o login. Tente de novo.");
    sessao = { id: j.user.id, email: j.user.email, token: j.access_token, refresh: j.refresh_token, nome: (j.user.email || "").split("@")[0], situacao: "aguardando" };
    gravarSessao(sessao);
    let conta = null;
    try { conta = await carregarConta(); } catch (e) { sessao = null; gravarSessao(null); throw e; }
    if (!conta) { sessao = null; gravarSessao(null); throw new Error("Não foi possível abrir sua conta agora. Tente entrar de novo."); }
    return conta;
  }
  const erroFuncao = (j, padrao) => { const e = new Error((j && j.mensagem) || padrao); e.codigo = j && j.codigo; e.campo = j && j.campo; return e; };

  /* usuário (ou e-mail, para contas antigas) + senha.
     → { conta } entrou · { confirmar: true, emailMascarado } falta validar o e-mail · erro genérico se não confere */
  async function entrarUsuario(usuario, senha) {
    /* AN: sem CAPTCHA — a função reino-login fala com o Auth pela chave secreta; os limites
       por IP e por IP+usuário seguram tentativas repetidas */
    const j = await funcao("reino-login", { usuario: String(usuario || "").trim(), senha });
    if (j.ok) return { conta: await abrirSessao(j) };
    if (j.codigo === "email_nao_confirmado") return { confirmar: true, emailMascarado: j.email_mascarado };
    throw erroFuncao(j, "Usuário ou senha não conferem.");
  }
  /* reenvia o link de confirmação (confere a senha no servidor; se já validou, entra) */
  async function reenviarConfirmacao(usuario, senha) {
    const j = await funcao("reino-login", { usuario: String(usuario || "").trim(), senha, acao: "reenviar", redirecionar: location.origin + "/" });
    if (j.ok) return { conta: await abrirSessao(j) };
    if (j.codigo === "email_nao_confirmado") {
      if (j.reenviado === false) throw erroFuncao(j, "Não foi possível reenviar agora. Aguarde um minuto e tente de novo.");
      return { reenviado: true, emailMascarado: j.email_mascarado };
    }
    throw erroFuncao(j, "Usuário ou senha não conferem.");
  }
  /* cadastro simples (AN): { nome, whatsapp, empresa, nicho, cidade, indicadoPor?, titulo? }
     → { conta } — a reino-cadastro cria (aguardando) ou reentra (reconhece o WhatsApp) e abre a sessão */
  async function cadastrarCompleto(d) {
    const f = new FormData();
    ["nome", "whatsapp", "empresa", "nicho", "cidade"].forEach((k) => f.append(k, d[k] == null ? "" : String(d[k])));
    if (d.indicadoPor) f.append("indicado_por", d.indicadoPor);
    if (d.cadeia) f.append("cadeia", d.cadeia);
    if (d.titulo) f.append("titulo", d.titulo);
    /* C6: o contexto da visita vai junto — é o servidor que grava a linha de `cadastros` agora */
    try {
      const A = window.ReinoAfiliados;
      const c = A && A.contexto ? A.contexto() : null;
      if (c) { if (c.visitaId) f.append("visita_id", c.visitaId); f.append("dispositivo", c.dispositivo); }
    } catch (e) { /* sem afiliados.js: o servidor usa o afiliado padrão */ }
    f.append("redirecionar", location.origin + "/");
    const j = await funcao("reino-cadastro", f);
    if (!j.ok) throw erroFuncao(j, "Não foi possível criar a conta agora. Tente de novo.");
    if (j.access_token) return { conta: await abrirSessao(j), reentrou: j.reentrou === true };
    return { entrarManual: true };
  }
  /* true = livre. Só responde sim/não. null = não deu para conferir.
     C12 do Parecer 1: a RPC `usuario_disponivel` deixou de ser pública (dava para varrer a lista de
     usuários do Reino com a chave publicável, uma chamada por nome). Agora a pergunta passa pela
     `reino-cadastro`, que limita por IP (60 checagens em 5 minutos — folgado para quem digita, curto
     para quem enumera). Sem CAPTCHA de propósito: é uma consulta por tecla, com debounce. */
  async function usuarioDisponivel(usuario) {
    if (!CFG()) return null;
    try {
      const j = await funcao("reino-cadastro", { acao: "usuario_disponivel", usuario });
      if (!j || typeof j.disponivel !== "boolean") return null;
      return j.disponivel;
    } catch (e) { return null; }
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
    /* porta direta do Auth */
    const corpo = { email };
    const r = await chamar(base() + "/auth/v1/recover?redirect_to=" + encodeURIComponent(location.origin + "/"), { method: "POST", headers: cab(), body: JSON.stringify(corpo) });
    if (!r.ok) throw new Error(erroDe(await r.json().catch(() => ({})), r));
    return true;
  }
  /* pré-aquecimento (entrar.html → index.html num iframe): a sessão nasce na página de
     login, que roda sua própria cópia deste arquivo (outra `sessao` na memória). Em vez de
     torcer para o iframe reler o localStorage sozinho, entrar.html manda a sessão pronta por
     postMessage e o iframe assume ela aqui, do jeito que o resto do arquivo já espera. */
  function assumir(s) { sessao = s || null; gravarSessao(sessao); }
  window.ReinoContas = {
    sessao: () => sessao, entrar, cadastrar, sair, salvarPerfil, iniciar, carregarConta, recuperarSenha,
    entrarUsuario, reenviarConfirmacao, cadastrarCompleto, usuarioDisponivel,
    codigoLivre, reservarCodigo, limpar, assumir,
    online: () => !!CFG(), token,
    trocarSenha: async (nova) => { if (!CFG() || !sessao || !sessao.token) throw new Error("Entre novamente para trocar a senha."); const r = await fetch(base() + "/auth/v1/user", { method: "PUT", headers: cab({ Authorization: "Bearer " + sessao.token }), body: JSON.stringify({ password: nova }) }); if (!r.ok) throw new Error(erroDe(await r.json().catch(() => ({})), r)); return true; },
  };
})();
