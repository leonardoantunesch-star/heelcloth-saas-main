import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CorelJobResult } from "@/services/coreldraw/job-contract";

// POST /api/coreldraw/[orderId]/resultado - Ingestão do manifesto de resultado emitido pelo CorelDRAW VBA
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { orderId } = await params;

    const payload = (await req.json()) as CorelJobResult;

    if (!payload || !payload.jobId || !payload.status) {
      return NextResponse.json(
        { erro: "Manifesto inválido: jobId e status são obrigatórios." },
        { status: 400 }
      );
    }

    if (payload.orderId && payload.orderId !== orderId) {
      return NextResponse.json(
        { erro: `Conflito de pedido: orderId do payload (${payload.orderId}) não corresponde à rota (${orderId}).` },
        { status: 400 }
      );
    }

    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        productionOrder: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: "Pedido não encontrado no sistema." },
        { status: 404 }
      );
    }

    // 1. Atualizar Anexos do Pedido com os arquivos gerados
    let currentAttachments: string[] = [];
    if (pedido.attachments) {
      try {
        const parsed = JSON.parse(pedido.attachments);
        if (Array.isArray(parsed)) {
          currentAttachments = parsed;
        } else if (typeof parsed === "string") {
          currentAttachments = [parsed];
        }
      } catch {
        currentAttachments = [pedido.attachments];
      }
    }

    const novosArquivosAdicionados: string[] = [];
    if (Array.isArray(payload.generatedFiles)) {
      for (const item of payload.generatedFiles) {
        if (item.cdrPath && !currentAttachments.includes(item.cdrPath)) {
          currentAttachments.push(item.cdrPath);
          novosArquivosAdicionados.push(item.cdrPath);
        }
        if (item.pdfPath && !currentAttachments.includes(item.pdfPath)) {
          currentAttachments.push(item.pdfPath);
          novosArquivosAdicionados.push(item.pdfPath);
        }
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        attachments: JSON.stringify(currentAttachments),
      },
    });

    // 2. Atualizar Esteira de Produção se existir
    if (pedido.productionOrder) {
      const isSuccess = payload.status === "succeeded";
      const newStageStatus = isSuccess ? "CONCLUIDO" : payload.status === "partial" ? "PENDENTE" : "PENDENTE";

      await prisma.productionOrder.update({
        where: { id: pedido.productionOrder.id },
        data: {
          stageStatus: newStageStatus,
          notes: `Último lote CorelDRAW (${payload.jobId}): status=${payload.status}, processados=${payload.processedPlayers}/${payload.totalPlayers}`,
          updatedAt: new Date(),
        },
      });

      // Registrar Histórico de Produção
      await prisma.productionHistory.create({
        data: {
          productionOrderId: pedido.productionOrder.id,
          stage: pedido.productionOrder.currentStage || "PERSONALIZACAO",
          status: isSuccess ? "CONCLUIDO" : "ERRO",
          responsible: session.name || "Automação CorelDRAW",
          notes: `Lote CorelDRAW ${payload.jobId} finalizado. Status: ${payload.status}. Processados: ${payload.processedPlayers}/${payload.totalPlayers}. Arquivos gerados: ${payload.generatedFiles?.length || 0}.`,
        },
      });
    }

    // 3. Registrar Log de Auditoria
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "STATUS_CHANGE",
          entity: "PRODUCAO",
          entityId: pedido.id,
          details: JSON.stringify({
            event: "COREL_DRAW_JOB_RESULT_INGESTED",
            jobId: payload.jobId,
            status: payload.status,
            totalPlayers: payload.totalPlayers,
            processedPlayers: payload.processedPlayers,
            generatedFilesCount: payload.generatedFiles?.length || 0,
            novosArquivosAdicionadosCount: novosArquivosAdicionados.length,
            errorsCount: payload.errors?.length || 0,
            warningsCount: payload.warnings?.length || 0,
            durationMs: payload.durationMs,
          }),
        },
      });
    } catch (auditErr) {
      console.warn("Falha não-bloqueante ao registrar AuditLog:", auditErr);
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Manifesto de resultado processado com sucesso.",
      status: payload.status,
      jobId: payload.jobId,
      novosArquivosAnexados: novosArquivosAdicionados.length,
      totalAnexos: currentAttachments.length,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao processar resultado do CorelDRAW:", error);
    return NextResponse.json(
      { erro: "Erro interno ao processar manifesto de resultado." },
      { status: 500 }
    );
  }
}
