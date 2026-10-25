import { lojaDaRequisicao } from "@/lib/loja-publica";
import { Checkout } from "@/components/loja/Checkout";

export const metadata = { title: "Carrinho" };

export default async function Carrinho() {
  const { produtos } = await lojaDaRequisicao();
  return <Checkout produtos={produtos} />;
}
