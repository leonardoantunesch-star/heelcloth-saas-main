import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatarParaVba } from "@/services/coreldraw";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const jogadorItemSchema = z.object({
  playerIndex: z.number().int().min(1),
  name: z.string().min(1, "Nome do jogador é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  size: z.string().min(1, "Tamanho é obrigatório"),
  model: z.string().default("Jogador"),
  shortSize: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const salvarJogadoresSchema = z.object({
  players: z.array(jogadorItemSchema).optional(),
  textoColado: z.string().optional(), // Para colar direto de Excel / CSV / WhatsApp
  permitirDuplicados: z.boolean().default(false), // Flag de controle
});

// Parser de texto colado (planilha tabulada, CSV ou delimitado por vírgula/ponto-e-vírgula)
function parseTextoColado(texto: string) {
  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const jogadores: any[] = [];

  linhas.forEach((linha, idx) => {
    // Detectar delimitador: TAB, ponto-e-vírgula ou vírgula
    let colunas: string[] = [];
    if (linha.includes("\t")) {
      colunas = linha.split("\t").map((c) => c.trim());
    } else if (linha.includes(";")) {
      colunas = linha.split(";").map((c) => c.trim());
    } else if (linha.includes(",")) {
      colunas = linha.split(",").map((c) => c.trim());
    } else {
      // Espaços múltiplos
      colunas = linha.split(/\s{2,}/).map((c) => c.trim());
    }

    if (colunas.length >= 2) {
      // Ignorar cabeçalho caso tenha sido colado junto
      const primeiraCol = colunas[0].toLowerCase();
      if (primeiraCol === "jogador" || primeiraCol === "nome" || primeiraCol === "#") {
        return;
      }

      // Possíveis estruturas:
      // Formato A: Nome, Número, Tamanho, Modelo, Calção
      // Formato B: Index, Nome, Número, Tamanho, Modelo
      let name = "";
      let number = "";
      let size = "M";
      let model = "Jogador";
      let shortSize = "";

      if (colunas.length === 2) {
        name = colunas[0];
        number = colunas[1];
      } else if (colunas.length === 3) {
        name = colunas[0];
        number = colunas[1];
        size = colunas[2] || "M";
      } else if (colunas.length === 4) {
        name = colunas[0];
        number = colunas[1];
        size = colunas[2] || "M";
        model = colunas[3] || "Jogador";
      } else {
        name = colunas[0];
        number = colunas[1];
        size = colunas[2] || "M";
        model = colunas[3] || "Jogador";
        shortSize = colunas[4] || "";
      }

      jogadores.push({
        playerIndex: jogadores.length + 1,
        name: name.toUpperCase(),
        number: number.replace(/\D/g, "") || number,
        size: size.toUpperCase(),
        model: model,
        shortSize: shortSize ? shortSize.toUpperCase() : null,
      });
    }
  });

  return jogadores;
}

// GET /api/pedidos/[id]/jogadores - Listar jogadores e exportar para CorelDRAW VBA
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        players: { orderBy: { playerIndex: "asc" } },
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    // Verificar se há duplicidade de números na equipe
    const numeros = pedido.players.map((p) => p.number);
    const duplicados = numeros.filter((num, idx) => numeros.indexOf(num) !== idx);

    // Formatar para macro VBA do CorelDRAW (Seção 16)
    const vbaTexto = formatarParaVba(
      pedido.players.map((p) => ({
        nome: p.name,
        numero: p.number,
        tamanho: p.size,
        modelo: p.model,
        observacoes: p.notes || undefined,
      }))
    );

    return NextResponse.json({
      sucesso: true,
      total: pedido.players.length,
      jogadores: pedido.players,
      numerosDuplicados: Array.from(new Set(duplicados)),
      textoVbaCorelDraw: vbaTexto,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar jogadores:", error);
    return NextResponse.json({ erro: "Erro ao listar jogadores" }, { status: 500 });
  }
}

// POST /api/pedidos/[id]/jogadores - Salvar / Importar lista de jogadores com validação de duplicidade
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = salvarJogadoresSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { players, textoColado, permitirDuplicados } = parsed.data;

    let listaParaSalvar: any[] = [];

    if (textoColado && textoColado.trim().length > 0) {
      listaParaSalvar = parseTextoColado(textoColado);
    } else if (players && players.length > 0) {
      listaParaSalvar = players;
    } else {
      return NextResponse.json(
        { erro: "Nenhum jogador informado ou texto para importação fornecido." },
        { status: 400 }
      );
    }

    if (listaParaSalvar.length === 0) {
      return NextResponse.json(
        { erro: "Nenhum jogador pôde ser reconhecido no texto fornecido." },
        { status: 400 }
      );
    }

    // REGRA DA SEÇÃO 6: Validação de dados duplicados (mesmo número repetido na mesma equipe)
    const contagemNumeros: Record<string, number> = {};
    const duplicados: string[] = [];

    listaParaSalvar.forEach((j) => {
      const num = String(j.number).trim();
      contagemNumeros[num] = (contagemNumeros[num] || 0) + 1;
      if (contagemNumeros[num] === 2) {
        duplicados.push(num);
      }
    });

    if (duplicados.length > 0 && !permitirDuplicados) {
      return NextResponse.json(
        {
          erro: `Atenção: Existem números repetidos nesta equipe: [Camisa(s) Nº ${duplicados.join(", ")}]. Por favor, confira a lista antes de salvar.`,
          numerosDuplicados: duplicados,
          requerConfirmacao: true,
        },
        { status: 422 }
      );
    }

    // Gravar lista substituindo os anteriores em transação atômica
    await prisma.$transaction(async (tx) => {
      await tx.orderPlayer.deleteMany({ where: { orderId: id } });

      for (let i = 0; i < listaParaSalvar.length; i++) {
        const j = listaParaSalvar[i];
        await tx.orderPlayer.create({
          data: {
            orderId: id,
            playerIndex: i + 1,
            name: String(j.name).trim().toUpperCase(),
            number: String(j.number).trim(),
            size: String(j.size).trim().toUpperCase(),
            model: String(j.model || "Jogador").trim(),
            shortSize: j.shortSize ? String(j.shortSize).trim().toUpperCase() : null,
            notes: j.notes ? String(j.notes).trim() : null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "ATUALIZACAO",
          entity: "PERSONALIZACAO_JOGADORES",
          entityId: id,
          details: JSON.stringify({
            totalJogadores: listaParaSalvar.length,
          }),
        },
      });
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `${listaParaSalvar.length} jogadores cadastrados com sucesso!`,
      total: listaParaSalvar.length,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao salvar jogadores:", error);
    return NextResponse.json({ erro: "Erro ao salvar jogadores" }, { status: 500 });
  }
}
