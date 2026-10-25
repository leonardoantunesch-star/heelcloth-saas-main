"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SeletorTamanho } from "@/components/SeletorTamanho";
import { SiteHeader } from "@/components/SiteHeader";
import { PRECOS_PADRAO, calcularOrcamento } from "@/lib/orcamento";
import {
  Shirt,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageCircle,
  ArrowRight,
  Info,
} from "lucide-react";

interface LinhaUniforme {
  id: string;
  nome: string;
  numero: string;
  tamCamisa: string;
  tamShort: string;
  goleiro: boolean;
  mangaLonga: boolean;
  texturizada: boolean;
  punhos: boolean;
  obs: string;
}

// Opção marcável (manga longa, textura, punho...) com efeito de hover e de clique.
function OpcaoCheck({
  checked,
  onChange,
  rotulo,
  detalhe,
  disabled = false,
  grande = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  rotulo: string;
  detalhe?: string;
  disabled?: boolean;
  grande?: boolean;
}) {
  return (
    <label
      className={`ripple-host inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 select-none ${
        grande ? "min-h-[44px]" : "py-1.5"
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={`rounded border-slate-300 text-[#49AAB8] focus:ring-[#49AAB8] ${grande ? "w-4 h-4" : "w-3.5 h-3.5"} ${
          disabled ? "" : "cursor-pointer"
        }`}
      />
      <span>
        {rotulo}
        {detalhe && <span className="ml-1 text-[10px] text-slate-400 font-medium">{detalhe}</span>}
      </span>
    </label>
  );
}

export default function FazerPedidoPage() {
  const router = useRouter();

  // Dados do Cliente / Equipe
  const [representante, setRepresentante] = useState("");
  const [contato, setContato] = useState("");
  const [tentouEnviar, setTentouEnviar] = useState(false);

  // Cria 10 jogadores iniciais (mínimo exigido pela confecção)
  const [linhas, setLinhas] = useState<LinhaUniforme[]>(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `linha-${i + 1}`,
      nome: "",
      numero: (i + 1).toString().padStart(2, "0"),
      tamCamisa: "M",
      tamShort: "",
      goleiro: i === 0, // Primeiro jogador como goleiro por padrão
      mangaLonga: false,
      texturizada: false,
      punhos: false,
      obs: "",
    }))
  );

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  // Adicionar nova linha de jogador
  const adicionarLinha = () => {
    const proximoNum = (linhas.length + 1).toString().padStart(2, "0");
    setLinhas((prev) => [
      ...prev,
      {
        id: `linha-${Date.now()}-${prev.length + 1}`,
        nome: "",
        numero: proximoNum,
        tamCamisa: "M",
        tamShort: "",
        goleiro: false,
        mangaLonga: false,
        texturizada: false,
        punhos: false,
        obs: "",
      },
    ]);
  };

  // Remover linha com confirmação caso tenha dados preenchidos
  const removerLinha = (id: string) => {
    if (linhas.length <= 1) return;
    const linha = linhas.find((l) => l.id === id);
    if (linha && (linha.nome.trim() !== "" || linha.obs.trim() !== "")) {
      const confirmar = window.confirm(
        `Remover este jogador (${linha.nome.trim() || `Camisa nº ${linha.numero}`}) da lista?`
      );
      if (!confirmar) return;
    }
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  };

  // Atualizar campo específico de uma linha
  const atualizarLinha = (id: string, campo: keyof LinhaUniforme, valor: any) => {
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const nova = { ...l, [campo]: valor };
        // Textura já traz o punho incluso: ao marcar, o punho liga sozinho (e fica travado);
        // ao desmarcar, volta ao normal.
        if (campo === "texturizada") nova.punhos = Boolean(valor);
        return nova;
      })
    );
  };

  // Máscara amigável de WhatsApp
  const handleContatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (raw.length <= 2) {
      setContato(raw);
    } else if (raw.length <= 7) {
      setContato(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    } else {
      setContato(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`);
    }
  };

  // Totais de peças
  const totalCamisas = linhas.filter((l) => Boolean(l.tamCamisa)).length;
  const totalShorts = linhas.filter((l) => Boolean(l.tamShort)).length;

  // Estimativa de preço: usa a mesma regra do servidor (camisa, punho, textura e manga longa).
  const orcamento = calcularOrcamento(
    PRECOS_PADRAO,
    linhas.map((l) => ({
      tamCamisa: l.tamCamisa,
      tamShort: l.tamShort,
      opcoes: [
        ...(l.mangaLonga ? ["manga_longa"] : []),
        ...(l.texturizada ? ["texturizada"] : []),
        ...(l.punhos || l.texturizada ? ["punhos"] : []),
      ],
    }))
  );
  const totalEstimado = orcamento.total;
  const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentouEnviar(true);
    setErro(null);

    if (!representante.trim()) {
      setErro("Informe o nome do responsável ou da equipe para prosseguir.");
      return;
    }

    const cleanContato = contato.replace(/\D/g, "");
    if (cleanContato.length < 10) {
      setErro("Informe um número de WhatsApp válido com DDD (mínimo 10 dígitos).");
      return;
    }

    if (totalCamisas < 10) {
      setErro(
        `O pedido mínimo para confecção é de 10 camisas. Atualmente há ${totalCamisas} camisas selecionadas.`
      );
      return;
    }

    setEnviando(true);

    try {
      // Monta payload esperado por /api/enviar
      const payloadItens = linhas.map((l) => {
        const opcoes: string[] = [];
        if (l.mangaLonga) opcoes.push("manga_longa");
        if (l.texturizada) opcoes.push("texturizada");
        if (l.punhos) opcoes.push("punhos");

        return {
          nome: l.nome.trim().toUpperCase(),
          numero: l.numero.trim(),
          tamCamisa: l.tamCamisa,
          tamShort: l.tamShort || "",
          goleiro: l.goleiro,
          opcoes,
          obs: l.obs.trim(),
        };
      });

      const res = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          representante: representante.trim(),
          contato: cleanContato,
          itens: payloadItens,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setProtocoloGerado(data.protocolo);
      } else {
        setErro(data.erro || "Falha ao processar o pedido. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro no envio:", err);
      setErro("Erro de comunicação com o servidor. Verifique sua conexão com a internet.");
    } finally {
      setEnviando(false);
    }
  };

  const contatoInvalido = tentouEnviar && contato.replace(/\D/g, "").length < 10;
  const representanteInvalido = tentouEnviar && !representante.trim();

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#49AAB8] selection:text-white flex flex-col justify-between">
      
      <SiteHeader />

      {/* ==================================================================== */}
      {/* CONTEÚDO PRINCIPAL DA TELA DE PEDIDO */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* TELA DE SUCESSO PÓS-ENVIO */}
        {protocoloGerado ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto text-center space-y-6 shadow-xs animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#49AAB8]/15 text-[#49AAB8] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#121212] tracking-tight">
                Pedido Enviado com Sucesso!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Seu pedido foi registrado em nossa confecção. Guarde o número de protocolo abaixo para acompanhar a produção da sua equipe:
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 inline-block min-w-[260px]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Número do Pedido / Protocolo
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#121212] font-mono mt-1 tracking-tight">
                {protocoloGerado}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/rastreio/${protocoloGerado}`}
                className="ripple-so-clique w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-full bg-[#121212] hover:bg-black/85 text-white text-xs sm:text-sm font-semibold transition"
              >
                <Search className="w-4 h-4" />
                <span>Acompanhar no Rastreamento</span>
              </Link>
              <a
                href={`https://wa.me/5511999999999?text=${encodeURIComponent(
                  `Olá! Acabei de enviar o pedido ${protocoloGerado} pelo site da Heelcloth e gostaria de confirmar.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ripple-host w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-full border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Confirmar via WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            
            {/* 1. HERO COMPACTO NO TOPO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121212]">
                  Monte seu pedido
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                  Informe os dados da equipe, os jogadores e os tamanhos para receber seu orçamento.
                </p>
              </div>

              {/* Contador Limpo do Mínimo de Peças */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 self-start sm:self-center shrink-0">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    totalCamisas >= 10 ? "bg-emerald-500" : "bg-[#49AAB8]"
                  }`}
                />
                <span className="font-semibold text-[#121212]">
                  {totalCamisas} de 10 peças mínimas
                </span>
                {totalCamisas >= 10 && (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Atingido
                  </span>
                )}
              </div>
            </div>

            {/* Alerta de Erro Geral */}
            {erro && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs sm:text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{erro}</span>
              </div>
            )}

            {/* 2. SEÇÃO: DADOS DA EQUIPE */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-[#121212] uppercase tracking-wider font-mono">
                  1. Dados da equipe
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identificação do responsável para formalização do orçamento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
                {/* Nome do Responsável / Equipe / Empresa */}
                <div>
                  <label
                    htmlFor="representante"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Nome do responsável / equipe / empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representante"
                    name="representante"
                    type="text"
                    required
                    value={representante}
                    onChange={(e) => setRepresentante(e.target.value)}
                    placeholder="Ex: Carlos Silva ou Grêmio F.C."
                    aria-invalid={representanteInvalido}
                    className={`w-full h-11 px-3.5 text-xs sm:text-sm bg-white border rounded-xl text-[#121212] placeholder-slate-400 transition focus:outline-none focus-visible:ring-2 ${
                      representanteInvalido
                        ? "border-red-400 focus-visible:ring-red-200"
                        : "border-slate-200 focus:border-[#49AAB8] focus-visible:ring-[#49AAB8]/20"
                    }`}
                  />
                  {representanteInvalido && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">
                      O nome do responsável é obrigatório.
                    </p>
                  )}
                </div>

                {/* WhatsApp com DDD */}
                <div>
                  <label
                    htmlFor="contato"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    WhatsApp com DDD <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contato"
                    name="contato"
                    type="tel"
                    required
                    value={contato}
                    onChange={handleContatoChange}
                    placeholder="(11) 98765-4321"
                    aria-invalid={contatoInvalido}
                    className={`w-full h-11 px-3.5 text-xs sm:text-sm bg-white border rounded-xl text-[#121212] placeholder-slate-400 transition focus:outline-none focus-visible:ring-2 ${
                      contatoInvalido
                        ? "border-red-400 focus-visible:ring-red-200"
                        : "border-slate-200 focus:border-[#49AAB8] focus-visible:ring-[#49AAB8]/20"
                    }`}
                  />
                  {contatoInvalido && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">
                      Informe o DDD e telefone celular com pelo menos 10 dígitos.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. SEÇÃO: JOGADORES E UNIFORMES */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#121212] uppercase tracking-wider font-mono">
                    2. Jogadores e uniformes ({linhas.length} itens)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preencha o nome nas costas, número e tamanhos de cada atleta.
                  </p>
                </div>

                {/* Botão Adicionar Jogador em Azul Aqua */}
                <button
                  type="button"
                  onClick={adicionarLinha}
                  className="ripple-so-clique inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-[#49AAB8] hover:bg-[#368D9C] text-white text-xs font-semibold transition active:scale-[0.98] shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar jogador</span>
                </button>
              </div>

              {/* VISUALIZAÇÃO DESKTOP: TABELA LIMPA COM CABEÇALHO FIXO */}
              <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs text-left text-slate-700 border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold font-mono tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3 w-12 text-center">#</th>
                        <th className="px-3 py-3">Nome nas costas</th>
                        <th className="px-2 py-3 w-20 text-center">Nº</th>
                        <th className="px-3 py-3 w-28 text-center">Camisa</th>
                        <th className="px-3 py-3 w-28 text-center">Short</th>
                        <th className="px-3 py-3 w-20 text-center">Goleiro</th>
                        <th className="px-3 py-3">Opções de acabamento</th>
                        <th className="px-3 py-3 min-w-[180px]">Observações <span className="normal-case font-medium text-slate-400">(opcional)</span></th>
                        <th className="px-2 py-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {linhas.map((linha, idx) => (
                        <tr key={linha.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Ordem */}
                          <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                            {(idx + 1).toString().padStart(2, "0")}
                          </td>

                          {/* Nome */}
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={linha.nome}
                              onChange={(e) =>
                                atualizarLinha(linha.id, "nome", e.target.value.toUpperCase())
                              }
                              placeholder="NOME DO ATLETA"
                              aria-label={`Nome do jogador ${idx + 1}`}
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] uppercase placeholder-slate-400 focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                            />
                          </td>

                          {/* Número como texto para aceitar '00' */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="text"
                              value={linha.numero}
                              onChange={(e) =>
                                atualizarLinha(linha.id, "numero", e.target.value)
                              }
                              placeholder="00"
                              maxLength={4}
                              aria-label={`Número do jogador ${idx + 1}`}
                              className="w-full h-8 px-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-[#121212] focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                            />
                          </td>

                          {/* Tamanho da Camisa */}
                          <td className="px-3 py-2.5 text-center">
                            <SeletorTamanho
                              value={linha.tamCamisa}
                              onChange={(valor) => atualizarLinha(linha.id, "tamCamisa", valor)}
                              ariaLabel={`Tamanho da camisa do jogador ${idx + 1}`}
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-[#121212] focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                            />
                          </td>

                          {/* Tamanho do Short */}
                          <td className="px-3 py-2.5 text-center">
                            <SeletorTamanho
                              tipo="short"
                              value={linha.tamShort}
                              onChange={(valor) => atualizarLinha(linha.id, "tamShort", valor)}
                              ariaLabel={`Tamanho do short do jogador ${idx + 1}`}
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                            />
                          </td>

                          {/* Checkbox Goleiro */}
                          <td className="px-3 py-2.5 text-center">
                            <label className="ripple-host inline-flex items-center justify-center cursor-pointer min-w-[32px] min-h-[32px] rounded-lg">
                              <input
                                type="checkbox"
                                checked={linha.goleiro}
                                onChange={(e) =>
                                  atualizarLinha(linha.id, "goleiro", e.target.checked)
                                }
                                aria-label={`Marcar jogador ${idx + 1} como goleiro`}
                                className="w-4 h-4 rounded border-slate-300 text-[#49AAB8] focus:ring-[#49AAB8] cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* Opções de Acabamento */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-slate-600">
                              <OpcaoCheck
                                checked={linha.mangaLonga}
                                onChange={(v) => atualizarLinha(linha.id, "mangaLonga", v)}
                                rotulo="Manga longa"
                                detalhe="+ R$ 20"
                              />
                              <OpcaoCheck
                                checked={linha.texturizada}
                                onChange={(v) => atualizarLinha(linha.id, "texturizada", v)}
                                rotulo="Textura"
                                detalhe="R$ 59,90"
                              />
                              <OpcaoCheck
                                checked={linha.punhos || linha.texturizada}
                                disabled={linha.texturizada}
                                onChange={(v) => atualizarLinha(linha.id, "punhos", v)}
                                rotulo="Punho"
                                detalhe={linha.texturizada ? "incluso" : "R$ 49,90"}
                              />
                            </div>
                          </td>

                          {/* Observações (opcional) */}
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={linha.obs}
                              onChange={(e) => atualizarLinha(linha.id, "obs", e.target.value)}
                              placeholder="Opcional"
                              maxLength={300}
                              aria-label={`Observações da camisa do jogador ${idx + 1} (opcional)`}
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] placeholder-slate-400 focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                            />
                          </td>

                          {/* Excluir */}
                          <td className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removerLinha(linha.id)}
                              disabled={linhas.length <= 1}
                              aria-label={`Remover jogador ${idx + 1}`}
                              className="ripple-so-clique w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-20 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VISUALIZAÇÃO MOBILE: CARTÕES COMPACTOS NUMERADOS */}
              <div className="md:hidden space-y-3">
                {linhas.map((linha, idx) => (
                  <div
                    key={linha.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3"
                  >
                    {/* Topo do Cartão: Número de Ordem e Botão de Excluir */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#121212]">
                          Jogador #{linha.numero || idx + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerLinha(linha.id)}
                        disabled={linhas.length <= 1}
                        aria-label={`Remover jogador ${idx + 1}`}
                        className="ripple-so-clique p-2 rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-20 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Linha 1: Nome nas Costas e Número */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <label
                          htmlFor={`mobile-nome-${linha.id}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Nome nas costas
                        </label>
                        <input
                          id={`mobile-nome-${linha.id}`}
                          type="text"
                          value={linha.nome}
                          onChange={(e) =>
                            atualizarLinha(linha.id, "nome", e.target.value.toUpperCase())
                          }
                          placeholder="Ex: SILVA"
                          className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] uppercase placeholder-slate-400 focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`mobile-num-${linha.id}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1 text-center"
                        >
                          Nº
                        </label>
                        <input
                          id={`mobile-num-${linha.id}`}
                          type="text"
                          value={linha.numero}
                          onChange={(e) =>
                            atualizarLinha(linha.id, "numero", e.target.value)
                          }
                          placeholder="10"
                          maxLength={4}
                          className="w-full h-10 px-1 text-xs bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-[#121212] focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Camisa e Short */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor={`mobile-camisa-${linha.id}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Camisa
                        </label>
                        <SeletorTamanho
                          id={`mobile-camisa-${linha.id}`}
                          value={linha.tamCamisa}
                          onChange={(valor) => atualizarLinha(linha.id, "tamCamisa", valor)}
                          className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] font-semibold focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`mobile-short-${linha.id}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Calção / Short
                        </label>
                        <SeletorTamanho
                          tipo="short"
                          id={`mobile-short-${linha.id}`}
                          value={linha.tamShort}
                          onChange={(valor) => atualizarLinha(linha.id, "tamShort", valor)}
                          className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] font-semibold focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                        />
                      </div>
                    </div>

                    {/* Linha 3: Opções e Acabamento com área de toque mínima de 44px */}
                    <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center gap-x-1 gap-y-0 text-xs text-slate-700">
                      <OpcaoCheck
                        grande
                        checked={linha.goleiro}
                        onChange={(v) => atualizarLinha(linha.id, "goleiro", v)}
                        rotulo="Goleiro"
                      />
                      <OpcaoCheck
                        grande
                        checked={linha.mangaLonga}
                        onChange={(v) => atualizarLinha(linha.id, "mangaLonga", v)}
                        rotulo="Manga longa"
                        detalhe="+ R$ 20"
                      />
                      <OpcaoCheck
                        grande
                        checked={linha.texturizada}
                        onChange={(v) => atualizarLinha(linha.id, "texturizada", v)}
                        rotulo="Textura"
                        detalhe="R$ 59,90"
                      />
                      <OpcaoCheck
                        grande
                        checked={linha.punhos || linha.texturizada}
                        disabled={linha.texturizada}
                        onChange={(v) => atualizarLinha(linha.id, "punhos", v)}
                        rotulo="Punho"
                        detalhe={linha.texturizada ? "incluso" : "R$ 49,90"}
                      />
                    </div>

                    {/* Observações (opcional) */}
                    <div>
                      <label
                        htmlFor={`mobile-obs-${linha.id}`}
                        className="block text-[11px] font-semibold text-slate-600 mb-1"
                      >
                        Observações <span className="font-normal text-slate-400">(opcional)</span>
                      </label>
                      <textarea
                        id={`mobile-obs-${linha.id}`}
                        value={linha.obs}
                        onChange={(e) => atualizarLinha(linha.id, "obs", e.target.value)}
                        rows={2}
                        maxLength={300}
                        placeholder="Ex: gola diferente, nome menor, detalhe no braço..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#121212] placeholder-slate-400 resize-none focus:outline-none focus:border-[#49AAB8] focus-visible:ring-1 focus-visible:ring-[#49AAB8]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé da Seção com Dica e Atalho de Adicionar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <div className="flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Dica: ao marcar <strong>Textura</strong>, o <strong>Punho</strong> já vem incluso. Use <strong>Observações</strong> para qualquer detalhe de cada camisa (é opcional).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={adicionarLinha}
                  className="ripple-host inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-[#49AAB8]" />
                  <span>+1 Jogador</span>
                </button>
              </div>
            </section>

            {/* 4. SEÇÃO: RESUMO & ENVIO */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-semibold block">
                  Estimativa preliminar do pedido
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-bold text-[#121212] tracking-tight">
                    {brl(totalEstimado)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({totalCamisas} camisas{totalShorts > 0 ? ` + ${totalShorts} calções` : ""})
                  </span>
                </div>
                {orcamento.linhas.length > 0 && (
                  <ul className="pt-1 space-y-0.5 text-[11px] text-slate-500">
                    {orcamento.linhas.map((l, i) => (
                      <li key={i}>{l.d}</li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-slate-400">
                  * Os valores finais serão formalizados após envio e aprovação do layout digital.
                </p>
              </div>

              {/* CTA Final em Azul Aqua */}
              <button
                type="submit"
                disabled={enviando}
                className="ripple-so-clique w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#49AAB8] hover:bg-[#368D9C] text-white text-sm font-semibold transition active:scale-[0.98] shadow-2xs disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] focus-visible:ring-offset-2"
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar para o resumo</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" strokeWidth={2} />
                  </>
                )}
              </button>
            </section>
          </form>
        )}
      </main>

      {/* ==================================================================== */}
      {/* FOOTER DISCRETO */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Heelcloth Sportswear. Confecção especializada sob medida.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#121212] transition">
              Início
            </Link>
            <Link href="/rastreio" className="hover:text-[#121212] transition">
              Rastreamento
            </Link>
            <Link href="/ajuda" className="hover:text-[#121212] transition">
              Ajuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
