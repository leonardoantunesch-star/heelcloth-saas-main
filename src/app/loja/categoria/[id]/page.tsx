import { notFound } from "next/navigation";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ListaProdutos } from "@/components/loja/ListaProdutos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { categorias } = await lojaDaRequisicao();
  return { title: categorias.find((c) => c.id === id)?.nome ?? "Categoria" };
}

export default async function Categoria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { config, categorias, produtos } = await lojaDaRequisicao();
  const cat = categorias.find((c) => c.id === id);
  if (!cat) notFound();
  return <ListaProdutos titulo={cat.nome} produtos={produtos.filter((p) => p.categoriaId === id)} parcelasMax={config.pagamento.parcelasMax} />;
}
