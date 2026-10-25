import { prisma } from "@/lib/db";
import {
  LOJA_PADRAO,
  ID_IMAGEM_LOJA,
  categoriaSchema,
  configSchema,
  produtoSchema,
  type Loja,
} from "@/data/loja";

// Servidor da loja: leitura/gravação da configuração, imagens e pagamento (Mercado Pago).
const CHAVE = "loja";
const PREFIXO_IMAGEM = "loja-img:";
const UMA_HORA = 60 * 60 * 1000;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const LIMITE_DATA_URL = 1_200_000; // ~900 KB de imagem

// Cada parte é validada separadamente: se uma estiver estragada, só ela volta ao padrão.
function interpretar(bruto: unknown): Loja {
  const o = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const cfgSalva = (o.config && typeof o.config === "object" ? o.config : {}) as Record<string, unknown>;
  const cfg = configSchema.safeParse({ ...LOJA_PADRAO.config, ...cfgSalva });
  const lista = <T,>(v: unknown, schema: { safeParse: (x: unknown) => { success: boolean; data?: T } }, padrao: T[]) =>
    Array.isArray(v)
      ? v.map((x) => schema.safeParse(x)).filter((r) => r.success).map((r) => r.data as T)
      : padrao;
  return {
    config: cfg.success ? cfg.data : LOJA_PADRAO.config,
    categorias: lista(o.categorias, categoriaSchema, LOJA_PADRAO.categorias),
    produtos: lista(o.produtos, produtoSchema, LOJA_PADRAO.produtos),
  };
}

export async function lerLoja(): Promise<Loja> {
  try {
    const linha = await prisma.setting.findUnique({ where: { key: CHAVE } });
    if (!linha) return LOJA_PADRAO;
    return interpretar(JSON.parse(linha.value));
  } catch (erro) {
    console.error("Loja: usando valores de partida (banco indisponível ou JSON inválido).", erro);
    return LOJA_PADRAO;
  }
}

async function gravar(loja: Loja) {
  const valor = JSON.stringify(loja);
  await prisma.setting.upsert({
    where: { key: CHAVE },
    update: { value: valor },
    create: { key: CHAVE, value: valor, description: "Loja online (JSON)" },
  });
}

function imagensUsadas(loja: Loja) {
  const s = new Set<string>();
  const add = (id: string | null) => id && s.add(id);
  add(loja.config.marca.logo);
  loja.config.banners.forEach((b) => add(b.imagem));
  loja.config.blocos.forEach((b) => add(b.imagem));
  loja.categorias.forEach((c) => add(c.imagem));
  loja.produtos.forEach((p) => p.imagens.forEach(add));
  return s;
}

export async function salvarLoja(loja: Loja): Promise<Loja> {
  const final = interpretar(loja);
  await gravar(final);
  // Apaga imagens que não estão mais em uso (as da última hora ficam: pode haver edição em andamento).
  try {
    const usadas = imagensUsadas(final);
    const todas = await prisma.setting.findMany({
      where: { key: { startsWith: PREFIXO_IMAGEM } },
      select: { key: true, updatedAt: true },
    });
    const corte = Date.now() - UMA_HORA;
    const orfas = todas
      .filter((t) => !usadas.has(t.key.slice(PREFIXO_IMAGEM.length)) && t.updatedAt.getTime() < corte)
      .map((t) => t.key);
    if (orfas.length > 0) await prisma.setting.deleteMany({ where: { key: { in: orfas } } });
  } catch (erro) {
    console.error("Loja: não foi possível limpar imagens antigas.", erro);
  }
  return final;
}

export async function salvarImagemLoja(dataUrl: string): Promise<string> {
  if (dataUrl.length > LIMITE_DATA_URL || !DATA_URL.test(dataUrl)) throw new Error("IMAGEM_INVALIDA");
  const id = crypto.randomUUID();
  await prisma.setting.create({ data: { key: PREFIXO_IMAGEM + id, value: dataUrl, description: "Imagem da loja" } });
  return id;
}

export async function lerImagemLoja(id: string): Promise<{ tipo: string; dados: Buffer } | null> {
  if (!ID_IMAGEM_LOJA.test(id)) return null;
  const linha = await prisma.setting.findUnique({ where: { key: PREFIXO_IMAGEM + id } });
  if (!linha) return null;
  const m = DATA_URL.exec(linha.value);
  return m ? { tipo: m[1], dados: Buffer.from(m[2], "base64") } : null;
}

// Tira do estoque as peças de um pedido. Cada item guarda "produtoId" em notes e o tamanho em size.
export async function baixarEstoque(itens: { notes: string | null; size: string | null; quantity: number }[]) {
  const loja = await lerLoja();
  for (const item of itens) {
    const p = loja.produtos.find((x) => x.id === item.notes);
    const t = p?.tamanhos.find((x) => x.nome === item.size);
    if (t) t.estoque = Math.max(0, t.estoque - item.quantity);
  }
  await gravar(loja);
}

// ------------------------------------------------------------------
// MERCADO PAGO (Checkout Pro). Configure MERCADOPAGO_ACCESS_TOKEN na Vercel.
// ------------------------------------------------------------------
export const tokenMercadoPago = () => process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";

export async function criarPreferencia(args: {
  protocolo: string;
  itens: { titulo: string; quantidade: number; preco: number }[];
  frete: number;
  email?: string;
  nome: string;
  origem: string;
  parcelasMax: number;
}): Promise<string> {
  const itens = args.itens.map((i) => ({
    title: i.titulo.slice(0, 250),
    quantity: i.quantidade,
    unit_price: Math.round(i.preco * 100) / 100,
    currency_id: "BRL",
  }));
  if (args.frete > 0) itens.push({ title: "Frete", quantity: 1, unit_price: args.frete, currency_id: "BRL" });
  const voltar = `${args.origem}/loja/obrigado?pedido=${encodeURIComponent(args.protocolo)}`;
  const https = args.origem.startsWith("https://");
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenMercadoPago()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": args.protocolo,
    },
    body: JSON.stringify({
      items: itens,
      external_reference: args.protocolo,
      payer: { name: args.nome, ...(args.email ? { email: args.email } : {}) },
      back_urls: { success: voltar, pending: voltar, failure: voltar },
      ...(https ? { auto_return: "approved", notification_url: `${args.origem}/api/loja/webhook` } : {}),
      payment_methods: { installments: args.parcelasMax },
      statement_descriptor: "HEELCLOTH",
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { init_point?: string; message?: string };
  if (!res.ok || !json.init_point) {
    console.error("Mercado Pago: erro ao criar preferência", res.status, json);
    throw new Error("PAGAMENTO_INDISPONIVEL");
  }
  return json.init_point;
}

// Consulta o pagamento direto no Mercado Pago (nunca confia no que chega pela URL ou pelo aviso)
// e, se aprovado e com o valor certo, marca o pedido como pago e tira as peças do estoque.
export async function confirmarPagamento(paymentId: string): Promise<void> {
  if (!tokenMercadoPago() || !/^\d{1,30}$/.test(paymentId)) return;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${tokenMercadoPago()}` },
    cache: "no-store",
  });
  if (!res.ok) return;
  const pg = (await res.json()) as { status?: string; external_reference?: string; transaction_amount?: number };
  if (pg.status !== "approved" || !pg.external_reference) return;

  const pedido = await prisma.order.findUnique({
    where: { orderNumber: pg.external_reference },
    include: { items: true },
  });
  if (!pedido || pedido.status !== "PAGAMENTO_PENDENTE") return;
  if ((pg.transaction_amount ?? 0) + 0.01 < pedido.totalAmount) {
    console.error("Mercado Pago: valor pago menor que o pedido", pedido.orderNumber, pg.transaction_amount);
    return;
  }
  // updateMany com o status na condição: se dois avisos chegarem juntos, só um baixa o estoque.
  const r = await prisma.order.updateMany({
    where: { id: pedido.id, status: "PAGAMENTO_PENDENTE" },
    data: { status: "PAGAMENTO_CONFIRMADO", paidAmount: pedido.totalAmount, pendingAmount: 0 },
  });
  if (r.count === 1) await baixarEstoque(pedido.items);
}
