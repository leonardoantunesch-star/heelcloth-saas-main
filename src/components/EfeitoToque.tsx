"use client";

import { useEffect } from "react";
import { dispararRipple } from "@/components/ui/ripple";

// Liga o círculo que expande em todo elemento com a classe "ripple-host" ou "ripple-so-clique", em qualquer página.
// Um único ouvinte no documento serve para tudo (inclusive para o que abre em portais).
export function EfeitoToque() {
  useEffect(() => {
    const aoPressionar = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.target instanceof Element)) return;
      const alvo = e.target.closest<HTMLElement>(".ripple-host, .ripple-so-clique");
      if (!alvo || alvo.matches(":disabled, [aria-disabled='true']")) return;
      dispararRipple(alvo, e.clientX, e.clientY);
    };
    document.addEventListener("pointerdown", aoPressionar, true);
    return () => document.removeEventListener("pointerdown", aoPressionar, true);
  }, []);

  return null;
}
