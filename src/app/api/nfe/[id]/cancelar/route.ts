import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getNfeProvider } from "@/services/nfe";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const cancelarSchema = z.object({
  justificativa: z.string().min(15, "Justificativa de cancelamento deve ter pelo menos 15 caracteres (Regra SEFAZ)"),
});

// POST /api/nfe/[id]/cancelar - Cancelar NF-e autorizada
// REGRA SEÇÃO 14.1: Estritamente restrito ao perfil ADMIN no backend
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN"]);
    const { id } = await params;

    const body = await req.json();
    const parsed = cancelarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { justificativa } = parsed.data;

    const nota = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!nota) {
      return NextResponse.json({ erro: "Nota fiscal não encontrada" }, { status: 404 });
    }

    if (nota.status !== "AUTORIZADA") {
      return NextResponse.json(
        { erro: `Apenas notas fiscais com status AUTORIZADA podem ser canceladas. Status atual: ${nota.status}.` },
        { status: 400 }
      );
    }

    // Chamar provedor fiscal para homologar cancelamento na SEFAZ
    const provider = getNfeProvider();
    const respCancelamento = await provider.cancelar(nota.accessKey || "", justificativa);

    const notaCancelada = await prisma.$transaction(async (tx) => {
      const atualizada = await tx.invoice.update({
        where: { id },
        data: {
          status: "CANCELADA",
          errorMessage: `Cancelada: ${justificativa}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CANCELAR_NFE",
          entity: "NFE",
          entityId: id,
          details: JSON.stringify({
            numero: nota.invoiceNumber,
            chave: nota.accessKey,
            justificativa,
          }),
        },
      });

      return atualizada;
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: respCancelamento.mensagem || "Cancelamento de NF-e homologado com sucesso!",
      nota: notaCancelada,
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
    console.error("Erro ao cancelar NF-e:", error);
    return NextResponse.json({ erro: "Erro ao cancelar nota fiscal" }, { status: 500 });
  }
}
