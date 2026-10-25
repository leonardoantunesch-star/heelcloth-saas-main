"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnviosCtx } from "@/components/admin-loja/Campos";
import { AbaProdutos } from "@/components/admin-loja/AbaProdutos";
import { AbaAparencia, AbaCategorias, AbaEntrega, AbaInicio, AbaPedidos } from "@/components/admin-loja/AbasConfig";
import { enviarImagemLoja } from "@/lib/reduzir-imagem";
import type { ConfigLoja, Loja } from "@/data/loja";

const ABAS = [
  { id: "produtos", rotulo: "Produtos" },
  { id: "categorias", rotulo: "Categorias" },
  { id: "inicio", rotulo: "Página inicial" },
  { id: "aparencia", rotulo: "Marca e cores" },
  { id: "entrega", rotulo: "Frete e pagamento" },
  { id: "pedidos", rotulo: "Pedidos" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default function AdminLojaPage() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [salvo, setSalvo] = useState("");
  const [mercadoPago, setMercadoPago] = useState(false);
  const [aba, setAba] = useState<Aba>("produtos");
  const [salvando, setSalvando] = useState(false);
  const [envios, setEnvios] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const atual = useMemo(() => (loja ? JSON.stringify(loja) : ""), [loja]);
  const alterado = loja !== null && atual !== salvo;

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const r = await fetch("/api/admin/loja", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível carregar a loja.");
      setLoja(j.loja);
      setSalvo(JSON.stringify(j.loja));
      setMercadoPago(Boolean(j.mercadoPago));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a loja.");
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!alterado) return;
    const f = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [alterado]);

  const mudar = (m: Partial<Loja>) => {
    setAviso(null);
    setLoja((l) => (l ? { ...l, ...m } : l));
  };
  const mudarConfig = (m: Partial<ConfigLoja>) => {
    setAviso(null);
    setLoja((l) => (l ? { ...l, config: { ...l.config, ...m } } : l));
  };

  const envioCtx = useMemo(
    () => ({
      enviar: async (arquivo: File, lado?: number) => {
        setEnvios((n) => n + 1);
        try {
          return await enviarImagemLoja(arquivo, lado);
        } catch (e) {
          setErro(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
          return null;
        } finally {
          setEnvios((n) => n - 1);
        }
      },
    }),
    []
  );

  const publicar = async (lojaParaSalvar = loja) => {
    if (!lojaParaSalvar) return;
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/loja", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loja: lojaParaSalvar }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível publicar. Confira a conexão com o banco de dados.");
      setLoja(j.loja);
      setSalvo(JSON.stringify(j.loja));
      setAviso("Alterações publicadas. A loja já está atualizada.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAberta = () => {
    if (!loja) return;
    const abrir = !loja.config.aberta;
    const exemplos = loja.produtos.filter((p) => p.id.startsWith("exemplo-") && p.visivel).length;
    const msg = abrir
      ? `Abrir a loja para o público?${exemplos ? `\n\nAtenção: ainda há ${exemplos} produto(s) de exemplo visíveis. Apague-os antes.` : ""}${mercadoPago ? "" : "\n\nO Mercado Pago ainda não está configurado: os pagamentos serão combinados pelo WhatsApp."}\n\nIsso também publica as outras alterações pendentes.`
      : "Fechar a loja? Os clientes passam a ver “em breve”. Isso também publica as outras alterações pendentes.";
    if (!window.confirm(msg)) return;
    const nova = { ...loja, config: { ...loja.config, aberta: abrir } };
    setLoja(nova);
    publicar(nova);
  };

  if (!loja) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        {erro ? (
          <div className="mx-auto max-w-md space-y-3">
            <p className="text-rose-700">{erro}</p>
            <Button variant="outline" onClick={carregar}>Tentar de novo</Button>
          </div>
        ) : (
          "Carregando a loja..."
        )}
      </div>
    );
  }

  return (
    <EnviosCtx.Provider value={envioCtx}>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loja online</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Tudo o que aparece em <strong>/loja</strong> é configurado aqui. As mudanças só vão para o ar quando você clicar em <strong>Publicar alterações</strong>.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={alternarAberta}
              disabled={salvando}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${loja.config.aberta ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${loja.config.aberta ? "bg-emerald-500" : "bg-slate-400"}`} />
              {loja.config.aberta ? "Loja aberta" : "Loja fechada"}
            </button>
            <Link href="/loja" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Ver loja <ExternalLink className="h-4 w-4" />
            </Link>
            <Button onClick={() => publicar()} isLoading={salvando} disabled={!alterado || envios > 0}>
              <Save className="h-4 w-4" /> Publicar alterações
            </Button>
          </div>
        </div>

        {erro && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>{erro}</span>
            <button type="button" onClick={() => setErro(null)} aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
          </div>
        )}
        {aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{aviso}</div>}
        {alterado && !salvando && (
          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Você tem alterações que ainda não foram publicadas.</div>
        )}
        {envios > 0 && (
          <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Enviando {envios} {envios === 1 ? "imagem" : "imagens"}...</p>
        )}

        <div role="tablist" aria-label="Seções da loja" className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {ABAS.map((a) => (
            <button
              key={a.id}
              role="tab"
              id={`aba-${a.id}`}
              aria-selected={aba === a.id}
              aria-controls={`painel-${a.id}`}
              onClick={() => setAba(a.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${aba === a.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
          {aba === "produtos" && <AbaProdutos produtos={loja.produtos} categorias={loja.categorias} onChange={(produtos) => mudar({ produtos })} />}
          {aba === "categorias" && <AbaCategorias categorias={loja.categorias} produtos={loja.produtos} onChange={(categorias) => mudar({ categorias })} />}
          {aba === "inicio" && <AbaInicio config={loja.config} categorias={loja.categorias} onChange={mudarConfig} />}
          {aba === "aparencia" && <AbaAparencia config={loja.config} onChange={mudarConfig} />}
          {aba === "entrega" && <AbaEntrega config={loja.config} mercadoPago={mercadoPago} onChange={mudarConfig} />}
          {aba === "pedidos" && <AbaPedidos />}
        </div>
      </div>
    </EnviosCtx.Provider>
  );
}
