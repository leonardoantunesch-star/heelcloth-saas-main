import type { Metadata } from "next";
import React from "react";
import { TITULO_SUBLIMACAO } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: TITULO_SUBLIMACAO },
  description: "Camisas, shorts e meiões personalizados para o seu time, com nome, número e escudo. Pedido mínimo de 10 camisas. Heel Cloth, Itaúna - MG.",
  alternates: { canonical: "/sublimacao" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
