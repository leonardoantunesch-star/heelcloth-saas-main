import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, COOKIE_NAME } from "@/lib/auth";
import { descreverFalha } from "@/lib/erro-login";
import { SENHA_FALSA } from "@/lib/conta";
import { ipDe, limitar, marcaDe, textoEspera, zerarLimite } from "@/lib/limite";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Limite de tentativas: por IP e por e-mail (15 minutos).
    const chaveEmail = `login-equipe:e:${marcaDe(email)}`;
    const porIp = await limitar(`login-equipe:ip:${ipDe(req)}`, 30, 900);
    const porEmail = await limitar(chaveEmail, 6, 900);
    if (!porIp.ok || !porEmail.ok) {
      return NextResponse.json({ erro: textoEspera(Math.max(porIp.esperaSeg, porEmail.esperaSeg)) }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Confere a senha mesmo sem usuário, para o tempo de resposta não revelar quais e-mails existem.
    const senhaConfere = verifyPassword(password, user?.passwordHash ?? SENHA_FALSA);

    if (!user || !user.active) {
      return NextResponse.json(
        { erro: "Credenciais inválidas ou usuário inativo" },
        { status: 401 }
      );
    }

    const isValid = senhaConfere;
    if (!isValid) {
      return NextResponse.json(
        { erro: "Credenciais inválidas ou usuário inativo" },
        { status: 401 }
      );
    }

    await zerarLimite(chaveEmail);

    // Gerar token de sessão (24h)
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "PRODUCAO" | "FINANCEIRO" | "VENDEDOR",
    });

    // Registrar log de login (Auditoria Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "USUARIO",
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    const response = NextResponse.json({
      sucesso: true,
      usuario: {
        id: user.id,
        nome: user.name,
        email: user.email,
        perfil: user.role,
      },
    });

    // Definir cookie seguro
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 horas
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    const { erro, codigo } = descreverFalha(error);
    return NextResponse.json({ erro, codigo }, { status: 500 });
  }
}
