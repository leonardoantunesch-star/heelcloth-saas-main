import { prisma } from "@/lib/db";

export interface ParametrosAuditoria {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

/**
 * Registra um evento no log de auditoria do sistema.
 * É seguro e não-bloqueante: se falhar, não interrompe a transação principal.
 */
export async function registrarAuditoria(params: ParametrosAuditoria) {
  try {
    const detailsString =
      typeof params.details === "object" && params.details !== null
        ? JSON.stringify(params.details)
        : (params.details as string) || null;

    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: detailsString,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Falha ao gravar registro de auditoria:", error);
    return null;
  }
}

/**
 * Consulta registros de auditoria com filtros e paginação
 */
export async function listarAuditorias(opcoes: {
  page?: number;
  limit?: number;
  busca?: string;
  acao?: string;
  entidade?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
}) {
  const page = Math.max(1, opcoes.page || 1);
  const limit = Math.min(100, Math.max(1, opcoes.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (opcoes.acao && opcoes.acao !== "TODAS") {
    where.action = opcoes.acao;
  }

  if (opcoes.entidade && opcoes.entidade !== "TODAS") {
    where.entity = opcoes.entidade;
  }

  if (opcoes.busca) {
    where.OR = [
      { entityId: { contains: opcoes.busca } },
      { details: { contains: opcoes.busca } },
      { action: { contains: opcoes.busca } },
      { user: { name: { contains: opcoes.busca } } },
      { user: { email: { contains: opcoes.busca } } },
    ];
  }

  if (opcoes.dataInicio && opcoes.dataFim) {
    const [anoIni, mesIni, diaIni] = opcoes.dataInicio.split("-").map(Number);
    const [anoFim, mesFim, diaFim] = opcoes.dataFim.split("-").map(Number);
    where.createdAt = {
      gte: new Date(anoIni, mesIni - 1, diaIni, 0, 0, 0, 0),
      lte: new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  // Estatísticas de ações
  const totalGeral = await prisma.auditLog.count();
  const hojeInicio = new Date();
  hojeInicio.setHours(0, 0, 0, 0);
  const totalHoje = await prisma.auditLog.count({
    where: { createdAt: { gte: hojeInicio } },
  });

  return {
    logs,
    paginacao: {
      page,
      limit,
      total,
      paginas: Math.ceil(total / limit),
    },
    metricas: {
      totalGeral,
      totalHoje,
    },
  };
}
