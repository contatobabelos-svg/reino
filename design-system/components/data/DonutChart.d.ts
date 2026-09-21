/** Rosca de distribuição com número no centro e legenda ao lado. */
export interface DonutSegment {
  name: string;
  value: number;
  /** Cor própria; sem valor, segue ciano, violeta, azul, magenta, ouro. */
  color?: string;
}
export interface DonutChartProps {
  segments?: DonutSegment[];
  /** Número no centro já formatado; sem valor, usa a soma. */
  total?: React.ReactNode;
  /** Texto miúdo sob o número. */
  label?: string;
  legend?: boolean;
  size?: number;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;
