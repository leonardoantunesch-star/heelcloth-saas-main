import React from "react";
import { LojaMoldura, metadataDaLoja } from "@/components/loja/LojaMoldura";
import { LojaInicio } from "@/components/loja/LojaInicio";

// Página inicial do site = loja HEEL CLOTH. O site de uniformes (sublimação) fica em /sublimacao.
// Enquanto a loja estiver fechada, quem não está logado no painel é levado para /sublimacao.
export const dynamic = "force-dynamic";

export const generateMetadata = metadataDaLoja;

export default function Inicio() {
  return (
    <LojaMoldura>
      <LojaInicio />
    </LojaMoldura>
  );
}
