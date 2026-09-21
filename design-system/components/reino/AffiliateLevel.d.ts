/** Emblema e nível do afiliado: selo de coroa, nome do nível, contagem de indicados e progresso até o próximo. */
export interface AffiliateLevelProps {
  /** Nome do nível: Bronze, Prata, Ouro, Diamante. */
  level?: string;
  /** Alias em pt-BR de `level`. */
  nivel?: string;
  indicados?: number;
  /** Frase curta do que falta: "faltam 3 para Ouro". */
  proximo?: string;
  /** 0–100 até o próximo nível. */
  progress?: number;
  /** Só selo e texto, sem barra — para o cabeçalho. */
  compact?: boolean;
}
export declare function AffiliateLevel(props: AffiliateLevelProps): JSX.Element;
