import { redirect } from "next/navigation";

// O endereço antigo da loja (/loja) agora leva para a página inicial, onde a loja fica.
export default function LojaAntiga() {
  redirect("/");
}
