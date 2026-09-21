/**
 * Rede ao vivo do Reino: empresas como nós sobre o mapa, ligadas por raios de luz.
 * @startingPoint section="Reino" subtitle="Rede de empresas com raios de luz" viewport="900x520"
 */
export interface NetworkNode {
  id: string;
  nome: string;
  nicho?: string;
  cidade?: string;
  /** Rótulo do território, ex. "SP". */
  estado?: string;
  /** Posição horizontal em % do painel (0–100). */
  x: number;
  /** Posição vertical em % do painel (0–100). */
  y: number;
  /** URL da foto; sem valor, mostra as iniciais. */
  foto?: string;
}
export interface NetworkMapProps {
  nodes?: NetworkNode[];
  /** Pares de ids ligados por um raio. */
  links?: [string, string][];
  /** Id do nó selecionado: acende os raios que chegam nele e abre o cartão. */
  selected?: string;
  onSelect?: (id: string) => void;
  /** Dock de ícones no pé do painel. */
  footer?: React.ReactNode;
  height?: number | string;
  /** Sem fundo nem borda: para sobrepor ao globo quando ele chega ao nível de bairro. */
  overlay?: boolean;
  /** Posições em px por id (ancoradas a um mapa que se move); sem isso usa x/y em % dos nós. */
  positions?: Record<string, { x: number; y: number }>;
}
export declare function NetworkMap(props: NetworkMapProps): JSX.Element;
