import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/whatsapp - Lista fila e histórico de mensagens de WhatsApp (Seção 15)
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim() || "";
    const template = searchParams.get("template")?.trim() || "";
    const busca = searchParams.get("busca")?.trim() || "";

    const where: any = {};

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (template && template !== "TODOS") {
      where.templateType = template;
    }

    if (busca) {
      where.OR = [
        { phone: { contains: busca } },
        { content: { contains: busca } },
        { customer: { name: { contains: busca } } },
        { order: { orderNumber: { contains: busca } } },
      ];
    }

    const mensagens = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, whatsapp: true } },
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
      },
    });

    const total = await prisma.whatsAppMessage.count();
    const enviadas = await prisma.whatsAppMessage.count({ where: { status: "ENVIADO" } });
    const pendentes = await prisma.whatsAppMessage.count({ where: { status: "PENDENTE" } });
    const falhas = await prisma.whatsAppMessage.count({ where: { status: "FALHA" } });

    return NextResponse.json({
      sucesso: true,
      metricas: {
        total,
        enviadas,
        pendentes,
        falhas,
      },
      mensagens,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao listar mensagens do WhatsApp:", error);
    return NextResponse.json({ erro: "Erro ao buscar histórico do WhatsApp" }, { status: 500 });
  }
}
