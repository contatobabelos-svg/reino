Dock do mapa: alterna painéis (Mapa / Notícias / Busca IA) ou leva a outros módulos.

```jsx
<MapDock value={aba} onChange={setAba} items={[
  { value: "mapa", icon: "mapa", label: "Mapa" },
  { value: "noticias", icon: "noticias", label: "Notícias" },
  { value: "busca", icon: "buscaIA", label: "Busca IA" },
]} />
```
