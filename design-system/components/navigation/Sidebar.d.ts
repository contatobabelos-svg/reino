/**
 * Menu lateral do app. No desktop ele fica escondido e desliza como vidro quando o mouse chega na borda esquerda.
 */
export interface SidebarProps {
  /** Arquivo da página atual, ex. "guildas.html" — marca aria-current. */
  current?: string;
  /** [href, ícone, rótulo][]. Padrão: os 12 módulos do Reino. */
  items?: [string, string, string][];
  /** Imagem de marca opcional. Sem valor, mostra a coroa (ícone "coroa" do produto) — a marca do app Reino. */
  logo?: string;
  /** Rodapé de estado da fonte de dados. */
  status?: "api" | "demo" | "off";
  onNavigate?: (href: string) => void;
  /** Menu recolhido (só ícones, com tooltip). */
  collapsed?: boolean;
  /** Mostra a seta na borda para recolher/expandir. */
  onToggle?: () => void;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
export declare const MENU_BABEL: [string, string, string][];
