import { Suspense } from "react";
import { TelaVerificar } from "@/components/loja/ContaTelas";

export const metadata = { title: "Confirmar e-mail", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaVerificar />
    </Suspense>
  );
}
