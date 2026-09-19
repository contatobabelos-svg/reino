/** Rótulo + campo + ajuda. `inline` é a variante usada na barra de filtros do mapa. */
export interface FieldProps {
  label?: string;
  hint?: string;
  inline?: boolean;
  htmlFor?: string;
  children?: React.ReactNode;
}
export declare function Field(props: FieldProps): JSX.Element;
