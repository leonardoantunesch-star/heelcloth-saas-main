import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ListaProdutos } from "@/components/loja/ListaProdutos";

export const metadata = { title: "Lançamentos" };

export default async function Novidades() {
  const { config, produtos } = await lojaDaRequisicao();
  return <ListaProdutos titulo={config.textos.lancamentos || "Lançamentos"} produtos={produtos.filter((p) => p.lancamento)} parcelasMax={config.pagamento.parcelasMax} />;
}
