#!/usr/bin/env bash
# Prepara o vídeo de fundo do login (PortalLogin) a partir de um .mp4 bruto.
# Uso: bash preparar-video.sh <entrada.mp4> [pasta-de-saída]
# Gera, na pasta deste script (ou na pasta indicada):
#   fundo-login.mp4        H.264, sem áudio, faststart (toca antes de baixar tudo)
#   fundo-login.webm       VP9, sem áudio (menor; o navegador escolhe)
#   fundo-login-final.jpg  último quadro (fundo parado do movimento reduzido e poster)
# Depois de trocar o vídeo, ajuste VIDEO_LOGIN.cardEm e .subidaDur no topo do PortalLogin.jsx.
set -euo pipefail

# ---------- recorte da marca d'água (ajuste aqui) ----------
# CORTE_TOPO: pixels tirados de cima (a marca "PopVid.AI" fica nos ~40 px de cima, à direita).
# A largura é recalculada para manter a proporção original; ALINHAR_X diz de onde sai a largura
# que sobra: "centro", "esquerda" (corta só a direita) ou "direita" (corta só a esquerda).
# CORTE_TOPO=0 desliga o recorte (vídeo final sem marca d'água).
CORTE_TOPO=44
ALINHAR_X="centro"
# Largura final em pixels (0 = mantém a do recorte). Altura sai proporcional e par.
LARGURA_SAIDA=0
# Qualidade: CRF menor = melhor e mais pesado.
CRF_H264=26
CRF_VP9=42
# -----------------------------------------------------------

ENTRADA="${1:?Uso: preparar-video.sh <entrada.mp4> [pasta-de-saída]}"
SAIDA="${2:-$(cd "$(dirname "$0")" && pwd)}"
[ -f "$ENTRADA" ] || { echo "Arquivo não encontrado: $ENTRADA" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "Precisa do ffmpeg instalado." >&2; exit 1; }
mkdir -p "$SAIDA"

IFS=x read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$ENTRADA")
if [ "$CORTE_TOPO" -gt 0 ]; then
  CH=$(( (H - CORTE_TOPO) / 2 * 2 ))
  CW=$(( (W * CH / H) / 2 * 2 ))
  case "$ALINHAR_X" in
    esquerda) CX=0 ;;
    direita)  CX=$(( W - CW )) ;;
    *)        CX=$(( (W - CW) / 2 )) ;;
  esac
  CY=$(( H - CH ))
  FILTRO="crop=${CW}:${CH}:${CX}:${CY}"
else
  CW=$W; CH=$H; FILTRO="null"
fi
if [ "$LARGURA_SAIDA" -gt 0 ]; then FILTRO="$FILTRO,scale=${LARGURA_SAIDA}:-2:flags=lanczos"; fi
FILTRO="$FILTRO,format=yuv420p"
echo "Entrada ${W}x${H} → recorte ${CW}x${CH} (filtro: $FILTRO)"

ffmpeg -hide_banner -loglevel error -y -i "$ENTRADA" -an -vf "$FILTRO" \
  -c:v libx264 -preset slow -crf "$CRF_H264" -profile:v high -movflags +faststart \
  "$SAIDA/fundo-login.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$ENTRADA" -an -vf "$FILTRO" \
  -c:v libvpx-vp9 -crf "$CRF_VP9" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  "$SAIDA/fundo-login.webm"
# último quadro: lê o vídeo já recortado e guarda o quadro final
ffmpeg -hide_banner -loglevel error -y -sseof -0.3 -i "$SAIDA/fundo-login.mp4" -update 1 -q:v 3 \
  "$SAIDA/fundo-login-final.jpg"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SAIDA/fundo-login.mp4")
echo "Duração: ${DUR}s"
ls -lh "$SAIDA"/fundo-login.mp4 "$SAIDA"/fundo-login.webm "$SAIDA"/fundo-login-final.jpg
