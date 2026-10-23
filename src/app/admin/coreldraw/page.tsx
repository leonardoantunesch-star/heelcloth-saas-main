"use client";

import React, { useState, useEffect } from "react";
import {
  Shirt,
  Download,
  Copy,
  Check,
  Code,
  FileText,
  Search,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Info,
  Upload,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  playerIndex: number;
  name: string;
  number: string;
  size: string;
  model: string;
  notes?: string | null;
  shortSize?: string | null;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    whatsapp?: string;
    address?: string;
  };
  totalJogadores: number;
  players: Player[];
}

export default function CorelDrawPage() {
  const [pedidos, setPedidos] = useState<OrderSummary[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [copiadoDados, setCopiadoDados] = useState(false);
  const [copiadoMacro, setCopiadoMacro] = useState(false);
  const [mostrarModalMacro, setMostrarModalMacro] = useState(false);
  const [mostrarModalGuia, setMostrarModalGuia] = useState(false);
  const [mostrarModalResultado, setMostrarModalResultado] = useState(false);
  const [manifestoJson, setManifestoJson] = useState("");
  const [importandoResultado, setImportandoResultado] = useState(false);
  const [resultadoSucesso, setResultadoSucesso] = useState<string | null>(null);
  const [resultadoErro, setResultadoErro] = useState<string | null>(null);
  const [macroCodigo, setMacroCodigo] = useState("");
  const [dadosTabulados, setDadosTabulados] = useState("");

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coreldraw?busca=${encodeURIComponent(busca)}`);
      const data = await res.json();
      if (data.sucesso && data.pedidos) {
        setPedidos(data.pedidos);
        if (data.pedidos.length > 0) {
          const atual = pedidoSelecionado
            ? data.pedidos.find((p: OrderSummary) => p.id === pedidoSelecionado.id) || data.pedidos[0]
            : data.pedidos[0];
          selecionarPedido(atual);
        } else {
          setPedidoSelecionado(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos para CorelDRAW:", err);
    } finally {
      setLoading(false);
    }
  };

  const selecionarPedido = async (pedido: OrderSummary) => {
    setPedidoSelecionado(pedido);
    setCopiadoDados(false);
    try {
      const res = await fetch(`/api/coreldraw/${pedido.id}`);
      const data = await res.json();
      if (data.sucesso) {
        setDadosTabulados(data.vbaData);
        setMacroCodigo(data.vbaMacro);
      }
    } catch (err) {
      console.error("Erro ao obter dados do pedido selecionado:", err);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, [busca]);

  const copiarDadosTabulados = () => {
    if (!dadosTabulados) return;
    navigator.clipboard.writeText(dadosTabulados);
    setCopiadoDados(true);
    setTimeout(() => setCopiadoDados(false), 2500);
  };

  const copiarMacroCodigo = () => {
    if (!macroCodigo) return;
    navigator.clipboard.writeText(macroCodigo);
    setCopiadoMacro(true);
    setTimeout(() => setCopiadoMacro(false), 2500);
  };

  const baixarArquivoTxt = () => {
    if (!pedidoSelecionado) return;
    window.open(`/api/coreldraw/${pedidoSelecionado.id}/download`, "_blank");
  };

  const baixarJobJson = () => {
    if (!pedidoSelecionado) return;
    window.open(`/api/coreldraw/${pedidoSelecionado.id}/job?download=true`, "_blank");
  };

  const enviarManifestoResultado = async () => {
    if (!pedidoSelecionado || !manifestoJson.trim()) return;
    try {
      setImportandoResultado(true);
      setResultadoErro(null);
      setResultadoSucesso(null);
      let parsed;
      try {
        parsed = JSON.parse(manifestoJson);
      } catch {
        setResultadoErro("O conteúdo informado não é um JSON válido.");
        return;
      }

      const res = await fetch(`/api/coreldraw/${pedidoSelecionado.id}/resultado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        setResultadoErro(data.erro || "Falha ao processar o manifesto de resultado.");
        return;
      }

      setResultadoSucesso(
        `Manifesto processado com sucesso! Status: ${data.status.toUpperCase()}. Novos arquivos vinculados ao pedido: ${data.novosArquivosAnexados || 0}.`
      );
      setManifestoJson("");
      carregarPedidos();
    } catch (err: any) {
      setResultadoErro(err.message || "Erro de rede ao enviar resultado.");
    } finally {
      setImportandoResultado(false);
    }
  };

  const totalPecas = pedidos.reduce((acc, p) => acc + (p.totalJogadores || 0), 0);
  const pedidosComArte = pedidos.filter((p) => p.totalJogadores > 0).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Shirt className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Automação CorelDRAW (VBA)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gere arquivos tabulados para produção automática de camisas e preenchimento de nomes/números no CorelDRAW.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarModalGuia(true)}
            className="gap-1.5 flex-1 sm:flex-initial justify-center"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Guia VBA</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setMostrarModalMacro(true)}
            className="gap-1.5 flex-1 sm:flex-initial justify-center bg-slate-900 text-white hover:bg-slate-800"
          >
            <Code className="w-4 h-4 text-blue-400" />
            <span>Macro VBA (.bas)</span>
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase">Pedidos Cadastrados</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{pedidos.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Shirt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase">Com Jogadores</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{pedidosComArte}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase">Total Peças</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalPecas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Code className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase">Versão Corel</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">X7 / 2020 a 2024</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal: Seleção de Pedido + Painel de Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Pedidos */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col min-h-[350px] lg:h-[700px]">
          <div className="p-4 border-b border-slate-100 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Selecione o Pedido</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nº do pedido ou cliente..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Carregando pedidos...</div>
            ) : pedidos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum pedido encontrado.
              </div>
            ) : (
              pedidos.map((pedido) => {
                const isSelected = pedidoSelecionado?.id === pedido.id;
                return (
                  <button
                    key={pedido.id}
                    onClick={() => selecionarPedido(pedido)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between mb-1 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {pedido.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            pedido.totalJogadores > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pedido.totalJogadores} {pedido.totalJogadores === 1 ? "peça" : "peças"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                        {pedido.customer.name}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-blue-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Dados Tabulados e Ações */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col min-h-[450px] lg:h-[700px] overflow-hidden">
          {pedidoSelecionado ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Barra de Ações Superior */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">
                      {pedidoSelecionado.orderNumber}
                    </h2>
                    <Badge variant="secondary">{pedidoSelecionado.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cliente: <strong className="text-slate-700">{pedidoSelecionado.customer.name}</strong> •{" "}
                    Total de camisas: <strong className="text-slate-700">{pedidoSelecionado.totalJogadores}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copiarDadosTabulados}
                    disabled={pedidoSelecionado.totalJogadores === 0}
                    className="gap-1.5 flex-1 sm:flex-initial justify-center"
                    title="Copiar dados tabulados para o clipboard"
                  >
                    {copiadoDados ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Dados</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={baixarArquivoTxt}
                    disabled={pedidoSelecionado.totalJogadores === 0}
                    className="gap-1.5 flex-1 sm:flex-initial justify-center"
                    title="Baixar lista tabulada legada em .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar .txt</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={baixarJobJson}
                    disabled={pedidoSelecionado.totalJogadores === 0}
                    className="gap-1.5 flex-1 sm:flex-initial justify-center text-blue-700 border-blue-200 hover:bg-blue-50"
                    title="Baixar snapshot estruturado do job em formato JSON para automação CorelDRAW VBA"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Job JSON</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setResultadoErro(null);
                      setResultadoSucesso(null);
                      setManifestoJson("");
                      setMostrarModalResultado(true);
                    }}
                    className="gap-1.5 flex-1 sm:flex-initial justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                    title="Importar manifesto de resultado emitido pelo CorelDRAW VBA"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar Resultado</span>
                  </Button>
                </div>
              </div>

              {/* Conteúdo Central: Tabela de Jogadores / Camisas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {pedidoSelecionado.totalJogadores === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">
                      Nenhum jogador cadastrado neste pedido
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Para gerar a lista tabulada, adicione os nomes e números dos jogadores no módulo de Pedidos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Lista de Jogadores ({pedidoSelecionado.players.length})
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Tabulado: Nome \t Nº \t Camisa \t Obs \t Short
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 w-12 text-center">#</th>
                              <th className="px-3 py-2">Nome Costas</th>
                              <th className="px-3 py-2 w-20 text-center">Nº</th>
                              <th className="px-3 py-2 w-20 text-center">Camisa</th>
                              <th className="px-3 py-2 w-20 text-center">Short</th>
                              <th className="px-3 py-2">Modelo</th>
                              <th className="px-3 py-2">Obs</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {pedidoSelecionado.players.map((jogador, idx) => (
                              <tr key={jogador.id || idx} className="hover:bg-slate-50/70">
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">
                                  {jogador.playerIndex || idx + 1}
                                </td>
                                <td className="px-3 py-2 font-bold text-slate-800">
                                  {jogador.name || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold">
                                    {jogador.number || "-"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center font-semibold text-slate-700">
                                  {jogador.size || "M"}
                                </td>
                                <td className="px-3 py-2 text-center text-slate-500">
                                  {jogador.shortSize || "-"}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {jogador.model || "PADRÃO"}
                                </td>
                                <td className="px-3 py-2 text-slate-400 italic">
                                  {jogador.notes || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Visualização dos Dados Brutos Tabulados */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-bold text-slate-700">
                          Pré-visualização do Arquivo TXT (Raw Tab-Delimited)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {dadosTabulados.split("\n").filter(Boolean).length} linhas
                        </span>
                      </div>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 selection:bg-emerald-900">
                        {dadosTabulados || "Carregando pré-visualização..."}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 m-auto text-sm">
              Selecione um pedido à esquerda para visualizar a automação CorelDRAW.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Guia Passo a Passo */}
      <Modal
        isOpen={mostrarModalGuia}
        onClose={() => setMostrarModalGuia(false)}
        title="Como Usar a Automação no CorelDRAW"
        maxWidth="xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalGuia(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMostrarModalGuia(false);
                setMostrarModalMacro(true);
              }}
            >
              Ver Código VBA
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              Conceito do Módulo Heelcloth VBA
            </p>
            <p>
              Esta macro duplica a página do seu gabarito para cada linha do pedido e preenche
              automaticamente os textos de <strong>NOME</strong> e <strong>NÚMERO</strong> sem exigir digitação manual.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Baixar o arquivo .txt do Pedido</h4>
                <p className="mt-0.5 text-slate-500">
                  Na Central CorelDRAW do Heelcloth, clique em <strong>"Baixar .txt"</strong> e salve o arquivo no seu computador.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Preparar o Gabarito no CorelDRAW</h4>
                <p className="mt-0.5 text-slate-500">
                  Abra o arquivo da camisa no CorelDRAW. Certifique-se de que há um texto de exemplo para o nome (ex: "NOME") e um para o número (ex: "10").
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Instalar a Macro VBA (Apenas uma vez)</h4>
                <p className="mt-0.5 text-slate-500">
                  Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">ALT + F11</kbd> para abrir o Editor VBA. Vá em <strong>Inserir &gt; Módulo</strong> e cole o código da macro fornecido pelo sistema.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Executar a Automação</h4>
                <p className="mt-0.5 text-slate-500">
                  Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">ALT + F8</kbd>, selecione <strong>GerarCamisasHeelcloth</strong> e clique em Executar. Selecione o arquivo .txt e aguarde as páginas serem geradas!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Código VBA (.bas) */}
      <Modal
        isOpen={mostrarModalMacro}
        onClose={() => setMostrarModalMacro(false)}
        title="Macro VBA Padrão Heelcloth"
        description="Compatível com CorelDRAW X7, 2018, 2020, 2022 e 2024"
        maxWidth="2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalMacro(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={copiarMacroCodigo}
              className="gap-1.5"
            >
              {copiadoMacro ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Código da Macro</span>
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[60vh]">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre selection:bg-emerald-800">
            {macroCodigo || "Carregando código VBA..."}
          </pre>
        </div>
      </Modal>

      {/* MODAL: Importar Resultado CorelDRAW */}
      <Modal
        isOpen={mostrarModalResultado}
        onClose={() => setMostrarModalResultado(false)}
        title="Importar Manifesto de Resultado (CorelDRAW VBA)"
        description={
          pedidoSelecionado
            ? `Pedido: ${pedidoSelecionado.orderNumber} • ${pedidoSelecionado.customer.name}`
            : ""
        }
        maxWidth="2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalResultado(false)}
              disabled={importandoResultado}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={enviarManifestoResultado}
              disabled={importandoResultado || !manifestoJson.trim()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importandoResultado ? (
                <span>Processando...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Processar e Vincular Arquivos</span>
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Cole abaixo o conteúdo do arquivo <code>result.json</code> gerado pela macro do CorelDRAW (localizado em <code>C:\Heelcloth\Outputs\{pedidoSelecionado?.orderNumber}\result.json</code>) ou selecione o arquivo local:
          </p>

          <div>
            <input
              type="file"
              accept=".json"
              className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) setManifestoJson(content);
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              JSON do Manifesto (result.json):
            </label>
            <textarea
              rows={9}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='{"jobId": "job_...", "status": "succeeded", "generatedFiles": [...]}'
              value={manifestoJson}
              onChange={(e) => setManifestoJson(e.target.value)}
            />
          </div>

          {resultadoErro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resultadoErro}</span>
            </div>
          )}

          {resultadoSucesso && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{resultadoSucesso}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
