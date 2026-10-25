import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ListaProdutos } from "@/components/loja/ListaProdutos";

export const metadata = { title: "Todos os produtos" };

export default async function Todos() {
  const { config, produtos } = await lojaDaRequisicao();
  return <ListaProdutos titulo="Todos os produtos" produtos={produtos} parcelasMax={config.pagamento.parcelasMax} />;
}
