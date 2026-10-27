import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogoLista } from "@/components/catalogo/CatalogoLista";
import { lerCatalogo } from "@/lib/catalogo";
import { comPreco } from "@/data/catalogo";

// Sempre lê o catálogo atual (fotos e modelos publicados pelo painel).
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Catálogo de modelos de uniformes",
  description: "Veja os modelos de camisas e shorts já desenhados pela Heel Cloth e escolha um como base do seu pedido.",
};

export default async function CatalogoPage() {
  const produtos = (await lerCatalogo()).map(comPreco);

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="max-w-2xl">
          <span className="uppercase tracking-[0.25em] font-mono text-[11px] text-[#121212]/50 font-medium">
            Catálogo
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            O que a gente produz para o seu time.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#606060] leading-relaxed">
            Veja as peças, os acabamentos e os valores. Entre em cada peça para conhecer os modelos prontos. Para pedir,
            é só escolher os tamanhos de cada jogador na página de pedido.
          </p>
        </div>

        <CatalogoLista produtos={produtos} />
      </main>

      <SiteFooter />
    </div>
  );
}
