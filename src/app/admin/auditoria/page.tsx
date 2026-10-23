"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Eye,
  AlertTriangle,
  FileCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entity: string;
  entityId: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

interface MetricasAuditoria {
  totalGeral: number;
  totalHoje: number;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasAuditoria>({ totalGeral: 0, totalHoje: 0 });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [acao, setAcao] = useState("TODAS");
  const [entidade, setEntidade] = useState("TODAS");
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [logSelecionado, setLogSelecionado] = useState<AuditLogItem | null>(null);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        busca,
        acao,
        entidade,
      });

      const res = await fetch(`/api/auditoria?${params.toString()}`);
      const json = await res.json();

      if (json.sucesso) {
        setLogs(json.logs || []);
        setTotalPaginas(json.paginacao?.paginas || 1);
        setTotalRegistros(json.paginacao?.total || 0);
        setMetricas(json.metricas || { totalGeral: 0, totalHoje: 0 });
      }
    } catch (err) {
      console.error("Erro ao carregar logs de auditoria:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, [page, acao, entidade]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    carregarLogs();
  };

  const getCorAcao = (act: string) => {
    const a = act.toUpperCase();
    if (a.includes("CRIACAO") || a.includes("LOGIN") || a.includes("APROV")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (a.includes("STATUS") || a.includes("AVANC") || a.includes("ATUALIZ")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (a.includes("EXCLUS") || a.includes("CANCEL") || a.includes("FAIL")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (a.includes("ESTOQUE") || a.includes("NFE")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formatarData = (dStr: string) => {
    return new Date(dStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const renderJsonDetalhes = (detalhesStr?: string | null) => {
    if (!detalhesStr) return "Nenhum detalhe adicional registrado.";
    try {
      const parsed = JSON.parse(detalhesStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return detalhesStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-slate-900 text-indigo-400 shadow-sm">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Auditoria & Logs de Segurança
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Trilha de auditoria completa e imutável para rastreabilidade de ações críticas (Seção 18).
          </p>
        </div>

        <button
          onClick={carregarLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar Logs
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total de Eventos</p>
            <p className="text-xl font-bold text-slate-900">{metricas.totalGeral}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Ações Hoje</p>
            <p className="text-xl font-bold text-slate-900">{metricas.totalHoje}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Nível de Proteção</p>
            <p className="text-sm font-bold text-slate-900">Trilha Auditada (RBAC)</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Acesso ao Módulo</p>
            <p className="text-sm font-bold text-purple-700">Exclusivo ADMIN</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por ID, detalhes, usuário ou ação..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={entidade}
              onChange={(e) => {
                setEntidade(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TODAS">Todas as Entidades</option>
              <option value="PEDIDO">Pedidos</option>
              <option value="CLIENTE">Clientes</option>
              <option value="PRODUCAO">Produção</option>
              <option value="QUALIDADE">Qualidade</option>
              <option value="ESTOQUE">Estoque</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="NFE">NF-e</option>
              <option value="USUARIO">Usuários</option>
              <option value="AUTH">Autenticação</option>
              <option value="CONFIG">Configurações</option>
            </select>

            <select
              value={acao}
              onChange={(e) => {
                setAcao(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TODAS">Todas as Ações</option>
              <option value="CRIACAO">Criação</option>
              <option value="ATUALIZACAO">Atualização</option>
              <option value="STATUS_CHANGE">Mudança de Status</option>
              <option value="EXCLUSAO">Exclusão</option>
              <option value="LOGIN">Login</option>
              <option value="NFE_EMISSAO">Emissão NF-e</option>
              <option value="MOVIMENTACAO_ESTOQUE">Movimento de Estoque</option>
            </select>

            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Registros Encontrados ({totalRegistros})
          </h2>
          <span className="text-xs text-slate-400">
            Página {page} de {totalPaginas || 1}
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">ID do Alvo</th>
                <th className="px-4 py-3">Detalhes</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Carregando registros de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatarData(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {log.user.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">{log.user.name}</p>
                            <p className="text-[10px] text-slate-400">{log.user.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sistema / Público</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getCorAcao(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">
                      {log.details || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setLogSelecionado(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspecionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            Página {page} de {totalPaginas || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            disabled={page >= totalPaginas}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            Próxima
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal / JSON Inspector */}
      {logSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-900 text-indigo-400 rounded-lg">
                  <FileCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inspeção do Registro de Auditoria
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {logSelecionado.id} • {formatarData(logSelecionado.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLogSelecionado(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 font-medium">Usuário Responsável:</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {logSelecionado.user
                      ? `${logSelecionado.user.name} (${logSelecionado.user.role})`
                      : "Sistema / Anônimo"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 font-medium">Ação & Entidade:</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {logSelecionado.action} em {logSelecionado.entity}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payload JSON / Detalhes da Operação:
                </label>
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed selection:bg-emerald-900">
                  {renderJsonDetalhes(logSelecionado.details)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setLogSelecionado(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
