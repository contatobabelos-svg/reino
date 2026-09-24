// Reino · cadastro do login imersivo (AN, 23/09). Recebe multipart/form-data:
//   nome, whatsapp, empresa, nicho, cidade, usuario, senha, indicado_por?, cadeia?, titulo?, visita_id?, dispositivo?
// Usuário e senha são OBRIGATÓRIOS (pedido do fundador em AN+): a pessoa escolhe os dois no
// cadastro e depois reentra por eles no "Já tenho conta". Empresa, nicho e cidade vão direto
// para o perfil; sem foto e sem CAPTCHA (decisão do fundador em AN).
//
// Reentrada: se o WhatsApp já tem conta, o sistema reconhece o número e abre a sessão da conta
// existente (situação que vem do banco — aguardando = demonstração, membro/admin = completo).
// Auditoria 24/09 (CRÍTICA): reentrar NUNCA mais sobrescreve a senha de uma conta que já tem a
// dela. Conta madura (perfis.senha_definida = true) só abre a sessão quem digita a senha ATUAL
// (signInWithPassword — a senha digitada nunca é gravada) e só preenche nome/empresa/nicho/cidade/
// usuário que faltam (fill-only, subindo o que a pessoa redigiu). Conta legada (senha_definida =
// false — nasceu com senha aleatória no período AJ/AN, sem usuário) tem UMA janela: a senha e o
// usuário digitados passam a ser os dela e ela fica madura. Usuário alheio é barrado; o atual pode
// ser trocado por outro livre. Limite de reentradas por conta (10 em 5 min).
//
// Conta nova nasce com a SENHA DIGITADA (não aleatória) e o usuário nos metadados — o
// gatilho privado.criar_perfil copia o usuário para perfis.usuario, e o "Já tenho conta"
// resolve o usuário para o e-mail interno e entra pela senha.
//
// Também atende, em JSON (compat — contas antigas reservadas):
//   POST { acao: "usuario_disponivel", usuario } → { ok: true, disponivel: boolean }
//
// Respostas:
//   { ok: true, access_token, refresh_token, user, reentrou: boolean }  → conta aberta
//   { ok: false, codigo, campo?, mensagem }                             → erro para mostrar na etapa
// Chamada com a chave publicável (verify_jwt = false no gateway): é cadastro, não há login ainda.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  CORS, cidadeValida, empresaValida, ipDe, limparUsuario, nomeValido, normalizarWhatsapp, resposta, senhaValida, usuarioValido,
} from "../_shared/reino-validar.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// C5 do Parecer 1: o Auth só aceita o cabeçalho Sb-Forwarded-For (o IP real de quem está
// cadastrando) quando a chamada usa uma chave SECRETA nova (sb_secret_...). Sem o segredo
// configurado, cai na service_role legada (comportamento de antes, sem o IP forjável).
const SECRETA = Deno.env.get("REINO_SECRET_KEY") || SERVICE;
const TITULOS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];
// C6: quando a visita chega sem ?ref=, a indicação é do afiliado da casa — nenhum cadastro fica órfão
const AFILIADO_PADRAO = (Deno.env.get("REINO_AFILIADO_PADRAO") || "marcelo").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sem = { auth: { persistSession: false, autoRefreshToken: false } };
// erro de validação sai com 200 + ok:false (é resposta esperada; o navegador não loga como falha)
const erro = (codigo: string, mensagem: string, campo?: string, status = 200) =>
  resposta({ ok: false, codigo, campo, mensagem }, status);

const PADRAO = () => AFILIADO_PADRAO;

// abre a sessão de uma conta existente SEM tocar nela: gera um magic link
// (sem enviar e-mail) e o troca aqui por uma sessão. Assim o ADM, que entra por
// usuário+senha no "Já tenho conta", continua com a senha dele intacta.
async function abrirSessao(userId: string, ip: string): Promise<{ access_token: string; refresh_token: string; id: string } | null> {
  const admin = createClient(SUPABASE_URL, SERVICE, sem);
  const { data: u, error: eU } = await admin.auth.admin.getUserById(userId);
  if (eU || !u?.user?.email) { console.error("getUserById na reentrada", eU, userId); return null; }
  const { data: link, error: eL } = await admin.auth.admin.generateLink({
    type: "magiclink", email: u.user.email, options: { shouldSendMail: false },
  });
  if (eL || !link?.properties?.hashed_token) { console.error("generateLink na reentrada", eL); return null; }
  const servidor = createClient(SUPABASE_URL, SECRETA, { ...sem });
  // troca o token do magic link por uma sessão. `verifyTokenHash` (supabase-js ≥ 2.49) nem sempre
  // existe no runtime; o endpoint /verify do GoTrue é o mesmo que ele chama e funciona em qualquer versão.
  const r = await fetch(SUPABASE_URL + "/auth/v1/verify", {
    method: "POST",
    headers: { apikey: SECRETA, Authorization: "Bearer " + SECRETA, "Content-Type": "application/json", "Sb-Forwarded-For": ip },
    body: JSON.stringify({ type: "magiclink", token_hash: link.properties.hashed_token }),
  });
  const j = await r.json().catch(() => ({}));
  const ses = j?.session ?? j; // o supabase-js embrulha em { session }, o endpoint cru devolve a sessão no topo
  if (!r.ok || !ses?.access_token) { console.error("verify no servidor (reentrada)", r.status, j); return null; }
  return { access_token: ses.access_token, refresh_token: ses.refresh_token, id: userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return erro("metodo", "Use POST.", undefined, 405);

  const ip = ipDe(req);
  const admin = createClient(SUPABASE_URL, SERVICE, sem);
  // true = pode seguir; false = estourou o limite da janela
  const cabe = async (chave: string, max: number, janela = 300) => {
    const { data, error } = await admin.rpc("reino_limite_login", { p_chave: chave, p_max: max, p_janela_seg: janela });
    if (error) { console.error("reino_limite_login", error); return true; } // limite quebrado não pode barrar cadastro
    return data !== false;
  };

  // ---------------------------------------------------------------- checagem do usuário (JSON) — compat
  // C12 do Parecer 1: a RPC usuario_disponivel deixou de ser pública; a pergunta passa por aqui.
  if ((req.headers.get("content-type") || "").includes("application/json")) {
    const corpo = await req.json().catch(() => ({}));
    if (corpo?.acao !== "usuario_disponivel") return erro("acao", "Ação desconhecida.");
    if (!(await cabe(`chk:${ip}`, 60))) {
      return resposta({ ok: false, codigo: "muitas_tentativas", mensagem: "Muitas checagens seguidas. Aguarde um minuto." }, 429);
    }
    const u = limparUsuario(corpo?.usuario);
    if (!usuarioValido(u)) return resposta({ ok: true, disponivel: false });
    const { data, error } = await admin.rpc("usuario_disponivel", { p_usuario: u });
    if (error) { console.error("usuario_disponivel", error); return erro("servidor", "Não foi possível conferir agora.", undefined, 500); }
    return resposta({ ok: true, disponivel: data === true });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return erro("corpo", "Envio inválido. Recarregue a página e tente de novo."); }
  const txt = (k: string) => String(form.get(k) ?? "").trim();

  const nome = txt("nome").replace(/\s+/g, " ");
  const whatsapp = normalizarWhatsapp(form.get("whatsapp"));
  const empresa = txt("empresa").replace(/\s+/g, " ");
  const nicho = txt("nicho").replace(/\s+/g, " ");
  const cidade = txt("cidade").replace(/\s+/g, " ");
  const usuario = limparUsuario(form.get("usuario"));
  const senha = String(form.get("senha") ?? "");
  const indicadoPor = txt("indicado_por").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;
  const cadeia = txt("cadeia").toLowerCase().replace(/[^a-z0-9_\/]/g, "").slice(0, 60) || null;
  const titulo = TITULOS.includes(txt("titulo")) ? txt("titulo") : null; // título escolhido antes (opcional)
  // C6: o clique que trouxe esta pessoa e o aparelho dela — só para a linha de `cadastros`
  const visitaId = UUID_RE.test(txt("visita_id")) ? txt("visita_id") : null;
  const dispositivo = txt("dispositivo") === "celular" ? "celular" : "computador";

  // Determinar o pai e a cadeia completa
  let pai = null;
  let cadeiaCompleta = cadeia;
  if (cadeia && cadeia.includes("/")) {
    const partes = cadeia.split("/");
    pai = partes.slice(0, -1).join("/");
    cadeiaCompleta = cadeia;
  } else if (indicadoPor && indicadoPor !== AFILIADO_PADRAO) {
    pai = PADRAO();
    cadeiaCompleta = pai + "/" + indicadoPor;
  } else {
    cadeiaCompleta = indicadoPor || AFILIADO_PADRAO;
  }

  // C2 do Parecer 1: limite por IP ANTES de qualquer trabalho. Sem CAPTCHA (decisão AN), os
  // limites por IP (10 em 5 min) e por WhatsApp (5 em 5 min) seguram scripts sem atrapalhar ninguém real.
  if (!(await cabe(`cad:ip:${ip}`, 10))) {
    return erro("muitas_tentativas", "Muitos cadastros seguidos deste acesso. Aguarde alguns minutos e tente de novo.", undefined, 429);
  }
  if (whatsapp && !(await cabe(`cad:wpp:${whatsapp}`, 5))) {
    return erro("muitas_tentativas", "Já tentamos esse WhatsApp várias vezes agora há pouco. Aguarde alguns minutos.", "whatsapp", 429);
  }

  if (!nomeValido(nome)) return erro("campo_invalido", "Digite seu nome completo (nome e sobrenome).", "nome");
  if (!whatsapp) return erro("campo_invalido", "Digite o WhatsApp com DDD, assim: (11) 91234-5678.", "whatsapp");
  if (!empresaValida(empresa)) return erro("campo_invalido", "Digite o nome da sua empresa ou negócio.", "empresa");
  if (nicho.length < 2 || nicho.length > 60) return erro("campo_invalido", "Digite o seu nicho (2 a 60 caracteres).", "nicho");
  if (!cidadeValida(cidade)) return erro("campo_invalido", "Digite a sua cidade.", "cidade");
  if (!usuarioValido(usuario)) return erro("campo_invalido", "Escolha um usuário: só letras minúsculas, números, ponto e sublinhado (3 a 24).", "usuario");
  if (!senhaValida(senha)) return erro("campo_invalido", "A senha precisa de pelo menos 8 caracteres.", "senha");
  // o usuário tem de estar livre (a conta própria, na reentrada, não conta como uso)
  const { data: usuarioLivre, error: eUsu } = await admin.rpc("usuario_disponivel", { p_usuario: usuario });
  if (eUsu) { console.error("usuario_disponivel", eUsu); return erro("servidor", "Não foi possível conferir o usuário agora. Tente de novo.", undefined, 500); }
  const usuarioEmUso = usuarioLivre !== true;

  // um WhatsApp, uma conta (o índice perfis_whatsapp_unico cobre a corrida entre dois envios)
  const { data: wppJa, error: eWpp } = await admin.rpc("reino_whatsapp_existe", { p_whatsapp: whatsapp });
  if (eWpp) { console.error("reino_whatsapp_existe", eWpp); return erro("servidor", "Não foi possível conferir o WhatsApp agora. Tente de novo.", undefined, 500); }

  // o GoTrue da produção recusa senhas conhecidas/localmente fracas (comum e "pwned"); o app
  // precisa mostrar isso na etapa da senha, não um 500 genérico
  const senhaFraca = (e: unknown): boolean => {
    const s = `${(e as { code?: unknown })?.code ?? ""} ${(e as { message?: unknown })?.message ?? ""} ${(e as { error_code?: unknown })?.error_code ?? ""}`.toLowerCase();
    return /weak_password|password is known to be weak|too easy to guess|null_password|pwned/i.test(s) || /weak/i.test(s);
  };
  // preenche só o que faltou no perfil (fill-only): nunca pisa em nome/empresa/nicho/cidade/título
  // que o dono já tem ou já editou em Minha conta; o usuário digitado troca o atual só se estiver
  // livre (já conferido antes)
  const preencherPerfil = async (ja: { id: string } & Record<string, unknown>): Promise<void> => {
    const preenchido = (v: unknown) => typeof v === "string" && v.trim() !== "";
    const patch: Record<string, unknown> = {};
    if (!preenchido(ja.nome) && nome) patch.nome = nome;
    if (!preenchido(ja.empresa) && empresa) patch.empresa = empresa;
    if (!preenchido(ja.nicho) && nicho) patch.nicho = nicho;
    if (!preenchido(ja.cidade) && cidade) patch.cidade = cidade;
    if (titulo && !preenchido(ja.titulo)) patch.titulo = titulo;
    if (usuario !== (ja.usuario ?? null)) patch.usuario = usuario;
    if (!Object.keys(patch).length) return;
    const { error: ePerfil } = await admin.from("perfis").update(patch).eq("id", ja.id);
    if (ePerfil) console.error("perfis.update na reentrada", ePerfil);
  };

  // ------------------------------------------------------------ reentrada pelo WhatsApp (conta já existe)
  if (wppJa === true) {
    // senha_definida vem da migração 2026-09-24_reentrada_exige_senha.sql — aplique-a antes desta função
    const { data: ja, error: ePer } = await admin.from("perfis")
      .select("id, usuario, senha_definida, titulo, nome, empresa, nicho, cidade")
      .eq("whatsapp", whatsapp).maybeSingle();
    if (ePer) { console.error("perfis.select na reentrada", ePer); return erro("servidor", "Não foi possível reconhecer seu WhatsApp agora. Tente de novo.", undefined, 500); }
    if (!ja) { console.error("whatsapp sem perfil?", whatsapp); return erro("servidor", "Não foi possível reconhecer seu WhatsApp agora. Tente de novo.", undefined, 500); }
    const id = ja.id as string;
    // o usuário digitado pertence a outra conta: pede outro (o dela continua valendo)
    if (usuarioEmUso && usuario !== (ja.usuario ?? null)) {
      return erro("usuario_em_uso", "Esse usuário já pertence a outra conta. Escolha outro.", "usuario");
    }
    // auditoria 24/09: senha errada repetida (ou tentativa de reentrar) não pode martelar — 10 em 5 min por conta
    if (!(await cabe(`reentry:${id}`, 10))) {
      return erro("muitas_tentativas", "Muitas reentradas seguidas nesta conta. Aguarde alguns minutos e tente de novo.", undefined, 429);
    }

    let ses: { access_token: string; refresh_token: string; id: string } | null = null;
    const legada = ja.senha_definida === false;

    if (legada) {
      // ÚNICA janela: conta nasceu com senha aleatória (período AJ/AN). A senha e o usuário
      // digitados passam a ser os dela — depois disso ela é madura e exige a senha atual.
      await preencherPerfil(ja);
      const { error: eSenha } = await admin.auth.admin.updateUserById(id, { password: senha });
      if (eSenha) {
        if (senhaFraca(eSenha)) return erro("senha_fraca", "Escolha uma senha mais forte para a sua conta. Misture letras, números e símbolos.", "senha");
        console.error("updateUserById (senha) na reentrada legada", eSenha, id);
        return erro("servidor", "Não foi possível salvar a sua senha agora. Tente de novo.", undefined, 500);
      }
      ses = await abrirSessao(id, ip);
      if (!ses) return erro("servidor", "Não foi possível abrir a sua conta agora. Tente de novo.", undefined, 500);
      const { error: eMarca } = await admin.from("perfis").update({ senha_definida: true }).eq("id", id);
      if (eMarca) console.error("senha_definida=true na reentrada legada", eMarca, id);
    } else {
      // CONTA MADURA: só abre a sessão quem digita a senha ATUAL (o Auth confere); a senha
      // digitada nunca é gravada aqui. Usuário/telefone não fazem parte desta prova.
      const { data: au } = await admin.auth.admin.getUserById(id);
      const emailAuth = au?.user?.email;
      if (!emailAuth) { console.error("sem e-mail na reentrada madura", id); return erro("servidor", "Não foi possível abrir a sua conta agora. Tente de novo.", undefined, 500); }
      // cliente com a chave SECRETA e só o Sb-Forwarded-For (C5): o Auth conta o limite por pessoa
      const servidor = createClient(SUPABASE_URL, SECRETA, { ...sem, global: { headers: { "Sb-Forwarded-For": ip } } });
      const { data: resultado, error: eEntra } = await servidor.auth.signInWithPassword({ email: emailAuth, password: senha });
      if (eEntra || !resultado?.session) {
        console.warn("senha não conferiu na reentrada madura", id, eEntra?.message ?? "sem sessão");
        return erro("senha_nao_confere", "Essa conta já tem senha. Digite a senha atual para continuar.", "senha");
      }
      await preencherPerfil(ja);
      ses = { access_token: resultado.session.access_token, refresh_token: resultado.session.refresh_token, id };
    }

    // a linha de afiliação nasce no cadastro; na reentrada só se faltou (conta pré-hierarquia)
    const { data: linha } = await admin.from("cadastros").select("id").eq("id", id).maybeSingle();
    if (!linha) {
      await admin.from("cadastros").insert({
        id, codigo: indicadoPor || AFILIADO_PADRAO, cadeia: cadeiaCompleta, pai,
        visita_id: visitaId, nome, email: null, titulo, cidade, uf: null, dispositivo,
        criado_em: new Date().toISOString(),
      }).then(() => {}).catch((e) => console.error("cadastros.insert na reentrada", e));
    }
    return resposta({ ok: true, reentrou: true, access_token: ses.access_token, refresh_token: ses.refresh_token, user: { id: ses.id, email: null } });
  }

  // ---------------------------------------------------------------- conta nova (situacao "aguardando")
  if (usuarioEmUso) return erro("usuario_em_uso", "Esse usuário já está em uso. Escolha outro.", "usuario");
  const emailInterno = `m-${crypto.randomUUID()}@contas.reino.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email: emailInterno, password: senha, email_confirm: true,
    user_metadata: { nome, whatsapp, empresa, nicho, cidade, usuario, titulo, indicado_por: indicadoPor },
  });
  if (error) {
    const m = `${error.code || ""} ${error.message || ""}`;
    if (senhaFraca(error)) return erro("senha_fraca", "Escolha uma senha mais forte. Misture letras, números e símbolos.", "senha");
    if (/database error/i.test(m)) {
      // o banco recusou o perfil: o WhatsApp ou o usuário acabaram de ser ocupados por outro envio
      const { data: wppAgora } = await admin.rpc("reino_whatsapp_existe", { p_whatsapp: whatsapp });
      if (wppAgora === true) return erro("whatsapp_em_uso", "Esse WhatsApp acabou de ser cadastrado. Se a conta é sua, digite os dados de novo que a gente reconhece.", "whatsapp");
      const { data: usuAgora } = await admin.rpc("usuario_disponivel", { p_usuario: usuario });
      if (usuAgora !== true) return erro("usuario_em_uso", "Esse usuário já está em uso. Escolha outro.", "usuario");
      return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
    }
    console.error("createUser", error);
    return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
  }
  const user = data.user;
  // o gatilho ao_criar_usuario grava o perfil; confere WhatsApp e usuário e desfaz se algum índice barrou
  const { data: perfil } = await admin.from("perfis").select("whatsapp, usuario").eq("id", user.id).maybeSingle();
  if (!perfil || perfil.whatsapp !== whatsapp || (perfil.usuario ?? null) !== usuario) {
    console.error("perfil incompleto após createUser", user.id, perfil);
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
    if (perfil && perfil.whatsapp === whatsapp) return erro("usuario_em_uso", "Esse usuário já está em uso. Escolha outro.", "usuario");
    return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
  }

  // C6 (Parecer 1): a linha de indicação nasce AQUI, com a chave de serviço, amarrada ao user.id
  // recém-criado. A chave primária é o próprio user.id: uma conta, um registro. Falhar aqui NÃO
  // derruba o cadastro: a conta já existe.
  {
    const { error: eCad } = await admin.from("cadastros").insert({
      id: user.id,
      codigo: indicadoPor || AFILIADO_PADRAO,
      cadeia: cadeiaCompleta,
      pai,
      visita_id: visitaId,
      nome, email: null, titulo, cidade, uf: null, dispositivo,
      criado_em: new Date().toISOString(),
    });
    if (eCad) console.error("cadastros.insert", eCad);
  }

  // Registrar o código do afiliado na tabela codigos (se ainda não existir)
  if (indicadoPor && indicadoPor !== AFILIADO_PADRAO) {
    try {
      const { data: codigoExistente } = await admin.from("codigos").select("codigo").eq("codigo", indicadoPor).maybeSingle();
      if (!codigoExistente) {
        await admin.from("codigos").insert({ codigo: indicadoPor, user_id: user.id, nome, pai, cadeia: cadeiaCompleta });
      }
    } catch (e) { console.warn("[reino-cadastro] codigos.insert", (e as Error)?.message); }
  }

  // abre a sessão com a chave SECRETA e o IP real (C5): o Auth conta o limite por pessoa, não pela função
  const servidor = createClient(SUPABASE_URL, SECRETA, { ...sem, global: { headers: { "Sb-Forwarded-For": ip } } });
  const { data: ses, error: eSes } = await servidor.auth.signInWithPassword({ email: emailInterno, password: senha });
  if (eSes || !ses?.session) {
    // a conta existe com a senha digitada; se o signIn falhou, a próxima reentrada (magic link) resolve
    console.error("signIn após cadastro", eSes);
    return erro("servidor", "Não foi possível abrir a sua conta agora. Digite os dados de novo.", undefined, 500);
  }
  return resposta({
    ok: true, reentrou: false,
    access_token: ses.session.access_token,
    refresh_token: ses.session.refresh_token,
    user: { id: user.id, email: null },
  });
});