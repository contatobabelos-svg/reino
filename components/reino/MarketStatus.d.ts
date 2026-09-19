/** Cápsula de estado do pregão: ponto verde pulsando quando aberto, vermelho parado quando fechado. */
export interface MarketStatusProps {
  open?: boolean;
  /** Texto próprio, ex.: "Conectando…". */
  children?: React.ReactNode;
}
export declare function MarketStatus(props: MarketStatusProps): JSX.Element;
