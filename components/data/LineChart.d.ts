/** Série temporal em linha com área, grade de três níveis e rótulos de eixo. */
export interface LineChartProps {
  /** Valores na ordem do tempo. */
  points?: number[];
  /** Rótulos do eixo horizontal, um por ponto. */
  labels?: string[];
  /** Valor em destaque na cápsula do canto. */
  highlight?: React.ReactNode;
  height?: number;
  /** Sufixo dos rótulos do eixo vertical, ex. "%". */
  suffix?: string;
}
export declare function LineChart(props: LineChartProps): JSX.Element;
