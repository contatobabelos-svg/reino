/**
 * Publicação em estilo linha do tempo (rede social): avatar, nome, @arroba, título, texto e ações.
 * @startingPoint section="Reino" subtitle="Feed estilo linha do tempo" viewport="700x360"
 */
export interface SocialPostProps {
  autor: string;
  empresa?: string;
  /** Título de nobreza do autor — mostra a coroa ao lado do nome. */
  titulo?: string;
  /** Tempo relativo: "8 min", "3 h", "ontem". */
  quando?: string;
  texto: string;
  curtidas?: number;
  comentarios?: number;
  repostagens?: number;
  imagem?: string;
  verificado?: boolean;
  curtido?: boolean;
  onCurtir?: () => void;
  onComentar?: () => void;
  onRepostar?: () => void;
  onCompartilhar?: () => void;
  /** Torna a publicação clicável (abre o detalhe). */
  onAbrir?: () => void;
}
export declare function SocialPost(props: SocialPostProps): JSX.Element;
