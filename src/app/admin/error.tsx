"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

// Aparece quando uma página do painel falha ao carregar (quase sempre por causa do banco de dados).
export default function ErroDoPainel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <div className="flex items-center gap-2 text-base font-semibold">
        <AlertCircle className="h-5 w-5" />
        Não foi possível carregar esta página
      </div>
      <p className="mt-2 text-sm">
        Isso costuma acontecer quando o banco de dados não está acessível ou ainda não tem as tabelas. Confira, na Vercel,
        se a <b>DATABASE_URL</b> e a <b>JWT_SECRET</b> estão cadastradas e se o banco recebeu <code>npm run prisma:push</code> e{" "}
        <code>npm run prisma:seed</code>.
      </p>
      {error.digest && <p className="mt-2 text-xs text-rose-700/80">Código do erro: {error.digest}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        >
          Tentar de novo
        </button>
        <Link href="/login" className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold hover:bg-rose-100">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
