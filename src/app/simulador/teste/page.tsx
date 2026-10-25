"use client";

import React, { useEffect, useRef, useState } from "react";
import { AJUSTE_LUZ, Camisa3D, CONFIG_PADRAO, type Camisa3DRef } from "@/components/simulador/Camisa3D";

// Página de teste do molde 3D (temporária).
export default function TesteCamisa() {
  const ref = useRef<Camisa3DRef>(null);
  const [pronto, setPronto] = useState(false);
  if (typeof window !== "undefined") {
    const luz = new URLSearchParams(window.location.search).get("luz");
    if (luz) Object.assign(AJUSTE_LUZ, JSON.parse(luz));
  }
  useEffect(() => {
    if (!pronto) return;
    const q = new URLSearchParams(window.location.search);
    const ang = Number(q.get("ang") || 0);
    if (q.get("ref")) {
      ref.current?.enquadrar({ angulo: ang, elevacao: Number(q.get("elev") || 2.5), distancia: Number(q.get("dist") || 2.555), fov: Number(q.get("fov") || 20), alvoY: Number(q.get("alvo") || -0.024) });
    } else ref.current?.girarPara(ang, true);
    (window as unknown as { __pronto: boolean }).__pronto = true;
  }, [pronto]);
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Camisa3D ref={ref} config={CONFIG_PADRAO} onPronto={() => setPronto(true)} />
    </div>
  );
}
