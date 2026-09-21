/** Barra inferior do celular (62px + safe area), cinco destinos, ícones de traço 1.9. */
export interface TabBarProps {
  current?: string;
  /** [href, ícone, rótulo curto, nome completo do módulo]. */
  items?: [string, string, string, string?][];
  onNavigate?: (href: string) => void;
}
export declare function TabBar(props: TabBarProps): JSX.Element;
export declare const TABBAR_BABEL: [string, string, string, string][];
