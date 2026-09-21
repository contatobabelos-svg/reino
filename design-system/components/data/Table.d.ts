/** Tabela com cabeçalho ciano em caixa alta e filetes azuis. */
export interface TableProps {
  columns?: React.ReactNode[];
  /** Uma matriz de células por linha. */
  rows?: React.ReactNode[][];
  empty?: React.ReactNode;
}
export declare function Table(props: TableProps): JSX.Element;
