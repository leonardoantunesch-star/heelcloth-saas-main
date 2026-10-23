"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Shirt,
  Save,
  CheckSquare,
  Square,
  Clock,
  Eye,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QualityCheckState {
  checkQuantity: boolean;
  checkSizes: boolean;
  checkNames: boolean;
  checkNumbers: boolean;
  checkModel: boolean;
  checkPersonalization: boolean;
  checkComplete: boolean;
  observations: string;
}

const CHECKLIST_ITEMS = [
  {
    key: "checkQuantity" as const,
    label: "Quantidade correta",
    descricao: "Contagem total de peças físicas confere exatamente com a quantidade solicitada no pedido.",
  },
  {
    key: "checkSizes" as const,
    label: "Tamanhos corretos",
    descricao: "Grade de tamanhos (P, M, G, GG, Infantil, etc.) confere com a ficha técnica.",
  },
  {
    key: "checkNames" as const,
    label: "Nomes corretos",
    descricao: "Ortografia, acentuação e alinhamento dos nomes estampados conferem com a lista dos jogadores.",
  },
  {
    key: "checkNumbers" as const,
    label: "Números corretos",
    descricao: "Dígitos, tipografia e posições (costas/calção) dos números conferem com a lista.",
  },
  {
    key: "checkModel" as const,
    label: "Modelo correto",
    descricao: "Corte, tecido, tipo de gola (V, redonda, polo), punhos e modelagem aprovada pelo cliente.",
  },
  {
    key: "checkPersonalization" as const,
    label: "Personalização correta",
    descricao: "Brasões, patrocinadores, tonalidade das cores e fidelidade da sublimação/estampa.",
  },
  {
    key: "checkComplete" as const,
    label: "Pedido completo",
    descricao: "Todas as peças de todos os kits (camisas, calções, meiões) finalizadas e embaladas.",
  },
];

export default function QualidadePedidoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);

  const [checks, setChecks] = useState<QualityCheckState>({
    checkQuantity: false,
    checkSizes: false,
    checkNames: false,
    checkNumbers: false,
    checkModel: false,
    checkPersonalization: false,
    checkComplete: false,
    observations: "",
  });

  const [jogadoresConferidos, setJogadoresConferidos] = useState<Record<string, boolean>>({});
  const [mensagemSucesso, setMensagemSucesso] = useState<string>("");
  const [mensagemErro, setMensagemErro] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetch(`/api/qualidade/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setPedido(data.pedido);
          setQualityData(data.qualityCheck);
          setChecks({
            checkQuantity: !!data.qualityCheck.checkQuantity,
            checkSizes: !!data.qualityCheck.checkSizes,
            checkNames: !!data.qualityCheck.checkNames,
            checkNumbers: !!data.qualityCheck.checkNumbers,
            checkModel: !!data.qualityCheck.checkModel,
            checkPersonalization: !!data.qualityCheck.checkPersonalization,
            checkComplete: !!data.qualityCheck.checkComplete,
            observations: data.qualityCheck.observations || "",
          });
        } else {
          setMensagemErro(data.erro || "Falha ao carregar dados do pedido.");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setMensagemErro("Erro ao conectar com o servidor.");
        setIsLoading(false);
      });
  }, [id]);

  const toggleCheck = (key: keyof Omit<QualityCheckState, "observations">) => {
    setChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMarcarTodos = (valor: boolean) => {
    setChecks((prev) => ({
      ...prev,
      checkQuantity: valor,
      checkSizes: valor,
      checkNames: valor,
      checkNumbers: valor,
      checkModel: valor,
      checkPersonalization: valor,
      checkComplete: valor,
    }));
  };

  const toggleJogadorBancada = (jogadorId: string) => {
    setJogadoresConferidos((prev) => ({
      ...prev,
      [jogadorId]: !prev[jogadorId],
    }));
  };

  const contagemConferidos = CHECKLIST_ITEMS.filter((item) => checks[item.key]).length;
  const todosConferidos = contagemConferidos === 7;

  const handleSalvarChecklist = async (avancarParaPronto: boolean = false) => {
    setIsSaving(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch(`/api/qualidade/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checks),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(data.erro || "Erro ao salvar conferência.");
        setIsSaving(false);
        return;
      }

      setQualityData(data.qualityCheck);
      setMensagemSucesso(data.mensagem);

      // Se o usuário solicitou avançar para PRONTO e foi aprovado
      if (avancarParaPronto && data.isApproved) {
        const resAvancar = await fetch(`/api/producao/${id}/etapa`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novaEtapa: "PRONTO" }),
        });

        const dataAvancar = await resAvancar.json();
        if (resAvancar.ok) {
          setMensagemSucesso("Conferência APROVADA e Pedido marcado como PRONTO com sucesso!");
          setTimeout(() => {
            router.push("/admin/producao");
          }, 1500);
          return;
        } else {
          setMensagemErro(`Conferência salva, mas erro ao avançar status: ${dataAvancar.erro}`);
        }
      }
    } catch {
      setMensagemErro("Erro de comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/producao">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Esteira de Produção
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
              Controle de Qualidade
            </h1>
            <p className="text-sm text-slate-500">
              Conferência técnica obrigatória de 7 itens (Seção 11 da especificação)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/pedidos/${id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Ver Pedido #{pedido?.numero}
            </Button>
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Banner de Status de Aprovação */}
      <Card className={qualityData?.isApproved ? "border-emerald-300 bg-emerald-50/40" : "border-amber-300 bg-amber-50/40"}>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                qualityData?.isApproved
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {qualityData?.isApproved ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Pedido #{pedido?.numero} - {qualityData?.isApproved ? "Aprovado na Qualidade" : "Em Conferência"}
                </h2>
                <Badge variant={qualityData?.isApproved ? "success" : "warning"}>
                  {qualityData?.isApproved ? "APROVADO" : "PENDENTE"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {qualityData?.isApproved
                  ? `Conferido e liberado por ${qualityData?.checkedBy?.name || "Inspetor"} em ${
                      qualityData.checkedAt ? new Date(qualityData.checkedAt).toLocaleString("pt-BR") : "data recente"
                    }`
                  : `Progresso: ${contagemConferidos} de 7 itens verificados. Nenhum pedido pode ser concluído sem os 7 itens marcados.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarcarTodos(true)}
              className="text-xs"
            >
              Marcar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarcarTodos(false)}
              className="text-xs"
            >
              Limpar Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Principal: O Checklist dos 7 Itens Obrigatórios */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                    Checklist dos 7 Itens Obrigatórios (Seção 11)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Clique em cada item para confirmar a verificação na bancada de acabamento
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600">{contagemConferidos}</span>
                  <span className="text-xs text-slate-400 font-semibold"> / 7</span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    todosConferidos ? "bg-emerald-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${(contagemConferidos / 7) * 100}%` }}
                ></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {CHECKLIST_ITEMS.map((item, index) => {
                const checked = checks[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      checked
                        ? "border-emerald-300 bg-emerald-50/40 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <div className="pt-0.5">
                      {checked ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {index + 1}. {item.label}
                        </span>
                        {checked && (
                          <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
                            OK
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.descricao}</p>
                    </div>
                  </div>
                );
              })}

              {/* Observações da Inspeção */}
              <div className="pt-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Observações da Conferência / Ficha de Inspeção:
                </label>
                <textarea
                  value={checks.observations}
                  onChange={(e) => setChecks((prev) => ({ ...prev, observations: e.target.value }))}
                  placeholder="Ex: Peças conferidas na bancada 3, sem fios soltos, costuras reforçadas e cores aprovadas..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Ações de Salvamento */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={() => handleSalvarChecklist(false)}
                  variant="outline"
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSaving ? "Salvando..." : "Salvar Rascunho"}
                </Button>

                <Button
                  onClick={() => handleSalvarChecklist(true)}
                  disabled={isSaving || !todosConferidos}
                  className={`w-full sm:flex-1 ${
                    todosConferidos
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {todosConferidos
                    ? "Aprovar Qualidade e Liberar Pedido (Pronto)"
                    : `Marque todos os 7 itens para aprovar (${contagemConferidos}/7)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Guia de Conferência das Peças / Bancada */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shirt className="h-5 w-5 text-indigo-600" />
                Grade de Jogadores & Peças ({pedido?.jogadores?.length || 0} peças)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ficha de conferência física das camisas na bancada
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(!pedido?.jogadores || pedido.jogadores.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum jogador cadastrado na lista deste pedido.
                </div>
              ) : (
                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                  {pedido.jogadores.map((j: any) => {
                    const isCheckedBench = !!jogadoresConferidos[j.id];
                    return (
                      <div
                        key={j.id}
                        onClick={() => toggleJogadorBancada(j.id)}
                        className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isCheckedBench ? "bg-emerald-50/30" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCheckedBench
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {j.number || "-"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {j.name || j.playerName || `Jogador #${j.playerIndex + 1}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Camisa: <strong>{j.size || j.shirtSize || "M"}</strong>
                              {j.shortSize && ` | Short: ${j.shortSize}`}
                              {(j.notes || j.observation) && ` | Obs: ${j.notes || j.observation}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isCheckedBench}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
