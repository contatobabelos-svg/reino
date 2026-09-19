/**
 * Publicação da rede social do Reino, com filete ciano aceso à esquerda.
 */
export interface FeedPostProps {
  autor: string;
  empresa?: string;
  /** Tempo relativo curto: "8 min", "3 h", "ontem". */
  quando?: string;
  texto: string;
  curtidas?: number;
  comentarios?: number;
}
export declare function FeedPost(props: FeedPostProps): JSX.Element;
