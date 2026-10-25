import { NextRequest } from "next/server";
import { lerImagem } from "@/lib/catalogo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/catalogo/imagem/[id] - Imagem pública do catálogo (o id é um código aleatório; a imagem nunca muda).
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const img = await lerImagem(id);
    if (!img) return new Response("Imagem não encontrada", { status: 404 });
    return new Response(new Uint8Array(img.dados), {
      headers: {
        "Content-Type": img.tipo,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (erro) {
    console.error("Erro ao ler imagem do catálogo:", erro);
    return new Response("Erro ao carregar a imagem", { status: 500 });
  }
}
