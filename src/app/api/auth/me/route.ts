import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }

  return NextResponse.json({
    autenticado: true,
    usuario: {
      id: session.userId,
      nome: session.name,
      email: session.email,
      perfil: session.role,
    },
  });
}
