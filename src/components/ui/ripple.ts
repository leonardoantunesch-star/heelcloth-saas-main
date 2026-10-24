import type { PointerEvent } from "react";

// Efeito de clique: um círculo que se expande a partir do ponto tocado.
// Use junto com a classe "ripple-host" (veja globals.css), que também cuida do cinza ao passar o mouse.
export function ripple(e: PointerEvent<HTMLElement>) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const diametro = Math.max(rect.width, rect.height) * 2.2;

  const dot = document.createElement("span");
  dot.className = "ripple-dot";
  dot.style.width = `${diametro}px`;
  dot.style.height = `${diametro}px`;
  dot.style.left = `${e.clientX - rect.left - diametro / 2}px`;
  dot.style.top = `${e.clientY - rect.top - diametro / 2}px`;
  el.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove(), { once: true });
}
