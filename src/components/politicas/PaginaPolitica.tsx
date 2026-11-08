import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EMPRESA, identificacaoLegal } from "@/lib/empresa";

// Moldura comum das páginas legais (Privacidade, Termos, Trocas): mesmo cabeçalho, rodapé, tipografia e
// bloco "quem é o responsável". Cada página só escreve o próprio conteúdo.

export const estilo = {
  h2: "mt-10 text-lg font-bold sm:text-xl",
  h3: "mt-6 text-base font-bold",
  p: "mt-3 text-sm leading-relaxed text-[#121212]/80 sm:text-base",
  ul: "mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#121212]/80 sm:text-base",
  link: "font-semibold underline underline-offset-2",
};

const OUTRAS = [
  { href: "/privacidade", rotulo: "Privacidade e cookies" },
  { href: "/termos", rotulo: "Termos de uso" },
  { href: "/trocas", rotulo: "Trocas, devoluções e reembolso" },
];

export function PaginaPolitica({ titulo, versao, resumo, atual, children }: { titulo: string; versao: string; resumo: string; atual: string; children: React.ReactNode }) {
  return (
    <div className="font-editorial flex min-h-screen flex-col bg-white text-[#121212] selection:bg-[#121212] selection:text-white">
      <SiteHeader />
      <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#121212]/70">{versao}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">{titulo}</h1>
        <p className={estilo.p}>{resumo}</p>
        {children}
        <Responsavel />
        <nav aria-label="Outras políticas" className="mt-12 border-t border-black/10 pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {OUTRAS.filter((o) => o.href !== atual).map((o) => (
              <li key={o.href}><Link href={o.href} className={estilo.link}>{o.rotulo}</Link></li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

// Identificação e canais da empresa, iguais em todas as políticas.
export function Responsavel() {
  const legal = identificacaoLegal();
  return (
    <section aria-labelledby="responsavel" className="mt-12 rounded-2xl bg-[#f3f3f1] p-5 text-sm leading-relaxed sm:text-base">
      <h2 id="responsavel" className="font-bold">Quem é o responsável</h2>
      <p className="mt-2 text-[#121212]/80">
        {EMPRESA.nome}{legal ? ` (${legal})` : ""}, {EMPRESA.endereco}.
        <br />
        E-mail: <a className={estilo.link} href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> · WhatsApp:{" "}
        <a className={estilo.link} href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer">{EMPRESA.whatsapp}</a>
        <br />
        Atendimento: {EMPRESA.horario}.
      </p>
    </section>
  );
}
