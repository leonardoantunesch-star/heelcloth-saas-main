import { prisma } from "@/lib/db";
import { registrarAuditoria } from "@/services/auditoria";

export const CONFIGURACOES_PADRAO: Record<
  string,
  { valor: string; descricao: string }
> = {
  // 1. Dados da Empresa
  EMPRESA_RAZAO_SOCIAL: {
    valor: "Heelcloth Confecção Esportiva LTDA",
    descricao: "Razão social registrada na Receita Federal",
  },
  EMPRESA_NOME_FANTASIA: {
    valor: "Heelcloth Sportswear",
    descricao: "Nome fantasia exibido nos orçamentos e relatórios",
  },
  EMPRESA_CNPJ: {
    valor: "45.123.456/0001-89",
    descricao: "CNPJ da empresa para notas e faturamento",
  },
  EMPRESA_IE: {
    valor: "123.456.789.000",
    descricao: "Inscrição Estadual do emitente",
  },
  EMPRESA_ENDERECO: {
    valor: "Rua da Indústria Têxtil, 500 - Galpão 3, São Paulo - SP, CEP 03001-000",
    descricao: "Endereço da fábrica e expedição",
  },
  EMPRESA_TELEFONE: {
    valor: "(11) 98765-4321",
    descricao: "Telefone comercial e WhatsApp",
  },
  EMPRESA_EMAIL: {
    valor: "contato@heelcloth.com",
    descricao: "E-mail corporativo para contato",
  },

  // 2. Regras Comerciais & Financeiro
  PRAZO_PADRAO_DIAS: {
    valor: "15",
    descricao: "Prazo padrão em dias corridos para confecção",
  },
  PERCENTUAL_SINAL_MINIMO: {
    valor: "50",
    descricao: "Percentual mínimo de sinal para iniciar produção",
  },
  VALIDADE_ORCAMENTO_DIAS: {
    valor: "7",
    descricao: "Validade em dias das propostas comerciais",
  },
  CHAVE_PIX: {
    valor: "45.123.456/0001-89",
    descricao: "Chave PIX padrão da empresa",
  },
  TIPO_CHAVE_PIX: {
    valor: "CNPJ",
    descricao: "Tipo da chave PIX (CNPJ, EMAIL, TELEFONE, ALEATORIA)",
  },
  PIX_BENEFICIARIO: {
    valor: "Heelcloth Confecção Esportiva LTDA",
    descricao: "Nome do favorecido impresso no comprovante",
  },

  // 3. Fábrica & Estoque
  ALERTA_ESTOQUE_MINIMO: {
    valor: "true",
    descricao: "Exibe alertas visuais quando insumos atingirem o nível crítico",
  },
  BLOQUEAR_SALDO_NEGATIVO: {
    valor: "true",
    descricao: "Bloqueia saídas de estoque sem saldo suficiente",
  },

  // 4. WhatsApp & Notificações
  WHATSAPP_NOTIFICACOES_ATIVAS: {
    valor: "true",
    descricao: "Habilita a central de notificações automáticas via WhatsApp",
  },
  WHATSAPP_AVISAR_PRODUCAO: {
    valor: "true",
    descricao: "Dispara aviso ao cliente quando a confecção for iniciada",
  },
  WHATSAPP_AVISAR_PRONTO: {
    valor: "true",
    descricao: "Dispara aviso ao cliente quando o pedido estiver pronto",
  },
  WHATSAPP_AVISAR_ENTREGUE: {
    valor: "true",
    descricao: "Dispara mensagem de agradecimento na entrega",
  },

  // 5. Fiscal NF-e
  NFE_AMBIENTE: {
    valor: "HOMOLOGACAO",
    descricao: "Ambiente SEFAZ para emissão (HOMOLOGACAO ou PRODUCAO)",
  },
  NFE_SERIE: {
    valor: "1",
    descricao: "Série padrão do modelo 55",
  },
  NFE_NCM_PADRAO: {
    valor: "6109.10.00",
    descricao: "NCM têxtil padrão para camisas e uniformes",
  },
};

/**
 * Retorna o mapa de configurações atuais da empresa, aplicando valores padrão para chaves ausentes
 */
export async function obterConfiguracoes(): Promise<
  Record<string, { valor: string; descricao?: string | null }>
> {
  const configsBanco = await prisma.setting.findMany();
  const mapaBanco = new Map<string, { value: string; description: string | null }>();

  configsBanco.forEach((c) => {
    mapaBanco.set(c.key, { value: c.value, description: c.description });
  });

  const resultado: Record<string, { valor: string; descricao?: string | null }> = {};

  // Preenche primeiro os defaults
  for (const [key, padrao] of Object.entries(CONFIGURACOES_PADRAO)) {
    const doBanco = mapaBanco.get(key);
    resultado[key] = {
      valor: doBanco ? doBanco.value : padrao.valor,
      descricao: doBanco ? doBanco.description || padrao.descricao : padrao.descricao,
    };
  }

  // Preenche eventuais chaves customizadas adicionadas
  for (const [key, config] of mapaBanco.entries()) {
    if (!resultado[key]) {
      resultado[key] = {
        valor: config.value,
        descricao: config.description,
      };
    }
  }

  return resultado;
}

/**
 * Salva ou atualiza configurações em lote no banco e registra evento na auditoria
 */
export async function salvarConfiguracoes(
  novasConfiguracoes: Record<string, string>,
  userId?: string | null
) {
  const alteracoes: Array<{ key: string; valor: string }> = [];

  for (const [key, value] of Object.entries(novasConfiguracoes)) {
    const descricao = CONFIGURACOES_PADRAO[key]?.descricao || "Configuração do sistema";
    await prisma.setting.upsert({
      where: { key },
      update: {
        value: String(value),
        description: descricao,
      },
      create: {
        key,
        value: String(value),
        description: descricao,
      },
    });

    alteracoes.push({ key, valor: String(value) });
  }

  // Registrar na auditoria
  await registrarAuditoria({
    userId,
    action: "ATUALIZACAO",
    entity: "CONFIG",
    entityId: "CONFIGURACOES_GLOBAIS",
    details: {
      totalAlteradas: alteracoes.length,
      chaves: alteracoes.map((a) => a.key),
    },
  });

  return { sucesso: true, totalSalvas: alteracoes.length };
}
