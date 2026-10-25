import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ListaProdutos } from "@/components/loja/ListaProdutos";
import { emPromocao } from "@/data/loja";

export const metadata = { title: "Ofertas" };

export default async function Ofertas() {
  const { config, produtos } = await lojaDaRequisicao();
  return <ListaProdutos titulo={config.textos.promocoes || "Ofertas"} produtos={produtos.filter(emPromocao)} parcelasMax={config.pagamento.parcelasMax} vazio="Nenhuma oferta no momento." />;
}
