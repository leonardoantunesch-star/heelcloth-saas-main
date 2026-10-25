import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { LojaProvider } from "@/components/loja/LojaContexto";
import { LojaHeader } from "@/components/loja/LojaHeader";
import { LojaRodape } from "@/components/loja/LojaRodape";
import { CarrinhoLateral } from "@/components/loja/CarrinhoLateral";

// Moldura da loja (cores, cabeçalho, rodapé, carrinho). Usada na página inicial e nas páginas /loja/...
export async function LojaMoldura({ children }: { children: React.ReactNode }) {
  const { config, categorias, visivel, previa } = await lojaDaRequisicao();
  const estilo = {
    "--lj-pri": config.cores.primaria,
    "--lj-dest": config.cores.destaque,
    "--lj-bg": config.cores.fundo,
    "--lj-txt": config.cores.texto,
  } as React.CSSProperties;

  // Loja ainda fechada: quem não está logado no painel vai direto para o site de sublimação.
  if (!visivel) redirect("/sublimacao");

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

export async function metadataDaLoja(): Promise<import("next").Metadata> {
  const { config } = await lojaDaRequisicao();
  return { title: { default: config.marca.nome, template: `%s | ${config.marca.nome}` }, description: config.marca.slogan };
}

