import { NextResponse } from "next/server";
import { PRECOS_PADRAO } from "@/lib/orcamento";

export async function GET() {
  // Por enquanto retorna a tabela padrão; na Etapa 3 conectará ao banco de dados / config
  return NextResponse.json(
    { precos: PRECOS_PADRAO },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
