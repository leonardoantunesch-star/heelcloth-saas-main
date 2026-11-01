import { Suspense } from "react";
import { TelaRedefinir } from "@/components/loja/ContaTelas";

export const metadata = { title: "Nova senha", robots: { index: false, follow: false } };

export default function Pagina() {
  return (
    <Suspense>
      <TelaRedefinir />
    </Suspense>
  );
}
