/** Minigráfico de sessão da bolsa. Sem dados, mostra o filete tracejado. */
export interface SparklineProps {
  /** Série de preços na ordem do tempo (até 120 pontos na sessão). */
  points?: number[];
  /** up = verde, down = vermelho, sem valor = azul. */
  trend?: "up" | "down";
  style?: React.CSSProperties;
}
export declare function Sparkline(props: SparklineProps): JSX.Element;
