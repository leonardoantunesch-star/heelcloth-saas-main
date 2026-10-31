import { Suspense } from "react";
import { TelaMinhaConta } from "@/components/loja/ContaTelas";

export const metadata = { title: "Minha conta", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaMinhaConta />
    </Suspense>
  );
}
