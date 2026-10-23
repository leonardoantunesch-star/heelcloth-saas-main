import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>; // invoice id or accessKey
}

// GET /api/nfe/[id]/danfe - Visualização do DANFE
// REGRA SEÇÃO 14.1: Estritamente restrito ao perfil ADMIN no backend
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const nota = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { accessKey: id }],
      },
      include: {
        order: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });

    if (!nota) {
      return NextResponse.json({ erro: "Nota fiscal não encontrada" }, { status: 404 });
    }

    const htmlDanfe = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DANFE - NF-e nº ${nota.invoiceNumber || "1001"}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #111; }
    .box { border: 1px solid #000; padding: 6px; margin-bottom: 6px; }
    .header { display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; padding: 10px; margin-bottom: 8px; }
    .title { font-size: 14px; font-weight: bold; }
    .bold { font-weight: bold; }
    .chave { font-family: monospace; font-size: 13px; letter-spacing: 1px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
    th { background: #eee; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0 0 4px 0;">HEELCLOTH CONFECÇÃO E ESTAMPARIA LTDA</h2>
      <p style="margin:2px 0;">CNPJ: 00.000.000/0001-00 | IE: 123.456.789.110</p>
      <p style="margin:2px 0;">Rua da Confecção, 1000 - São Paulo - SP</p>
    </div>
    <div style="text-align: right;">
      <div class="title">DANFE</div>
      <div>Documento Auxiliar da Nota Fiscal Eletrônica</div>
      <div><strong>Nº ${nota.invoiceNumber || "1001"}</strong> - SÉRIE ${nota.series || "1"}</div>
      <div>0 - ENTRADA / 1 - SAÍDA: <strong>1 (SAÍDA)</strong></div>
    </div>
  </div>

  <div class="box">
    <div class="bold">CHAVE DE ACESSO:</div>
    <div class="chave">${nota.accessKey || "35261000000000000100550010000010011123456780"}</div>
    <div style="margin-top: 4px;">Consulta de autenticidade no portal nacional da NF-e (www.nfe.fazenda.gov.br)</div>
  </div>

  <div class="box">
    <div class="bold" style="border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 4px;">DESTINATÁRIO / REMETENTE</div>
    <div style="display: flex; justify-content: space-between;">
      <div>NOME / RAZÃO SOCIAL: <strong>${nota.order?.customer?.name || "Cliente Padrão"}</strong></div>
      <div>CNPJ / CPF: <strong>${nota.order?.customer?.document || "000.000.000-00"}</strong></div>
    </div>
    <div style="margin-top: 4px;">TELEFONE: ${nota.order?.customer?.phone || nota.order?.customer?.whatsapp || "-"}</div>
  </div>

  <div class="box">
    <div class="bold">DADOS DOS PRODUTOS / SERVIÇOS</div>
    <table>
      <thead>
        <tr>
          <th>CÓD</th>
          <th>DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
          <th>NCM/SH</th>
          <th>CST</th>
          <th>CFOP</th>
          <th>UN</th>
          <th class="text-right">QTD</th>
          <th class="text-right">V. UNIT</th>
          <th class="text-right">V. TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${(nota.order?.items || []).map((i) => `
          <tr>
            <td>HC-01</td>
            <td>${i.product}</td>
            <td>61091000</td>
            <td>0102</td>
            <td>5101</td>
            <td>UN</td>
            <td class="text-right">${i.quantity}</td>
            <td class="text-right">${formatCurrency(i.unitPrice)}</td>
            <td class="text-right">${formatCurrency(i.totalPrice)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <div class="box" style="text-align: right;">
    <span class="title">VALOR TOTAL DA NOTA: <strong>${formatCurrency(nota.order?.totalAmount || 0)}</strong></span>
  </div>

  <div class="box">
    <div class="bold">DADOS ADICIONAIS</div>
    <div>Inf. Contribuinte: Documento emitido por ME ou EPP optante pelo Simples Nacional. Pedido: #${nota.order?.orderNumber}. Status SEFAZ: ${nota.status}.</div>
    <div>Data de Emissão: ${formatDate(nota.emittedAt || nota.createdAt)}</div>
  </div>
</body>
</html>`;

    return new NextResponse(htmlDanfe, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
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
    return NextResponse.json({ erro: "Erro ao gerar DANFE" }, { status: 500 });
  }
}
