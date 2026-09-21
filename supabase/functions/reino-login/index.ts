// Reino · login do login imersivo (W), baseado na login-commandbar do Babel OS.
//   POST { usuario, senha }                       → entra (usuario pode ser o usuário ou o e-mail)
//   POST { usuario, senha, acao: "reenviar", redirecionar? } → reenvia o e-mail de confirmação
// Segurança:
//   - latência mínima + jitter em TODA resposta (não dá para medir se o usuário existe);
//   - erro genérico { ok:false, codigo:"nao_confere" } para usuário inexistente OU senha errada;
//   - "email_nao_confirmado" só sai quando a senha está CERTA (o Auth confere a senha antes);
//   - usuário → e-mail resolvido com a service role (RPC reino_email_do_usuario), nunca no navegador;
//   - limite de tentativas por IP e por IP+usuário (RPC reino_limite_login).
// Sucesso devolve a sessão no formato que app/servicos/contas.js grava:
//   { ok:true, access_token, refresh_token, user:{ id, email } }
import { createClient } from "npm:@supabase/supabase-js@2";
import { CORS, EMAIL_RE, ipDe, limparUsuario, mascararEmail, resposta, urlVolta, USUARIO_RE } from "../_shared/reino-validar.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LATENCIA_MINIMA_MS = 600;
const JITTER_MAX_MS = 50;
const sem = { auth: { persistSession: false, autoRefreshToken: false } };

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function esperarMinimo(t0: number) {
  const alvo = LATENCIA_MINIMA_MS + Math.floor(Math.random() * JITTER_MAX_MS);
  const passou = Date.now() - t0;
  if (passou < alvo) await dormir(alvo - passou);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta({ ok: false, codigo: "metodo" }, 405);
  const t0 = Date.now();
  const responder = async (corpo: Record<string, unknown>, status = 200) => { await esperarMinimo(t0); return resposta(corpo, status); };
  const naoConfere = () => responder({ ok: false, codigo: "nao_confere", mensagem: "Usuário ou senha não conferem." });

  try {
    const corpo = await req.json().catch(() => ({}));
    const bruto = limparUsuario(corpo?.usuario);
    const senha = String(corpo?.senha ?? "");
    const acao = corpo?.acao === "reenviar" ? "reenviar" : "entrar";
    const ehEmail = bruto.includes("@");
    if (!bruto || bruto.length > 254 || (ehEmail ? !EMAIL_RE.test(bruto) : !USUARIO_RE.test(bruto))) return naoConfere();
    if (senha.length < 6 || senha.length > 72) return naoConfere(); // contas antigas podem ter 6–7 caracteres

    const admin = createClient(SUPABASE_URL, SERVICE, sem);
    const ip = ipDe(req);
    const [porIp, porConta] = await Promise.all([
      admin.rpc("reino_limite_login", { p_chave: `ip:${ip}`, p_max: 60, p_janela_seg: 300 }),
      admin.rpc("reino_limite_login", { p_chave: `conta:${ip}:${bruto}`, p_max: 10, p_janela_seg: 300 }),
    ]);
    if (porIp.data === false || porConta.data === false) {
      return responder({ ok: false, codigo: "muitas_tentativas", mensagem: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." }, 429);
    }

    let email = ehEmail ? bruto : null;
    if (!ehEmail) {
      const { data } = await admin.rpc("reino_email_do_usuario", { p_usuario: bruto });
      email = typeof data === "string" && data ? data : null;
    }
    // usuário inexistente também passa pelo Auth (com um e-mail que não existe) para o tempo ser igual
    const emailAuth = email || `naoexiste-${bruto.replace(/[^a-z0-9._]/g, "")}@reino.invalido`;

    // cliente com a chave pública; o IP de quem chamou vai junto para o Auth limitar por pessoa
    const publico = createClient(SUPABASE_URL, ANON, { ...sem, global: { headers: { "X-Forwarded-For": ip, "sb-forwarded-for": ip } } });
    const { data: ses, error } = await publico.auth.signInWithPassword({ email: emailAuth, password: senha });

    if (error) {
      const m = `${error.code || ""} ${error.message || ""}`;
      if (email && /email_not_confirmed|not confirmed/i.test(m)) {
        // a senha conferiu (o Auth só diz "não confirmado" depois de conferir a senha)
        if (acao === "reenviar") {
          const { error: eR } = await publico.auth.resend({ type: "signup", email, options: { emailRedirectTo: urlVolta(corpo?.redirecionar) } });
          if (eR) console.error("resend", eR.message);
          return responder({ ok: false, codigo: "email_nao_confirmado", email_mascarado: mascararEmail(email), reenviado: !eR,
            mensagem: eR ? "Não foi possível reenviar agora. Aguarde um minuto e tente de novo." : undefined });
        }
        return responder({ ok: false, codigo: "email_nao_confirmado", email_mascarado: mascararEmail(email) });
      }
      if (/rate|too many/i.test(m)) return responder({ ok: false, codigo: "muitas_tentativas", mensagem: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." }, 429);
      return naoConfere();
    }
    if (!ses?.session || !ses.user) return naoConfere();
    // pediu reenvio mas o e-mail já foi validado: entra direto (ja_confirmado avisa o app)
    return responder({
      ja_confirmado: acao === "reenviar" || undefined,
      ok: true,
      access_token: ses.session.access_token,
      refresh_token: ses.session.refresh_token,
      user: { id: ses.user.id, email: ses.user.email },
    });
  } catch (e) {
    console.error("reino-login erro inesperado:", e);
    return responder({ ok: false, codigo: "servidor", mensagem: "Não foi possível entrar agora. Tente de novo em instantes." });
  }
});
