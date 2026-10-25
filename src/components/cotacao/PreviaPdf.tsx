"use client";

import React, { useEffect, useRef, useState } from "react";

// Prévia do PDF desenhada como imagem (pdf.js). Funciona em qualquer navegador, inclusive quando o
// navegador está configurado para baixar PDFs em vez de abrir (aí um <iframe> fica em branco).
export function PreviaPdf({ dados }: { dados: ArrayBuffer | null }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!dados || !caixa.current) return;
    let cancelado = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(dados.slice(0)) }).promise;
        const largura = caixa.current?.clientWidth || 600;
        const telas: HTMLCanvasElement[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const pagina = await pdf.getPage(n);
          const base = pagina.getViewport({ scale: 1 });
          const escala = (largura / base.width) * Math.min(2, window.devicePixelRatio || 1);
          const vp = pagina.getViewport({ scale: escala });
          const c = document.createElement("canvas");
          c.width = Math.floor(vp.width);
          c.height = Math.floor(vp.height);
          c.style.width = "100%";
          c.style.display = "block";
          c.style.boxShadow = "0 1px 4px rgba(0,0,0,.12)";
          c.style.background = "#fff";
          c.setAttribute("role", "img");
          c.setAttribute("aria-label", `Página ${n} da cotação`);
          await pagina.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          telas.push(c);
        }
        if (cancelado || !caixa.current) return;
        caixa.current.replaceChildren(...telas);
        setFalhou(false);
      } catch (e) {
        console.error("Prévia do PDF:", e);
        if (!cancelado) setFalhou(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [dados]);

  return (
    <div className="max-h-[760px] overflow-y-auto bg-slate-100 p-3">
      {falhou && <p className="p-4 text-xs text-rose-700">Não foi possível desenhar a prévia. Use o botão “Baixar PDF”.</p>}
      <div ref={caixa} className="flex flex-col gap-3">
        {!dados && <div className="flex h-48 items-center justify-center text-xs text-slate-500">Montando a prévia...</div>}
      </div>
    </div>
  );
}
