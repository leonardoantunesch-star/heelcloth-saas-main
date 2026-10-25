import React from "react";
import { urlImagemLoja } from "@/data/loja";

// Foto da loja. Sem foto cadastrada, mostra um fundo neutro com o nome, para o layout não quebrar.
export function ImagemLoja({
  id,
  alt,
  className = "",
  ajuste = "cover",
  rotulo,
}: {
  id: string | null | undefined;
  alt: string;
  className?: string;
  ajuste?: "cover" | "contain";
  rotulo?: string;
}) {
  if (id) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={urlImagemLoja(id)} alt={alt} loading="lazy" className={`${className} ${ajuste === "cover" ? "object-cover" : "object-contain"}`} />;
  }
  return (
    <div role="img" aria-label={alt} className={`${className} flex items-center justify-center bg-[#f1f1ef] text-center`}>
      <span className="px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/30">{rotulo ?? "HEEL CLOTH."}</span>
    </div>
  );
}
