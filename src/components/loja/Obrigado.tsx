"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { brl } from "@/data/loja";

// Página de retorno depois do pagamento: mostra a situação do pedido, consultada no servidor.
export function Obrigado({ protocolo, pagamentoId, manual }: { protocolo: string; pagamentoId: string; manual: boolean }) {
  const { config, limpar } = useLoja();
  const [info, setInfo] = useState<{ status: string; total: number } | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    limpar();
    if (!protocolo) return;
    let tentativas = 0;
    let parar = false;
    const consultar = async () => {
      try {
        const q = pagamentoId && /^\d+$/.test(pagamentoId) ? `?payment_id=${pagamentoId}` : "";
        const r = await fetch(`/api/loja/pedido/${encodeURIComponent(protocolo)}${q}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (parar) return;
        setInfo(j);
        // O aviso do Mercado Pago pode levar alguns segundos: consulta de novo por até ~1 minuto.
        if (j.status === "PAGAMENTO_PENDENTE" && !manual && ++tentativas < 12) setTimeout(consultar, 5000);
      } catch {
        if (!parar) setErro(true);
      }
    };
    consultar();
    return () => {
      parar = true;
    };
  }, [protocolo, pagamentoId, manual, limpar]);

  const pago = info?.status === "PAGAMENTO_CONFIRMADO";
  const whats = config.contato.whatsapp.replace(/\D/g, "");
  const linkWhats = whats
    ? `https://wa.me/${whats.length <= 11 ? "55" + whats : whats}?text=${encodeURIComponent(`Olá! Fiz o pedido ${protocolo} na loja e gostaria de combinar o pagamento/entrega.`)}`
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {pago ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /> : <Clock className="mx-auto h-14 w-14 text-black/40" />}
      <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight">{pago ? "Pagamento confirmado!" : "Pedido recebido"}</h1>
      {protocolo && (
        <p className="mt-3 text-sm text-black/65">
          Número do pedido: <strong className="text-black">{protocolo}</strong>
          {info && <> · Total {brl(info.total)}</>}
        </p>
      )}
      <p className="mt-6 text-sm leading-relaxed text-black/70">
        {pago
          ? "Obrigado pela compra! Já estamos separando seus produtos e avisaremos pelo WhatsApp quando forem enviados."
          : manual
            ? "Recebemos seu pedido. Vamos falar com você pelo WhatsApp para combinar o pagamento e a entrega."
            : "Estamos aguardando a confirmação do pagamento pelo Mercado Pago. Pix e cartão costumam confirmar em instantes; boleto pode levar até 3 dias úteis."}
      </p>
      {erro && <p className="mt-4 text-xs text-black/50">Não conseguimos consultar a situação agora, mas seu pedido foi registrado.</p>}
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {linkWhats && (
          <a href={linkWhats} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center border border-black px-6 text-xs font-bold uppercase tracking-[0.16em]">
            Falar no WhatsApp
          </a>
        )}
        <Link href="/loja" className="inline-flex h-12 items-center justify-center bg-[var(--lj-pri)] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
