Gaveta lateral. Entra deslizando da direita em 0,3s; fecha no ✕ ou Esc.

```jsx
<Drawer open={aberto} title="Notificações" onClose={fechar}>
  <ul className="hg-list"><ListRow title="Novo match 96%" subtitle="…" time="10 min" /></ul>
</Drawer>
```

Não há overlay escurecendo a página: o fundo continua visível.
