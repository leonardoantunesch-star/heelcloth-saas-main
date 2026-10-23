"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  DollarSign,
  Package,
  MessageSquare,
  Save,
  Check,
  AlertCircle,
  Receipt,
  Clock,
  Sparkles,
} from "lucide-react";

interface ConfigItem {
  valor: string;
  descricao?: string | null;
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [abaAtiva, setAbaAtiva] = useState<"empresa" | "comercial" | "fabrica" | "integracoes">("empresa");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/configuracoes");
      const json = await res.json();
      if (json.sucesso && json.configuracoes) {
        const valores: Record<string, string> = {};
        for (const [chave, item] of Object.entries(json.configuracoes as Record<string, ConfigItem>)) {
          valores[chave] = item.valor;
        }
        setConfigs(valores);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
      setErro("Falha ao carregar parâmetros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const handleChange = (chave: string, valor: string) => {
    setConfigs((prev) => ({ ...prev, [chave]: valor }));
    setSucesso(false);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);

    try {
      const res = await fetch("/api/configuracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });

      const json = await res.json();
      if (json.sucesso) {
        setSucesso(true);
        setTimeout(() => setSucesso(false), 3500);
      } else {
        setErro(json.erro || "Erro ao salvar alterações.");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setErro("Erro de conexão ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  };

  const abas = [
    { id: "empresa", label: "Dados da Empresa", icone: Building },
    { id: "comercial", label: "Comercial & Financeiro", icone: DollarSign },
    { id: "fabrica", label: "Fábrica & Estoque", icone: Package },
    { id: "integracoes", label: "WhatsApp & Fiscal NF-e", icone: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-slate-900 text-white shadow-sm">
              <Settings className="w-5 h-5 text-indigo-400" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Configurações Gerais
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Personalize os dados cadastrais da empresa, prazos de confecção, chaves de pagamento e integrações.
          </p>
        </div>

        <button
          onClick={handleSalvar}
          disabled={salvando || loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 w-full sm:w-auto"
        >
          {salvando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Salvando...</span>
            </>
          ) : sucesso ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Salvo com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Todas as configurações e parâmetros foram atualizados no banco de dados!</span>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {abas.map((tab) => {
          const Icone = tab.icone;
          const ativo = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                ativo
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
              }`}
            >
              <Icone className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSalvar} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Carregando parâmetros do sistema...
          </div>
        ) : (
          <div className="space-y-6">
            {/* ABA 1: DADOS DA EMPRESA */}
            {abaAtiva === "empresa" && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Identificação Cadastral & Localização Fabril
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Razão Social:
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_RAZAO_SOCIAL || ""}
                      onChange={(e) => handleChange("EMPRESA_RAZAO_SOCIAL", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nome Fantasia (Marca):
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_NOME_FANTASIA || ""}
                      onChange={(e) => handleChange("EMPRESA_NOME_FANTASIA", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      CNPJ:
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_CNPJ || ""}
                      onChange={(e) => handleChange("EMPRESA_CNPJ", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Inscrição Estadual (IE):
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_IE || ""}
                      onChange={(e) => handleChange("EMPRESA_IE", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Endereço Completo da Fábrica / Expedição:
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_ENDERECO || ""}
                      onChange={(e) => handleChange("EMPRESA_ENDERECO", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Telefone Comercial / Atendimento:
                    </label>
                    <input
                      type="text"
                      value={configs.EMPRESA_TELEFONE || ""}
                      onChange={(e) => handleChange("EMPRESA_TELEFONE", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      E-mail Oficial:
                    </label>
                    <input
                      type="email"
                      value={configs.EMPRESA_EMAIL || ""}
                      onChange={(e) => handleChange("EMPRESA_EMAIL", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: COMERCIAL & FINANCEIRO */}
            {abaAtiva === "comercial" && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Regras Comerciais, Prazos & Chave PIX
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Prazo Padrão de Entrega (dias):
                    </label>
                    <input
                      type="number"
                      value={configs.PRAZO_PADRAO_DIAS || "15"}
                      onChange={(e) => handleChange("PRAZO_PADRAO_DIAS", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Preenchimento automático ao criar novos pedidos.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Percentual de Sinal Mínimo (%):
                    </label>
                    <input
                      type="number"
                      value={configs.PERCENTUAL_SINAL_MINIMO || "50"}
                      onChange={(e) => handleChange("PERCENTUAL_SINAL_MINIMO", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ex: 50% de entrada para iniciar corte/estampa.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Validade do Orçamento (dias):
                    </label>
                    <input
                      type="number"
                      value={configs.VALIDADE_ORCAMENTO_DIAS || "7"}
                      onChange={(e) => handleChange("VALIDADE_ORCAMENTO_DIAS", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Prazo de validade do preço antes de expirar.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Configuração de Recebimento PIX
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Tipo da Chave PIX:
                      </label>
                      <select
                        value={configs.TIPO_CHAVE_PIX || "CNPJ"}
                        onChange={(e) => handleChange("TIPO_CHAVE_PIX", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Chave PIX:
                      </label>
                      <input
                        type="text"
                        value={configs.CHAVE_PIX || ""}
                        onChange={(e) => handleChange("CHAVE_PIX", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nome do Beneficiário:
                      </label>
                      <input
                        type="text"
                        value={configs.PIX_BENEFICIARIO || ""}
                        onChange={(e) => handleChange("PIX_BENEFICIARIO", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: FÁBRICA & ESTOQUE */}
            {abaAtiva === "fabrica" && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Regras de Controle Fabril & Matéria-Prima
                </h2>

                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Alerta de Nível Mínimo de Estoque
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Exibir tarja de atenção quando rolos de tecido ou tintas estiverem abaixo da cota mínima.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configs.ALERTA_ESTOQUE_MINIMO === "true"}
                        onChange={(e) =>
                          handleChange("ALERTA_ESTOQUE_MINIMO", e.target.checked ? "true" : "false")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Bloquear Saldo Negativo na Saída
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Impede operadores de registrar baixa de insumos caso não haja saldo suficiente registrado.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configs.BLOQUEAR_SALDO_NEGATIVO === "true"}
                        onChange={(e) =>
                          handleChange("BLOQUEAR_SALDO_NEGATIVO", e.target.checked ? "true" : "false")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: WHATSAPP & FISCAL */}
            {abaAtiva === "integracoes" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Disparos Automáticos de WhatsApp
                  </h2>

                  <div className="space-y-3 max-w-xl mt-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Central de Notificações WhatsApp</p>
                        <p className="text-[11px] text-slate-500">Habilita o envio de mensagens transacionais</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configs.WHATSAPP_NOTIFICACOES_ATIVAS === "true"}
                        onChange={(e) =>
                          handleChange("WHATSAPP_NOTIFICACOES_ATIVAS", e.target.checked ? "true" : "false")
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Aviso: Início de Produção</p>
                        <p className="text-[11px] text-slate-500">Notificar cliente quando o corte iniciar</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configs.WHATSAPP_AVISAR_PRODUCAO === "true"}
                        onChange={(e) =>
                          handleChange("WHATSAPP_AVISAR_PRODUCAO", e.target.checked ? "true" : "false")
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Aviso: Pedido Pronto</p>
                        <p className="text-[11px] text-slate-500">Notificar cliente após aprovação no CQ</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configs.WHATSAPP_AVISAR_PRONTO === "true"}
                        onChange={(e) =>
                          handleChange("WHATSAPP_AVISAR_PRONTO", e.target.checked ? "true" : "false")
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 pb-2">
                    Parâmetros Fiscais (NF-e Modelo 55)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Ambiente SEFAZ:
                      </label>
                      <select
                        value={configs.NFE_AMBIENTE || "HOMOLOGACAO"}
                        onChange={(e) => handleChange("NFE_AMBIENTE", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="HOMOLOGACAO">HOMOLOGAÇÃO (Testes)</option>
                        <option value="PRODUCAO">PRODUÇÃO (Com valor fiscal real)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Série da NF-e:
                      </label>
                      <input
                        type="text"
                        value={configs.NFE_SERIE || "1"}
                        onChange={(e) => handleChange("NFE_SERIE", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        NCM Padrão Têxtil:
                      </label>
                      <input
                        type="text"
                        value={configs.NFE_NCM_PADRAO || "6109.10.00"}
                        onChange={(e) => handleChange("NFE_NCM_PADRAO", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={salvando || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Parâmetros da Empresa</span>
          </button>
        </div>
      </form>
    </div>
  );
}
