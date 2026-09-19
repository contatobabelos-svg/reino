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

/* Rolagem em toda a tela: quem rola é o conteúdo (.hg-content). A roda do mouse
   sobre cabeçalho, menu lateral ou barra inferior é repassada a ele, a menos
   que o elemento sob o mouse tenha rolagem própria com espaço para rolar. */
(function () {
  function rolaSozinho(el, dy) {
    for (; el && el !== document.body; el = el.parentElement) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
      }
    }
    return false;
  }
  document.addEventListener("wheel", function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
    var c = document.querySelector(".hg-content");
    if (!c || c.contains(e.target) || document.body.classList.contains("is-imersivo")) return;
    if (rolaSozinho(e.target, e.deltaY)) return;
    c.scrollBy({ top: e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? c.clientHeight : 1), left: 0 });
  }, { passive: true });
})();
