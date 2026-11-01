import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usarCodigo } from "@/lib/conta";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

// POST /api/conta/verificar { codigo } - confirma o e-mail. Só por POST (a página faz a chamada), para que
// programas que "abrem" links de e-mail não gastem o código.
export async function POST(req: NextRequest) {
  try {
    const lim = await limitar(`verificar:${ipDe(req)}`, 20, 3600);
    if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
    const { codigo } = (await req.json().catch(() => ({}))) as { codigo?: string };
    const conta = await usarCodigo(String(codigo ?? ""), "VERIFICAR_EMAIL");
    if (!conta) return NextResponse.json({ erro: "Este link venceu ou já foi usado. Entre na sua conta e peça um novo." }, { status: 400 });
    if (!conta.emailVerificadoEm) await prisma.conta.update({ where: { id: conta.id }, data: { emailVerificadoEm: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("Confirmar e-mail:", erro);
    return NextResponse.json({ erro: "Não foi possível confirmar. Tente de novo." }, { status: 500 });
  }
}
