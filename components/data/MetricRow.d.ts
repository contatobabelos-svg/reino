/** Métrica de conquista: nome à esquerda, contagem à direita, barra embaixo. */
export interface MetricRowProps {
  name: string;
  /** Contagem já formatada: "14 / 25". */
  label: string;
  value?: number;
  color?: string;
}
export declare function MetricRow(props: MetricRowProps): JSX.Element;
