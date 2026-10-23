export type StatusJobCorel =
  | "aguardando_geracao"
  | "processando"
  | "concluido"
  | "erro";

export interface JogadorCorel {
  nome: string;
  numero: string;
  tamanho: string;
  modelo: string; // Ex: "Jogador", "Goleiro", "Comissão"
  tipoCamisa?: string; // Ex: "Padrão", "Texturizada", "Manga Longa"
  observacoes?: string;
}

export interface JobCorelDraw {
  id: string;
  pedidoId: string;
  numeroPedido: string;
  templateArquivo?: string;
  jogadores: JogadorCorel[];
  status: StatusJobCorel;
  totalPecas: number;
  arquivosGerados?: string[];
  erro?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
