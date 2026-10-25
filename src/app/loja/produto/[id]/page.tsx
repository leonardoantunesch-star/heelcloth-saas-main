import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { ComprarProduto, GaleriaProduto } from "@/components/loja/ComprarProduto";
import { GradeProdutos } from "@/components/loja/CardProduto";
import { brl } from "@/data/loja";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { produtos } = await lojaDaRequisicao();
  const p = produtos.find((x) => x.id === id);
  return { title: p?.nome ?? "Produto", description: p?.descricao.slice(0, 160) };
}

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { config, categorias, produtos } = await lojaDaRequisicao();
  const p = produtos.find((x) => x.id === id);
  if (!p) notFound();
  const cat = categorias.find((c) => c.id === p.categoriaId);
  const relacionados = produtos.filter((x) => x.id !== p.id && x.categoriaId === p.categoriaId).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-8">
      <nav aria-label="Caminho" className="mb-6 text-xs text-black/55">
        <Link href="/loja" className="hover:underline">Início</Link>
        {cat && <> / <Link href={`/loja/categoria/${cat.id}`} className="hover:underline">{cat.nome}</Link></>}
        {" / "}<span className="text-black">{p.nome}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <GaleriaProduto produto={p} />
        <div className="lg:sticky lg:top-32 lg:self-start">
          {p.cor && <p className="text-xs uppercase tracking-[0.14em] text-black/55">{p.cor}</p>}
          <h1 className="mt-1 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-3xl">{p.nome}</h1>
          <div className="mt-5">
            <ComprarProduto produto={p} />
          </div>
          <div className="mt-8 flex gap-3 border-t border-black/10 pt-6 text-sm">
            <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="text-black/70">
              <p>
                Frete {config.frete.valor > 0 ? brl(config.frete.valor) : "grátis"}
                {config.frete.gratisAcima !== null && config.frete.valor > 0 && ` · grátis acima de ${brl(config.frete.gratisAcima)}`}
                {config.frete.retirada && " · ou retire no local"}
              </p>
              {config.frete.prazo && <p className="mt-1 text-xs">{config.frete.prazo}</p>}
            </div>
          </div>
          {p.descricao && (
            <div className="mt-6 border-t border-black/10 pt-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em]">Descrição</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">{p.descricao}</p>
            </div>
          )}
        </div>
      </div>
      {relacionados.length > 0 && (
        <section className="pt-16">
          <h2 className="mb-6 text-2xl font-extrabold uppercase tracking-tight">Você também pode gostar</h2>
          <GradeProdutos produtos={relacionados} parcelasMax={config.pagamento.parcelasMax} />
        </section>
      )}
    </div>
  );
}
