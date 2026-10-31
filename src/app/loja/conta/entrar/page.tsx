import { Suspense } from "react";
import { TelaEntrar } from "@/components/loja/ContaTelas";

export const metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaEntrar />
    </Suspense>
  );
}
