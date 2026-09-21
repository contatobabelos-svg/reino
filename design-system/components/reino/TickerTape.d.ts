/** Letreiro infinito de cotações no topo da Bolsa; pausa no hover e com prefers-reduced-motion. */
export interface TickerItem { symbol: string; value?: number; changePercent?: number }
export interface TickerTapeProps {
  items?: TickerItem[];
  onSelect?: (symbol: string) => void;
  paused?: boolean;
}
export declare function TickerTape(props: TickerTapeProps): JSX.Element;
