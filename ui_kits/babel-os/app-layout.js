/* Palco de 1920px: acima dessa largura o app é escalado por zoom em vez de
   esticar. Mede a janela e grava --palco-zoom em <html>. */
(function () {
  var PALCO = 1920;
  function aplicar() {
    var html = document.documentElement;
    if (html.classList.contains("is-modo-app")) { html.classList.remove("is-palco"); html.style.removeProperty("--palco-zoom"); return; }
    var w = window.innerWidth;
    if (w > PALCO) { html.classList.add("is-palco"); html.style.setProperty("--palco-zoom", (w / PALCO).toFixed(4)); }
    else { html.classList.remove("is-palco"); html.style.removeProperty("--palco-zoom"); }
  }
  // modo-app num celular real não faz sentido (a moldura de 430px sobraria): vale só acima de 1100px
  function modoApp() {
    var html = document.documentElement;
    if (window.innerWidth <= 1100 && html.classList.contains("is-modo-app")) html.classList.remove("is-modo-app");
    else if (window.innerWidth > 1100 && localStorage.getItem("reino.modo") === "app") html.classList.add("is-modo-app");
  }
  modoApp();
  window.addEventListener("resize", modoApp);
  aplicar();
  window.addEventListener("resize", aplicar);
})();
