export type GoRemitRow = Record<string, unknown>;

export type GoRemitResponse = {
  count: number;
  data: GoRemitRow[];
};

