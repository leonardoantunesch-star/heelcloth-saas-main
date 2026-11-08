import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { lojaDaRequisicao } from "@/lib/loja-publica";
import { brl } from "@/data/loja";
import { EMPRESA } from "@/lib/empresa";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dúvidas",
  description: "Pagamento, frete, prazo, troca e acompanhamento de pedidos na loja Heel Cloth.",
  alternates: { canonical: "/loja/duvidas" },
};

export default async function Duvidas() {
  const { config } = await lojaDaRequisicao();
  const f = config.frete;

  const grupos: { titulo: string; itens: { p: string; r: React.ReactNode }[] }[] = [
    {
      titulo: "Compra e pagamento",
      itens: [
        { p: "Quais são as formas de pagamento?", r: "Pix. O pagamento é processado pelo Mercado Pago e o pedido é confirmado assim que o Pix cai." },
        { p: "Preciso ter conta para comprar?", r: "Não. Você pode comprar sem conta. Com conta, você acompanha todos os seus pedidos em um só lugar e o login é protegido por um código enviado ao seu e-mail." },
        { p: "Como acompanho meu pedido?", r: <>Entre na sua conta e abra <Link href="/loja/conta" className="underline">Minha conta</Link> para ver o andamento dos pedidos. Se tiver dúvida, chame a gente no WhatsApp {EMPRESA.whatsapp}.</> },
      ],
    },
    {
      titulo: "Entrega",
      itens: [
        { p: "Vocês entregam para todo o Brasil?", r: "Sim, enviamos para todo o Brasil." },
        { p: "Quanto custa o frete?", r: f.gratisAcima !== null ? `O frete é de ${brl(f.valor)}. Em compras acima de ${brl(f.gratisAcima)} o frete é grátis.` : `O frete é de ${brl(f.valor)}.` },
        { p: "Qual é o prazo de envio?", r: f.prazo },
        ...(f.retirada ? [{ p: "Posso retirar na loja?", r: `Sim. Na finalização da compra escolha "retirada" e busque seu pedido em ${EMPRESA.endereco}. Horário: ${EMPRESA.horario}.` }] : []),
      ],
    },
    {
      titulo: "Trocas e tamanhos",
      itens: [
        { p: "Como faço uma troca?", r: <>Fale com a gente pelo <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a> ou pelo e-mail {EMPRESA.email} informando o número do pedido. Compras feitas pela internet também têm o direito de arrependimento em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor.</> },
        { p: "Como escolho o tamanho?", r: <>Veja a <Link href="/tamanhos" className="underline">tabela de tamanhos</Link>: o jeito mais seguro é medir uma camisa que já serve bem em você e comparar com as medidas.</> },
      ],
    },
    {
      titulo: "Uniformes personalizados",
      itens: [
        { p: "Vocês fazem uniformes para times e equipes?", r: <>Fazemos. As camisas e os uniformes são personalizados por sublimação, com nome e número. Veja como funciona em <Link href="/sublimacao" className="underline">Uniformes personalizados</Link> e comece seu pedido em <Link href="/pedido" className="underline">Fazer pedido</Link>.</> },
        { p: "Existe quantidade mínima?", r: <>Para uniformes personalizados o lote mínimo é de 10 peças. Mais detalhes na <Link href="/ajuda" className="underline">central de ajuda dos uniformes</Link>.</> },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">Dúvidas</h1>
      <p className="mt-3 text-sm text-black/60 sm:text-base">Respostas rápidas sobre compra, entrega e troca. Não achou o que procura? Chame a gente no WhatsApp.</p>

      <div className="mt-10 space-y-10">
        {grupos.map((g, n) => (
          <section key={g.titulo} aria-labelledby={`grupo-${n}`}>
            <h2 id={`grupo-${n}`} className="text-xs font-bold uppercase tracking-[0.16em] text-black/65">{g.titulo}</h2>
            <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
              {g.itens.map((i) => (
                <details key={i.p} className="group py-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {i.p}
                    <span aria-hidden="true" className="shrink-0 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-black/70 sm:text-base">{i.r}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-sm bg-black/[0.04] p-6">
        <h2 className="text-lg font-extrabold">Ainda com dúvida?</h2>
        <p className="mt-1 text-sm text-black/65">{EMPRESA.horario}.</p>
        <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-12 items-center rounded-full bg-[var(--lj-pri)] px-7 text-sm font-semibold text-white">
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}
