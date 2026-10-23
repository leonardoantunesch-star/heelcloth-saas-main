export type StatusNfe =
  | "aguardando"
  | "processando"
  | "autorizada"
  | "cancelada"
  | "rejeitada"
  | "erro";

export interface DadosEmissaoNfe {
  pedidoId: string;
  numeroPedido: string;
  cliente: {
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  itens: Array<{
    descricao: string;
    codigo?: string;
    ncm?: string;
    cfop?: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  valorTotal: number;
  formaPagamento?: string;
}

export interface RespostaEmissaoNfe {
  sucesso: boolean;
  status: StatusNfe;
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  mensagem?: string;
  erros?: string[];
}

export interface NfeProvider {
  emitir(dados: DadosEmissaoNfe): Promise<RespostaEmissaoNfe>;
  consultarStatus(chaveAcesso: string): Promise<RespostaEmissaoNfe>;
  cancelar(chaveAcesso: string, justificativa: string): Promise<RespostaEmissaoNfe>;
  baixarXml(chaveAcesso: string): Promise<Buffer | string>;
  baixarDanfe(chaveAcesso: string): Promise<Buffer>;
}
