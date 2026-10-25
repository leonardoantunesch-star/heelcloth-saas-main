import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { LojaProvider } from "@/components/loja/LojaContexto";
import { LojaHeader } from "@/components/loja/LojaHeader";
import { LojaRodape } from "@/components/loja/LojaRodape";
import { CarrinhoLateral } from "@/components/loja/CarrinhoLateral";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await lojaDaRequisicao();
  return { title: { default: `Loja | ${config.marca.nome}`, template: `%s | ${config.marca.nome}` }, description: config.marca.slogan };
}

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const { config, categorias, visivel, previa } = await lojaDaRequisicao();
  const estilo = {
    "--lj-pri": config.cores.primaria,
    "--lj-dest": config.cores.destaque,
    "--lj-bg": config.cores.fundo,
    "--lj-txt": config.cores.texto,
  } as React.CSSProperties;

  if (!visivel) {
    return (
      <main style={estilo} className="font-editorial flex min-h-screen flex-col items-center justify-center bg-[var(--lj-bg)] px-6 text-center text-[var(--lj-txt)]">
        <p className="whitespace-nowrap text-2xl font-extrabold uppercase tracking-[0.3em] [word-spacing:0.3em] sm:text-4xl">{config.marca.nome}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-black/50">Loja online · em breve</p>
        <Link href="/" className="mt-10 border border-current px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] hover:bg-black hover:text-white">
          Uniformes personalizados
        </Link>
      </main>
    );
  }

  return (
    <div style={estilo} className="font-editorial min-h-screen bg-[var(--lj-bg)] text-[var(--lj-txt)]">
      <LojaProvider config={config} categorias={categorias}>
        {previa && (
          <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">
            Prévia: a loja está fechada e só quem está logado no painel vê esta página.{" "}
            <Link href="/admin/loja" className="underline">Abrir a loja no painel</Link>
          </div>
        )}
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Pular para o conteúdo</a>
        <LojaHeader />
        <main id="conteudo">{children}</main>
        <LojaRodape />
        <CarrinhoLateral />
      </LojaProvider>
    </div>
  );
}
