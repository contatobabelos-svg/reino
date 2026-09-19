/** Ícone do conjunto próprio do Babel OS (traçado 1.8, grade 24). */
export interface IconProps {
  /** Nome do ícone: visao, guilda, mapa, social, match, trofeu, revista, bolsa, coroa, estrela, busca, buscaIA, sino, msg, config, filtro, pin, camadas, alerta, link, mais, x, menu, baixar, grafico, rota, plug, vitrine, noticias, agenda, clientes, ordens, relatorios, tecnicos, analises. */
  name: string;
  /** Tamanho em px (por padrão herda o tamanho definido pela classe do componente pai). */
  size?: number;
  /** Espessura do traço. Padrão 1.8 (1.9 na barra inferior do celular). */
  strokeWidth?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element | null;
export declare const BABEL_ICON_PATHS: Record<string, string>;
