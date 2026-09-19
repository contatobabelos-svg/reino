#!/bin/sh
# Hook de contexto do REINO.
# Lê o CLAUDE.md da raiz e devolve ao Claude Code como additionalContext.
#   uso: injetar-contexto.sh completo|resumo   (o JSON do evento chega pela entrada padrão)
#   completo → o arquivo inteiro; resumo → só o trecho entre as marcas REGRAS-ESSENCIAIS.
# Cada execução vira uma linha em 00-comando/logs/hook-ingestao.tsv.
MODO="${1:-resumo}"
RAIZ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

MODO="$MODO" RAIZ="$RAIZ" exec python3 -c '
import datetime, json, os, sys

modo, raiz = os.environ["MODO"], os.environ["RAIZ"]
try:
    evento = json.load(sys.stdin).get("hook_event_name", "?")
except Exception:
    evento = "?"

try:
    texto = open(os.path.join(raiz, "CLAUDE.md"), encoding="utf-8").read()
except OSError:
    texto = ""

if modo == "resumo" and texto:
    ini, fim = "<!-- REGRAS-ESSENCIAIS:INICIO -->", "<!-- REGRAS-ESSENCIAIS:FIM -->"
    if ini in texto and fim in texto:
        texto = texto.split(ini, 1)[1].split(fim, 1)[0].strip()

# registro: data, evento, modo, bytes enviados
try:
    logs = os.path.join(raiz, "00-comando", "logs")
    os.makedirs(logs, exist_ok=True)
    with open(os.path.join(logs, "hook-ingestao.tsv"), "a", encoding="utf-8") as f:
        f.write("\t".join([datetime.datetime.now().isoformat(timespec="seconds"), evento, modo, str(len(texto.encode()))]) + "\n")
except OSError:
    pass

if texto:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": evento, "additionalContext": texto}}, ensure_ascii=False))
'
