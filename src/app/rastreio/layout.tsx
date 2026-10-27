import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Acompanhe seu pedido",
  description: "Digite o código do seu pedido e veja em que etapa da produção ele está.",
  alternates: { canonical: "/rastreio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
