import type { PointerEvent } from "react";

// Efeito de clique: um círculo que se expande a partir do ponto tocado.
// Funciona em qualquer elemento com a classe "ripple-host" (veja globals.css), que também cuida do
// cinza ao passar o mouse. O componente EfeitoToque (no layout) liga isso em todo o site.
export function dispararRipple(el: HTMLElement, clientX: number, clientY: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = el.getBoundingClientRect();
  const diametro = Math.max(rect.width, rect.height) * 2.2;

  const dot = document.createElement("span");
  dot.className = "ripple-dot";
  dot.setAttribute("aria-hidden", "true");
  dot.style.width = `${diametro}px`;
  dot.style.height = `${diametro}px`;
  dot.style.left = `${clientX - rect.left - diametro / 2}px`;
  dot.style.top = `${clientY - rect.top - diametro / 2}px`;
  el.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove(), { once: true });
}

export function ripple(e: PointerEvent<HTMLElement>) {
  dispararRipple(e.currentTarget, e.clientX, e.clientY);
}
