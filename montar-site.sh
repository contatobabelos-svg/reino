#!/bin/sh
# Monta o site publicado pela Vercel (pasta site/): o app de ui_kits/babel-os
# na raiz do domínio, mais o que ele importa da raiz do projeto
# (../../styles.css → tokens/ e components/babel-ui.css, ../../_ds_bundle.js).
set -e
rm -rf site
mkdir -p site/tokens site/components
cp -R ui_kits/babel-os/. site/
rm -f site/vercel.json site/README.md site/*.sql
cp styles.css _ds_bundle.js site/
cp tokens/*.css site/tokens/
cp components/babel-ui.css site/components/
