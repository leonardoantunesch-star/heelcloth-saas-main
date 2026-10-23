import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getNfeProvider } from "@/services/nfe";

interface RouteParams {
  params: Promise<{ id: string }>; // invoice id or accessKey
}

// GET /api/nfe/[id]/xml - Download do arquivo XML da NF-e
// REGRA SEÇÃO 14.1: Estritamente restrito ao perfil ADMIN no backend
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const nota = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { accessKey: id }],
      },
    });

    if (!nota || !nota.accessKey) {
      return NextResponse.json({ erro: "Nota fiscal não encontrada" }, { status: 404 });
    }

    const provider = getNfeProvider();
    const xml = await provider.baixarXml(nota.accessKey);

    return new NextResponse(xml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="NFe-${nota.accessKey}.xml"`,
      },
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
    return NextResponse.json({ erro: "Erro ao baixar XML" }, { status: 500 });
  }
}
