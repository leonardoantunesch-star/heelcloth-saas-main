import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// GET /api/nfe - Lista notas fiscais e pedidos aptos para emissão
// REGRA SEÇÃO 14.1: Estritamente restrito ao perfil ADMIN no backend
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim() || "";
    const busca = searchParams.get("busca")?.trim() || "";

    const where: any = {};

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (busca) {
      where.OR = [
        { invoiceNumber: { contains: busca } },
        { accessKey: { contains: busca } },
        { order: { orderNumber: { contains: busca } } },
        { order: { customer: { name: { contains: busca } } } },
      ];
    }

    const notas = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, document: true, whatsapp: true } },
            items: true,
          },
        },
      },
    });

    // Buscar pedidos aptos a emitir nota fiscal (Pedidos que ainda não possuem NF-e ou cuja nota foi cancelada)
    const pedidosSemNota = await prisma.order.findMany({
      where: {
        status: { in: ["PRONTO", "CONCLUIDO", "PAGAMENTO_CONFIRMADO", "EM_PRODUCAO"] },
        invoices: {
          none: {
            status: "AUTORIZADA",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        customer: { select: { id: true, name: true, document: true } },
        items: true,
      },
    });

    const totalEmitidas = await prisma.invoice.count();
    const totalAutorizadas = await prisma.invoice.count({ where: { status: "AUTORIZADA" } });
    const totalCanceladas = await prisma.invoice.count({ where: { status: "CANCELADA" } });
    const totalAguardando = await prisma.invoice.count({ where: { status: "AGUARDANDO" } });

    return NextResponse.json({
      sucesso: true,
      metricas: {
        totalEmitidas,
        totalAutorizadas,
        totalCanceladas,
        totalAguardando,
        pedidosAptos: pedidosSemNota.length,
      },
      notas,
      pedidosAptosParaEmissao: pedidosSemNota,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso estritamente restrito ao perfil Administrador (Seção 14.1)" },
        { status: 403 }
      );
    }
    console.error("Erro ao listar notas fiscais:", error);
    return NextResponse.json({ erro: "Erro ao buscar notas fiscais" }, { status: 500 });
  }
}
