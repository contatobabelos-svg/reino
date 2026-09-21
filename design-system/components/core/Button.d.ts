/**
 * Botão do Babel OS: gradiente violeta por padrão, halo neon no hover.
 */
export interface ButtonProps {
  /** primary = gradiente azul→violeta (ação principal); cyan = confirmar/continuar; ghost = secundário; green = afiliado/copiar. */
  variant?: "primary" | "cyan" | "ghost" | "green";
  /** Largura total (is-block), usado no pé dos painéis de coluna. */
  block?: boolean;
  /** Nome de um ícone do conjunto, desenhado antes do texto. */
  icon?: string;
  href?: string;
  as?: "button" | "a";
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
