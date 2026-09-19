/** Lista de barras horizontais: rótulo, trilha e valor à direita. */
export interface BarMetricItem {
  name: string;
  /** Valor exibido à direita, já formatado (R$, %, contagem). */
  value: React.ReactNode;
  /** 0–100, define o comprimento da barra. */
  percent?: number;
  color?: string;
}
export interface BarMetricProps { items?: BarMetricItem[] }
export declare function BarMetric(props: BarMetricProps): JSX.Element;
