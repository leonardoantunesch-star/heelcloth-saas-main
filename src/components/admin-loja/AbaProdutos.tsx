"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, ImagePlus, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo, Cartao, Dinheiro, Inteiro, Marcar, Texto, estiloCampo, useEnvios } from "./Campos";
import { brl, criarId, estoqueTotal, precoFinal, urlImagemLoja, type CategoriaLoja, type ProdutoLoja } from "@/data/loja";

const GRADES: { rotulo: string; tamanhos: string[] }[] = [
  { rotulo: "P ao GG", tamanhos: ["P", "M", "G", "GG"] },
  { rotulo: "PP ao G3", tamanhos: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"] },
  { rotulo: "Infantil 2–16", tamanhos: ["2", "4", "6", "8", "10", "12", "14", "16"] },
  { rotulo: "Numeração 34–44", tamanhos: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"] },
  { rotulo: "Tamanho único", tamanhos: ["Único"] },
];

export function novoProduto(categoriaId: string): ProdutoLoja {
  return {
    id: criarId("produto"),
    nome: "Novo produto",
    descricao: "",
    categoriaId,
    preco: 0,
    precoPromo: null,
    imagens: [],
    cor: "",
    tamanhos: ["P", "M", "G", "GG"].map((nome) => ({ nome, estoque: 0 })),
    lancamento: true,
    destaque: false,
    visivel: false,
    criadoEm: Date.now(),
  };
}

export function AbaProdutos({
  produtos,
  categorias,
  onChange,
}: {
  produtos: ProdutoLoja[];
  categorias: CategoriaLoja[];
  onChange: (p: ProdutoLoja[]) => void;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState("");

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return [...produtos]
      .filter((p) => (!t || p.nome.toLowerCase().includes(t)) && (!filtroCat || p.categoriaId === filtroCat))
      .sort((a, b) => b.criadoEm - a.criadoEm);
  }, [produtos, busca, filtroCat]);

  const atual = produtos.find((p) => p.id === editando);
  const mudar = (id: string, m: Partial<ProdutoLoja>) => onChange(produtos.map((p) => (p.id === id ? { ...p, ...m } : p)));
  const nomeCat = (id: string) => categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";

  if (atual) {
    return (
      <EditorProduto
        produto={atual}
        categorias={categorias}
        onChange={(m) => mudar(atual.id, m)}
        onVoltar={() => setEditando(null)}
        onDuplicar={() => {
          const copia = { ...atual, id: criarId(atual.nome), nome: `${atual.nome} (cópia)`.slice(0, 100), visivel: false, criadoEm: Date.now() };
          onChange([...produtos, copia]);
          setEditando(copia.id);
        }}
        onExcluir={() => {
          if (!window.confirm(`Excluir "${atual.nome}"? Ele sai da loja quando você publicar.`)) return;
          onChange(produtos.filter((p) => p.id !== atual.id));
          setEditando(null);
        }}
      />
    );
  }

  return (
    <Cartao
      titulo={`Produtos (${produtos.length})`}
      descricao="Clique num produto para editar fotos, preço, tamanhos e estoque."
      acoes={
        <Button size="sm" onClick={() => { const p = novoProduto(filtroCat || categorias[0]?.id || ""); onChange([...produtos, p]); setEditando(p.id); }}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input aria-label="Buscar produto" placeholder="Buscar produto..." className={`${estiloCampo} pl-9`} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select aria-label="Filtrar por categoria" className={`${estiloCampo} sm:w-56`} value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      {lista.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {lista.map((p) => {
            const est = estoqueTotal(p);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setEditando(p.id)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-blue-50">
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                    {p.imagens[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlImagemLoja(p.imagens[0])} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.nome}</p>
                    <p className="text-xs text-slate-500">
                      {nomeCat(p.categoriaId)} · {brl(precoFinal(p))}
                      {precoFinal(p) < p.preco && <span className="ml-1 text-rose-600">(promoção)</span>}
                    </p>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.visivel ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.visivel ? "Na loja" : "Escondido"}
                    </span>
                    <span className={`text-[11px] ${est === 0 ? "font-semibold text-rose-600" : "text-slate-500"}`}>{est === 0 ? "Sem estoque" : `${est} em estoque`}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}

function EditorProduto({
  produto: p,
  categorias,
  onChange,
  onVoltar,
  onDuplicar,
  onExcluir,
}: {
  produto: ProdutoLoja;
  categorias: CategoriaLoja[];
  onChange: (m: Partial<ProdutoLoja>) => void;
  onVoltar: () => void;
  onDuplicar: () => void;
  onExcluir: () => void;
}) {
  const { enviar } = useEnvios();
  const [enviando, setEnviando] = useState(0);
  const [novoTam, setNovoTam] = useState("");

  const addFotos = async (arquivos: FileList | null) => {
    if (!arquivos) return;
    const lista = Array.from(arquivos).slice(0, 8 - p.imagens.length);
    setEnviando((n) => n + lista.length);
    const ids: string[] = [];
    for (const f of lista) {
      const id = await enviar(f);
      if (id) ids.push(id);
      setEnviando((n) => n - 1);
    }
    if (ids.length) onChange({ imagens: [...p.imagens, ...ids].slice(0, 8) });
  };
  const moverFoto = (i: number, d: number) => {
    const a = [...p.imagens];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    onChange({ imagens: a });
  };
  const tam = p.tamanhos;
  const setTam = (i: number, m: Partial<(typeof tam)[number]>) => onChange({ tamanhos: tam.map((t, k) => (k === i ? { ...t, ...m } : t)) });
  const addTam = () => {
    const n = novoTam.trim().slice(0, 12);
    if (!n || tam.some((t) => t.nome.toLowerCase() === n.toLowerCase()) || tam.length >= 20) return;
    onChange({ tamanhos: [...tam, { nome: n, estoque: 0 }] });
    setNovoTam("");
  };
  const aplicarGrade = (nomes: string[]) => {
    if (tam.length && !window.confirm("Trocar a grade de tamanhos? O estoque dos tamanhos que continuarem é mantido.")) return;
    onChange({ tamanhos: nomes.map((nome) => ({ nome, estoque: tam.find((t) => t.nome === nome)?.estoque ?? 0 })) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onVoltar}><ArrowLeft className="h-4 w-4" /> Voltar para a lista</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDuplicar}><Copy className="h-3.5 w-3.5" /> Duplicar</Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={onExcluir}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button>
        </div>
      </div>

      <Cartao titulo="Informações">
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto className="sm:col-span-2" rotulo="Nome do produto" valor={p.nome} max={100} onChange={(v) => onChange({ nome: v })} />
          <Campo rotulo="Categoria">
            {(id) => (
              <select id={id} className={estiloCampo} value={p.categoriaId} onChange={(e) => onChange({ categoriaId: e.target.value })}>
                <option value="">Sem categoria</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
          </Campo>
          <Texto rotulo="Cor" valor={p.cor} max={40} placeholder="Ex: Preto" onChange={(v) => onChange({ cor: v })} />
          <Dinheiro rotulo="Preço" valor={p.preco} onChange={(v) => onChange({ preco: v ?? 0 })} />
          <Dinheiro rotulo="Preço promocional (opcional)" vazio valor={p.precoPromo} onChange={(v) => onChange({ precoPromo: v })} ajuda="Deixe em branco se não estiver em promoção. Precisa ser menor que o preço." />
          <Texto className="sm:col-span-2" rotulo="Descrição" linhas={5} max={2000} valor={p.descricao} onChange={(v) => onChange({ descricao: v })} placeholder="Tecido, caimento, cuidados de lavagem..." />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-4">
          <Marcar rotulo="Visível na loja" valor={p.visivel} onChange={(v) => onChange({ visivel: v })} />
          <Marcar rotulo="Lançamento" ajuda="Aparece em Lançamentos" valor={p.lancamento} onChange={(v) => onChange({ lancamento: v })} />
          <Marcar rotulo="Destaque" ajuda="Aparece na vitrine de destaques" valor={p.destaque} onChange={(v) => onChange({ destaque: v })} />
        </div>
      </Cartao>

      <Cartao
        titulo={`Fotos (${p.imagens.length}/8)`}
        descricao="A primeira é a capa; a segunda aparece ao passar o mouse. Formato vertical 4:5 fica melhor."
        acoes={
          p.imagens.length < 8 ? (
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <ImagePlus className="h-3.5 w-3.5" /> Adicionar fotos
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFotos(e.target.files); e.target.value = ""; }} />
            </label>
          ) : undefined
        }
      >
        {p.imagens.length === 0 && enviando === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">Nenhuma foto ainda.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.imagens.map((f, i) => (
              <li key={f} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="relative aspect-[4/5] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlImagemLoja(f)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Capa</span>}
                </div>
                <div className="flex items-center justify-between p-1.5">
                  <div className="flex">
                    <button type="button" aria-label="Mover para antes" disabled={i === 0} onClick={() => moverFoto(i, -1)} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" aria-label="Mover para depois" disabled={i === p.imagens.length - 1} onClick={() => moverFoto(i, 1)} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <button type="button" aria-label={`Remover foto ${i + 1}`} onClick={() => onChange({ imagens: p.imagens.filter((x) => x !== f) })} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {Array.from({ length: enviando }).map((_, k) => (
              <li key={`env-${k}`} className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Cartao titulo={`Tamanhos e estoque (${estoqueTotal(p)} peças)`} descricao="O estoque baixa sozinho quando um pagamento é confirmado. Tamanho com 0 aparece riscado na loja.">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="self-center text-xs text-slate-500">Grade pronta:</span>
          {GRADES.map((g) => (
            <button key={g.rotulo} type="button" onClick={() => aplicarGrade(g.tamanhos)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{g.rotulo}</button>
          ))}
        </div>
        {tam.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tam.map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                <input aria-label="Nome do tamanho" className={`${estiloCampo} w-20 text-center font-semibold`} maxLength={12} value={t.nome} onChange={(e) => setTam(i, { nome: e.target.value })} />
                <Inteiro esconderRotulo rotulo={`Estoque do tamanho ${t.nome}`} valor={t.estoque} onChange={(v) => setTam(i, { estoque: v })} className="flex-1" />
                <button type="button" aria-label={`Remover tamanho ${t.nome}`} onClick={() => onChange({ tamanhos: tam.filter((_, k) => k !== i) })} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex max-w-sm gap-2">
          <input aria-label="Novo tamanho" placeholder="Outro tamanho (ex: XGG)" maxLength={12} className={estiloCampo} value={novoTam} onChange={(e) => setNovoTam(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTam(); } }} />
          <Button variant="outline" onClick={addTam} disabled={!novoTam.trim()}>Adicionar</Button>
        </div>
      </Cartao>
    </div>
  );
}
