import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { gerarProtocolo } from "@/lib/orcamento";
import { baixarEstoque, criarPreferencia, lerLoja, tokenMercadoPago } from "@/lib/loja";
import { calcularFrete, precoFinal } from "@/data/loja";

const r2 = (v: number) => Math.round(v * 100) / 100;

const pedidoSchema = z
  .object({
    cliente: z.object({
      nome: z.string().trim().min(3, "Informe seu nome completo.").max(100),
      whatsapp: z.string().trim().regex(/^[\d\s()+-]{10,20}$/, "Informe o WhatsApp com DDD."),
      email: z.string().trim().email("E-mail inválido.").max(120),
      cpf: z.string().trim().regex(/^[\d.\-\s]{11,14}$/, "CPF inválido."),
    }),
    retirada: z.boolean(),
    endereco: z
      .object({
        cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
        rua: z.string().trim().min(2, "Informe a rua.").max(120),
        numero: z.string().trim().min(1, "Informe o número.").max(10),
        complemento: z.string().trim().max(60),
        bairro: z.string().trim().min(2, "Informe o bairro.").max(60),
        cidade: z.string().trim().min(2, "Informe a cidade.").max(60),
        uf: z.string().trim().regex(/^[A-Za-z]{2}$/, "UF inválida."),
      })
      .nullable(),
    itens: z
      .array(
        z.object({
          produtoId: z.string().max(80),
          tamanho: z.string().max(12),
          quantidade: z.number().int().min(1).max(50),
        })
      )
      .min(1, "Seu carrinho está vazio.")
      .max(50),
  })
  .refine((d) => d.retirada || d.endereco !== null, { message: "Informe o endereço de entrega." });

// POST /api/loja/pedido - fecha a compra: confere preço e estoque no servidor, grava o pedido e
// devolve o link de pagamento do Mercado Pago.
export async function POST(req: NextRequest) {
  try {
    const parsed = pedidoSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    const { cliente, retirada, endereco, itens } = parsed.data;
    const loja = await lerLoja();
    if (!loja.config.aberta && !(await getSession(req))) {
      return NextResponse.json({ erro: "A loja ainda não está aberta." }, { status: 403 });
    }

    // Junta linhas repetidas e confere cada uma com o cadastro (o preço do navegador é ignorado).
    const juntos = new Map<string, { produtoId: string; tamanho: string; quantidade: number }>();
    for (const i of itens) {
      const k = `${i.produtoId}|${i.tamanho}`;
      const atual = juntos.get(k);
      juntos.set(k, { ...i, quantidade: (atual?.quantidade ?? 0) + i.quantidade });
    }
    const linhas = [];
    for (const i of juntos.values()) {
      const p = loja.produtos.find((x) => x.id === i.produtoId && x.visivel);
      if (!p) return NextResponse.json({ erro: "Um produto do carrinho não está mais disponível." }, { status: 409 });
      const t = p.tamanhos.find((x) => x.nome === i.tamanho);
      if (!t) return NextResponse.json({ erro: `Escolha um tamanho válido para ${p.nome}.` }, { status: 409 });
      if (t.estoque < i.quantidade) {
        return NextResponse.json(
          { erro: t.estoque === 0 ? `${p.nome} (${t.nome}) esgotou.` : `Só temos ${t.estoque} de ${p.nome} (${t.nome}).` },
          { status: 409 }
        );
      }
      linhas.push({ produto: p, tamanho: t.nome, quantidade: i.quantidade, preco: precoFinal(p) });
    }

    const subtotal = r2(linhas.reduce((s, l) => s + l.preco * l.quantidade, 0));
    const frete = calcularFrete(loja.config, subtotal, retirada);
    const total = r2(subtotal + frete);
    const protocolo = gerarProtocolo().replace(/^HC-/, "LJ-");
    const so = (v: string) => v.replace(/\D/g, "");
    const enderecoTexto = endereco
      ? `${endereco.rua}, ${endereco.numero}${endereco.complemento ? ` - ${endereco.complemento}` : ""}, ${endereco.bairro}, ${endereco.cidade}/${endereco.uf.toUpperCase()}, CEP ${endereco.cep}`
      : null;

    let customer = await prisma.customer.findFirst({ where: { OR: [{ whatsapp: cliente.whatsapp }, { email: cliente.email }] } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: cliente.nome,
          whatsapp: cliente.whatsapp,
          phone: cliente.whatsapp,
          email: cliente.email,
          document: so(cliente.cpf),
          address: enderecoTexto,
        },
      });
    }

    const comPagamentoOnline = Boolean(tokenMercadoPago());
    const pedido = await prisma.order.create({
      data: {
        orderNumber: protocolo,
        customerId: customer.id,
        status: "PAGAMENTO_PENDENTE",
        totalAmount: total,
        paidAmount: 0,
        pendingAmount: total,
        paymentMethod: comPagamentoOnline ? "MERCADO_PAGO" : null,
        notes: [
          "Pedido da loja online.",
          retirada ? "Entrega: retirada no local." : `Entrega: ${enderecoTexto}`,
          `Frete: R$ ${frete.toFixed(2)}`,
          `Cliente: ${cliente.nome} · ${cliente.email} · CPF ${cliente.cpf}`,
        ].join("\n"),
        items: {
          create: linhas.map((l) => ({
            product: l.produto.nome,
            quantity: l.quantidade,
            size: l.tamanho,
            color: l.produto.cor || null,
            notes: l.produto.id, // usado para dar baixa no estoque
            unitPrice: l.preco,
            totalPrice: r2(l.preco * l.quantidade),
          })),
        },
      },
      include: { items: true },
    });

    if (!comPagamentoOnline) {
      // Sem Mercado Pago configurado: reserva o estoque agora e o pagamento é combinado pelo WhatsApp.
      await baixarEstoque(pedido.items);
      return NextResponse.json({ ok: true, protocolo, total, pagamentoUrl: null });
    }

    try {
      const pagamentoUrl = await criarPreferencia({
        protocolo,
        itens: linhas.map((l) => ({ titulo: `${l.produto.nome} (${l.tamanho})`, quantidade: l.quantidade, preco: l.preco })),
        frete,
        email: cliente.email,
        nome: cliente.nome,
        origem: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin,
        parcelasMax: loja.config.pagamento.parcelasMax,
      });
      return NextResponse.json({ ok: true, protocolo, total, pagamentoUrl });
    } catch {
      return NextResponse.json({ ok: true, protocolo, total, pagamentoUrl: null, avisoPagamento: true });
    }
  } catch (erro) {
    console.error("Erro ao fechar pedido da loja:", erro);
    return NextResponse.json({ erro: "Não foi possível finalizar a compra. Tente de novo." }, { status: 500 });
  }
}
