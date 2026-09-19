/** Campo de nova publicação no topo da linha do tempo, com contador de caracteres. */
export interface SocialComposerProps {
  /** Nome de quem publica (iniciais do avatar). */
  autor?: string;
  placeholder?: string;
  onPublicar?: (texto: string) => void;
  max?: number;
}
export declare function SocialComposer(props: SocialComposerProps): JSX.Element;
