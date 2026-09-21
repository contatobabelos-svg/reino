#!/usr/bin/env bash
# Prepara os vídeos de fundo do login (PortalLogin) a partir de um ou mais .mp4 brutos.
# Uso: bash preparar-video.sh <entrada1.mp4> [entrada2.mp4 ...]
#      SAIDA=/outra/pasta bash preparar-video.sh ...   (padrão: app/assets/login)
# Arquivos repetidos (mesmo sha256) entram uma vez só. Gera, na pasta de saída:
#   1 vídeo único  → fundo-login.mp4 / fundo-login.webm
#   2 ou mais      → fundo-login-1.mp4 / -1.webm, fundo-login-2.mp4 / -2.webm, ...
#   fundo-login-final.jpg  último quadro do 1º vídeo (movimento reduzido e card direto)
# No fim imprime o trecho de VIDEO_LOGIN.lista para colar no topo do PortalLogin.jsx.
# Os fundo-login* antigos da pasta de saída são apagados antes (são sempre gerados por aqui).
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

[ "$#" -ge 1 ] || { echo "Uso: bash preparar-video.sh <entrada1.mp4> [entrada2.mp4 ...]" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "Precisa do ffmpeg instalado." >&2; exit 1; }
SAIDA="${SAIDA:-$(cd "$(dirname "$0")/../app/assets/login" && pwd)}"
mkdir -p "$SAIDA"

# tira os duplicados pelo conteúdo (sha256), mantendo a ordem de entrada
UNICOS=(); VISTOS=" "
for f in "$@"; do
  [ -f "$f" ] || { echo "Arquivo não encontrado: $f" >&2; exit 1; }
  h=$(sha256sum "$f" | cut -c1-64)
  case "$VISTOS" in *" $h "*) echo "Pulando repetido: $f" ; continue ;; esac
  VISTOS="$VISTOS$h "; UNICOS+=("$f")
done
N=${#UNICOS[@]}
echo "$# arquivo(s), $N diferente(s)."

rm -f "$SAIDA"/fundo-login*.mp4 "$SAIDA"/fundo-login*.webm "$SAIDA"/fundo-login*.jpg

filtro_de() {
  local W H CH CW CX CY F
  IFS=x read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$1")
  if [ "$CORTE_TOPO" -gt 0 ]; then
    CH=$(( (H - CORTE_TOPO) / 2 * 2 ))
    CW=$(( (W * CH / H) / 2 * 2 ))
    case "$ALINHAR_X" in
      esquerda) CX=0 ;;
      direita)  CX=$(( W - CW )) ;;
      *)        CX=$(( (W - CW) / 2 )) ;;
    esac
    CY=$(( H - CH ))
    F="crop=${CW}:${CH}:${CX}:${CY}"
  else
    F="null"
  fi
  if [ "$LARGURA_SAIDA" -gt 0 ]; then F="$F,scale=${LARGURA_SAIDA}:-2:flags=lanczos"; fi
  echo "$F,format=yuv420p"
}

LISTA=""
i=0
for f in "${UNICOS[@]}"; do
  i=$((i + 1))
  if [ "$N" -eq 1 ]; then NOME="fundo-login"; else NOME="fundo-login-$i"; fi
  FILTRO=$(filtro_de "$f")
  echo "[$i/$N] $f → $NOME (filtro: $FILTRO)"
  ffmpeg -hide_banner -loglevel error -y -i "$f" -an -vf "$FILTRO" \
    -c:v libx264 -preset slow -crf "$CRF_H264" -profile:v high -movflags +faststart \
    "$SAIDA/$NOME.mp4"
  ffmpeg -hide_banner -loglevel error -y -i "$f" -an -vf "$FILTRO" \
    -c:v libvpx-vp9 -crf "$CRF_VP9" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "$SAIDA/$NOME.webm"
  # último quadro do 1º vídeo: fundo parado do movimento reduzido e do card direto
  if [ "$i" -eq 1 ]; then
    ffmpeg -hide_banner -loglevel error -y -sseof -0.3 -i "$SAIDA/$NOME.mp4" -update 1 -q:v 3 \
      "$SAIDA/fundo-login-final.jpg"
  fi
  LISTA="$LISTA    { webm: \"assets/login/$NOME.webm\", mp4: \"assets/login/$NOME.mp4\" },
"
done

ls -lh "$SAIDA"/fundo-login*
echo
echo "Cole em VIDEO_LOGIN (PortalLogin.jsx):"
printf '  lista: [\n%s  ],\n' "$LISTA"
