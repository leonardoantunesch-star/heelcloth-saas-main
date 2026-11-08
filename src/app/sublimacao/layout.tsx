import type { Metadata } from "next";
import React from "react";
import { DESCRICAO_SUBLIMACAO, SITE_NOMES_ALTERNATIVOS, TITULO_SUBLIMACAO } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: TITULO_SUBLIMACAO },
  description: DESCRICAO_SUBLIMACAO,
  keywords: [...SITE_NOMES_ALTERNATIVOS, "camisas esportivas", "camisas esportivas personalizadas", "camisa de time personalizada", "uniforme de futebol personalizado", "sublimação"],
  openGraph: { title: TITULO_SUBLIMACAO, description: DESCRICAO_SUBLIMACAO, url: "/sublimacao" },
  alternates: { canonical: "/sublimacao" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
