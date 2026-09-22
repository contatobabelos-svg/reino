// Reino · cadastro do login imersivo (W, simplificado em AJ1 — 22/09). Recebe multipart/form-data:
//   nome, whatsapp, usuario, senha, foto (arquivo webp/jpeg),
//   indicado_por?, titulo?, visita_id?, dispositivo?, captcha_token?
// Empresa, CNPJ, cidade/UF e e-mail ficam para Minha conta (AJ2).
// Também atende, em JSON, a checagem do carrossel (C12 do Parecer 1):
//   POST { acao: "usuario_disponivel", usuario } → { ok: true, disponivel: boolean }
// Valida tudo de novo aqui (o navegador não é confiável). Sem e-mail, a conta nasce no Auth pela
// API de admin com um e-mail INTERNO já confirmado (m-<uuid>@contas.reino.invalid, domínio que
// nunca recebe mensagem) e entra na hora: o login é sempre por usuário. A foto vai para o
// Storage em avatares/<user_id>.webp e o link em perfis.foto. Nada de base64 em coluna.
// Respostas:
//   { ok: true, confirmar: false, access_token, refresh_token, user }       → conta criada e aberta
//   { ok: false, codigo, campo?, mensagem }                                 → erro para mostrar na etapa
// Chamada com a chave publicável (verify_jwt = false no gateway): é cadastro, não há login ainda.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  CORS, ipDe, limparUsuario, nomeValido, normalizarWhatsapp, resposta, senhaValida, usuarioValido,
} from "../_shared/reino-validar.ts";
import { conferirCaptcha, MENSAGEM_CAPTCHA } from "../_shared/reino-captcha.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// C5 do Parecer 1: o Auth só aceita o cabeçalho Sb-Forwarded-For (o IP real de quem está cadastrando)
// quando a chamada usa uma chave SECRETA nova (sb_secret_...). Com a chave publicável, ou com a
// service_role legada, o limite por IP do Auth conta o IP de SAÍDA DESTA FUNÇÃO — ou seja, vira um
// limite do projeto inteiro. Sem o segredo configurado, cai na service_role legada (comportamento de
// antes, só que sem o X-Forwarded-For forjável).
const SECRETA = Deno.env.get("REINO_SECRET_KEY") || SERVICE;
// endereço que o navegador enxerga (no local o SUPABASE_URL de dentro do contêiner é http://kong:8000)
const URL_PUBLICA = (Deno.env.get("REINO_URL_PUBLICA") || SUPABASE_URL).replace(/\/$/, "");
const FOTO_MAX = 2 * 1024 * 1024;
const TITULOS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];
// C6: quando a visita chega sem ?ref=, a indicação é do afiliado da casa — nenhum cadastro fica órfão
// (é o mesmo padrão que o navegador usava em app/servicos/afiliados.js, PADRAO()).
const AFILIADO_PADRAO = (Deno.env.get("REINO_AFILIADO_PADRAO") || "marcelo").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sem = { auth: { persistSession: false, autoRefreshToken: false } };
// erro de validação sai com 200 + ok:false (é resposta esperada; o navegador não loga como falha)
const erro = (codigo: string, mensagem: string, campo?: string, status = 200) =>
  resposta({ ok: false, codigo, campo, mensagem }, status);

// confere a assinatura do arquivo, não só o tipo declarado
function tipoDaFoto(b: Uint8Array): "image/webp" | "image/jpeg" | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
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

  // ---------------------------------------------------------------- checagem do usuário (JSON)
  // C12 do Parecer 1: a RPC usuario_disponivel deixou de ser pública (com a chave publicável dava
  // para varrer a lista de usuários do Reino). A pergunta passa por aqui, com limite por IP: 60
  // checagens em 5 minutos — folgado para quem digita com debounce, curto para quem enumera.
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
  const usuario = limparUsuario(form.get("usuario"));
  const senha = String(form.get("senha") ?? "");
  const indicadoPor = txt("indicado_por").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;
  const foto = form.get("foto");
  const titulo = TITULOS.includes(txt("titulo")) ? txt("titulo") : null; // título escolhido antes (opcional)
  // C6: o clique que trouxe esta pessoa e o aparelho dela — só para a linha de `cadastros`
  const visitaId = UUID_RE.test(txt("visita_id")) ? txt("visita_id") : null;
  const dispositivo = txt("dispositivo") === "celular" ? "celular" : "computador";

  // C2 do Parecer 1: limite por IP ANTES de qualquer trabalho (banco, Storage, Auth).
  // 10 cadastros por IP em 5 minutos: nenhuma pessoa real faz isso; um script faz em segundos.
  // Sem e-mail para validar, o limite por WhatsApp (5 em 5 minutos) segura quem tenta o mesmo número.
  if (!(await cabe(`cad:ip:${ip}`, 10))) {
    return erro("muitas_tentativas", "Muitos cadastros seguidos deste acesso. Aguarde alguns minutos e tente de novo.", undefined, 429);
  }
  if (whatsapp && !(await cabe(`cad:wpp:${whatsapp}`, 5))) {
    return erro("muitas_tentativas", "Já tentamos esse WhatsApp várias vezes agora há pouco. Aguarde alguns minutos.", "whatsapp", 429);
  }
  // CAPTCHA: enquanto o segredo TURNSTILE_SECRET não existir, passa sem token (fase tolerante).
  {
    const v = await conferirCaptcha(form.get("captcha_token"), ip);
    if (!v.ok) {
      console.error("captcha recusado no cadastro:", v.codigos.join(","));
      return erro("captcha", MENSAGEM_CAPTCHA, undefined, 403);
    }
  }

  if (!nomeValido(nome)) return erro("campo_invalido", "Digite seu nome completo (nome e sobrenome).", "nome");
  if (!whatsapp) return erro("campo_invalido", "Digite o WhatsApp com DDD, assim: (11) 91234-5678.", "whatsapp");
  if (!(foto instanceof File) || foto.size === 0) return erro("campo_invalido", "Envie uma foto de perfil.", "foto");
  if (foto.size > FOTO_MAX) return erro("campo_invalido", "A foto passou de 2 MB. Escolha outra.", "foto");
  if (!usuarioValido(usuario)) return erro("campo_invalido", "Usuário: 3 a 24 letras minúsculas, números, ponto ou sublinhado.", "usuario");
  if (!senhaValida(senha)) return erro("campo_invalido", "A senha precisa de pelo menos 8 caracteres.", "senha");

  const bytes = new Uint8Array(await foto.arrayBuffer());
  const tipo = tipoDaFoto(bytes);
  if (!tipo) return erro("campo_invalido", "A foto precisa ser WebP ou JPEG.", "foto");

  // um WhatsApp, uma conta (o índice perfis_whatsapp_unico cobre a corrida entre dois envios)
  const { data: wppJa, error: eWpp } = await admin.rpc("reino_whatsapp_existe", { p_whatsapp: whatsapp });
  if (eWpp) { console.error("reino_whatsapp_existe", eWpp); return erro("servidor", "Não foi possível conferir o WhatsApp agora. Tente de novo.", undefined, 500); }
  if (wppJa === true) return erro("whatsapp_em_uso", "Esse WhatsApp já tem conta no Reino. Use \"Já tenho conta\".", "whatsapp");
  const { data: livre, error: eLivre } = await admin.rpc("usuario_disponivel", { p_usuario: usuario });
  if (eLivre) { console.error("usuario_disponivel", eLivre); return erro("servidor", "Não foi possível conferir o usuário agora. Tente de novo.", undefined, 500); }
  if (livre !== true) return erro("usuario_indisponivel", "Esse usuário já existe. Escolha outro.", "usuario");

  // conta no Auth com e-mail interno já confirmado: nada é enviado, e o login é pelo usuário
  const emailInterno = `m-${crypto.randomUUID()}@contas.reino.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email: emailInterno, password: senha, email_confirm: true,
    user_metadata: { nome, whatsapp, usuario, titulo, indicado_por: indicadoPor },
  });
  if (error) {
    const m = `${error.code || ""} ${error.message || ""}`;
    if (/database error/i.test(m)) {
      // o banco recusou o perfil: ou o usuário ou o WhatsApp acabou de ser ocupado por outro envio
      const { data: wppAgora } = await admin.rpc("reino_whatsapp_existe", { p_whatsapp: whatsapp });
      if (wppAgora === true) return erro("whatsapp_em_uso", "Esse WhatsApp acabou de ser cadastrado. Se a conta é sua, use \"Já tenho conta\".", "whatsapp");
      return erro("usuario_indisponivel", "Esse usuário acabou de ser escolhido por outra pessoa. Escolha outro.", "usuario");
    }
    if (/weak|password/i.test(m)) return erro("campo_invalido", "Essa senha é fraca demais. Escolha outra.", "senha");
    console.error("createUser", error);
    return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
  }
  const user = data.user;
  // o gatilho ao_criar_usuario não grava o WhatsApp se ele colidir no índice: confere e desfaz
  const { data: perfil } = await admin.from("perfis").select("usuario, whatsapp").eq("id", user.id).maybeSingle();
  if (!perfil || perfil.usuario !== usuario || perfil.whatsapp !== whatsapp) {
    console.error("perfil incompleto após createUser", user.id, perfil);
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
    return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
  }

  // foto → Storage; se falhar, desfaz a conta para a pessoa poder tentar de novo com o mesmo usuário
  const arquivo = `${user.id}.${tipo === "image/webp" ? "webp" : "jpg"}`;
  const { error: eUp } = await admin.storage.from("avatares").upload(arquivo, bytes, { contentType: tipo, upsert: true, cacheControl: "3600" });
  if (eUp) {
    console.error("upload avatar", eUp);
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
    return erro("servidor", "Não foi possível salvar sua foto agora. Tente de novo.", "foto", 500);
  }
  const link = `${URL_PUBLICA}/storage/v1/object/public/avatares/${arquivo}?v=${Date.now()}`;
  {
    const { error: ePerfil } = await admin.from("perfis").update({ foto: link }).eq("id", user.id);
    if (ePerfil) console.error("perfis.foto", ePerfil);
  }

  // C6 (Parecer 1): a linha de indicação nasce AQUI, com a chave de serviço, amarrada ao user.id
  // recém-criado. A chave primária é o próprio user.id: uma conta, um registro. Falhar aqui NÃO
  // derruba o cadastro: a conta já existe.
  {
    const { error: eCad } = await admin.from("cadastros").insert({
      id: user.id,
      codigo: indicadoPor || AFILIADO_PADRAO,
      visita_id: visitaId,
      nome, email: null, titulo, cidade: null, uf: null, dispositivo,
      criado_em: new Date().toISOString(),
    });
    if (eCad) console.error("cadastros.insert", eCad);
  }

  // abre a sessão com a chave SECRETA e o IP real (C5): o Auth conta o limite por pessoa, não pela função
  const servidor = createClient(SUPABASE_URL, SECRETA, { ...sem, global: { headers: { "Sb-Forwarded-For": ip } } });
  const { data: ses, error: eSes } = await servidor.auth.signInWithPassword({ email: emailInterno, password: senha });
  if (eSes || !ses?.session) {
    // a conta existe; a pessoa entra pelo "Já tenho conta" com usuário e senha
    console.error("signIn após cadastro", eSes);
    return resposta({ ok: true, confirmar: false, entrar_manual: true, foto: link });
  }
  return resposta({ ok: true, confirmar: false, access_token: ses.session.access_token, refresh_token: ses.session.refresh_token, user: { id: user.id, email: null }, foto: link });
});
