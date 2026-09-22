// Reino · validação do CAPTCHA (Cloudflare Turnstile) dentro das Edge Functions — C2 do Parecer 1.
//
// Por que a função valida, e não o Auth:
//   `reino-cadastro` e `reino-login` têm verify_jwt = false, ou seja, SÃO a porta de entrada. Elas
//   falam com o Auth usando a chave SECRETA do projeto e, com chave secreta, o Auth pula a checagem
//   de CAPTCHA (gotrue v2.197.0, internal/api/middleware.go: "skip captcha validation if
//   authorization header contains an admin role" — medido no ensaio local de 2026-09-21). Então, se
//   a função não validar, ninguém valida. E o token do Turnstile é de uso ÚNICO: repassar o mesmo
//   token ao Auth daria "timeout-or-duplicate". Uma porta, uma validação.
//
// Enquanto TURNSTILE_SECRET não existir, `exigirCaptcha()` devolve false e tudo passa sem token —
// é o modo tolerante da fase (a) da implantação (site novo no ar antes de a porta fechar).

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const exigirCaptcha = () => !!Deno.env.get("TURNSTILE_SECRET");

export type Veredito = { ok: true } | { ok: false; motivo: string; codigos: string[] };

/** Valida o token na Cloudflare. `ip` é o IP de quem pediu (a Cloudflare usa para pontuar). */
export async function conferirCaptcha(token: unknown, ip?: string): Promise<Veredito> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return { ok: true };                       // fase tolerante: sem segredo, sem exigência
  const t = String(token ?? "").trim();
  if (!t || t.length > 2048) return { ok: false, motivo: "sem_token", codigos: ["missing-input-response"] };

  const corpo = new URLSearchParams({ secret, response: t });
  if (ip && ip !== "desconhecido") corpo.set("remoteip", ip);

  let r: Response;
  try {
    r = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // Cloudflare fora do ar ou lenta: NÃO trancamos o cadastro do Reino por causa dela.
    console.error("turnstile indisponível", String(e));
    return { ok: true };
  }
  if (!r.ok) { console.error("turnstile HTTP", r.status); return { ok: true }; }

  const j = await r.json().catch(() => ({})) as { success?: boolean; "error-codes"?: string[] };
  if (j.success === true) return { ok: true };
  const codigos = Array.isArray(j["error-codes"]) ? j["error-codes"] : [];
  // internal-error é problema da Cloudflare, não da pessoa: deixa passar (o limite por IP segura)
  if (codigos.includes("internal-error")) return { ok: true };
  return { ok: false, motivo: "token_invalido", codigos };
}

// mensagem única para as duas funções
export const MENSAGEM_CAPTCHA =
  "Não deu para confirmar que você é uma pessoa. Recarregue a página e tente de novo.";
