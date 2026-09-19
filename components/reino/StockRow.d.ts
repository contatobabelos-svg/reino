/**
 * Linha de ativo da Bolsa: vidro com filete que pulsa em verde ou vermelho conforme a variação.
 */
export interface StockRowProps {
  /** Código do ativo, ex. "PETR4". */
  symbol: string;
  name: string;
  value?: number;
  changeValue?: number;
  /** Positivo pinta a linha de verde, negativo de vermelho. */
  changePercent?: number;
  volume?: number;
  low?: number;
  high?: number;
  /** Série da sessão para o minigráfico. */
  points?: number[];
  /** Posição na lista — atrasa a entrada e o pulso (--i). */
  index?: number;
  /** 0–1: força do pulso, proporcional à maior variação da lista (--forca). */
  force?: number;
  onOpen?: () => void;
  onRemove?: () => void;
}
export declare function StockRow(props: StockRowProps): JSX.Element;
