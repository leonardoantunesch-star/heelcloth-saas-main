import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Faça seu pedido de uniformes",
  description: "Monte a lista do seu time com nome, número e tamanho de cada jogador e receba o orçamento na hora. Camisa, short e meião personalizados.",
  alternates: { canonical: "/pedido" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
