import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getWhatsAppService, gerarLinkWhatsApp } from "@/services/whatsapp";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/whatsapp/[id]/reenviar - Tentar reenvio de mensagem da fila
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const msg = await prisma.whatsAppMessage.findUnique({
      where: { id },
    });

    if (!msg) {
      return NextResponse.json({ erro: "Mensagem não encontrada" }, { status: 404 });
    }

    const waService = getWhatsAppService();
    const resp = await waService.enviarMensagem({
      destinatario: msg.phone,
      evento: (msg.templateType.toLowerCase() as any) || "pedido_confirmado",
      variaveis: { nomeCliente: "Cliente", numeroPedido: "" },
      mensagemPersonalizada: msg.content,
    });

    const statusNovo = resp.sucesso ? "ENVIADO" : "FALHA";

    const atualizada = await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        status: statusNovo,
        errorMessage: resp.erro || null,
        sentAt: resp.sucesso ? new Date() : msg.sentAt,
      },
    });

    return NextResponse.json({
      sucesso: resp.sucesso,
      mensagem: resp.sucesso ? "Mensagem reenviada com sucesso!" : "Falha ao reenviar mensagem.",
      registro: atualizada,
      linkWhatsAppWeb: gerarLinkWhatsApp(msg.phone, msg.content),
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao reenviar WhatsApp:", error);
    return NextResponse.json({ erro: "Erro ao processar reenvio de WhatsApp" }, { status: 500 });
  }
}
