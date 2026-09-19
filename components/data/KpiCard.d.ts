/**
 * Indicador do Reino: rótulo, número que acende e pé com variação.
 */
export interface KpiCardProps {
  label: string;
  value?: React.ReactNode;
  /** "★" na nota média, "%" onde couber. */
  suffix?: string;
  /** Texto do pé, depois da variação. Ex.: "nesta semana". */
  foot?: React.ReactNode;
  /** Variação percentual: positiva em verde, negativa em vermelho. */
  trend?: number;
  onClose?: () => void;
  empty?: boolean;
  size?: string;
}
export declare function KpiCard(props: KpiCardProps): JSX.Element;
