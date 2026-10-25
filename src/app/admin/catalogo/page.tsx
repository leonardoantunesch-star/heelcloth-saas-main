"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModeloCatalogo, ProdutoPublico } from "@/data/catalogo";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";
const rotulo = "block text-xs font-semibold text-slate-700 mb-1";

// Reduz a foto no próprio navegador (o site não precisa de imagens enormes e o envio fica rápido).
async function reduzirImagem(arquivo: File, lado = 1000): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error("Não foi possível abrir a imagem."));
      i.src = url;
    });
    let escala = Math.min(1, lado / Math.max(img.width, img.height));
    for (let tentativa = 0; tentativa < 4; tentativa++) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * escala));
      c.height = Math.max(1, Math.round(img.height * escala));
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dados = c.toDataURL("image/jpeg", 0.82);
      if (dados.length < 850_000) return dados;
      escala *= 0.75;
    }
    throw new Error("Imagem grande demais, tente uma menor.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function enviarImagem(arquivo: File): Promise<string> {
  const dataUrl = await reduzirImagem(arquivo);
  const res = await fetch("/api/admin/catalogo/imagem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) throw new Error(json.erro || "Falha ao enviar a imagem.");
  return json.id as string;
}

const nomeDoArquivo = (n: string) =>
  n.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Modelo";

// Só o que o painel edita (o preço vem da tabela de preços e não muda aqui).
const editavel = (p: ProdutoPublico) => ({
  id: p.id, nome: p.nome, descricao: p.descricao, destaques: p.destaques, imagem: p.imagem, visivel: p.visivel, modelos: p.modelos,
});

export default function AdminCatalogoPage() {
  const [produtos, setProdutos] = useState<ProdutoPublico[]>([]);
  const [salvo, setSalvo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [envios, setEnvios] = useState(0);
  const [aberto, setAberto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const instantaneo = useMemo(() => JSON.stringify(produtos.map(editavel)), [produtos]);
  const alterado = !carregando && instantaneo !== salvo;

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/catalogo", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.erro || "Não foi possível carregar o catálogo.");
      const lista = json.produtos as ProdutoPublico[];
      setProdutos(lista);
      setSalvo(JSON.stringify(lista.map(editavel)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o catálogo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Avisa antes de fechar a aba com alterações que ainda não foram publicadas.
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const mudarProduto = (id: string, mudancas: Partial<ProdutoPublico>) => {
    setAviso(null);
    setProdutos((l) => l.map((p) => (p.id === id ? { ...p, ...mudancas } : p)));
  };
  const mudarModelo = (pid: string, mid: string, mudancas: Partial<ModeloCatalogo>) => {
    setAviso(null);
    setProdutos((l) =>
      l.map((p) => (p.id === pid ? { ...p, modelos: p.modelos.map((m) => (m.id === mid ? { ...m, ...mudancas } : m)) } : p))
    );
  };
  const moverModelo = (pid: string, indice: number, delta: number) => {
    setAviso(null);
    setProdutos((l) =>
      l.map((p) => {
        if (p.id !== pid) return p;
        const alvo = indice + delta;
        if (alvo < 0 || alvo >= p.modelos.length) return p;
        const m = [...p.modelos];
        [m[indice], m[alvo]] = [m[alvo], m[indice]];
        return { ...p, modelos: m };
      })
    );
  };
  const removerModelo = (pid: string, mid: string) => {
    const modelo = produtos.find((p) => p.id === pid)?.modelos.find((m) => m.id === mid);
    if (!window.confirm(`Remover o modelo "${modelo?.nome ?? ""}"? Ele sai do site quando você publicar.`)) return;
    mudarProduto(pid, { modelos: produtos.find((p) => p.id === pid)!.modelos.filter((m) => m.id !== mid) });
  };

  const adicionarModelos = async (pid: string, arquivos: FileList | null) => {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setAviso(null);
    const lista = Array.from(arquivos);
    setEnvios((n) => n + lista.length);
    for (const arq of lista) {
      try {
        if (!arq.type.startsWith("image/")) throw new Error(`"${arq.name}" não é uma imagem.`);
        const id = await enviarImagem(arq);
        const modelo: ModeloCatalogo = { id: novoId(), nome: nomeDoArquivo(arq.name), descricao: "", imagem: id };
        setProdutos((l) => l.map((p) => (p.id === pid ? { ...p, modelos: [...p.modelos, modelo] } : p)));
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
      } finally {
        setEnvios((n) => n - 1);
      }
    }
  };

  const trocarFoto = async (pid: string, arquivo?: File) => {
    if (!arquivo) return;
    setErro(null);
    setEnvios((n) => n + 1);
    try {
      if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
      mudarProduto(pid, { imagem: await enviarImagem(arquivo) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setEnvios((n) => n - 1);
    }
  };

  const publicar = async () => {
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const res = await fetch("/api/admin/catalogo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtos: produtos.map(editavel) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.erro || "Não foi possível publicar. Confira a conexão com o banco de dados.");
      const lista = json.produtos as ProdutoPublico[];
      setProdutos(lista);
      setSalvo(JSON.stringify(lista.map(editavel)));
      setAviso("Alterações publicadas. O catálogo do site já está atualizado.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catálogo do site</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Cadastre a foto de cada peça e os modelos prontos que aparecem dentro dela, na página pública do catálogo. As
            mudanças só vão para o site quando você clicar em <strong>Publicar alterações</strong>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/catalogo"
            target="_blank"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver no site <ExternalLink className="h-4 w-4" />
          </Link>
          <Button onClick={publicar} isLoading={salvando} disabled={!alterado || envios > 0}>
            <Save className="h-4 w-4" /> Publicar alterações
          </Button>
        </div>
      </div>

      {erro && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{erro}</span>
          <button type="button" onClick={() => setErro(null)} aria-label="Fechar aviso" className="shrink-0"><X className="h-4 w-4" /></button>
        </div>
      )}
      {aviso && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{aviso}</div>
      )}
      {alterado && !salvando && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Você tem alterações que ainda não foram publicadas.
        </div>
      )}
      {envios > 0 && (
        <div role="status" className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Enviando {envios} {envios === 1 ? "imagem" : "imagens"}...
        </div>
      )}

      {carregando ? (
        <p className="py-16 text-center text-sm text-slate-500">Carregando catálogo...</p>
      ) : (
        <ul className="space-y-3">
          {produtos.map((p) => {
            const expandido = aberto === p.id;
            return (
              <li key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-[10px] text-slate-400">
                    {p.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/catalogo/imagem/${p.imagem}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "sem foto"
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAberto(expandido ? null : p.id)}
                    aria-expanded={expandido}
                    aria-controls={`painel-${p.id}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{p.nome}</span>
                      <span className="block text-xs text-slate-500">
                        {brl(p.preco)} · {p.modelos.length} {p.modelos.length === 1 ? "modelo" : "modelos"}
                        {!p.visivel && " · escondido do site"}
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expandido ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {expandido && (
                  <div id={`painel-${p.id}`} className="space-y-6 border-t border-slate-100 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={rotulo} htmlFor={`nome-${p.id}`}>Nome da peça</label>
                        <input id={`nome-${p.id}`} className={campo} value={p.nome} maxLength={80} onChange={(e) => mudarProduto(p.id, { nome: e.target.value })} />
                      </div>
                      <div className="flex items-end">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" checked={p.visivel} onChange={(e) => mudarProduto(p.id, { visivel: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                          Visível no site
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className={rotulo} htmlFor={`desc-${p.id}`}>Descrição</label>
                      <textarea id={`desc-${p.id}`} className={campo} rows={2} maxLength={400} value={p.descricao} onChange={(e) => mudarProduto(p.id, { descricao: e.target.value })} />
                    </div>
                    <Destaques valor={p.destaques} onChange={(d) => mudarProduto(p.id, { destaques: d })} />

                    <div>
                      <span className={rotulo}>Foto da peça</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500">
                          <ImagePlus className="h-4 w-4" /> {p.imagem ? "Trocar foto" : "Enviar foto"}
                          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { trocarFoto(p.id, e.target.files?.[0]); e.target.value = ""; }} />
                        </label>
                        {p.imagem && (
                          <Button variant="ghost" size="sm" onClick={() => mudarProduto(p.id, { imagem: null })}>
                            <Trash2 className="h-3.5 w-3.5" /> Remover foto
                          </Button>
                        )}
                        <span className="text-xs text-slate-400">Formato vertical (4:5) fica melhor.</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">Modelos prontos ({p.modelos.length})</h2>
                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                          <Plus className="h-4 w-4" /> Adicionar modelos
                          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { adicionarModelos(p.id, e.target.files); e.target.value = ""; }} />
                        </label>
                      </div>
                      {p.modelos.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                          Nenhum modelo ainda. Clique em &quot;Adicionar modelos&quot; e escolha uma ou mais imagens.
                        </p>
                      ) : (
                        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {p.modelos.map((m, i) => (
                            <li key={m.id} className="overflow-hidden rounded-lg border border-slate-200">
                              <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
                                {m.imagem ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={`/api/catalogo/imagem/${m.imagem}`} alt={m.nome} className="h-full w-full object-contain" />
                                ) : (
                                  <span className="text-xs text-slate-400">sem imagem</span>
                                )}
                              </div>
                              <div className="space-y-2 p-3">
                                <input aria-label={`Nome do modelo ${i + 1}`} className={campo} value={m.nome} maxLength={80} onChange={(e) => mudarModelo(p.id, m.id, { nome: e.target.value })} />
                                <input aria-label={`Descrição do modelo ${i + 1} (opcional)`} className={campo} value={m.descricao} maxLength={200} placeholder="Descrição (opcional)" onChange={(e) => mudarModelo(p.id, m.id, { descricao: e.target.value })} />
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    <Button variant="outline" size="icon" aria-label="Mover para antes" disabled={i === 0} onClick={() => moverModelo(p.id, i, -1)}><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" aria-label="Mover para depois" disabled={i === p.modelos.length - 1} onClick={() => moverModelo(p.id, i, 1)}><ChevronRight className="h-4 w-4" /></Button>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => removerModelo(p.id, m.id)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Remover
                                  </Button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Etiquetas curtas que aparecem no cartão da peça (ex: "PP ao G5").
function Destaques({ valor, onChange }: { valor: string[]; onChange: (v: string[]) => void }) {
  const [texto, setTexto] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);
  const adicionar = () => {
    const t = texto.trim().slice(0, 40);
    if (!t || valor.length >= 6 || valor.includes(t)) return;
    onChange([...valor, t]);
    setTexto("");
    campoRef.current?.focus();
  };
  return (
    <div>
      <label className={rotulo} htmlFor="novo-destaque">Etiquetas (até 6)</label>
      <div className="flex flex-wrap gap-2">
        {valor.map((d) => (
          <span key={d} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700">
            {d}
            <button type="button" aria-label={`Remover etiqueta ${d}`} onClick={() => onChange(valor.filter((x) => x !== d))} className="rounded-full p-0.5 hover:bg-slate-200">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          ref={campoRef}
          id="novo-destaque"
          className={campo}
          value={texto}
          maxLength={40}
          placeholder="Ex: PP ao G5"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <Button variant="outline" onClick={adicionar} disabled={!texto.trim() || valor.length >= 6}>Adicionar</Button>
      </div>
    </div>
  );
}
