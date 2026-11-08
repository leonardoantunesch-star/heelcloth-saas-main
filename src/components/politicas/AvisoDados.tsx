import React from "react";
import Link from "next/link";

// Aviso curto junto dos formulários: para que servem os dados e onde ler as políticas.
// "tom" ajusta a cor ao fundo (claro na maioria das telas).
export function AvisoDados({ finalidade, comTermos = false, className = "" }: { finalidade: string; comTermos?: boolean; className?: string }) {
  const l = "font-semibold underline underline-offset-2";
  return (
    <p className={`text-xs leading-relaxed text-[#121212]/70 ${className}`}>
      {finalidade}{" "}
      {comTermos ? (
        <>
          Antes de pagar, leia os <Link href="/termos" className={l}>Termos de uso</Link>, a política de{" "}
          <Link href="/trocas" className={l}>Trocas e devoluções</Link> e a <Link href="/privacidade" className={l}>Política de privacidade</Link>.
        </>
      ) : (
        <>
          Saiba mais na <Link href="/privacidade" className={l}>Política de privacidade</Link>.
        </>
      )}
    </p>
  );
}
