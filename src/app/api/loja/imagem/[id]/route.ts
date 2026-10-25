import { NextRequest } from "next/server";
import { lerImagemLoja } from "@/lib/loja";

// GET /api/loja/imagem/[id] - imagem pública da loja (o código é aleatório e a imagem nunca muda)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const img = await lerImagemLoja(id);
    if (!img) return new Response("Imagem não encontrada", { status: 404 });
    return new Response(new Uint8Array(img.dados), {
      headers: { "Content-Type": img.tipo, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (erro) {
    console.error("Erro ao ler imagem da loja:", erro);
    return new Response("Erro ao carregar a imagem", { status: 500 });
  }
}
