/** Linha de configuração com chave ligada/desligada (fundo ciano aceso quando ligada). */
export interface SwitchProps {
  label: string;
  hint?: string;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export declare function Switch(props: SwitchProps): JSX.Element;
