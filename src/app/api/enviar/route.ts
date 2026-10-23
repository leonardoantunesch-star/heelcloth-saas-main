import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PRECOS_PADRAO, calcularOrcamento, gerarProtocolo } from "@/lib/orcamento";
import { prisma } from "@/lib/db";

const MIN_CAMISAS = 10;

const itemSchema = z.object({
  nome: z.string().optional().default(""),
  numero: z.string().optional().default(""),
  tamCamisa: z.string().optional().default(""),
  tamShort: z.string().optional().default(""),
  goleiro: z.boolean().optional().default(false),
  opcoes: z.array(z.string()).optional().default([]),
  obs: z.string().optional().default(""),
});

const enviarSchema = z.object({
  representante: z.string().min(1, "Informe o nome do representante.").max(100),
  contato: z.string().min(10, "Informe o WhatsApp com DDD."),
  itens: z.array(itemSchema).min(1, "Lista inválida.").max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = enviarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { representante, contato, itens: rawItens } = parsed.data;

    // Filtra itens com tamanho definido
    const itens = rawItens.filter((i) => Boolean(i.tamCamisa || i.tamShort));

    const totalCamisas = itens.filter((i) => Boolean(i.tamCamisa)).length;
    const totalShorts = itens.filter((i) => Boolean(i.tamShort)).length;

    if (totalCamisas < MIN_CAMISAS) {
      return NextResponse.json(
        { erro: `O pedido precisa ter no mínimo ${MIN_CAMISAS} camisas (recebemos ${totalCamisas}).` },
        { status: 400 }
      );
    }

    const protocolo = gerarProtocolo();
    const orcamento = calcularOrcamento(PRECOS_PADRAO, itens);

    // Salva ou recupera o cliente no banco de dados
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ whatsapp: contato }, { phone: contato }],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: representante,
          whatsapp: contato,
          phone: contato,
        },
      });
    }

    // Cria o pedido e vincula todos os uniformes/jogadores
    const novoPedido = await prisma.order.create({
      data: {
        orderNumber: protocolo,
        customerId: customer.id,
        status: "AGUARDANDO_APROVACAO",
        totalAmount: orcamento.total,
        paidAmount: 0.0,
        pendingAmount: orcamento.total,
        items: {
          create: [
            ...(totalCamisas > 0
              ? [
                  {
                    product: "Camisa de Jogo Personalizada",
                    quantity: totalCamisas,
                    unitPrice: orcamento.total / (totalCamisas || 1),
                    totalPrice: orcamento.total,
                  },
                ]
              : []),
            ...(totalShorts > 0
              ? [
                  {
                    product: "Calção Esportivo",
                    quantity: totalShorts,
                    unitPrice: PRECOS_PADRAO.short,
                    totalPrice: totalShorts * PRECOS_PADRAO.short,
                  },
                ]
              : []),
          ],
        },
        players: {
          create: itens.map((item, idx) => ({
            playerIndex: idx + 1,
            name: (item.nome || `JOGADOR ${idx + 1}`).trim().toUpperCase(),
            number: (item.numero || `${idx + 1}`).trim(),
            size: item.tamCamisa || "M",
            model: item.goleiro ? "GOLEIRO" : "JOGADOR",
            shortSize: item.tamShort || null,
            options: item.opcoes && item.opcoes.length > 0 ? item.opcoes.join(", ") : null,
            notes: item.obs || null,
          })),
        },
        productionOrder: {
          create: {
            currentStage: "ARTE",
            stageStatus: "PENDENTE",
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      protocolo,
      pedidoId: novoPedido.id,
      camisas: totalCamisas,
      shorts: totalShorts,
      orcamento,
    });
  } catch (err) {
    console.error("Erro ao processar envio de pedido:", err);
    return NextResponse.json(
      { erro: "Erro interno ao processar pedido." },
      { status: 500 }
    );
  }
}
