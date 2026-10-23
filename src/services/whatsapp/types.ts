export type EventoWhatsApp =
  | "pedido_confirmado"
  | "producao_iniciada"
  | "producao_concluida"
  | "pedido_pronto"
  | "pedido_entregue";

export interface VariaveisMensagem {
  nomeCliente: string;
  numeroPedido: string;
  protocolo?: string;
  previsaoEntrega?: string;
  total?: string;
  [key: string]: string | undefined;
}

export interface MensagemEnvio {
  destinatario: string; // telefone formatado com DDI e DDD (ex: 5537999999999)
  evento: EventoWhatsApp;
  variaveis: VariaveisMensagem;
  mensagemPersonalizada?: string;
}

export interface RespostaEnvioWhatsApp {
  sucesso: boolean;
  mensagemId?: string;
  erro?: string;
}

export interface WhatsAppService {
  enviarMensagem(dados: MensagemEnvio): Promise<RespostaEnvioWhatsApp>;
}
