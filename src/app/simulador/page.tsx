import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// O simulador 3D completo está guardado em ./SimuladorCompleto.tsx e volta para esta página quando estiver pronto.
export const metadata = { title: "Simulador 3D | Heelcloth" };

export default function SimuladorPage() {
  return (
    <div className="font-editorial flex min-h-screen flex-col bg-white text-[#121212]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-5 py-24 text-center sm:px-8 lg:px-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#121212]/50">Simulador 3D</p>
        <h1 className="mt-4 text-5xl font-light tracking-tight sm:text-7xl">Em breve</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-[#121212]/60">
          Estamos preparando um simulador para você montar o seu uniforme em 3D: cores, padrão, nome, número e escudo.
          Enquanto isso, você já pode fazer o seu pedido.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pedido"
            className="ripple-host inline-flex h-11 items-center justify-center rounded-full bg-[#121212] px-6 text-sm font-medium text-white"
          >
            Fazer pedido
          </Link>
          <Link
            href="/catalogo"
            className="ripple-host inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-medium text-[#121212]"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
