/** Estrelas de reputação em dourado; as vazias ficam em dourado 22%. */
export interface StarsProps {
  /** Nota 0–5, arredondada para a estrela mais próxima. */
  value?: number;
  max?: number;
  /** Mostra a nota numérica ao lado. */
  showValue?: boolean;
}
export declare function Stars(props: StarsProps): JSX.Element;
