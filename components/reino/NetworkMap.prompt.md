Rede de empresas sobre o mapa — a visão "ao vivo" do Reino, com raios de luz entre parceiros.

```jsx
<NetworkMap selected={atual} onSelect={setAtual}
  nodes={[{ id: "a", nome: "Conta Certa", nicho: "Contabilidade", cidade: "Campinas", x: 32, y: 40 }]}
  links={[["a", "b"], ["b", "c"]]} />
```

`x`/`y` são porcentagens, então a rede acompanha o tamanho do painel — não passe pixels. Sem `foto`, o nó mostra as iniciais, que é o padrão do produto (não há fotos de pessoas nos dados).

No Babel OS a rede não é uma vista separada: ela aparece **sobre o globo quando ele chega ao nível de bairro** (`overlay`), como faz o `Globo` do UI kit.

Para ancorar a rede a um mapa que se move, passe `positions={{ id: { x, y } }}` em px (recalculado a cada quadro pelo dono do mapa); os nós sem posição (atrás do globo) somem.
