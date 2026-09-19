/** Abas em cápsula; a selecionada ganha fundo azul translúcido e halo. */
export interface TabsProps {
  /** Strings, ou { value, label }. */
  items?: (string | { value: string; label: string })[];
  value?: string;
  onChange?: (value: string) => void;
}
export declare function Tabs(props: TabsProps): JSX.Element;
