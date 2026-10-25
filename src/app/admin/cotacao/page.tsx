"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2, FileText, Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRECOS_PADRAO } from "@/lib/orcamento";
import {
  calcularTotais,
  gerarPdfCotacao,
  moeda,
  type EmpresaCotacao,
  type ItemCotacao,
} from "@/lib/cotacao-pdf";
import { PreviaPdf } from "@/components/cotacao/PreviaPdf";

interface LinhaItem {
  id: string;
  descricao: string;
  detalhes: string;
  quantidade: string;
  valorUnitario: string;
}

const CHAVE_EMPRESA = "heelcloth-cotacao-empresa";

const EMPRESA_PADRAO: EmpresaCotacao = {
  nome: "Heel Cloth Sportswear",
  documento: "044.769.741/0001-07",
  telefone: "",
  email: "",
  endereco: "R. Antônio de Matos, 171 - Centro, Itaúna - MG",
  site: "",
};

// Itens prontos, com os mesmos preços da página de pedido.
const ATALHOS: { rotulo: string; descricao: string; detalhes: string; valor: number }[] = [
  { rotulo: "Camisa", descricao: "Camisa de jogo sublimada", detalhes: "Tecido padrão, nome e número nas costas", valor: PRECOS_PADRAO.camisa },
  { rotulo: "Camisa com punho", descricao: "Camisa com punhos personalizados", detalhes: "Punhos personalizados", valor: PRECOS_PADRAO.camisa_punho },
  { rotulo: "Camisa texturizada", descricao: "Camisa texturizada", detalhes: "Tecido texturizado, punhos inclusos", valor: PRECOS_PADRAO.camisa_text },
  { rotulo: "Camisa dry-fit", descricao: "Camisa dry-fit", detalhes: "Tecido dry-fit", valor: PRECOS_PADRAO.camisa_dry },
  { rotulo: "Manga longa", descricao: "Manga longa (adicional)", detalhes: "Valor por camisa com manga longa", valor: PRECOS_PADRAO.manga_longa },
  { rotulo: "Short", descricao: "Short esportivo", detalhes: "", valor: PRECOS_PADRAO.short },
  { rotulo: "Short texturizado", descricao: "Short texturizado", detalhes: "", valor: PRECOS_PADRAO.short_text },
  { rotulo: "Calção dry-fit", descricao: "Calção dry-fit", detalhes: "Tecido dry-fit", valor: PRECOS_PADRAO.short_dry },
  { rotulo: "Meião", descricao: "Meião esportivo", detalhes: "Branco, preto, azul, verde ou vermelho", valor: PRECOS_PADRAO.meiao },
];

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const paraTexto = (n: number) => n.toFixed(2).replace(".", ",");
const novoId = () => `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function gerarNumero(d = new Date()) {
  const aa = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `COT-${aa}${mm}${dd}-${hh}${mi}`;
}

const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";
const rotuloCampo = "block text-xs font-semibold text-slate-700 mb-1";

async function carregarLogo(): Promise<string | null> {
  try {
    const resp = await fetch("/logo.png");
    const blob = await resp.blob();
    return await new Promise((ok) => {
      const leitor = new FileReader();
      leitor.onloadend = () => ok(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => ok(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function CotacaoPage() {
  const [numero, setNumero] = useState("");
  const [validadeDias, setValidadeDias] = useState("7");
  const [cliente, setCliente] = useState({ nome: "", documento: "", contato: "", email: "", endereco: "" });
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [descontoValor, setDescontoValor] = useState("");
  const [descontoTipo, setDescontoTipo] = useState<"valor" | "percentual">("valor");
  const [pagamento, setPagamento] = useState(
    "50% na aprovação do layout e 50% na entrega. Pix, cartão, boleto ou transferência."
  );
  const [prazoProducao, setPrazoProducao] = useState(
    "15 dias úteis após a aprovação do layout e a confirmação do pagamento."
  );
  const [entrega, setEntrega] = useState(
    "Retirada na loja ou envio por transportadora, com frete por conta do cliente."
  );
  const [observacoes, setObservacoes] = useState(
    "Pedido mínimo de 10 camisas. As medidas podem variar cerca de 2 cm na sublimação, por causa da temperatura."
  );
  const [empresa, setEmpresa] = useState<EmpresaCotacao>(EMPRESA_PADRAO);
  const [empresaAberta, setEmpresaAberta] = useState(false);

  const [previaDados, setPreviaDados] = useState<ArrayBuffer | null>(null);
  const [gerando, setGerando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const logoRef = useRef<string | null | undefined>(undefined);
  const urlAnterior = useRef<string | null>(null);

  // Número da cotação e dados da empresa lembrados neste navegador.
  useEffect(() => {
    setNumero(gerarNumero());
    try {
      const salvo = localStorage.getItem(CHAVE_EMPRESA);
      if (salvo) {
        // campos que ficaram vazios na versão salva voltam ao padrão (CNPJ e endereço)
        const guardado = JSON.parse(salvo) as Partial<EmpresaCotacao>;
        const mesclado = { ...EMPRESA_PADRAO, ...guardado };
        if (!guardado.documento) mesclado.documento = EMPRESA_PADRAO.documento;
        // o endereço antigo (nº 173) que ficou gravado no navegador também é trocado
        if (!guardado.endereco || guardado.endereco.includes("173 - Centro")) mesclado.endereco = EMPRESA_PADRAO.endereco;
        setEmpresa(mesclado);
      }
    } catch {
      /* sem armazenamento: usa os dados padrão */
    }
  }, []);

  const atualizarEmpresa = (campoEmpresa: keyof EmpresaCotacao, valor: string) => {
    setEmpresa((anterior) => {
      const novo = { ...anterior, [campoEmpresa]: valor };
      try {
        localStorage.setItem(CHAVE_EMPRESA, JSON.stringify(novo));
      } catch {
        /* ignora */
      }
      return novo;
    });
  };

  const itensCalculo: ItemCotacao[] = useMemo(
    () =>
      itens.map((i) => ({
        descricao: i.descricao,
        detalhes: i.detalhes,
        quantidade: Math.max(0, Math.floor(num(i.quantidade))),
        valorUnitario: num(i.valorUnitario),
      })),
    [itens]
  );

  const subtotal = useMemo(() => calcularTotais(itensCalculo, 0).subtotal, [itensCalculo]);
  const descontoEmReais = useMemo(() => {
    const v = num(descontoValor);
    return descontoTipo === "percentual" ? Math.round(subtotal * Math.min(v, 100)) / 100 : v;
  }, [descontoValor, descontoTipo, subtotal]);
  const totais = useMemo(() => calcularTotais(itensCalculo, descontoEmReais), [itensCalculo, descontoEmReais]);

  const emissao = useMemo(() => new Date(), []);
  const validade = useMemo(() => {
    const d = new Date(emissao);
    d.setDate(d.getDate() + Math.max(0, Math.floor(num(validadeDias))));
    return d;
  }, [emissao, validadeDias]);

  const montarDados = useCallback(
    () => ({
      numero: numero || "COT",
      emissao,
      validade,
      empresa,
      cliente,
      itens: itensCalculo,
      desconto: descontoEmReais,
      condicoes: { pagamento, prazoProducao, entrega },
      observacoes,
    }),
    [numero, emissao, validade, empresa, cliente, itensCalculo, descontoEmReais, pagamento, prazoProducao, entrega, observacoes]
  );

  const obterLogo = async () => {
    if (logoRef.current === undefined) logoRef.current = await carregarLogo();
    return logoRef.current;
  };

  // Prévia ao vivo: refaz o PDF um instante depois da última digitação.
  useEffect(() => {
    let cancelado = false;
    const t = setTimeout(async () => {
      setGerando(true);
      try {
        const doc = await gerarPdfCotacao(montarDados(), await obterLogo());
        if (cancelado) return;
        setPreviaDados(doc.output("arraybuffer"));
        setErro(null);
      } catch (e) {
        console.error("Erro ao gerar a prévia do PDF:", e);
        if (!cancelado) setErro("Não foi possível montar a prévia do PDF.");
      } finally {
        if (!cancelado) setGerando(false);
      }
    }, 700);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [montarDados]);

  useEffect(
    () => () => {
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current);
    },
    []
  );

  const itensValidos = itensCalculo.filter((i) => i.descricao.trim() && i.quantidade > 0).length;
  const podeBaixar = cliente.nome.trim() !== "" && itensValidos > 0;

  const baixar = async () => {
    if (!podeBaixar) return;
    setBaixando(true);
    try {
      const doc = await gerarPdfCotacao(montarDados(), await obterLogo());
      const nomeArquivo = `Cotacao-${(numero || "COT").replace(/[^A-Za-z0-9_-]/g, "")}-${cliente.nome
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30)}.pdf`;
      doc.save(nomeArquivo);
    } catch (e) {
      console.error("Erro ao gerar o PDF:", e);
      setErro("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  };

  const adicionarAtalho = (a: (typeof ATALHOS)[number]) =>
    setItens((l) => [
      ...l,
      { id: novoId(), descricao: a.descricao, detalhes: a.detalhes, quantidade: "1", valorUnitario: paraTexto(a.valor) },
    ]);

  const adicionarLivre = () =>
    setItens((l) => [...l, { id: novoId(), descricao: "", detalhes: "", quantidade: "1", valorUnitario: "" }]);

  const alterarItem = (id: string, k: keyof LinhaItem, v: string) =>
    setItens((l) => l.map((i) => (i.id === id ? { ...i, [k]: v } : i)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Cotação</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monte a proposta para o cliente e baixe o PDF pronto. A prévia ao lado se atualiza sozinha.
          </p>
        </div>
        <Button onClick={baixar} disabled={!podeBaixar} isLoading={baixando} className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span>Baixar PDF</span>
        </Button>
      </div>

      {!podeBaixar && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Para baixar o PDF, informe o nome do cliente e adicione ao menos um item.
        </p>
      )}
      {erro && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6 items-start">
        {/* ------------------------------------------------------------ formulário */}
        <div className="space-y-5 min-w-0">
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" /> Dados da cotação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cot-numero" className={rotuloCampo}>Número</label>
                <input id="cot-numero" className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cot-validade" className={rotuloCampo}>Validade da proposta (dias)</label>
                <input
                  id="cot-validade"
                  inputMode="numeric"
                  className={campo}
                  value={validadeDias}
                  onChange={(e) => setValidadeDias(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900">Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="cot-cliente" className={rotuloCampo}>Nome do cliente ou da equipe *</label>
                <input
                  id="cot-cliente"
                  className={campo}
                  value={cliente.nome}
                  onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                  placeholder="Ex: Associação Atlética União FC"
                />
              </div>
              <div>
                <label htmlFor="cot-doc" className={rotuloCampo}>CPF ou CNPJ</label>
                <input id="cot-doc" className={campo} value={cliente.documento} onChange={(e) => setCliente({ ...cliente, documento: e.target.value })} />
              </div>
              <div>
                <label htmlFor="cot-whats" className={rotuloCampo}>WhatsApp</label>
                <input id="cot-whats" className={campo} value={cliente.contato} onChange={(e) => setCliente({ ...cliente, contato: e.target.value })} placeholder="(11) 98765-4321" />
              </div>
              <div>
                <label htmlFor="cot-email" className={rotuloCampo}>E-mail</label>
                <input id="cot-email" type="email" className={campo} value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
              </div>
              <div>
                <label htmlFor="cot-end" className={rotuloCampo}>Endereço</label>
                <input id="cot-end" className={campo} value={cliente.endereco} onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">Itens</h2>
              <Button variant="outline" size="sm" onClick={adicionarLivre} className="gap-1.5 self-start">
                <Plus className="h-3.5 w-3.5" /> Item livre
              </Button>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Itens prontos">
              {ATALHOS.map((a) => (
                <button
                  key={a.rotulo}
                  type="button"
                  onClick={() => adicionarAtalho(a)}
                  className="ripple-host inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Plus className="h-3 w-3" /> {a.rotulo}
                  <span className="text-slate-400 font-medium">{moeda(a.valor)}</span>
                </button>
              ))}
            </div>

            {itens.length === 0 ? (
              <p className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg p-4 text-center">
                Nenhum item ainda. Clique em um item pronto acima ou em &ldquo;Item livre&rdquo;.
              </p>
            ) : (
              <ul className="space-y-3">
                {itens.map((i, idx) => (
                  <li key={i.id} className="rounded-lg border border-slate-200 p-3 space-y-2.5 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400">ITEM {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))}
                        aria-label={`Remover item ${idx + 1}`}
                        className="ripple-so-clique rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={rotuloCampo} htmlFor={`d-${i.id}`}>Descrição</label>
                        <input id={`d-${i.id}`} className={campo} value={i.descricao} onChange={(e) => alterarItem(i.id, "descricao", e.target.value)} />
                      </div>
                      <div>
                        <label className={rotuloCampo} htmlFor={`t-${i.id}`}>Detalhes (opcional)</label>
                        <input id={`t-${i.id}`} className={campo} value={i.detalhes} onChange={(e) => alterarItem(i.id, "detalhes", e.target.value)} />
                      </div>
                      <div>
                        <label className={rotuloCampo} htmlFor={`q-${i.id}`}>Quantidade</label>
                        <input id={`q-${i.id}`} inputMode="numeric" className={campo} value={i.quantidade} onChange={(e) => alterarItem(i.id, "quantidade", e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div>
                        <label className={rotuloCampo} htmlFor={`v-${i.id}`}>Valor unitário (R$)</label>
                        <input id={`v-${i.id}`} inputMode="decimal" className={campo} value={i.valorUnitario} onChange={(e) => alterarItem(i.id, "valorUnitario", e.target.value.replace(/[^\d,.]/g, ""))} placeholder="0,00" />
                      </div>
                    </div>
                    <p className="text-right text-xs text-slate-500">
                      Subtotal: <strong className="text-slate-900">{moeda(Math.floor(num(i.quantidade)) * num(i.valorUnitario))}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="cot-desc" className={rotuloCampo}>Desconto</label>
                <div className="flex gap-2">
                  <input
                    id="cot-desc"
                    inputMode="decimal"
                    className={campo}
                    value={descontoValor}
                    onChange={(e) => setDescontoValor(e.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="0"
                  />
                  <div role="group" aria-label="Tipo de desconto" className="flex shrink-0 rounded-lg border border-slate-300 overflow-hidden">
                    {(["valor", "percentual"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={descontoTipo === t}
                        onClick={() => setDescontoTipo(t)}
                        className={`ripple-host px-3 text-sm font-semibold ${descontoTipo === t ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                      >
                        {t === "valor" ? "R$" : "%"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between self-end">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Total</span>
                <span className="text-lg font-bold">{moeda(totais.total)}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900">Condições comerciais</h2>
            <div>
              <label htmlFor="cot-pag" className={rotuloCampo}>Forma de pagamento</label>
              <textarea id="cot-pag" rows={2} className={campo} value={pagamento} onChange={(e) => setPagamento(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cot-prazo" className={rotuloCampo}>Prazo de produção</label>
              <textarea id="cot-prazo" rows={2} className={campo} value={prazoProducao} onChange={(e) => setPrazoProducao(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cot-ent" className={rotuloCampo}>Entrega</label>
              <textarea id="cot-ent" rows={2} className={campo} value={entrega} onChange={(e) => setEntrega(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cot-obs" className={rotuloCampo}>Observações (opcional)</label>
              <textarea id="cot-obs" rows={3} className={campo} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <button
              type="button"
              onClick={() => setEmpresaAberta((v) => !v)}
              aria-expanded={empresaAberta}
              className="ripple-host w-full flex items-center justify-between rounded-lg -m-1 p-1 text-left"
            >
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Dados da empresa no PDF
              </span>
              <span className="text-xs text-slate-500">{empresaAberta ? "Fechar" : "Editar"}</span>
            </button>
            {empresaAberta && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {(
                  [
                    ["nome", "Nome da empresa"],
                    ["documento", "CNPJ"],
                    ["telefone", "Telefone / WhatsApp"],
                    ["email", "E-mail"],
                    ["endereco", "Endereço"],
                    ["site", "Site"],
                  ] as [keyof EmpresaCotacao, string][]
                ).map(([k, nome]) => (
                  <div key={k}>
                    <label htmlFor={`emp-${k}`} className={rotuloCampo}>{nome}</label>
                    <input id={`emp-${k}`} className={campo} value={empresa[k] ?? ""} onChange={(e) => atualizarEmpresa(k, e.target.value)} />
                  </div>
                ))}
                <p className="sm:col-span-2 text-[11px] text-slate-500">
                  Esses dados ficam salvos neste navegador e aparecem em todas as cotações.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------------------ prévia */}
        <aside className="xl:sticky xl:top-20 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/70">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Prévia do PDF
              </span>
              <span className="text-[11px] text-slate-500">{gerando ? "Atualizando..." : "Atualizada"}</span>
            </div>
            <PreviaPdf dados={previaDados} />
          </div>
        </aside>
      </div>
    </div>
  );
}
