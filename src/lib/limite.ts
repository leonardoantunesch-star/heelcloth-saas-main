import crypto from "crypto";
import { prisma } from "./db";

// Limite de tentativas guardado no banco (funciona na Vercel, onde cada requisição pode cair numa máquina diferente).
// Janela fixa: depois de "max" tentativas na janela, bloqueia até a janela acabar.

export function ipDe(req: Request): string {
  const h = req.headers;
  return h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

// Guarda só uma impressão do e-mail, nunca o e-mail inteiro.
export const marcaDe = (valor: string) => crypto.createHash("sha256").update(valor.toLowerCase().trim()).digest("hex").slice(0, 24);

// O banco guarda só a impressão da chave (que pode conter IP ou e-mail), nunca o valor legível.
const guardar = (chave: string) => "h:" + crypto.createHash("sha256").update(chave).digest("hex").slice(0, 32);

export async function limitar(chaveLegivel: string, max: number, janelaSeg: number): Promise<{ ok: boolean; esperaSeg: number }> {
  const chave = guardar(chaveLegivel);
  try {
    const agora = new Date();
    const fim = new Date(agora.getTime() + janelaSeg * 1000);
    await prisma.limiteTaxa.updateMany({ where: { chave, expiraEm: { lt: agora } }, data: { contagem: 0, expiraEm: fim } });
    await prisma.limiteTaxa.upsert({ where: { chave }, create: { chave, contagem: 0, expiraEm: fim }, update: {} });
    const r = await prisma.limiteTaxa.update({ where: { chave }, data: { contagem: { increment: 1 } } });
    if (Math.random() < 0.02) {
      prisma.limiteTaxa.deleteMany({ where: { expiraEm: { lt: new Date(Date.now() - 86_400_000) } } }).catch(() => {});
    }
    if (r.contagem > max) return { ok: false, esperaSeg: Math.max(1, Math.ceil((r.expiraEm.getTime() - agora.getTime()) / 1000)) };
    return { ok: true, esperaSeg: 0 };
  } catch (erro) {
    // Se o contador falhar, a loja continua funcionando (o login não pode parar por causa dele).
    console.error("Limite de tentativas:", erro);
    return { ok: true, esperaSeg: 0 };
  }
}

export async function zerarLimite(chave: string) {
  await prisma.limiteTaxa.deleteMany({ where: { chave: guardar(chave) } }).catch(() => {});
}

export function textoEspera(seg: number) {
  const min = Math.ceil(seg / 60);
  return min <= 1 ? "Muitas tentativas. Espere 1 minuto e tente de novo." : `Muitas tentativas. Espere ${min} minutos e tente de novo.`;
}
