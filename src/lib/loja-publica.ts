import { cache } from "react";
import { getSession } from "@/lib/auth";
import { lerLoja } from "@/lib/loja";
import type { Loja } from "@/data/loja";

// Leitura da loja para as páginas públicas: uma consulta por requisição (o layout e a página dividem o resultado).
export const lojaDaRequisicao = cache(async () => {
  const loja = await lerLoja();
  const admin = !loja.config.aberta ? Boolean(await getSession().catch(() => null)) : false;
  const categorias = loja.categorias.filter((c) => c.visivel);
  const idsCat = new Set(categorias.map((c) => c.id));
  const produtos = loja.produtos
    .filter((p) => p.visivel && (p.categoriaId === "" || idsCat.has(p.categoriaId)))
    .sort((a, b) => b.criadoEm - a.criadoEm);
  return {
    config: loja.config,
    categorias,
    produtos,
    // Loja fechada: só quem está logado no painel enxerga (para revisar antes de abrir).
    visivel: loja.config.aberta || admin,
    previa: !loja.config.aberta && admin,
  } satisfies { config: Loja["config"]; categorias: Loja["categorias"]; produtos: Loja["produtos"]; visivel: boolean; previa: boolean };
});
