import { EventoWhatsApp, MensagemEnvio, RespostaEnvioWhatsApp, WhatsAppService } from "./types";

export const TEMPLATES_NOTIFICACAO: Record<string, string> = {
  PEDIDO_CONFIRMADO:
    "👕 Olá, *{cliente}*! Seu pedido *#{pedido}* na Heelcloth foi confirmado com sucesso!\n📦 Quantidade: {totalPecas} peças\n💰 Total: {valorTotal} (Entrada: {valorPago})\n📅 Previsão de Entrega: {prazo}\n\nQualquer dúvida, estamos à disposição!",
  PRODUCAO_INICIADA:
    "✂️ Olá, *{cliente}*! Boas notícias: os uniformes do seu pedido *#{pedido}* entraram em produção na fábrica!\nNossa equipe já está cuidando do corte a laser e da estamparia das suas peças.",
  PRODUCAO_CONCLUIDA:
    "🪡 Olá, *{cliente}*! A confecção das peças do seu pedido *#{pedido}* foi finalizada com sucesso e agora segue para acabamento e controle de qualidade.",
  PEDIDO_PRONTO:
    "🏆 Olá, *{cliente}*! SEU PEDIDO *#{pedido}* ESTÁ PRONTO!\nSuas peças foram 100% conferidas na bancada e embaladas com todo cuidado.\n{infoSaldo}\nVocê já pode combinar a retirada ou envio!",
  PEDIDO_ENTREGUE:
    "🚚 Olá, *{cliente}*! Seu pedido *#{pedido}* foi entregue!\nMuito obrigado pela confiança na Heelcloth Esportes. Desejamos muito sucesso ao seu time em campo! ⚽✨",
  MENSAGEM_LIVRE: "{mensagem}",
};

/**
 * Substitui variáveis do template: {cliente}, {pedido}, {valorTotal}, {prazo}, etc.
 */
export function renderizarTemplate(template: string, variaveis: Record<string, string | number | undefined | null>): string {
  return template.replace(/\{(\w+)\}/g, (_, chave) => {
    const valor = variaveis[chave];
    return valor !== undefined && valor !== null ? String(valor) : `{${chave}}`;
  });
}

/**
 * Limpa e formata o telefone para o padrão internacional do WhatsApp (ex: 5511999998888)
 */
export function formatarTelefoneWhatsApp(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Gera URL direta para o WhatsApp Web / aplicativo oficial
 */
export function gerarLinkWhatsApp(telefone: string, mensagem: string): string {
  const fone = formatarTelefoneWhatsApp(telefone);
  return `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Provedor Mock / Local para WhatsApp
 * Imprime no console e retorna id de mensagem
 */
export class MockWhatsAppService implements WhatsAppService {
  async enviarMensagem(dados: MensagemEnvio): Promise<RespostaEnvioWhatsApp> {
    const template = dados.mensagemPersonalizada || TEMPLATES_NOTIFICACAO[dados.evento] || "";
    const texto = renderizarTemplate(template, dados.variaveis);
    console.log(`[WhatsApp Mock] Enviando para ${dados.destinatario}:\n${texto}`);

    return {
      sucesso: true,
      mensagemId: `wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
  }
}

let currentService: WhatsAppService = new MockWhatsAppService();

export function setWhatsAppService(service: WhatsAppService) {
  currentService = service;
}

export function getWhatsAppService(): WhatsAppService {
  return currentService;
}

export * from "./types";
