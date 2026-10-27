import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Ajuda e perguntas frequentes",
  description: "Prazos, pagamento, tamanhos e como funciona o pedido de uniformes personalizados da Heel Cloth.",
  alternates: { canonical: "/ajuda" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
