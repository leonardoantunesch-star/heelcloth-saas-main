import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  TEMPLATES_NOTIFICACAO,
  renderizarTemplate,
  gerarLinkWhatsApp,
  getWhatsAppService,
} from "@/services/whatsapp";
import { formatCurrency, formatDate } from "@/lib/utils";

const enviarSchema = z.object({
  orderId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  templateType: z.enum([
    "PEDIDO_CONFIRMADO",
    "PRODUCAO_INICIADA",
    "PRODUCAO_CONCLUIDA",
    "PEDIDO_PRONTO",
    "PEDIDO_ENTREGUE",
    "MENSAGEM_LIVRE",
  ]),
  customMessage: z.string().optional().nullable(),
  dispararAutomatico: z.boolean().default(true),
});

// POST /api/whatsapp/enviar - Enviar notificação de WhatsApp para cliente/pedido
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = enviarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId, customerId, phone, templateType, customMessage, dispararAutomatico } = parsed.data;

    let targetPhone = phone || "";
    let clienteNome = "Cliente";
    let pedidoNumero = "";
    let valorTotalStr = "";
    let valorPagoStr = "";
    let infoSaldo = "";
    let totalPecas = 1;
    let prazoEntregaStr = "A combinar";

    let resolvedOrderId = orderId || null;
    let resolvedCustomerId = customerId || null;

    if (orderId) {
      const pedido = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true, items: true, players: true },
      });

      if (pedido) {
        resolvedOrderId = pedido.id;
        resolvedCustomerId = pedido.customerId;
        targetPhone = targetPhone || pedido.customer.whatsapp || pedido.customer.phone || "";
        clienteNome = pedido.customer.name;
        pedidoNumero = pedido.orderNumber;
        valorTotalStr = formatCurrency(pedido.totalAmount);
        valorPagoStr = formatCurrency(pedido.paidAmount);
        totalPecas = pedido.players.length > 0 ? pedido.players.length : pedido.items.reduce((acc, i) => acc + i.quantity, 0);
        if (pedido.deliveryDeadline) {
          prazoEntregaStr = formatDate(pedido.deliveryDeadline);
        }

        if (pedido.pendingAmount > 0) {
          infoSaldo = `💳 Saldo a liquidar: *${formatCurrency(pedido.pendingAmount)}*`;
        } else {
          infoSaldo = "✅ Pedido 100% quitado!";
        }
      }
    } else if (customerId) {
      const cliente = await prisma.customer.findUnique({ where: { id: customerId } });
      if (cliente) {
        resolvedCustomerId = cliente.id;
        targetPhone = targetPhone || cliente.whatsapp || cliente.phone || "";
        clienteNome = cliente.name;
      }
    }

    if (!targetPhone) {
      return NextResponse.json(
        { erro: "Número de telefone ou WhatsApp não informado ou não cadastrado no cliente." },
        { status: 400 }
      );
    }

    // Renderizar template com as variáveis dinâmicas
    let textoFinal = "";
    if (templateType === "MENSAGEM_LIVRE") {
      textoFinal = customMessage || "Olá!";
    } else {
      const rawTemplate = TEMPLATES_NOTIFICACAO[templateType] || TEMPLATES_NOTIFICACAO.MENSAGEM_LIVRE;
      textoFinal = renderizarTemplate(rawTemplate, {
        cliente: clienteNome,
        pedido: pedidoNumero,
        valorTotal: valorTotalStr,
        valorPago: valorPagoStr,
        totalPecas,
        prazo: prazoEntregaStr,
        infoSaldo,
        mensagem: customMessage || undefined,
      });
    }

    // Disparar via serviço de WhatsApp
    let statusEnvio = "PENDENTE";
    let erroEnvio: string | null = null;
    let sentAt: Date | null = null;

    if (dispararAutomatico) {
      const waService = getWhatsAppService();
      const resposta = await waService.enviarMensagem({
        destinatario: targetPhone,
        evento: templateType.toLowerCase() as any,
        variaveis: {
          nomeCliente: clienteNome,
          numeroPedido: pedidoNumero,
        },
        mensagemPersonalizada: textoFinal,
      });

      if (resposta.sucesso) {
        statusEnvio = "ENVIADO";
        sentAt = new Date();
      } else {
        statusEnvio = "FALHA";
        erroEnvio = resposta.erro || "Falha na conexão com gateway de WhatsApp";
      }
    }

    // Salvar registro no banco de dados
    const msgSalva = await prisma.whatsAppMessage.create({
      data: {
        orderId: resolvedOrderId,
        customerId: resolvedCustomerId,
        phone: targetPhone,
        templateType,
        content: textoFinal,
        status: statusEnvio,
        errorMessage: erroEnvio,
        sentAt,
      },
    });

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "ENVIAR_WHATSAPP",
        entity: "WHATSAPP",
        entityId: msgSalva.id,
        details: JSON.stringify({
          phone: targetPhone,
          templateType,
          status: statusEnvio,
        }),
      },
    });

    const linkWhatsAppWeb = gerarLinkWhatsApp(targetPhone, textoFinal);

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: statusEnvio === "ENVIADO" ? "Mensagem de WhatsApp enviada com sucesso!" : "Mensagem registrada na fila de WhatsApp.",
        registro: msgSalva,
        linkWhatsAppWeb,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao enviar mensagem WhatsApp:", error);
    return NextResponse.json({ erro: "Erro ao processar envio de WhatsApp" }, { status: 500 });
  }
}
