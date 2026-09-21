/** Dock flutuante sobre mapa/globo: ícones em cápsula de vidro com rótulo embaixo. */
export interface MapDockItem {
  value?: string;
  /** Vira link em vez de aba. */
  href?: string;
  icon: string;
  label: string;
}
export interface MapDockProps {
  items?: MapDockItem[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}
export declare function MapDock(props: MapDockProps): JSX.Element;
