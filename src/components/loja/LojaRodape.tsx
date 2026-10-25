"use client";

import React from "react";
import Link from "next/link";
import { CreditCard, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { MarcaLoja } from "./LojaHeader";
import { brl } from "@/data/loja";

// Selos de confiança (frete, parcelamento, compra segura), como nas lojas de referência.
export function SelosLoja() {
  const { config } = useLoja();
  const selos = [
    {
      icone: Truck,
      titulo: config.frete.gratisAcima !== null ? `Frete grátis acima de ${brl(config.frete.gratisAcima)}` : "Entrega para todo o Brasil",
      texto: config.frete.prazo,
    },
    { icone: CreditCard, titulo: `Até ${config.pagamento.parcelasMax}x no cartão`, texto: "Pix, cartão de crédito ou boleto." },
    { icone: ShieldCheck, titulo: "Compra segura", texto: "Pagamento processado pelo Mercado Pago." },
    { icone: RefreshCcw, titulo: "Troca fácil", texto: "Fale com a gente pelo WhatsApp." },
  ];
  return (
    <section aria-label="Vantagens" className="border-y border-black/10">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 py-8 sm:px-8 lg:grid-cols-4">
        {selos.map(({ icone: Icone, titulo, texto }) => (
          <li key={titulo} className="flex items-start gap-3">
            <Icone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.06em]">{titulo}</p>
              <p className="mt-1 text-xs text-black/55">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LojaRodape() {
  const { config, categorias } = useLoja();
  const c = config.contato;
  const whats = c.whatsapp.replace(/\D/g, "");
  const insta = c.instagram.replace(/^@/, "");
  return (
    <footer className="mt-16 bg-[var(--lj-pri)] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <MarcaLoja claro />
          {config.marca.slogan && <p className="mt-3 max-w-xs text-sm text-white/60">{config.marca.slogan}</p>}
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Loja</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><Link href="/loja/novidades" className="hover:text-white">Lançamentos</Link></li>
            {categorias.map((cat) => (
              <li key={cat.id}><Link href={`/loja/categoria/${cat.id}`} className="hover:text-white">{cat.nome}</Link></li>
            ))}
            <li><Link href="/loja/ofertas" className="hover:text-white">Ofertas</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Atendimento</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {whats && <li><a href={`https://wa.me/${whats.length <= 11 ? "55" + whats : whats}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp: {c.whatsapp}</a></li>}
            {c.email && <li><a href={`mailto:${c.email}`} className="hover:text-white">{c.email}</a></li>}
            {insta && <li><a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">@{insta}</a></li>}
            <li><Link href="/sublimacao" className="hover:text-white">Heel Sublimação (uniformes personalizados)</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Pagamento</h2>
          <p className="mt-4 text-sm text-white/70">Pix, cartão de crédito (até {config.pagamento.parcelasMax}x) e boleto, pelo Mercado Pago.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1440px] px-4 py-5 text-[11px] text-white/50 sm:px-8">
          © {new Date().getFullYear()} {config.marca.nome}
          {c.cnpj && ` · CNPJ ${c.cnpj}`}
          {c.endereco && ` · ${c.endereco}`}
        </p>
      </div>
    </footer>
  );
}
