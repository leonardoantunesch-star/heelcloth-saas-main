import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getNfeProvider } from "@/services/nfe";

const emitirSchema = z.object({
  orderId: z.string().min(1, "ID do pedido é obrigatório"),
  serie: z.string().default("1"),
});

// POST /api/nfe/emitir - Emitir NF-e (Modelo 55) para pedido de confecção
// REGRA SEÇÃO 14.1: Estritamente restrito ao perfil ADMIN no backend
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN"]);

    const body = await req.json();
    const parsed = emitirSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId, serie } = parsed.data;

    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        players: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    // Verificar se já existe NF-e autorizada para este pedido
    const notaExistente = await prisma.invoice.findFirst({
      where: { orderId, status: "AUTORIZADA" },
    });

    if (notaExistente) {
      return NextResponse.json(
        {
          erro: `Este pedido já possui a NF-e nº ${notaExistente.invoiceNumber} autorizada. Não é permitida duplicidade de emissão fiscal.`,
        },
        { status: 400 }
      );
    }

    // Montar payload de emissão fiscal
    const dadosEmissao = {
      pedidoId: pedido.id,
      numeroPedido: pedido.orderNumber,
      cliente: {
        nome: pedido.customer.name,
        cpfCnpj: pedido.customer.document || "000.000.000-00",
        email: pedido.customer.email || undefined,
        telefone: pedido.customer.phone || pedido.customer.whatsapp || undefined,
        endereco: {
          logradouro: "Rua do Cliente",
          numero: "100",
          bairro: "Centro",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01001-000",
        },
      },
      itens: pedido.items.map((i) => ({
        descricao: i.product,
        codigo: "HC-CONF",
        ncm: "61091000", // Camisetas de malha
        cfop: "5101",
        quantidade: i.quantity,
        valorUnitario: i.unitPrice,
        valorTotal: i.totalPrice,
      })),
      valorTotal: pedido.totalAmount,
      formaPagamento: pedido.paymentMethod || "PIX",
    };

    // Chamar provedor fiscal
    const provider = getNfeProvider();
    const respostaFiscal = await provider.emitir(dadosEmissao);

    if (!respostaFiscal.sucesso) {
      return NextResponse.json(
        {
          erro: "Falha na comunicação com a SEFAZ",
          detalhes: respostaFiscal.erros || [respostaFiscal.mensagem],
        },
        { status: 502 }
      );
    }

    // Salvar nota no banco de dados
    const nota = await prisma.$transaction(async (tx) => {
      const novaNota = await tx.invoice.create({
        data: {
          orderId: pedido.id,
          invoiceNumber: respostaFiscal.numero || "1001",
          accessKey: respostaFiscal.chaveAcesso,
          series: respostaFiscal.serie || serie,
          status: "AUTORIZADA",
          xmlUrl: respostaFiscal.xmlUrl,
          danfeUrl: respostaFiscal.danfeUrl,
          emittedAt: new Date(),
        },
      });

      // Auditoria (Seção 18)
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "EMISSAO_NFE",
          entity: "NFE",
          entityId: novaNota.id,
          details: JSON.stringify({
            numero: novaNota.invoiceNumber,
            chave: novaNota.accessKey,
            pedido: pedido.orderNumber,
            valor: pedido.totalAmount,
          }),
        },
      });

      return novaNota;
    });

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: respostaFiscal.mensagem || "NF-e emitida e autorizada com sucesso!",
        nota,
      },
      { status: 201 }
    );
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
    console.error("Erro ao emitir NF-e:", error);
    return NextResponse.json({ erro: "Erro ao emitir nota fiscal" }, { status: 500 });
  }
}
