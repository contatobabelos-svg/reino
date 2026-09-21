/**
 * Chip de título de nobreza no pré-cadastro: escolher o chip define o território do mapa.
 */
export interface TitleChipProps {
  /** Imperador, Rei, Príncipe, Duque, Conde, Barão. */
  nome: string;
  /** Uma frase sobre o alcance: "Comanda um estado e suas cidades." */
  descricao?: string;
  mensalidade?: number;
  selected?: boolean;
  onSelect?: () => void;
}
export declare function TitleChip(props: TitleChipProps): JSX.Element;
