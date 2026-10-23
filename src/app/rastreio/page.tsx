"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrderTrackingView } from "@/components/tracking/order-tracking-view";

function RastreioContent() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo") || "";

  return <OrderTrackingView codigoInicial={codigo} />;
}

export default function RastreioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-xs font-mono">
          Carregando rastreamento...
        </div>
      }
    >
      <RastreioContent />
    </Suspense>
  );
}
