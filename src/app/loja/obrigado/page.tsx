import { Obrigado } from "@/components/loja/Obrigado";

export const metadata = { title: "Pedido recebido" };

export default async function Pagina({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <Obrigado protocolo={sp.pedido ?? ""} pagamentoId={sp.payment_id ?? sp.collection_id ?? ""} manual={sp.manual === "1"} />;
}
