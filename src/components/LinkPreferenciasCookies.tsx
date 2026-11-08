"use client";

import React from "react";
import { abrirPreferenciasCookies } from "@/lib/cookies-consentimento";

// Botão do rodapé que reabre o aviso de cookies, para a pessoa mudar ou retirar a escolha quando quiser.
export function LinkPreferenciasCookies({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={abrirPreferenciasCookies} className={className}>
      Preferências de cookies
    </button>
  );
}
