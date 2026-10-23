import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { gerarJobSnapshot } from "@/services/coreldraw";

// GET /api/coreldraw/[orderId]/job - Retorna ou faz download do Job Snapshot JSON para o CorelDRAW VBA
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAuth(req);
    const { orderId } = await params;

    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "true";
    const templateKey = url.searchParams.get("templateKey") || undefined;
    const templatePath = url.searchParams.get("templatePath") || undefined;
    const rootPath = url.searchParams.get("rootPath") || undefined;
    const dryRun = url.searchParams.get("dryRun") === "true";

    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        players: {
          orderBy: { playerIndex: "asc" },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    const jobSnapshot = gerarJobSnapshot(pedido, {
      templateKey,
      templatePath,
      rootPath,
      dryRun,
    });

    if (download) {
      const safeOrderNum = pedido.orderNumber.replace(/[^A-Za-z0-9_-]/g, "_");
      const fileName = `job_${safeOrderNum}.json`;
      return new NextResponse(JSON.stringify(jobSnapshot, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json({
      sucesso: true,
      job: jobSnapshot,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao gerar job snapshot CorelDRAW:", error);
    return NextResponse.json(
      { erro: "Erro ao gerar snapshot do job para CorelDRAW" },
      { status: 500 }
    );
  }
}
