import { prisma } from "@/lib/db";
import { PRODUTOS_PADRAO, type ModeloCatalogo, type ProdutoCatalogo } from "@/data/catalogo";

// O catálogo editável fica numa linha da tabela de configurações (Setting), em JSON.
// As imagens ficam em linhas próprias ("catalogo-img:<id>") e são servidas por /api/catalogo/imagem/[id].
const CHAVE = "catalogo";
const PREFIXO_IMAGEM = "catalogo-img:";
const UMA_HORA = 60 * 60 * 1000;

export const ID_IMAGEM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const LIMITE_DATA_URL = 900_000; // ~650 KB de imagem

// Parte do produto que pode ser editada no painel.
export type ProdutoSalvo = Pick<ProdutoCatalogo, "id" | "nome" | "descricao" | "destaques" | "imagem" | "visivel" | "modelos">;

const texto = (v: unknown, max: number, padrao = "") =>
  typeof v === "string" ? v.trim().slice(0, max) : padrao;
const idImagem = (v: unknown) => (typeof v === "string" && ID_IMAGEM.test(v) ? v : null);

function limparModelos(v: unknown): ModeloCatalogo[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((m): ModeloCatalogo | null => {
      if (!m || typeof m !== "object") return null;
      const o = m as Record<string, unknown>;
      const id = texto(o.id, 60);
      const nome = texto(o.nome, 80);
      if (!id || !nome) return null;
      return { id, nome, descricao: texto(o.descricao, 200), imagem: idImagem(o.imagem) };
    })
    .filter((m): m is ModeloCatalogo => m !== null)
    .slice(0, 60);
}

// Junta o que foi salvo com os produtos de partida: produtos novos do sistema aparecem sozinhos.
function mesclar(salvos: unknown): ProdutoCatalogo[] {
  const lista: Record<string, unknown>[] = Array.isArray(salvos) ? (salvos as Record<string, unknown>[]) : [];
  return PRODUTOS_PADRAO.map((padrao) => {
    const s = lista.find((x) => x && x.id === padrao.id);
    if (!s) return padrao;
    const destaques = Array.isArray(s.destaques)
      ? (s.destaques as unknown[]).map((d) => texto(d, 40)).filter(Boolean).slice(0, 6)
      : padrao.destaques;
    return {
      ...padrao,
      nome: texto(s.nome, 80) || padrao.nome,
      descricao: typeof s.descricao === "string" ? texto(s.descricao, 400) : padrao.descricao,
      destaques,
      imagem: idImagem(s.imagem),
      visivel: s.visivel === false ? false : true,
      modelos: limparModelos(s.modelos),
    };
  });
}

// Lê o catálogo. Se o banco não responder ou ainda estiver vazio, usa os produtos de partida.
export async function lerCatalogo(): Promise<ProdutoCatalogo[]> {
  try {
    const linha = await prisma.setting.findUnique({ where: { key: CHAVE } });
    if (!linha) return PRODUTOS_PADRAO;
    return mesclar(JSON.parse(linha.value));
  } catch (erro) {
    console.error("Catálogo: usando valores de partida (banco indisponível ou JSON inválido).", erro);
    return PRODUTOS_PADRAO;
  }
}

export async function salvarCatalogo(produtos: ProdutoSalvo[]): Promise<ProdutoCatalogo[]> {
  const final = mesclar(produtos);
  const valor = JSON.stringify(
    final.map(({ id, nome, descricao, destaques, imagem, visivel, modelos }) => ({
      id, nome, descricao, destaques, imagem, visivel, modelos,
    }))
  );
  await prisma.setting.upsert({
    where: { key: CHAVE },
    update: { value: valor },
    create: { key: CHAVE, value: valor, description: "Catálogo do site (JSON)" },
  });

  // Apaga imagens que não estão mais em uso (as enviadas na última hora ficam, pode haver edição em andamento).
  try {
    const usadas = new Set<string>();
    for (const p of final) {
      if (p.imagem) usadas.add(p.imagem);
      for (const m of p.modelos) if (m.imagem) usadas.add(m.imagem);
    }
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
    console.error("Catálogo: não foi possível limpar imagens antigas.", erro);
  }
  return final;
}

export async function salvarImagem(dataUrl: string): Promise<string> {
  if (dataUrl.length > LIMITE_DATA_URL || !DATA_URL.test(dataUrl)) {
    throw new Error("IMAGEM_INVALIDA");
  }
  const id = crypto.randomUUID();
  await prisma.setting.create({
    data: { key: PREFIXO_IMAGEM + id, value: dataUrl, description: "Imagem do catálogo" },
  });
  return id;
}

export async function lerImagem(id: string): Promise<{ tipo: string; dados: Buffer } | null> {
  if (!ID_IMAGEM.test(id)) return null;
  const linha = await prisma.setting.findUnique({ where: { key: PREFIXO_IMAGEM + id } });
  if (!linha) return null;
  const m = DATA_URL.exec(linha.value);
  if (!m) return null;
  return { tipo: m[1], dados: Buffer.from(m[2], "base64") };
}
