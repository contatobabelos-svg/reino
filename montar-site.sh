#!/bin/sh
# Monta o site publicado pela Vercel (pasta site/): o app de app/ na raiz do
# domínio, mais o que ele importa do design system (../design-system/styles.css
# → tokens/ e components/babel-ui.css, ../design-system/_ds_bundle.js).
set -e
rm -rf site
mkdir -p site/design-system/tokens site/design-system/components
cp -R app/. site/
rm -f site/README.md
cp design-system/styles.css design-system/_ds_bundle.js site/design-system/
cp design-system/tokens/*.css site/design-system/tokens/
cp design-system/components/babel-ui.css site/design-system/components/
