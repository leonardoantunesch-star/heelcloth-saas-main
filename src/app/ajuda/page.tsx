"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
} from "lucide-react";

interface FAQItem {
  pergunta: string;
  resposta: string;
  categoria: "pedido" | "tamanhos" | "personalizacao" | "rastreio" | "suporte";
}

const FAQS: FAQItem[] = [
  {
    categoria: "pedido",
    pergunta: "Qual é a quantidade mínima para fazer um pedido de uniformes?",
    resposta:
      "A confecção trabalha com lote mínimo de 10 peças personalizadas. Esse volume garante o melhor custo-benefício de impressão por sublimação e corte têxtil para sua equipe.",
  },
  {
    categoria: "pedido",
    pergunta: "Posso incluir camisas de goleiro e camisas de linha no mesmo pedido?",
    resposta:
      "Sim. No formulário de pedido, você pode marcar individualmente quais atletas são goleiros e quais são jogadores de linha, escolhendo cores e detalhes específicos para cada função.",
  },
  {
    categoria: "tamanhos",
    pergunta: "Como escolher os tamanhos corretos dos atletas?",
    resposta:
      "Recomendamos consultar a nossa Tabela de Medidas disponível na página inicial. A forma mais precisa é medir uma camisa confortável do atleta (largura de axila a axila e comprimento do ombro à barra). Trabalhamos com tamanhos masculinos (P ao XGG), femininos babylook (P ao GG) e infantis (06 ao 14).",
  },
  {
    categoria: "tamanhos",
    pergunta: "Existe variação de tamanho nas peças confeccionadas?",
    resposta:
      "Como se trata de corte têxtil e costura artesanal em tecido esportivo, existe uma tolerância técnica internacional padrão de até 1,5 cm nas medidas finais.",
  },
  {
    categoria: "personalizacao",
    pergunta: "A estampa desbota ou descasca com o tempo?",
    resposta:
      "Não. Utilizamos o processo de sublimação digital total, onde os pigmentos de cor são fundidos diretamente nas fibras do poliéster através de alta temperatura. A estampa não possui relevo plástico, não racha e não desbota após as lavagens.",
  },
  {
    categoria: "personalizacao",
    pergunta: "Como devo enviar o escudo do meu time?",
    resposta:
      "Você pode enviar o escudo em vetor (CorelDRAW CDR, Illustrator AI, EPS, PDF) ou imagem em alta resolução (PNG com fundo transparente de no mínimo 300 DPI).",
  },
  {
    categoria: "rastreio",
    pergunta: "Como faço para acompanhar o status da produção do meu lote?",
    resposta:
      "Ao cadastrar seu pedido, você recebe um código de acompanhamento único (exemplo: HC-2603-0001). Basta acessar a aba 'Rastrear Pedido' no topo do site e digitar seu código para ver em tempo real se o lote está em corte, estampa, costura ou pronto para envio.",
  },
  {
    categoria: "suporte",
    pergunta: "Qual é o prazo médio de entrega das peças?",
    resposta:
      "O prazo padrão de fabricação da Heelcloth é de 15 dias úteis a partir da aprovação final do layout e confirmação do pedido. Prazos especiais para campeonatos podem ser acordados diretamente no atendimento.",
  },
  {
    categoria: "suporte",
    pergunta: "Quais são as condições de pagamento?",
    resposta:
      "Trabalhamos com entrada padrão de 50% de sinal para início do corte da matéria-prima e os 50% restantes quitados no momento do despacho ou retirada das peças prontas.",
  },
];

export default function AjudaPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [itensAbertos, setItensAbertos] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleItem = (idx: number) => {
    setItensAbertos((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const faqsFiltrados = FAQS.filter((f) => {
    const bateCategoria = categoriaAtiva === "todas" || f.categoria === categoriaAtiva;
    const bateBusca =
      !busca ||
      f.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
      f.resposta.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* Header Limpo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Voltar para a página inicial"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.png"
                alt="Logo Heelcloth"
                width={20}
                height={38}
                className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
              <span className="font-black text-lg tracking-tight text-slate-950">
                HEELCLOTH
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/rastreio" className="text-slate-600 hover:text-slate-950 transition font-medium">
              Rastrear Pedido
            </Link>
            <Link
              href="/pedido"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
            >
              Fazer Pedido
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 flex-1 w-full">
        {/* Título e Apresentação */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Central de Dúvidas
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Perguntas Frequentes & Suporte
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Tire suas dúvidas sobre como montar seu pedido, tabela de medidas dos atletas, materiais esportivos e acompanhamento da confecção.
          </p>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar dúvida ou palavra-chave (ex: medidas, prazo, tecido)..."
            className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-slate-950 bg-white"
          />
        </div>

        {/* Filtros de Categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "todas", label: "Todas as Dúvidas" },
            { id: "pedido", label: "Como Fazer Pedido" },
            { id: "tamanhos", label: "Tamanhos & Medidas" },
            { id: "personalizacao", label: "Personalização & Escudos" },
            { id: "rastreio", label: "Acompanhamento" },
            { id: "suporte", label: "Prazos & Pagamento" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                categoriaAtiva === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Perguntas (Acordeão Limpo) */}
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
          {faqsFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma resposta encontrada para os termos buscados.
            </div>
          ) : (
            faqsFiltrados.map((faq, idx) => {
              const aberto = itensAbertos[idx];
              return (
                <div key={idx} className="p-4 sm:p-5">
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full text-left flex items-start justify-between gap-4 group"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {faq.pergunta}
                    </span>
                    <span className="p-1 rounded text-slate-400 group-hover:text-slate-700 shrink-0">
                      {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  {aberto && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {faq.resposta}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bloco de Contato Direto */}
        <div className="border border-slate-200 rounded-lg p-6 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900">Ainda precisa de ajuda?</h3>
            <p className="text-xs text-slate-600">
              Inicie seu pedido e nossa equipe de produção entrará em contato para alinhar os detalhes do seu uniforme.
            </p>
          </div>
          <Link
            href="/pedido"
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shrink-0"
          >
            Fazer Meu Pedido
          </Link>
        </div>
      </main>

      {/* Footer Discreto */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Heelcloth Sportswear. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition">
            <Lock className="h-3 w-3" />
            <Link href="/login" className="hover:underline">
              Acesso do Colaborador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
