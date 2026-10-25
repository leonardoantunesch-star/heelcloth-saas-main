import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ListaProdutos } from "@/components/loja/ListaProdutos";

export const metadata = { title: "Busca" };

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { config, produtos, categorias } = await lojaDaRequisicao();
  const termos = normal(q).split(/\s+/).filter(Boolean);
  const achados = produtos.filter((p) => {
    const cat = categorias.find((c) => c.id === p.categoriaId)?.nome ?? "";
    const texto = normal(`${p.nome} ${p.cor} ${p.descricao} ${cat}`);
    return termos.length > 0 && termos.every((t) => texto.includes(t));
  });
  return (
    <ListaProdutos
      titulo={q ? `Busca: “${q.slice(0, 60)}”` : "Busca"}
      produtos={achados}
      parcelasMax={config.pagamento.parcelasMax}
      vazio="Não encontramos nada com esse termo. Tente outra palavra."
    />
  );
}
