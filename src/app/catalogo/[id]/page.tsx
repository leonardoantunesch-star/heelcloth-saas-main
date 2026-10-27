import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GaleriaModelos } from "@/components/catalogo/GaleriaModelos";
import { Silhueta } from "@/components/catalogo/Silhueta";
import { lerCatalogo } from "@/lib/catalogo";
import { comPreco } from "@/data/catalogo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const produto = (await lerCatalogo()).find((p) => p.id === id && p.visivel);
  return { title: produto ? `${produto.nome} | Catálogo` : "Catálogo" };
}

export default async function ProdutoPage({ params }: PageProps) {
  const { id } = await params;
  const todos = (await lerCatalogo()).map(comPreco).filter((p) => p.visivel);
  const produto = todos.find((p) => p.id === id);
  if (!produto) notFound();
  const outros = todos.filter((p) => p.id !== produto.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
        <Link
          href="/catalogo"
          className="ripple-host inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-[#121212]/70 hover:text-[#121212] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao catálogo
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-14">
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#f2f2f2]">
            {produto.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/catalogo/imagem/${produto.imagem}`} alt={produto.nome} className="h-full w-full object-cover" />
            ) : (
              <Silhueta forma={produto.forma} />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <span className="uppercase tracking-[0.25em] font-mono text-[11px] text-[#121212]/50 font-medium">Catálogo</span>
            <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">{produto.nome}</h1>
            <p className="mt-4 text-xl font-bold">
              {produto.precoPrefixo && <span className="mr-2 text-[11px] font-medium uppercase tracking-wider text-[#606060]">{produto.precoPrefixo}</span>}
              {brl(produto.preco)}
            </p>
            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#606060]">{produto.descricao}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {produto.destaques.map((d) => (
                <li key={d} className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-[#121212]/70">
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pedido"
                className="ripple-host inline-flex h-11 items-center justify-center rounded-full bg-[#121212] px-7 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
              >
                Fazer pedido
              </Link>
              <Link
                href="/contato"
                className="ripple-host inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-7 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
              >
                Falar com a gente
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 sm:mt-24 border-t border-black/[0.08] pt-10 sm:pt-14" aria-labelledby="modelos-titulo">
          <h2 id="modelos-titulo" className="text-xl sm:text-2xl font-bold tracking-tight">
            Modelos prontos
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#606060]">
            Desenhos já feitos pela Heelcloth. Escolha um para usar como base do seu pedido; as cores e o escudo do time
            podem ser adaptados na aprovação do layout.
          </p>
          <div className="mt-8">
            {produto.modelos.length > 0 ? (
              <GaleriaModelos modelos={produto.modelos} produtoNome={produto.nome} forma={produto.forma} />
            ) : (
              <p className="rounded-xl border border-dashed border-black/15 px-5 py-10 text-center text-sm text-[#606060]">
                Os modelos prontos desta peça chegam em breve. Enquanto isso, faça o seu pedido e enviamos o desenho
                exclusivo do seu time para aprovação.
              </p>
            )}
          </div>
        </section>

        {outros.length > 0 && (
          <section className="mt-16 sm:mt-24 border-t border-black/[0.08] pt-10 sm:pt-14" aria-labelledby="outros-titulo">
            <h2 id="outros-titulo" className="text-xl sm:text-2xl font-bold tracking-tight">
              Veja também
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {outros.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/catalogo/${o.id}`}
                    className="ripple-host group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
                  >
                    <span className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-[#f2f2f2]">
                      {o.imagem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/catalogo/imagem/${o.imagem}`} alt={o.nome} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <Silhueta forma={o.forma} />
                      )}
                    </span>
                    <span className="mt-2 block text-sm font-bold tracking-tight">{o.nome}</span>
                    <span className="block text-xs text-[#606060]">{brl(o.preco)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
