#!/usr/bin/env python3
"""Dominic · guardião de alterações do REINO.

Roda como hook do Claude Code a cada alteração de arquivo:
  antes   (PreToolUse)  → backup do arquivo que vai mudar e limpeza de backups velhos
  depois  (PostToolUse) → checa sintaxe, procura segredo e código mal feito,
                           analisa a mudança e indica a skill certa (catalogo.json)
Uso manual:
  dominic.py restaurar <arquivo> [n]   volta o arquivo para o n-ésimo backup mais recente (1 = último)
  dominic.py backups <arquivo>         lista os backups de um arquivo

Regra de ouro: o Dominic nunca instala skill do mercado sozinho. Ele indica; a
instalação passa pela validação de 4 passos da skill dominic-skill-creator.
"""
import datetime, difflib, fnmatch, json, os, re, shutil, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(os.path.dirname(AQUI))
BACKUPS = os.path.join(AQUI, "backups")
ESTADO = os.path.join(AQUI, "estado")
LOG = os.path.join(RAIZ, "00-comando", "logs", "dominic.tsv")
SKILLS = os.path.join(RAIZ, ".claude", "skills")

MANTER_DIAS = 7          # backups mais velhos que isso são apagados
MANTER_MAX = 400         # e nunca mais que isso de pastas de backup
REPETIR_SKILL_MIN = 20   # não repete a mesma indicação de skill dentro deste intervalo

IGNORAR = (".git/", "site/", "node_modules/", ".vercel/", ".claude/dominic/backups/",
           ".claude/dominic/estado/", "00-comando/logs/")
TEXTO = (".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".json", ".css", ".html", ".md",
         ".sql", ".sh", ".py", ".svg", ".xml", ".txt", ".toml", ".yml", ".yaml", ".env")

SEGREDOS = [
    (r"sb_secret_[A-Za-z0-9_-]{10,}", "chave secreta do Supabase"),
    (r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*", "JWT service_role do Supabase"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----", "chave privada"),
    (r"AKIA[0-9A-Z]{16}", "chave de acesso AWS"),
    (r"gh[pousr]_[A-Za-z0-9]{30,}", "token do GitHub"),
    (r"sk-ant-[A-Za-z0-9_-]{20,}", "chave da Anthropic"),
    (r"sk-(?:proj-)?[A-Za-z0-9]{32,}", "chave de API (formato sk-)"),
    (r"xox[baprs]-[A-Za-z0-9-]{10,}", "token do Slack"),
    (r"FAL_KEY\s*=\s*['\"]?[A-Za-z0-9:_-]{20,}", "chave da fal.ai"),
    (r"[0-9a-f]{8,12}msh[0-9a-f]{12,20}p1[0-9a-f]{4,8}jsn[0-9a-f]{10,14}", "chave da RapidAPI"),
]
FONTES_OK = {"exo 2", "inter", "system-ui", "-apple-system", "segoe ui", "roboto", "sans-serif",
             "serif", "monospace", "ui-monospace", "sfmono-regular", "menlo", "inherit", "initial", "var"}


def agora():
    return datetime.datetime.now()


def rel(caminho):
    try:
        r = os.path.relpath(os.path.abspath(caminho), RAIZ)
    except ValueError:
        return None
    return None if r.startswith("..") else r.replace(os.sep, "/")


def ignorado(r):
    return r is None or any(r == p.rstrip("/") or r.startswith(p) for p in IGNORAR)


def ler(caminho):
    try:
        with open(caminho, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return None


def estado(nome, padrao):
    try:
        with open(os.path.join(ESTADO, nome), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return padrao


def salvar_estado(nome, valor):
    os.makedirs(ESTADO, exist_ok=True)
    with open(os.path.join(ESTADO, nome), "w", encoding="utf-8") as f:
        json.dump(valor, f, ensure_ascii=False)


def registrar(ferramenta, arquivo, area, resultado, detalhe):
    try:
        os.makedirs(os.path.dirname(LOG), exist_ok=True)
        novo = not os.path.exists(LOG)
        with open(LOG, "a", encoding="utf-8") as f:
            if novo:
                f.write("data\tferramenta\tarquivo\tarea\tresultado\tdetalhe\n")
            f.write("\t".join([agora().isoformat(timespec="seconds"), ferramenta, arquivo, area, resultado,
                               detalhe.replace("\t", " ").replace("\n", " | ")[:300]]) + "\n")
    except OSError:
        pass


# ---------------------------------------------------------------- backup
def fazer_backup(r):
    origem = os.path.join(RAIZ, r)
    if not os.path.isfile(origem):
        return None
    destino = os.path.join(BACKUPS, agora().strftime("%Y%m%d-%H%M%S-%f"), r)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copy2(origem, destino)
    ultimos = estado("ultimo-backup.json", {})
    ultimos[r] = destino
    salvar_estado("ultimo-backup.json", ultimos)
    return destino


def limpar_backups():
    marca = estado("ultima-limpeza.json", 0)
    if time.time() - marca < 600 or not os.path.isdir(BACKUPS):
        return
    pastas = sorted(os.listdir(BACKUPS))
    limite = (agora() - datetime.timedelta(days=MANTER_DIAS)).strftime("%Y%m%d")
    velhas = [p for p in pastas if p[:8] < limite]
    excesso = pastas[: max(0, len(pastas) - MANTER_MAX)]
    for p in set(velhas + excesso):
        shutil.rmtree(os.path.join(BACKUPS, p), ignore_errors=True)
    salvar_estado("ultima-limpeza.json", time.time())


def backups_de(r):
    if not os.path.isdir(BACKUPS):
        return []
    achados = [os.path.join(BACKUPS, p, r) for p in sorted(os.listdir(BACKUPS), reverse=True)]
    return [a for a in achados if os.path.isfile(a)]


def versao_anterior(r, ferramenta):
    if ferramenta != "Bash":
        b = estado("ultimo-backup.json", {}).get(r)
        return ler(b) if b else ""
    try:  # Bash não faz backup antes; a base é o último commit
        return subprocess.run(["git", "show", "HEAD:" + r], cwd=RAIZ, capture_output=True, text=True, timeout=5).stdout
    except (OSError, subprocess.SubprocessError):
        return ""


# ---------------------------------------------------------------- checagens
def checar_sintaxe(r):
    caminho = os.path.join(RAIZ, r)
    ext = os.path.splitext(r)[1].lower()

    def rodar(cmd):
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return None if p.returncode == 0 else (p.stderr or p.stdout).strip()[:600]

    try:
        if ext in (".js", ".mjs", ".cjs"):
            return rodar(["node", "--check", caminho])
        if ext == ".jsx":
            return rodar(["node", os.path.join(AQUI, "checar-jsx.js"), caminho])
        if ext == ".json":
            json.loads(ler(caminho) or "")
        elif ext == ".sh":
            return rodar(["bash", "-n", caminho])
        elif ext == ".py":
            compile(ler(caminho) or "", r, "exec")
        elif ext in (".svg", ".xml"):
            import xml.etree.ElementTree as ET
            ET.fromstring(ler(caminho) or "")
        elif ext == ".css":
            return checar_css(ler(caminho) or "")
    except (ValueError, SyntaxError) as e:
        return str(e)[:600]
    except Exception as e:  # checador indisponível não bloqueia
        return None if isinstance(e, (OSError, subprocess.SubprocessError)) else str(e)[:600]
    return None


def checar_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'", "\"\"", css)
    nivel = 0
    for n, linha in enumerate(css.split("\n"), 1):
        for c in linha:
            nivel += (c == "{") - (c == "}")
            if nivel < 0:
                return f"CSS: '}}' sobrando na linha {n}"
    return f"CSS: {nivel} bloco(s) sem fechar '}}'" if nivel else None


def paleta():
    cores = set()
    for arq in ("tokens/colors.css", "tokens/effects.css"):
        cores |= {c.lower() for c in re.findall(r"#[0-9a-fA-F]{3,8}\b", ler(os.path.join(RAIZ, arq)) or "")}
    return cores


def inspecionar(r, adicionadas):
    """Devolve (erros que bloqueiam, avisos) olhando só as linhas adicionadas."""
    erros, avisos = [], []
    if r.startswith(".claude/dominic/"):
        return erros, avisos
    texto = "\n".join(adicionadas)
    for padrao, nome in SEGREDOS:
        if re.search(padrao, texto):
            erros.append(f"parece haver {nome} no arquivo — segredo nunca vai para o código (use variável de ambiente)")
    ext = os.path.splitext(r)[1].lower()
    codigo = ext in (".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".html")
    app = r.startswith(("app/", "design-system/components/", "design-system/tokens/"))
    conta = lambda rx: sum(1 for l in adicionadas if re.search(rx, l))
    if codigo:
        if conta(r"\bdebugger\b"):
            avisos.append("`debugger` adicionado — remova antes de subir")
        if conta(r"console\.log\("):
            avisos.append(f"{conta(r'console.log[(]')} `console.log` novo(s) — deixe só o que for proposital")
        if conta(r"\beval\(|new Function\("):
            avisos.append("`eval`/`new Function` — risco de execução de código; evite")
        if conta(r"innerHTML\s*[+]?=.*\$\{"):
            avisos.append("`innerHTML` com `${}` — risco de XSS; escape o texto (o globo.js usa esc())")
    if conta(r"\b(TODO|FIXME|XXX)\b"):
        avisos.append("TODO/FIXME novo — registre em 00-comando/TODO.md para não se perder")
    if app and ext in (".css", ".jsx", ".js", ".html"):
        soltas = {c.lower() for l in adicionadas for c in re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", l)} - paleta()
        if soltas:
            avisos.append("cor fora dos tokens: " + ", ".join(sorted(soltas)[:5]) + " — use var(--...) de tokens/")
        for l in adicionadas:
            for fam in re.findall(r"font-family\s*:\s*([^;\"}]+)|fontFamily\s*:\s*[\"'`]([^\"'`]+)", l):
                fam = fam[0] or fam[1]
                fora = [f.strip(" '\"").lower() for f in fam.split(",") if f.strip(" '\"").lower() not in FONTES_OK
                        and not f.strip().startswith("var(")]
                if fora:
                    avisos.append("fonte fora da identidade: " + ", ".join(fora[:3]) + " (só Exo 2 e Inter)")
        if ext == ".css" and conta(r"!important") >= 3:
            avisos.append(f"{conta('!important')} `!important` novos — sinal de briga de especificidade")
    if app and re.search(r"R\$\s?\d|%\s*do\s*lucro|renda\s+(garantida|passiva|extra)|últimas vagas|só hoje", texto, re.I):
        avisos.append("texto com valor/renda/urgência — confira as proibições jurídicas do CLAUDE.md")
    if ext == ".sql":
        if re.search(r"disable\s+row\s+level\s+security", texto, re.I):
            erros.append("SQL desliga RLS — dados ficariam abertos")
        if re.search(r"grant\s+all", texto, re.I):
            avisos.append("`grant all` — conceda só o necessário")
        if re.search(r"to\s+anon[^;]*using\s*\(\s*true\s*\)", texto, re.I | re.S) and re.search(r"perfis|cadastros|codigos", texto, re.I):
            avisos.append("política `using (true)` para anônimo em tabela com dado pessoal — confira")
    return erros, avisos


# ---------------------------------------------------------------- análise → skill
def catalogo():
    try:
        return json.loads(ler(os.path.join(AQUI, "catalogo.json")) or "{}").get("areas", [])
    except ValueError:
        return []


def areas_de(r, texto):
    achadas = []
    for a in catalogo():
        if any(fnmatch.fnmatch(r, p) for p in a.get("caminhos", [])) or \
           any(k.lower() in texto.lower() for k in a.get("conteudo", [])):
            achadas.append(a)
    return achadas[:2]


def instalada(nome):
    return ":" in nome or os.path.isfile(os.path.join(SKILLS, nome, "SKILL.md"))


def indicar(r, texto, mais, menos):
    areas = areas_de(r, texto)
    vistas = estado("indicacoes.json", {})
    linhas, ids = [], []
    if not areas:
        lac = os.path.join(ESTADO, "lacunas.tsv")
        os.makedirs(ESTADO, exist_ok=True)
        with open(lac, "a", encoding="utf-8") as f:
            f.write(f"{agora().isoformat(timespec='seconds')}\t{r}\n")
        return (f"Dominic: `{r}` (+{mais}/−{menos}) não está em nenhuma área do catálogo. "
                "Se for um tipo novo de trabalho, use a skill dominic-skill-creator para achar ou criar a skill certa."), "lacuna"
    for a in areas:
        ids.append(a["id"])
        if time.time() - vistas.get(a["id"], 0) < REPETIR_SKILL_MIN * 60:
            continue
        vistas[a["id"]] = time.time()
        usar = [s for s in a.get("instaladas", []) if instalada(s)]
        faltam = [m for m in a.get("mercado", []) if not instalada(m["skill"])]
        partes = [f"área **{a['nome']}**"]
        if usar:
            partes.append("use: " + ", ".join(usar))
        if faltam:
            partes.append("do mercado (não instalada; validar com dominic-skill-creator antes): " +
                          "; ".join(f"{m['skill']} ({m['repo']}) — {m['por_que']}" for m in faltam))
        if a.get("lembrete"):
            partes.append(a["lembrete"])
        linhas.append(" · ".join(partes))
    salvar_estado("indicacoes.json", vistas)
    if not linhas:
        return "", "+".join(ids)
    return f"Dominic: `{r}` (+{mais}/−{menos}) → " + " | ".join(linhas), "+".join(ids)


# ---------------------------------------------------------------- eventos
def alvos(evento):
    ferramenta = evento.get("tool_name", "")
    entrada = evento.get("tool_input") or {}
    if ferramenta == "Bash":
        marca = os.path.join(ESTADO, "marca-bash")
        if not os.path.exists(marca):
            return []
        limite = os.path.getmtime(marca)
        mudados = []
        for base, pastas, arquivos in os.walk(RAIZ):
            rb = rel(base)
            pastas[:] = [p for p in pastas if not ignorado(((rb + "/") if rb and rb != "." else "") + p + "/")]
            for a in arquivos:
                c = os.path.join(base, a)
                r = rel(c)
                if not ignorado(r) and r.endswith(TEXTO) and os.path.getmtime(c) > limite:
                    mudados.append(r)
                    if len(mudados) >= 15:
                        return mudados
        return mudados
    caminho = entrada.get("file_path") or entrada.get("notebook_path")
    r = rel(caminho) if caminho else None
    return [] if ignorado(r) else [r]


def antes(evento):
    if evento.get("tool_name") == "Bash":
        os.makedirs(ESTADO, exist_ok=True)
        with open(os.path.join(ESTADO, "marca-bash"), "w") as f:
            f.write(str(time.time()))
    else:
        for r in alvos(evento):
            fazer_backup(r)
    limpar_backups()


def depois(evento):
    ferramenta = evento.get("tool_name", "?")
    erros_todos, contexto = [], []
    for r in alvos(evento):
        caminho = os.path.join(RAIZ, r)
        atual = ler(caminho)
        if atual is None:  # arquivo apagado
            registrar(ferramenta, r, "-", "apagado", "")
            continue
        anterior = versao_anterior(r, ferramenta) or ""
        diff = list(difflib.unified_diff(anterior.splitlines(), atual.splitlines(), lineterm="", n=0))
        adicionadas = [l[1:] for l in diff if l.startswith("+") and not l.startswith("+++")]
        removidas = [l for l in diff if l.startswith("-") and not l.startswith("---")]
        if not adicionadas and not removidas:
            continue
        erros, avisos = inspecionar(r, adicionadas)
        falha = checar_sintaxe(r) if r.lower().endswith(TEXTO) else None
        if falha:
            erros.insert(0, "sintaxe quebrada: " + falha)
        indicacao, area = indicar(r, "\n".join(adicionadas), len(adicionadas), len(removidas))
        if erros:
            volta = f".claude/dominic/dominic.py restaurar {r}" if backups_de(r) else f"git checkout -- {r}"
            erros_todos.append(f"✗ {r}:\n  - " + "\n  - ".join(erros) + f"\n  Corrija agora ou volte a versão anterior com: {volta}")
        if avisos:
            contexto.append(f"Dominic · avisos em `{r}`: " + "; ".join(avisos))
        if indicacao:
            contexto.append(indicacao)
        registrar(ferramenta, r, area, "erro" if erros else "aviso" if avisos else "ok",
                  "; ".join(erros + avisos))
    if erros_todos:
        print("Dominic bloqueou a alteração:\n" + "\n".join(erros_todos), file=sys.stderr)
        sys.exit(2)
    if contexto:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse",
                                                 "additionalContext": "\n".join(contexto)}}, ensure_ascii=False))


def restaurar(r, n=1):
    lista = backups_de(r)
    if len(lista) < n:
        sys.exit(f"sem backup nº {n} de {r} (há {len(lista)})")
    fazer_backup(r)  # guarda a versão atual antes de voltar, para poder desfazer
    shutil.copy2(lista[n - 1] if n > 1 else lista[0], os.path.join(RAIZ, r))
    print(f"{r} restaurado de {os.path.relpath(lista[n - 1], RAIZ)}")


def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else ""
    if modo in ("restaurar", "backups"):
        if len(sys.argv) < 3:
            sys.exit(__doc__)
        r = rel(os.path.join(os.getcwd(), sys.argv[2])) or sys.argv[2]
        if modo == "backups":
            for i, b in enumerate(backups_de(r), 1):
                print(i, os.path.relpath(b, RAIZ))
        else:
            restaurar(r, int(sys.argv[3]) if len(sys.argv) > 3 else 1)
        return
    try:
        evento = json.load(sys.stdin)
    except ValueError:
        return
    try:
        (antes if modo == "antes" else depois)(evento)
    except SystemExit:
        raise
    except Exception as e:  # o guardião nunca derruba a sessão por erro próprio
        registrar(evento.get("tool_name", "?"), "-", "-", "falha-dominic", repr(e))


if __name__ == "__main__":
    main()
