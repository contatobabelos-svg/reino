Menu lateral (248px fixo; 264px de vidro no desktop com hover na borda).

```jsx
<div className="hg-app">
  <Sidebar current="guildas.html" onNavigate={ir} />
  <div className="hg-main">…</div>
</div>
```

A marca do app é a **coroa** (ícone `coroa` do conjunto do produto) com a palavra **Reino** — "no" em ciano aceso. `logo` só para trocar por uma imagem. Nunca desenhe outro mark.

A ordem dos módulos é a do produto — não reordene. O item ativo ganha gradiente azul e o ícone vira branco com brilho.

`collapsed` recolhe para 72px só com ícones (o rótulo vira tooltip); `onToggle` mostra a seta na borda. No UI kit o app grava a escolha em `localStorage`.
