/** Lista ordenada com medalha dourada — hierarquia de títulos e rankings de pontos. */
export interface RankItem { nome: string; descricao?: string; mensalidade?: number; valor?: React.ReactNode }
export interface RankListProps { items?: RankItem[] }
export declare function RankList(props: RankListProps): JSX.Element;
