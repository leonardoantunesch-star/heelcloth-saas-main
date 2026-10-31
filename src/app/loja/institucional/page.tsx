import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Institucional",
  description: "Conheça a Heel Cloth (Heel Clothing), confecção de Itaúna - MG: uniformes personalizados por sublimação e camisas com identidade própria.",
  alternates: { canonical: "/loja/institucional" },
};

export default function Institucional() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">Institucional</h1>
      <p className="mt-4 text-lg font-semibold leading-snug sm:text-xl">{EMPRESA.frase}</p>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-black/75 sm:text-base">
        <p>
          A Heel Cloth, também conhecida como Heel Clothing, Heel Camisas e Heel Eder Modas, é uma confecção de Itaúna, em Minas Gerais. Trabalhamos com duas frentes: a produção de camisas e uniformes personalizados por sublimação, com nome e número, e a loja de camisas com a nossa identidade, a prancha da nossa logo.
        </p>
        <p>
          Nos uniformes, a estampa é feita por sublimação: a cor entra na fibra do tecido, sem relevo, e não racha nem desbota com as lavagens. Cada pedido passa por aprovação do layout antes de ir para a produção, e você acompanha as etapas pelo código do pedido.
        </p>
        <p>
          Na loja, as camisas são pensadas para o dia a dia, em várias cores e estampas. Enviamos para todo o Brasil.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link href="/sublimacao" className="rounded-sm border border-black/15 p-5 hover:border-black">
          <span className="block text-base font-extrabold">Uniformes personalizados</span>
          <span className="mt-1 block text-sm text-black/60">Camisas de time e de equipe com nome e número.</span>
        </Link>
        <Link href="/loja/todos" className="rounded-sm border border-black/15 p-5 hover:border-black">
          <span className="block text-base font-extrabold">A loja</span>
          <span className="mt-1 block text-sm text-black/60">Camisas e roupas Heel Clothing.</span>
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="onde">
        <h2 id="onde" className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">Onde estamos</h2>
        <address className="mt-3 not-italic text-sm leading-relaxed sm:text-base">
          <a href={EMPRESA.enderecoMapa} target="_blank" rel="noopener noreferrer" className="underline">{EMPRESA.endereco}</a>
          <br />
          {EMPRESA.horario}
          <br />
          <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className="underline">{EMPRESA.whatsapp}</a>
          {" · "}
          <a href={`mailto:${EMPRESA.email}`} className="underline">{EMPRESA.email}</a>
        </address>
      </section>
    </div>
  );
}
