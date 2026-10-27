import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Tabela de tamanhos",
  description: "Medidas das camisas e shorts da Heel Cloth, do PP ao G5, para escolher o tamanho certo do uniforme.",
  alternates: { canonical: "/tamanhos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
