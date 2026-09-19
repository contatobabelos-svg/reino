/** Botão quadrado 38x38 de ícone, usado no cabeçalho, no dock do mapa e no zoom do globo. */
export interface IconButtonProps {
  icon?: string;
  /** Vai para aria-label e title — obrigatório, o botão não tem texto. */
  label: string;
  /** Estado ligado (is-on): borda e halo acesos. */
  active?: boolean;
  /** Ponto magenta de "tem novidade". */
  dot?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
