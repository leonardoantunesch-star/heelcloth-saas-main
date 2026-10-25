import React from "react";
import { LojaMoldura, metadataDaLoja } from "@/components/loja/LojaMoldura";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataDaLoja;

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <LojaMoldura>{children}</LojaMoldura>;
}
