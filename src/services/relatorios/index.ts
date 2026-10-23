import { prisma } from "@/lib/db";

export interface IntervaloData {
  inicio: Date;
  fim: Date;
  label: string;
}

/**
 * Retorna as datas de início e fim baseadas no período solicitado
 */
export function obterIntervaloData(
  periodo: string = "mes",
  dataInicioStr?: string | null,
  dataFimStr?: string | null
): IntervaloData {
  const agora = new Date();

  if (periodo === "personalizado" && dataInicioStr && dataFimStr) {
    const [anoIni, mesIni, diaIni] = dataInicioStr.split("-").map(Number);
    const [anoFim, mesFim, diaFim] = dataFimStr.split("-").map(Number);
    const inicio = new Date(anoIni, mesIni - 1, diaIni, 0, 0, 0, 0);
    const fim = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999);
    return {
      inicio,
      fim,
      label: `${dataInicioStr} a ${dataFimStr}`,
    };
  }

  if (periodo === "hoje") {
    const inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(agora);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim, label: "Hoje" };
  }

  if (periodo === "semana") {
    const inicio = new Date(agora);
    inicio.setDate(agora.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(agora);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim, label: "Últimos 7 dias" };
  }

  if (periodo === "ano") {
    const inicio = new Date(agora.getFullYear(), 0, 1, 0, 0, 0, 0);
    const fim = new Date(agora.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { inicio, fim, label: `Ano ${agora.getFullYear()}` };
  }

  // Padrão: Mês atual
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return { inicio, fim, label: `${meses[agora.getMonth()]} de ${agora.getFullYear()}` };
}

/**
 * Calcula todas as métricas analíticas e consolida o BI para a confecção
 */
export async function obterMetricasBI(inicio: Date, fim: Date) {
  // 1. Pedidos no período
  const pedidos = await prisma.order.findMany({
    where: {
      createdAt: { gte: inicio, lte: fim },
    },
    include: {
      customer: { select: { id: true, name: true, whatsapp: true } },
      items: true,
      players: true,
    },
  });

  const totalPedidos = pedidos.length;
  const pedidosConcluidos = pedidos.filter((p) =>
    ["ENTREGUE", "CONCLUIDO", "PRONTO"].includes(p.status)
  ).length;

  const faturamentoTotal = pedidos.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const valorTotalPedidos = pedidos.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const ticketMedio = totalPedidos > 0 ? valorTotalPedidos / totalPedidos : 0;

  // Total de peças (itens de pedido + jogadores)
  let totalPecas = 0;
  pedidos.forEach((p) => {
    if (p.players && p.players.length > 0) {
      totalPecas += p.players.length;
    } else if (p.items && p.items.length > 0) {
      totalPecas += p.items.reduce((s, item) => s + (item.quantity || 1), 0);
    }
  });

  // 2. Transações Financeiras no período
  const transacoes = await prisma.financialTransaction.findMany({
    where: {
      createdAt: { gte: inicio, lte: fim },
      status: "PAGO",
    },
  });

  const receitaTotal = transacoes
    .filter((t) => t.type === "RECEITA")
    .reduce((acc, t) => acc + t.amount, 0);

  const despesaTotal = transacoes
    .filter((t) => t.type === "DESPESA")
    .reduce((acc, t) => acc + t.amount, 0);

  const lucroLiquido = receitaTotal - despesaTotal;
  const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

  // 3. Orçamentos e Taxa de Conversão
  const orcamentos = await prisma.quote.findMany({
    where: {
      createdAt: { gte: inicio, lte: fim },
    },
  });

  const totalOrcamentos = orcamentos.length;
  const orcamentosConvertidos = orcamentos.filter((o) =>
    ["CONVERTIDO", "APROVADO"].includes(o.status)
  ).length;

  const taxaConversaoOrcamento =
    totalOrcamentos > 0 ? (orcamentosConvertidos / totalOrcamentos) * 100 : 0;

  // 4. Controle de Qualidade
  const inspecionados = await prisma.qualityCheck.findMany({
    where: {
      checkedAt: { gte: inicio, lte: fim },
    },
  });

  const totalInspecionados = inspecionados.length;
  const totalAprovados = inspecionados.filter((q) => q.isApproved).length;
  const taxaQualidade =
    totalInspecionados > 0 ? (totalAprovados / totalInspecionados) * 100 : 100;

  // 5. Ranking de Clientes
  const clientesMap = new Map<
    string,
    { id: string; nome: string; pedidos: number; totalGasto: number; pecas: number }
  >();

  pedidos.forEach((p) => {
    const cid = p.customerId;
    const nome = p.customer?.name || "Cliente Não Identificado";
    const pecasPedido = p.players.length > 0 ? p.players.length : p.items.length;

    const atual = clientesMap.get(cid) || {
      id: cid,
      nome,
      pedidos: 0,
      totalGasto: 0,
      pecas: 0,
    };

    atual.pedidos += 1;
    atual.totalGasto += p.totalAmount;
    atual.pecas += pecasPedido;
    clientesMap.set(cid, atual);
  });

  const rankingClientes = Array.from(clientesMap.values())
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, 10);

  // 6. Ranking de Produtos mais vendidos
  const produtosMap = new Map<string, { nome: string; quantidade: number; receita: number }>();
  pedidos.forEach((p) => {
    p.items.forEach((item) => {
      const nome = item.product || "Produto Padrão";
      const atual = produtosMap.get(nome) || { nome, quantidade: 0, receita: 0 };
      atual.quantidade += item.quantity || 1;
      atual.receita += item.totalPrice || 0;
      produtosMap.set(nome, atual);
    });
  });

  const rankingProdutos = Array.from(produtosMap.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  // 7. Distribuição das Etapas na Produção
  const ordensProducao = await prisma.productionOrder.findMany({
    select: { currentStage: true, stageStatus: true },
  });

  const etapasProducao: Record<string, number> = {
    ARTE: 0,
    CORTE: 0,
    PERSONALIZACAO: 0,
    COSTURA: 0,
    ESTAMPA: 0,
    ACABAMENTO: 0,
    CONTROLE_QUALIDADE: 0,
    PRONTO: 0,
  };

  ordensProducao.forEach((op) => {
    if (etapasProducao[op.currentStage] !== undefined) {
      etapasProducao[op.currentStage] += 1;
    }
  });

  // 8. Série Temporal de Vendas (Diária/Semanal)
  const vendasPorDia: Record<string, { data: string; total: number; pedidos: number }> = {};
  pedidos.forEach((p) => {
    const diaKey = new Date(p.createdAt).toISOString().split("T")[0];
    if (!vendasPorDia[diaKey]) {
      vendasPorDia[diaKey] = { data: diaKey, total: 0, pedidos: 0 };
    }
    vendasPorDia[diaKey].total += p.totalAmount;
    vendasPorDia[diaKey].pedidos += 1;
  });

  const serieVendas = Object.values(vendasPorDia).sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  return {
    kpis: {
      faturamentoTotal,
      valorTotalPedidos,
      ticketMedio,
      totalPedidos,
      pedidosConcluidos,
      totalPecas,
      receitaTotal,
      despesaTotal,
      lucroLiquido,
      margemLucro: Number(margemLucro.toFixed(1)),
      totalOrcamentos,
      orcamentosConvertidos,
      taxaConversaoOrcamento: Number(taxaConversaoOrcamento.toFixed(1)),
      totalInspecionados,
      totalAprovados,
      taxaQualidade: Number(taxaQualidade.toFixed(1)),
    },
    rankingClientes,
    rankingProdutos,
    etapasProducao,
    serieVendas,
  };
}

/**
 * Gera arquivo CSV com os dados consolidados para exportação
 */
export async function gerarCsvRelatorio(
  tipo: "vendas" | "financeiro" | "producao" | "clientes" = "vendas",
  inicio: Date,
  fim: Date
): Promise<string> {
  if (tipo === "vendas") {
    const pedidos = await prisma.order.findMany({
      where: { createdAt: { gte: inicio, lte: fim } },
      include: { customer: true, items: true, players: true },
      orderBy: { createdAt: "desc" },
    });

    const cabecalho = "Numero_Pedido,Data,Cliente,WhatsApp,Status,Valor_Total,Valor_Pago,Total_Pecas\n";
    const linhas = pedidos.map((p) => {
      const dataStr = new Date(p.createdAt).toLocaleDateString("pt-BR");
      const pecas = p.players.length > 0 ? p.players.length : p.items.length;
      return [
        `"${p.orderNumber}"`,
        `"${dataStr}"`,
        `"${p.customer?.name.replace(/"/g, '""')}"`,
        `"${p.customer?.whatsapp || ""}"`,
        `"${p.status}"`,
        p.totalAmount.toFixed(2),
        p.paidAmount.toFixed(2),
        pecas,
      ].join(",");
    });

    return "\uFEFF" + cabecalho + linhas.join("\n");
  }

  if (tipo === "financeiro") {
    const transacoes = await prisma.financialTransaction.findMany({
      where: { createdAt: { gte: inicio, lte: fim } },
      orderBy: { createdAt: "desc" },
    });

    const cabecalho = "Data,Tipo,Categoria,Descricao,Valor,Status,Metodo_Pagamento\n";
    const linhas = transacoes.map((t) => {
      const dataStr = new Date(t.createdAt).toLocaleDateString("pt-BR");
      return [
        `"${dataStr}"`,
        `"${t.type}"`,
        `"${t.category}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${t.status}"`,
        `"${t.paymentMethod || ""}"`,
      ].join(",");
    });

    return "\uFEFF" + cabecalho + linhas.join("\n");
  }

  if (tipo === "clientes") {
    const clientes = await prisma.customer.findMany({
      include: { orders: true },
    });

    const cabecalho = "Nome,Documento,WhatsApp,Telefone,Total_Pedidos,Valor_Acumulado\n";
    const linhas = clientes.map((c) => {
      const totalGasto = c.orders.reduce((acc, o) => acc + o.totalAmount, 0);
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.document || ""}"`,
        `"${c.whatsapp || ""}"`,
        `"${c.phone || ""}"`,
        c.orders.length,
        totalGasto.toFixed(2),
      ].join(",");
    });

    return "\uFEFF" + cabecalho + linhas.join("\n");
  }

  // Padrão: Produção
  const ordens = await prisma.productionOrder.findMany({
    include: {
      order: { include: { customer: true, players: true } },
    },
  });

  const cabecalho = "Numero_Pedido,Cliente,Etapa_Atual,Status_Etapa,Responsavel,Total_Pecas\n";
  const linhas = ordens.map((op) => {
    return [
      `"${op.order.orderNumber}"`,
      `"${op.order.customer.name.replace(/"/g, '""')}"`,
      `"${op.currentStage}"`,
      `"${op.stageStatus}"`,
      `"${op.responsible || ""}"`,
      op.order.players.length,
    ].join(",");
  });

  return "\uFEFF" + cabecalho + linhas.join("\n");
}
