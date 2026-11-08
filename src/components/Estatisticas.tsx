"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EVENTO_COOKIES_MUDOU, GA_ID, apagarCookiesAnalytics, estatisticasPermitidas } from "@/lib/cookies-consentimento";

// Código de pedido na URL (/rastreio/HC-...) não vai para o Google: vira "/rastreio/[codigo]".
const caminhoSeguro = (c: string) => c.replace(/^\/rastreio\/[^/]+/, "/rastreio/[codigo]");

let ultimaVisita = "";
function enviarVisita(caminho: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  const c = caminhoSeguro(caminho);
  if (!w.gtag || ultimaVisita === c) return;
  ultimaVisita = c;
  // Sem parâmetros da URL (podem conter e-mail ou códigos).
  w.gtag("event", "page_view", { page_location: location.origin + c, page_path: c, page_title: document.title });
}

type JanelaGa = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void } & Record<string, unknown>;

// Google Analytics 4, carregado SÓ depois que a pessoa aceita "Estatísticas" no aviso de cookies.
// Sem NEXT_PUBLIC_GA_ID este componente não faz nada. Não roda no painel (/admin) nem no login da equipe.
export function Estatisticas() {
  const caminho = usePathname();
  const areaInterna = caminho.startsWith("/admin") || caminho === "/login";

  useEffect(() => {
    if (!GA_ID) return;
    const w = window as unknown as JanelaGa;
    const aplicar = () => {
      const pode = estatisticasPermitidas() && !areaInterna;
      w[`ga-disable-${GA_ID}`] = !pode;
      if (!pode) {
        apagarCookiesAnalytics();
        return;
      }
      if (!document.getElementById("ga4")) {
        w.dataLayer = w.dataLayer || [];
        w.gtag = function gtag() {
          // eslint-disable-next-line prefer-rest-params
          w.dataLayer!.push(arguments);
        };
        w.gtag("js", new Date());
        // A visita de cada página é enviada pelo efeito abaixo (o site troca de página sem recarregar).
        w.gtag("config", GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
        const s = document.createElement("script");
        s.id = "ga4";
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(s);
      }
      enviarVisita(location.pathname);
    };
    aplicar();
    window.addEventListener(EVENTO_COOKIES_MUDOU, aplicar);
    return () => window.removeEventListener(EVENTO_COOKIES_MUDOU, aplicar);
  }, [areaInterna]);

  // Uma visita por página (o site troca de página sem recarregar).
  useEffect(() => {
    if (!GA_ID || areaInterna || !estatisticasPermitidas()) return;
    enviarVisita(caminho);
  }, [caminho, areaInterna]);

  return null;
}
