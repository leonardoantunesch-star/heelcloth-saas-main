import React from "react";
import Link from "next/link";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { Banners } from "@/components/loja/Banners";
import { GradeProdutos } from "@/components/loja/CardProduto";
import { ImagemLoja } from "@/components/loja/ImagemLoja";
import { SelosLoja } from "@/components/loja/LojaRodape";
import { emPromocao, type ProdutoLoja } from "@/data/loja";

function Vitrine({ titulo, href, produtos, parcelasMax }: { titulo: string; href: string; produtos: ProdutoLoja[]; parcelasMax: number }) {
  if (produtos.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-14 sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">{titulo}</h2>
        <Link href={href} className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">Ver tudo</Link>
      </div>
      <GradeProdutos produtos={produtos.slice(0, 8)} parcelasMax={parcelasMax} />
    </section>
  );
}

export default async function LojaInicio() {
  const { config, produtos } = await lojaDaRequisicao();
  const banners = config.banners.filter((b) => b.visivel);
  const pm = config.pagamento.parcelasMax;
  return (
    <>
      <Banners banners={banners} />

      {config.blocos.length > 0 && (
        <section aria-label="Navegue por categoria" className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-8">
          <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${config.blocos.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {config.blocos.map((b) => (
              <li key={b.id}>
                <Link href={b.link || "/loja"} className="group relative block aspect-[3/4] overflow-hidden">
                  <ImagemLoja id={b.imagem} alt="" className="h-full w-full transition-transform duration-500 group-hover:scale-105" rotulo="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-lg font-extrabold uppercase tracking-tight text-white sm:text-xl">{b.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Vitrine titulo={config.textos.lancamentos} href="/loja/novidades" produtos={produtos.filter((p) => p.lancamento)} parcelasMax={pm} />
      <Vitrine titulo={config.textos.destaques} href="/loja/todos" produtos={produtos.filter((p) => p.destaque)} parcelasMax={pm} />
      <Vitrine titulo={config.textos.promocoes} href="/loja/ofertas" produtos={produtos.filter(emPromocao)} parcelasMax={pm} />

      {produtos.length === 0 && (
        <p className="mx-auto max-w-[1440px] px-4 py-20 text-center text-sm text-black/55 sm:px-8">Novos produtos chegam em breve.</p>
      )}

      {(config.textos.sobreTitulo || config.textos.sobre) && (
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
          {config.textos.sobreTitulo && <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">{config.textos.sobreTitulo}</h2>}
          {config.textos.sobre && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-black/65 sm:text-base">{config.textos.sobre}</p>}
        </section>
      )}

      <SelosLoja />
    </>
  );
}
