import { Suspense } from "react";
import { TelaCadastrar } from "@/components/loja/ContaTelas";

export const metadata = { title: "Criar conta", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaCadastrar />
    </Suspense>
  );
}
