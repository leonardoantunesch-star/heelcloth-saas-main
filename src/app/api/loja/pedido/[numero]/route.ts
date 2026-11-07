import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { confirmarPagamento } from "@/lib/loja";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

// GET /api/loja/pedido/[numero]?payment_id=... - situação de um pedido da loja (para a página de retorno).
// Mostra só a situação e o total; nada de dados pessoais.
export async function GET(req: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    if (!/^LJ-\d{4}-[A-Z0-9]{4}$/.test(numero)) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    const pagamento = req.nextUrl.searchParams.get("payment_id");
    // A página de retorno consulta a cada 5 s (até 12 vezes); o limite deixa folga para isso, mas barra abuso.
    // Com payment_id, cada chamada gasta a cota do Mercado Pago, então o limite é menor.
    const lim = await limitar(`lojapedido:${pagamento ? "mp" : "ler"}:${ipDe(req)}`, pagamento ? 40 : 120, 600);
    if (!lim.ok) {
      return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429, headers: { "Retry-After": String(lim.esperaSeg) } });
    }
    if (pagamento) await confirmarPagamento(pagamento); // caso o aviso do Mercado Pago ainda não tenha chegado
    const pedido = await prisma.order.findUnique({
      where: { orderNumber: numero },
      select: { orderNumber: true, status: true, totalAmount: true },
    });
    if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json({ protocolo: pedido.orderNumber, status: pedido.status, total: pedido.totalAmount });
  } catch (erro) {
    console.error("Erro ao consultar pedido da loja:", erro);
    return NextResponse.json({ erro: "Não foi possível consultar o pedido." }, { status: 500 });
  }
}
