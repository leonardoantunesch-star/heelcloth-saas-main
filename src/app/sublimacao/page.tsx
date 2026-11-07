import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileText, PackageSearch, Shirt, Users } from "lucide-react";
import { EditorialSlideshow } from "@/components/EditorialSlideshow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { editorialSlides } from "@/data/editorialSlides";

// Faixa de vantagens logo abaixo do destaque (mesmo desenho dos selos da loja).
const VANTAGENS = [
  { icone: Users, titulo: "Pedido mínimo de 10 camisas", texto: "Com nome, número e tamanho de cada jogador." },
  { icone: Shirt, titulo: "Do jeito do seu time", texto: "Camisa, punho, textura, manga longa e short no mesmo pedido." },
  { icone: FileText, titulo: "Orçamento online", texto: "Monte o pedido e receba o orçamento." },
  { icone: PackageSearch, titulo: "Acompanhe a produção", texto: "Com o código do pedido, veja a etapa em que ele está." },
];

// Atalhos para as outras páginas, no formato dos blocos de categoria da loja.
const ATALHOS = [
  { href: "/catalogo", numero: "01", titulo: "Catálogo", texto: "Peças, acabamentos e modelos prontos para usar de base." },
  { href: "/tamanhos", numero: "02", titulo: "Tamanhos", texto: "Tabela de medidas para acertar o tamanho de cada jogador." },
  { href: "/rastreio", numero: "03", titulo: "Acompanhar", texto: "Digite o código e veja em que etapa da produção ele está." },
  { href: "/contato", numero: "04", titulo: "Contato", texto: "Dúvidas sobre tecidos, personalização e prazos." },
];

const botaoReto = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export default function SublimacaoPage() {
  // A galeria só aparece quando houver fotos de verdade (sem as caixas "imagem a ser enviada").
  const temFotos = editorialSlides.some((s) => s.src && s.src.trim() !== "");

  return (
    <div className="font-editorial flex min-h-screen flex-col bg-white text-[#121212] selection:bg-[#121212] selection:text-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Destaque, no formato do banner da loja */}
        <section aria-label="Uniformes personalizados" className="bloco-preto relative overflow-hidden bg-[#0b0b0b] text-white">
          <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
            <Image
              src="/images/hero-jersey-dark.jpg"
              alt="Camisa Heel Cloth preta com detalhes dourados e número 10"
              fill
              priority
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover object-[50%_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 md:bg-gradient-to-r md:from-[#0b0b0b] md:via-[#0b0b0b]/30 md:to-transparent" />
          </div>

          <div className="relative mx-auto flex min-h-[560px] max-w-[1440px] flex-col justify-end px-5 pb-14 pt-24 sm:px-8 sm:pb-20 md:min-h-[640px] lg:min-h-[700px] lg:px-12">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Sublimação esportiva</span>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Uniformes personalizados para o seu time
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              Monte seu pedido, informe os jogadores e receba seu orçamento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pedido" className={`${botaoReto} group bg-white text-[#121212] hover:bg-white/85 focus-visible:ring-white focus-visible:ring-offset-black`}>
                Fazer pedido
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <Link href="/catalogo" className={`${botaoReto} border border-white/60 text-white hover:bg-white hover:text-[#121212] focus-visible:ring-white focus-visible:ring-offset-black`}>
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>

        {/* Vantagens */}
        <section aria-label="Vantagens" className="border-b border-black/10">
          <ul className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
            {VANTAGENS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-3">
                <Icone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em]">{titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-black/55">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Atalhos */}
        <section aria-labelledby="titulo-atalhos" className="mx-auto max-w-[1440px] px-5 pt-14 sm:px-8 lg:px-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="titulo-atalhos" className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
              Tudo para o seu pedido
            </h2>
            <Link href="/pedido" className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">
              Fazer pedido
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {ATALHOS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex min-h-[200px] flex-col justify-between rounded-2xl bg-[#f3f3f1] p-5 sm:min-h-[260px] transition-colors duration-300 hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[11px] text-current opacity-50">{a.numero}</span>
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold uppercase leading-tight tracking-tight sm:text-2xl">{a.titulo}</h3>
                    <p className="mt-2 max-w-[22ch] text-xs leading-relaxed opacity-60">{a.texto}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Galeria (só com fotos de verdade) */}
        {temFotos && (
          <section aria-labelledby="titulo-galeria" className="mx-auto mt-14 w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="titulo-galeria" className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
                Camisas &amp; fardamentos
              </h2>
              <Link href="/catalogo" className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">
                Ver tudo
              </Link>
            </div>
            <EditorialSlideshow />
          </section>
        )}

        {/* Chamada final */}
        <section aria-label="Comece seu pedido" className="mt-16 border-t border-black/10 sm:mt-20">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-12">
            <h2 className="max-w-xl text-3xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-5xl">
              Pronto para montar o seu time?
            </h2>
            <Link href="/pedido" className={`${botaoReto} group shrink-0 bg-[#121212] text-white hover:bg-[#3a3a3a] focus-visible:ring-[#121212]`}>
              Fazer pedido
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
