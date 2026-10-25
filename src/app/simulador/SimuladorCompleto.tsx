"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Upload, Play, Pause, ShoppingBag, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Visualizador3D, type Visualizador3DRef, type Vista } from "@/components/simulador/Visualizador3D";
import {
  CHAVE_SIMULADOR,
  MODELOS_PRONTOS,
  PADROES,
  PROJETO_INICIAL,
  descreverProjeto,
  type ProjetoUniforme,
} from "@/lib/simulador/projeto";

function Cor({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="ripple-host flex items-center gap-2.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-[#121212] cursor-pointer">
      <input
        type="color"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-label={rotulo}
        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-black/15 bg-transparent p-0"
      />
      <span className="font-medium">{rotulo}</span>
    </label>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/10 pt-4">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#121212]/55">{titulo}</h2>
      {children}
    </section>
  );
}

function Escolha<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={valor === o.id}
          className={`ripple-host rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
            valor === o.id ? "border-[#121212] bg-[#121212] text-white" : "border-black/15 bg-white text-[#121212] hover:border-black/40"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export default function SimuladorCompleto() {
  const [p, setP] = useState<ProjetoUniforme>(PROJETO_INICIAL);
  const [vista, setVista] = useState<Vista>("conjunto");
  const [girar, setGirar] = useState(true);
  const [aviso, setAviso] = useState("");
  const ref = useRef<Visualizador3DRef>(null);
  const campoEscudo = useRef<HTMLInputElement>(null);

  const mudar = <K extends keyof ProjetoUniforme>(k: K, v: ProjetoUniforme[K]) => setP((a) => ({ ...a, [k]: v }));
  const listrado = p.padrao === "listras-v" || p.padrao === "listras-h";

  const baixar = () => {
    const url = ref.current?.capturar();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "uniforme-heelcloth.png";
    a.click();
  };

  const lerEscudo = (arq?: File) => {
    if (!arq) return;
    if (!arq.type.startsWith("image/")) return setAviso("Escolha um arquivo de imagem (PNG ou JPG).");
    const leitor = new FileReader();
    leitor.onload = () => {
      // reduz para não pesar no navegador
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const f = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * f);
        c.height = Math.round(img.height * f);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        mudar("escudo", c.toDataURL("image/png"));
        setAviso("");
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arq);
  };

  const enviarParaPedido = () => {
    try {
      localStorage.setItem(
        CHAVE_SIMULADOR,
        JSON.stringify({ descricao: descreverProjeto(p), imagem: ref.current?.capturar() ?? null })
      );
    } catch {
      /* sem armazenamento: segue mesmo assim */
    }
    window.location.href = "/pedido";
  };

  return (
    <div className="font-editorial min-h-screen bg-white text-[#121212]">
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#121212]/50">Simulador 3D</p>
          <h1 className="mt-1 text-3xl font-light tracking-tight sm:text-4xl">Monte o seu uniforme</h1>
          <p className="mt-2 max-w-xl text-sm text-[#121212]/60">
            Gire, mude as cores, o padrão, o nome e o número. Quando gostar, envie o modelo direto para o pedido.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative h-[460px] overflow-hidden rounded-2xl border border-black/10 bg-[#f2f2f2] sm:h-[560px] lg:h-[calc(100vh-170px)] lg:min-h-[520px]">
              <Visualizador3D ref={ref} projeto={p} vista={vista} girarSozinho={girar} />
              <div className="absolute left-3 top-3 flex gap-1.5 rounded-full bg-white/90 p-1 shadow-xs">
                {(
                  [
                    ["conjunto", "Conjunto"],
                    ["camisa", "Camisa"],
                    ["short", "Short"],
                  ] as [Vista, string][]
                ).map(([id, r]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVista(id)}
                    aria-pressed={vista === id}
                    className={`ripple-host rounded-full px-3 py-1 text-xs font-medium ${
                      vista === id ? "bg-[#121212] text-white" : "text-[#121212]/70"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => { setGirar(false); ref.current?.girarPara("frente"); }} className="ripple-host rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-xs">Frente</button>
                  <button type="button" onClick={() => { setGirar(false); ref.current?.girarPara("costas"); }} className="ripple-host rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-xs">Costas</button>
                  <button type="button" onClick={() => setGirar((g) => !g)} aria-label={girar ? "Parar giro" : "Girar sozinho"} className="ripple-host inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-xs">
                    {girar ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {girar ? "Parar" : "Girar"}
                  </button>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-[#121212]/55">Arraste para girar · role para aproximar</span>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-2xl border border-black/10 bg-white p-5">
            <Bloco titulo="Modelos prontos">
              <div className="flex flex-wrap gap-2">
                {MODELOS_PRONTOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setP((a) => ({ ...a, ...m.projeto }))}
                    className="ripple-host rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium hover:border-black/40"
                  >
                    {m.nome}
                  </button>
                ))}
              </div>
            </Bloco>

            <Bloco titulo="Padrão da camisa">
              <Escolha opcoes={PADROES} valor={p.padrao} onChange={(v) => mudar("padrao", v)} />
              {listrado && (
                <label className="mt-3 flex items-center gap-3 text-xs">
                  <span className="font-medium">Listras: {p.listras}</span>
                  <input type="range" min={4} max={20} step={2} value={p.listras} onChange={(e) => mudar("listras", Number(e.target.value))} className="flex-1 accent-[#121212]" />
                </label>
              )}
            </Bloco>

            <Bloco titulo="Cores da camisa">
              <div className="grid grid-cols-2 gap-2">
                <Cor rotulo="Principal" valor={p.corBase} onChange={(v) => mudar("corBase", v)} />
                <Cor rotulo="Secundária" valor={p.corDetalhe} onChange={(v) => mudar("corDetalhe", v)} />
                <Cor rotulo="Mangas" valor={p.corManga} onChange={(v) => mudar("corManga", v)} />
                <Cor rotulo="Gola" valor={p.corGola} onChange={(v) => mudar("corGola", v)} />
                <Cor rotulo="Listras da gola" valor={p.corGolaListra} onChange={(v) => mudar("corGolaListra", v)} />
                <Cor rotulo="Punhos e barra" valor={p.corPunho} onChange={(v) => mudar("corPunho", v)} />
                <Cor rotulo="Nome e número" valor={p.corTexto} onChange={(v) => mudar("corTexto", v)} />
              </div>
            </Bloco>

            <Bloco titulo="Modelagem">
              <div className="space-y-3">
                <Escolha opcoes={[{ id: "v-transp", rotulo: "V transpassada" }, { id: "v", rotulo: "Gola em V" }, { id: "redonda", rotulo: "Gola redonda" }]} valor={p.gola} onChange={(v) => mudar("gola", v)} />
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={p.raglan} onChange={(e) => mudar("raglan", e.target.checked)} className="h-4 w-4 accent-[#121212]" />
                  Corte raglan (manga até o pescoço)
                </label>
                <Escolha opcoes={[{ id: "curta", rotulo: "Manga curta" }, { id: "longa", rotulo: "Manga longa (+R$ 20)" }]} valor={p.mangaLonga ? "longa" : "curta"} onChange={(v) => mudar("mangaLonga", v === "longa")} />
              </div>
            </Bloco>

            <Bloco titulo="Nome, número e escudo">
              <div className="grid grid-cols-[1fr_88px] gap-2">
                <input value={p.nome} maxLength={16} onChange={(e) => mudar("nome", e.target.value.toUpperCase())} placeholder="Nome nas costas" aria-label="Nome" className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#121212]" />
                <input value={p.numero} maxLength={3} inputMode="numeric" onChange={(e) => mudar("numero", e.target.value.replace(/\D/g, ""))} placeholder="Nº" aria-label="Número" className="rounded-lg border border-black/15 px-3 py-2 text-center text-sm outline-none focus:border-[#121212]" />
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs font-medium">
                <input type="checkbox" checked={p.numeroFrente} onChange={(e) => mudar("numeroFrente", e.target.checked)} className="h-4 w-4 accent-[#121212]" />
                Número também na frente
              </label>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => campoEscudo.current?.click()} className="ripple-host inline-flex items-center gap-2 rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-medium hover:border-black/40">
                  <Upload className="h-3.5 w-3.5" /> {p.escudo ? "Trocar escudo" : "Enviar escudo"}
                </button>
                {p.escudo && (
                  <button type="button" onClick={() => mudar("escudo", null)} aria-label="Remover escudo" className="ripple-host rounded-full border border-black/15 p-1.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <input ref={campoEscudo} type="file" accept="image/*" hidden onChange={(e) => { lerEscudo(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              {aviso && <p role="alert" className="mt-2 text-xs text-red-600">{aviso}</p>}
            </Bloco>

            <Bloco titulo="Short e meião">
              <div className="grid grid-cols-2 gap-2">
                <Cor rotulo="Principal" valor={p.shortBase} onChange={(v) => mudar("shortBase", v)} />
                <Cor rotulo="Faixa lateral" valor={p.shortFaixa} onChange={(v) => mudar("shortFaixa", v)} />
                <Cor rotulo="Cós" valor={p.shortCos} onChange={(v) => mudar("shortCos", v)} />
                <Cor rotulo="Meião" valor={p.meiao} onChange={(v) => mudar("meiao", v)} />
                <Cor rotulo="Faixa do meião" valor={p.meiaoFaixa} onChange={(v) => mudar("meiaoFaixa", v)} />
              </div>
            </Bloco>

            <div className="flex flex-col gap-2 border-t border-black/10 pt-4">
              <button type="button" onClick={enviarParaPedido} className="ripple-host inline-flex items-center justify-center gap-2 rounded-full bg-[#121212] px-5 py-3 text-sm font-medium text-white">
                <ShoppingBag className="h-4 w-4" /> Usar este modelo no pedido
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={baixar} className="ripple-host inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-medium">
                  <Download className="h-3.5 w-3.5" /> Baixar imagem
                </button>
                <button type="button" onClick={() => setP(PROJETO_INICIAL)} className="ripple-host inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-medium">
                  <RotateCcw className="h-3.5 w-3.5" /> Recomeçar
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#121212]/45">
                A visualização é uma simulação. Cores na tela podem variar um pouco do tecido final; a arte definitiva é combinada com a Heelcloth.{" "}
                <Link href="/contato" className="underline">Falar com a gente</Link>
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
