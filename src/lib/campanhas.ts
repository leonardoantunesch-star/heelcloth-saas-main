import { z } from "zod";
import { prisma } from "@/lib/db";

// Campanhas de marketing (Black Friday, promoções...). Ficam numa linha da tabela de configurações (JSON),
// então não precisa mexer no banco.
const CHAVE = "CAMPANHAS";
export const MAX_CAMPANHAS = 40;

export const campanhaSchema = z.object({
  id: z.string().trim().min(1).max(60),
  nome: z.string().trim().min(2, "Dê um nome à campanha.").max(80),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data final da campanha."),
  concluida: z.boolean(),
});

export const listaCampanhasSchema = z.array(campanhaSchema).max(MAX_CAMPANHAS);

export type Campanha = z.infer<typeof campanhaSchema>;

export async function lerCampanhas(): Promise<Campanha[]> {
  try {
    const linha = await prisma.setting.findUnique({ where: { key: CHAVE } });
    if (!linha) return [];
    const bruto: unknown = JSON.parse(linha.value);
    if (!Array.isArray(bruto)) return [];
    // Aceita as linhas válidas e ignora as estragadas.
    return bruto.map((c) => campanhaSchema.safeParse(c)).filter((r) => r.success).map((r) => r.data as Campanha);
  } catch (erro) {
    console.error("Campanhas: não foi possível ler (lista vazia).", erro);
    return [];
  }
}

export async function gravarCampanhas(lista: Campanha[]): Promise<void> {
  const value = JSON.stringify(lista);
  await prisma.setting.upsert({
    where: { key: CHAVE },
    update: { value },
    create: { key: CHAVE, value, description: "Campanhas de marketing mostradas no dashboard" },
  });
}
