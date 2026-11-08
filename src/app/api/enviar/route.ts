import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CORES_MEIAO, PRECOS_PADRAO, calcularOrcamento, gerarProtocolo } from "@/lib/orcamento";
import { prisma } from "@/lib/db";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

const MIN_CAMISAS = 10;
const FORMAS_PAGAMENTO = ["PIX", "TRANSFERENCIA", "DINHEIRO"] as const;

const coresMeiao = CORES_MEIAO.map((c) => c.valor) as [string, ...string[]];

// Tamanho máximo de cada texto: ninguém grava um parágrafo gigante no banco.
const itemSchema = z.object({
  nome: z.string().max(60).optional().default(""),
  numero: z.string().max(4).optional().default(""),
  tamCamisa: z.string().max(12).optional().default(""),
  tamShort: z.string().max(12).optional().default(""),
  goleiro: z.boolean().optional().default(false),
  meiao: z.enum(["", ...coresMeiao]).optional().default(""),
  opcoes: z.array(z.string().max(60)).max(10).optional().default([]),
  obs: z.string().max(300).optional().default(""),
});

const enviarSchema = z.object({
  representante: z.string().min(1, "Informe o nome do representante.").max(100),
  contato: z.string().min(10, "Informe o WhatsApp com DDD.").max(30, "WhatsApp inválido."),
  pagamento: z.enum(FORMAS_PAGAMENTO, { message: "Escolha a forma de pagamento." }),
  modelo: z.string().max(2000).optional().default(""),
  itens: z.array(itemSchema).min(1, "Lista inválida.").max(300, "A lista passou de 300 peças. Fale com a gente pelo WhatsApp."),
});

export async function POST(req: NextRequest) {
  try {
    // Até 5 pedidos por hora por IP. Um time real manda 1 ou 2; um script que enche o banco é barrado.
    const lim = await limitar(`enviar:ip:${ipDe(req)}`, 5, 3600);
    if (!lim.ok) {
      return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429, headers: { "Retry-After": String(lim.esperaSeg) } });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
    }
    const parsed = enviarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { representante, contato, pagamento, modelo, itens: rawItens } = parsed.data;

    // Filtra itens com tamanho definido
    const itens = rawItens.filter((i) => Boolean(i.tamCamisa || i.tamShort || i.meiao));

    const totalCamisas = itens.filter((i) => Boolean(i.tamCamisa)).length;
    const totalShorts = itens.filter((i) => Boolean(i.tamShort)).length;
    const totalMeioes = itens.filter((i) => Boolean(i.meiao)).length;

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
        paymentMethod: pagamento,
        notes: modelo.trim() || null,
        items: {
          create: [
            ...(totalCamisas > 0
              ? [
                  {
                    product: "Camisa de Jogo Personalizada",
                    quantity: totalCamisas,
                    unitPrice: orcamento.totais.camisas / (totalCamisas || 1),
                    totalPrice: orcamento.totais.camisas,
                  },
                ]
              : []),
            ...(totalShorts > 0
              ? [
                  {
                    product: "Calção Esportivo",
                    quantity: totalShorts,
                    unitPrice: orcamento.totais.shorts / (totalShorts || 1),
                    totalPrice: orcamento.totais.shorts,
                  },
                ]
              : []),
            ...(totalMeioes > 0
              ? [
                  {
                    product: "Meião",
                    quantity: totalMeioes,
                    unitPrice: orcamento.totais.meioes / (totalMeioes || 1),
                    totalPrice: orcamento.totais.meioes,
                  },
                ]
              : []),
          ],
        },
        players: {
          create: itens.map((item, idx) => ({
            playerIndex: idx + 1,
            name: (item.nome || `JOGADOR ${idx + 1}`).trim().toUpperCase(),
            number: (item.numero || "").trim(),
            size: item.tamCamisa || "-", // pedido só de short: sem camisa
            model: item.goleiro ? "GOLEIRO" : "JOGADOR",
            shortSize: item.tamShort || null,
            options:
              [...(item.opcoes || []), ...(item.meiao ? [`meiao ${item.meiao}`] : [])].join(", ") || null,
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
      meioes: totalMeioes,
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
