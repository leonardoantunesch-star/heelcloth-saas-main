"use client";

import React, { useEffect, useRef } from "react";
import { pintarOndas } from "@/lib/simulador/estampas";

// Página de teste: mostra só a estampa (temporária).
export default function TesteEstampa() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const t = performance.now();
    pintarOndas(ref.current!, mref.current!, "#3a3a3a", "#c9a25a");
    (window as unknown as { __pronto: number }).__pronto = performance.now() - t;
  }, []);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <canvas ref={ref} width={2048} height={2048} style={{ width: 1024, height: 1024 }} />
      <canvas ref={mref} width={2048} height={2048} style={{ display: "none" }} />
    </div>
  );
}
