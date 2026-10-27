import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Lista de páginas que o Google deve visitar. Produtos e categorias da loja entram só quando a loja está aberta.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();
  const fixas: [string, number][] = [
    ["/sublimacao", 1],
    ["/pedido", 0.9],
    ["/catalogo", 0.8],
    ["/tamanhos", 0.6],
    ["/contato", 0.6],
    ["/ajuda", 0.5],
    ["/rastreio", 0.4],
  ];
  const lista: MetadataRoute.Sitemap = fixas.map(([caminho, prioridade]) => ({
    url: `${SITE_URL}${caminho}`,
    lastModified: agora,
    priority: prioridade,
  }));

  try {
    // importado aqui dentro: se o banco falhar, o sitemap continua saindo com as páginas fixas
    const { lerLoja } = await import("@/lib/loja");
    const loja = await lerLoja();
    if (loja.config.aberta) {
      lista.unshift({ url: SITE_URL, lastModified: agora, priority: 1 });
      for (const rota of ["/loja/novidades", "/loja/ofertas", "/loja/todos"]) {
        lista.push({ url: `${SITE_URL}${rota}`, lastModified: agora, priority: 0.7 });
      }
      const idsCat = new Set<string>();
      for (const c of loja.categorias.filter((x) => x.visivel)) {
        idsCat.add(c.id);
        lista.push({ url: `${SITE_URL}/loja/categoria/${c.id}`, lastModified: agora, priority: 0.7 });
      }
      for (const p of loja.produtos.filter((x) => x.visivel && (x.categoriaId === "" || idsCat.has(x.categoriaId)))) {
        lista.push({ url: `${SITE_URL}/loja/produto/${p.id}`, lastModified: new Date(p.criadoEm || agora), priority: 0.8 });
      }
    }
  } catch {
    // sem banco de dados: o sitemap fica só com as páginas fixas
  }
  return lista;
}
