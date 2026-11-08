import React from "react";
import Link from "next/link";
import { Camera, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Marca } from "@/components/Marca";
import { LinkPreferenciasCookies } from "@/components/LinkPreferenciasCookies";
import { EMPRESA, identificacaoLegal } from "@/lib/empresa";
import "./tema-faixas.css";

// Rodapé das páginas públicas, no mesmo estilo do rodapé da loja (fundo preto, colunas, contato).
export function SiteFooter() {
  const titulo = "text-xs font-bold uppercase tracking-[0.16em]";
  const lista = "mt-4 space-y-2.5 text-sm text-white/70";
  const link = "hover:text-white transition-colors";
  return (
    <footer className="font-editorial bloco-preto w-full bg-[#121212] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
        <div>
          <Link href="/sublimacao" className="group inline-block">
            <Marca claro />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">{EMPRESA.frase}</p>
        </div>

        <nav aria-label="Sublimação">
          <h2 className={titulo}>Sublimação</h2>
          <ul className={lista}>
            <li><Link href="/pedido" className={link}>Fazer pedido</Link></li>
            <li><Link href="/catalogo" className={link}>Catálogo</Link></li>
            <li><Link href="/simulador" className={link}>Simulador 3D</Link></li>
            <li><Link href="/tamanhos" className={link}>Tamanhos</Link></li>
            <li><Link href="/rastreio" className={link}>Acompanhe seu pedido</Link></li>
          </ul>
        </nav>

        <nav aria-label="Ajuda">
          <h2 className={titulo}>Heel</h2>
          <ul className={lista}>
            <li><Link href="/" className={link}>Heel Loja</Link></li>
            <li><Link href="/ajuda" className={link}>Perguntas frequentes</Link></li>
            <li><Link href="/contato" className={link}>Contato</Link></li>
            <li><Link href="/privacidade" className={link}>Privacidade e cookies</Link></li>
            <li><Link href="/termos" className={link}>Termos de uso</Link></li>
            <li><Link href="/trocas" className={link}>Trocas e devoluções</Link></li>
            <li><LinkPreferenciasCookies className={`${link} text-left`} /></li>
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
        <p className="mx-auto max-w-[1440px] px-5 py-5 text-[11px] text-white/50 sm:px-8 lg:px-12">
          © {new Date().getFullYear()} {EMPRESA.nome} (Heel Clothing){identificacaoLegal() && ` · ${identificacaoLegal()}`} · Camisas e uniformes esportivos sob medida · Itaúna - MG · Conexão protegida (HTTPS)
        </p>
      </div>
    </footer>
  );
}
