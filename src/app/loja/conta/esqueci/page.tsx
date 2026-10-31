import { Suspense } from "react";
import { TelaEsqueci } from "@/components/loja/ContaTelas";

export const metadata = { title: "Esqueci minha senha", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaEsqueci />
    </Suspense>
  );
}
