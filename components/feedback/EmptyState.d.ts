/** Estado vazio: borda tracejada, ícone que respira em ciano. */
export interface EmptyStateProps {
  icon?: string;
  title?: string;
  /** Uma frase explicando o que fazer, no máximo 300px de largura. */
  description?: string;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
