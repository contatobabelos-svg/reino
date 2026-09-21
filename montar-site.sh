#!/bin/sh
# Monta o site publicado pela Vercel (pasta site/): o app de ui_kits/babel-os
# na raiz do domínio, mais o que ele importa da raiz do projeto
# (../../styles.css → tokens/ e components/babel-ui.css, ../../_ds_bundle.js).
set -e
rm -rf site
mkdir -p site/tokens site/components
cp -R ui_kits/babel-os/. site/
rm -f site/vercel.json site/README.md site/*.sql
# o script que prepara o vídeo do login não vai ao ar
rm -f site/assets/login/*.sh
# exports antigos com login de demonstração e entrada de admin não vão ao ar
rm -f site/reino-app.html site/app-standalone.html site/portal-preview.html
cp styles.css _ds_bundle.js site/
cp tokens/*.css site/tokens/
cp components/babel-ui.css site/components/
