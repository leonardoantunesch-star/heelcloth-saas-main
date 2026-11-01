"use client";

import React from "react";
import Link from "next/link";
import { Barcode, Camera, Clock, CreditCard, ExternalLink, Lock, Mail, MapPin, Phone, QrCode, RefreshCcw, ShieldCheck, Store, Truck, Wallet } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { MarcaLoja } from "./LojaHeader";
import { brl } from "@/data/loja";
import { EMPRESA, FORMAS_PAGAMENTO } from "@/lib/empresa";

const SITE_HOST = "heelclothing.com.br";

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

// Informação do rodapé: só ícone e texto, sem caixa nem borda, para não parecer botão (o único link é o sublinhado).
function Info({ icone: Icone, children }: { icone: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-white/80">
      <Icone className="h-4 w-4 shrink-0 text-white/55" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

const ICONE_PAGAMENTO: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  Pix: QrCode,
  "Cartão de crédito": CreditCard,
  Boleto: Barcode,
  "Mercado Pago": Wallet,
};

export function LojaRodape() {
  const { config, categorias } = useLoja();
  const titulo = "text-xs font-bold uppercase tracking-[0.16em]";
  const lista = "mt-4 space-y-2.5 text-sm text-white/70";
  const link = "hover:text-white";
  return (
    <footer className="mt-16 bg-[var(--lj-pri)] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <MarcaLoja claro />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">{EMPRESA.frase}</p>
        </div>

        <nav aria-label="Institucional">
          <h2 className={titulo}>Institucional</h2>
          <ul className={lista}>
            <li><Link href="/loja/institucional" className={link}>Institucional</Link></li>
            <li><Link href="/loja/duvidas" className={link}>Dúvidas</Link></li>
            <li><Link href="/tamanhos" className={link}>Tabela de tamanhos</Link></li>
            <li><Link href="/sublimacao" className={link}>Uniformes personalizados</Link></li>
            <li><Link href="/loja/conta" className={link}>Minha conta e pedidos</Link></li>
          </ul>
        </nav>

        <nav aria-label="Loja">
          <h2 className={titulo}>Loja</h2>
          <ul className={lista}>
            <li><Link href="/loja/novidades" className={link}>Lançamentos</Link></li>
            {categorias.map((cat) => (
              <li key={cat.id}><Link href={`/loja/categoria/${cat.id}`} className={link}>{cat.nome}</Link></li>
            ))}
            <li><Link href="/loja/ofertas" className={link}>Ofertas</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className={titulo}>Contato</h2>
          <ul className={lista}>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className={link}>{EMPRESA.whatsapp}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${EMPRESA.email}`} className={`${link} break-all`}>{EMPRESA.email}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={EMPRESA.enderecoMapa} target="_blank" rel="noopener noreferrer" className={link}>{EMPRESA.endereco}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{EMPRESA.horario}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Camera className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={EMPRESA.instagramLink} target="_blank" rel="noopener noreferrer" className={link}>@{EMPRESA.instagram}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-8 md:grid-cols-3">
          <div>
            <h2 className={titulo}>Formas de pagamento</h2>
            <ul className="mt-4 space-y-2.5">
              {FORMAS_PAGAMENTO.map((f) => <Info key={f.nome} icone={ICONE_PAGAMENTO[f.nome] ?? CreditCard}>{f.nome}</Info>)}
            </ul>
            <p className="mt-3 text-xs text-white/55">Cartão em até {config.pagamento.parcelasMax}x.</p>
          </div>
          <div>
            <h2 className={titulo}>Meios de envio</h2>
            <ul className="mt-4 space-y-2.5">
              <Info icone={Truck}>Entrega para todo o Brasil</Info>
              {config.frete.retirada && <Info icone={Store}>Retirada em Itaúna</Info>}
            </ul>
            {config.frete.gratisAcima !== null && <p className="mt-3 text-xs text-white/55">Frete grátis acima de {brl(config.frete.gratisAcima)}.</p>}
          </div>
          <div>
            <h2 className={titulo}>Segurança</h2>
            <ul className="mt-4 space-y-2.5">
              <Info icone={Lock}>Site seguro (HTTPS)</Info>
              <Info icone={ShieldCheck}>Pagamento pelo Mercado Pago</Info>
            </ul>
            <p className="mt-3 text-xs text-white/55">
              <a href={`https://transparencyreport.google.com/safe-browsing/search?url=${SITE_HOST}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:text-white">
                Conferir a segurança do site no Google
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1440px] px-4 py-5 text-[11px] text-white/50 sm:px-8">
          © {new Date().getFullYear()} {config.marca.nome}
          {config.contato.cnpj && ` · CNPJ ${config.contato.cnpj}`}
          {` · ${EMPRESA.endereco}`}
        </p>
      </div>
    </footer>
  );
}
