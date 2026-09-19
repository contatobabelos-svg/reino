// Dominic · checa a sintaxe de um .jsx com o mesmo Babel 7.29.0 que o app usa no navegador.
// uso: node checar-jsx.js <arquivo.jsx>   → sai 0 se compila; 1 com a mensagem do erro.
const fs = require("fs");
const path = require("path");
global.window = global; // o pacote standalone espera um window
const Babel = require(path.join(__dirname, "vendor", "babel-standalone-7.29.0.min.js"));
const arquivo = process.argv[2];
try {
  Babel.transform(fs.readFileSync(arquivo, "utf8"), { presets: ["react"], filename: arquivo, sourceType: "script" });
} catch (e) {
  console.error(String(e.message || e).split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
