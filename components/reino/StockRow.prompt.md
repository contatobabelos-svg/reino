Linha de ativo. Dentro de `<div className="hg-bolsa-lista" role="list">`, com o cabeçalho `hg-bolsa-cab` acima.

```jsx
<div className="hg-bolsa-cab" aria-hidden="true">
  <span>Ativo</span><span>Preço</span><span>Variação</span><span>Sessão</span><span>Mín · Máx</span><span>Volume</span><span></span>
</div>
<div className="hg-bolsa-lista" role="list">
  <StockRow symbol="PETR4" name="Petrobras" value={48.95} changeValue={0.62} changePercent={1.28}
    volume={3.2e7} low={48.1} high={49.3} points={[48.1, 48.5, 48.95]} index={0} force={1} />
</div>
```

Valores em pt-BR (R$ com vírgula), números tabulares. Abaixo de 1100px a linha vira grade de 3 áreas — o CSS cuida.
