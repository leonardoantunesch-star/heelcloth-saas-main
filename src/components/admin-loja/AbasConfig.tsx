"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cartao, Cor, Dinheiro, Inteiro, Marcar, Texto, UmaImagem, estiloCampo } from "./Campos";
import { brl, criarId, type BannerLoja, type BlocoLoja, type CategoriaLoja, type ConfigLoja, type ProdutoLoja } from "@/data/loja";

function mover<T>(lista: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= lista.length) return lista;
  const a = [...lista];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

function BotoesOrdem({ i, total, onMover, onRemover, nome }: { i: number; total: number; onMover: (d: number) => void; onRemover: () => void; nome: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="outline" size="icon" aria-label={`Subir ${nome}`} disabled={i === 0} onClick={() => onMover(-1)}><ArrowUp className="h-4 w-4" /></Button>
      <Button variant="outline" size="icon" aria-label={`Descer ${nome}`} disabled={i === total - 1} onClick={() => onMover(1)}><ArrowDown className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" aria-label={`Remover ${nome}`} className="text-rose-600 hover:bg-rose-50" onClick={onRemover}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

// ---------------- CATEGORIAS ----------------
export function AbaCategorias({ categorias, produtos, onChange }: { categorias: CategoriaLoja[]; produtos: ProdutoLoja[]; onChange: (c: CategoriaLoja[]) => void }) {
  const set = (i: number, m: Partial<CategoriaLoja>) => onChange(categorias.map((c, k) => (k === i ? { ...c, ...m } : c)));
  return (
    <Cartao
      titulo="Categorias e menu"
      descricao="A ordem aqui é a ordem do menu da loja. Categoria escondida some do menu junto com seus produtos."
      acoes={
        <Button size="sm" disabled={categorias.length >= 30} onClick={() => onChange([...categorias, { id: criarId("categoria"), nome: "Nova categoria", imagem: null, visivel: true }])}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      }
    >
      <ul className="space-y-3">
        {categorias.map((c, i) => {
          const qtd = produtos.filter((p) => p.categoriaId === c.id).length;
          return (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center">
              <input aria-label="Nome da categoria" className={`${estiloCampo} sm:max-w-xs`} maxLength={40} value={c.nome} onChange={(e) => set(i, { nome: e.target.value })} />
              <span className="text-xs text-slate-500">{qtd} {qtd === 1 ? "produto" : "produtos"}</span>
              <div className="sm:ml-auto flex items-center gap-4">
                <Marcar rotulo="No menu" valor={c.visivel} onChange={(v) => set(i, { visivel: v })} />
                <BotoesOrdem i={i} total={categorias.length} nome={c.nome} onMover={(d) => onChange(mover(categorias, i, d))} onRemover={() => {
                  if (!window.confirm(qtd ? `"${c.nome}" tem ${qtd} produto(s). Eles ficarão sem categoria. Remover?` : `Remover "${c.nome}"?`)) return;
                  onChange(categorias.filter((_, k) => k !== i));
                }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">Link de cada categoria: /loja/categoria/&lt;código&gt; — use o botão “Copiar link” abaixo para colocar num banner ou bloco.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <button key={c.id} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-200"
            onClick={() => navigator.clipboard?.writeText(`/loja/categoria/${c.id}`)}>
            Copiar link: {c.nome}
          </button>
        ))}
      </div>
    </Cartao>
  );
}

// ---------------- PÁGINA INICIAL ----------------
export function AbaInicio({ config, categorias, onChange }: { config: ConfigLoja; categorias: CategoriaLoja[]; onChange: (c: Partial<ConfigLoja>) => void }) {
  const setBanner = (i: number, m: Partial<BannerLoja>) => onChange({ banners: config.banners.map((b, k) => (k === i ? { ...b, ...m } : b)) });
  const setBloco = (i: number, m: Partial<BlocoLoja>) => onChange({ blocos: config.blocos.map((b, k) => (k === i ? { ...b, ...m } : b)) });
  const sugestoes = ["/loja/novidades", "/loja/ofertas", "/loja/todos", ...categorias.map((c) => `/loja/categoria/${c.id}`)];

  return (
    <div className="space-y-4">
      <datalist id="links-loja">{sugestoes.map((s) => <option key={s} value={s} />)}</datalist>

      <Cartao titulo="Faixa de avisos (topo)" descricao="Mensagens curtas que se alternam no topo da loja. Até 6."
        acoes={<Button size="sm" variant="outline" disabled={config.faixa.length >= 6} onClick={() => onChange({ faixa: [...config.faixa, ""] })}><Plus className="h-4 w-4" /> Aviso</Button>}>
        <ul className="space-y-2">
          {config.faixa.map((f, i) => (
            <li key={i} className="flex gap-2">
              <input aria-label={`Aviso ${i + 1}`} className={estiloCampo} maxLength={90} value={f} placeholder="Ex: Frete grátis acima de R$ 299"
                onChange={(e) => onChange({ faixa: config.faixa.map((x, k) => (k === i ? e.target.value : x)) })} />
              <BotoesOrdem i={i} total={config.faixa.length} nome={`aviso ${i + 1}`} onMover={(d) => onChange({ faixa: mover(config.faixa, i, d) })} onRemover={() => onChange({ faixa: config.faixa.filter((_, k) => k !== i) })} />
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Banners principais" descricao="Imagens grandes no topo da página inicial. Use fotos horizontais (ex: 1920×1000). Até 6."
        acoes={<Button size="sm" variant="outline" disabled={config.banners.length >= 6} onClick={() => onChange({ banners: [...config.banners, { id: criarId("banner"), titulo: "", subtitulo: "", botao: "Comprar agora", link: "/loja/novidades", imagem: null, textoClaro: true, visivel: true }] })}><Plus className="h-4 w-4" /> Banner</Button>}>
        <ul className="space-y-4">
          {config.banners.map((b, i) => (
            <li key={b.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Banner {i + 1}</span>
                <BotoesOrdem i={i} total={config.banners.length} nome={`banner ${i + 1}`} onMover={(d) => onChange({ banners: mover(config.banners, i, d) })} onRemover={() => onChange({ banners: config.banners.filter((_, k) => k !== i) })} />
              </div>
              <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                <UmaImagem rotulo="Imagem" valor={b.imagem} onChange={(v) => setBanner(i, { imagem: v })} proporcao="aspect-[16/9]" lado={2000} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Texto className="sm:col-span-2" rotulo="Título" max={80} valor={b.titulo} onChange={(v) => setBanner(i, { titulo: v })} />
                  <Texto className="sm:col-span-2" rotulo="Subtítulo" max={160} valor={b.subtitulo} onChange={(v) => setBanner(i, { subtitulo: v })} />
                  <Texto rotulo="Texto do botão" max={30} valor={b.botao} onChange={(v) => setBanner(i, { botao: v })} />
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor={`bl-${b.id}`}>Link</label>
                    <input id={`bl-${b.id}`} list="links-loja" className={estiloCampo} maxLength={200} value={b.link} onChange={(e) => setBanner(i, { link: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap gap-6 sm:col-span-2">
                    <Marcar rotulo="Texto branco" ajuda="Para fotos escuras" valor={b.textoClaro} onChange={(v) => setBanner(i, { textoClaro: v })} />
                    <Marcar rotulo="Mostrar" valor={b.visivel} onChange={(v) => setBanner(i, { visivel: v })} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Blocos de navegação" descricao="Os quadros com foto logo abaixo do banner (ex: Camisetas, Shorts). Até 8."
        acoes={<Button size="sm" variant="outline" disabled={config.blocos.length >= 8} onClick={() => onChange({ blocos: [...config.blocos, { id: criarId("bloco"), titulo: "Novo bloco", link: "/loja/todos", imagem: null }] })}><Plus className="h-4 w-4" /> Bloco</Button>}>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {config.blocos.map((b, i) => (
            <li key={b.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
              <UmaImagem rotulo="Foto (vertical)" valor={b.imagem} onChange={(v) => setBloco(i, { imagem: v })} proporcao="aspect-[3/4]" />
              <Texto rotulo="Título" max={40} valor={b.titulo} onChange={(v) => setBloco(i, { titulo: v })} />
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor={`bk-${b.id}`}>Link</label>
                <input id={`bk-${b.id}`} list="links-loja" className={estiloCampo} maxLength={200} value={b.link} onChange={(e) => setBloco(i, { link: e.target.value })} />
              </div>
              <BotoesOrdem i={i} total={config.blocos.length} nome={b.titulo} onMover={(d) => onChange({ blocos: mover(config.blocos, i, d) })} onRemover={() => onChange({ blocos: config.blocos.filter((_, k) => k !== i) })} />
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Títulos das vitrines e texto institucional">
        <div className="grid gap-4 sm:grid-cols-3">
          <Texto rotulo="Vitrine de lançamentos" max={40} valor={config.textos.lancamentos} onChange={(v) => onChange({ textos: { ...config.textos, lancamentos: v } })} />
          <Texto rotulo="Vitrine de destaques" max={40} valor={config.textos.destaques} onChange={(v) => onChange({ textos: { ...config.textos, destaques: v } })} />
          <Texto rotulo="Vitrine de ofertas" max={40} valor={config.textos.promocoes} onChange={(v) => onChange({ textos: { ...config.textos, promocoes: v } })} />
          <Texto className="sm:col-span-3" rotulo="Título do texto sobre a marca" max={80} valor={config.textos.sobreTitulo} onChange={(v) => onChange({ textos: { ...config.textos, sobreTitulo: v } })} />
          <Texto className="sm:col-span-3" rotulo="Texto sobre a marca" linhas={4} max={1200} valor={config.textos.sobre} onChange={(v) => onChange({ textos: { ...config.textos, sobre: v } })} />
        </div>
      </Cartao>
    </div>
  );
}

// ---------------- MARCA, CORES E CONTATO ----------------
export function AbaAparencia({ config, onChange }: { config: ConfigLoja; onChange: (c: Partial<ConfigLoja>) => void }) {
  const cores = config.cores;
  return (
    <div className="space-y-4">
      <Cartao titulo="Marca">
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <UmaImagem rotulo="Logo (opcional)" valor={config.marca.logo} onChange={(v) => onChange({ marca: { ...config.marca, logo: v } })} proporcao="aspect-square" lado={600} ajuda="Aparece ao lado do nome. PNG com fundo transparente vira fundo branco; prefira logo em fundo branco." />
          <div className="space-y-4">
            <Texto rotulo="Nome da loja" max={40} valor={config.marca.nome} onChange={(v) => onChange({ marca: { ...config.marca, nome: v } })} />
            <Texto rotulo="Frase (aparece no rodapé)" max={120} valor={config.marca.slogan} onChange={(v) => onChange({ marca: { ...config.marca, slogan: v } })} />
          </div>
        </div>
      </Cartao>
      <Cartao titulo="Cores">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Cor rotulo="Principal (botões, faixa, rodapé)" valor={cores.primaria} onChange={(v) => onChange({ cores: { ...cores, primaria: v } })} />
          <Cor rotulo="Destaque (ofertas, avisos)" valor={cores.destaque} onChange={(v) => onChange({ cores: { ...cores, destaque: v } })} />
          <Cor rotulo="Fundo" valor={cores.fundo} onChange={(v) => onChange({ cores: { ...cores, fundo: v } })} />
          <Cor rotulo="Texto" valor={cores.texto} onChange={(v) => onChange({ cores: { ...cores, texto: v } })} />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200" style={{ background: cores.fundo, color: cores.texto }} aria-label="Prévia das cores">
          <div className="px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: cores.primaria }}>Faixa de avisos</div>
          <div className="flex flex-wrap items-center gap-4 p-4">
            <span className="font-extrabold uppercase tracking-[0.2em]">{config.marca.nome}</span>
            <span className="text-sm font-bold" style={{ color: cores.destaque }}>{brl(59.9)}</span>
            <span className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: cores.primaria }}>Adicionar ao carrinho</span>
          </div>
        </div>
      </Cartao>
      <Cartao titulo="Contato e dados da empresa" descricao="Aparecem no rodapé e no botão de WhatsApp depois da compra.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto rotulo="WhatsApp (com DDD)" max={20} placeholder="(11) 99999-9999" valor={config.contato.whatsapp} onChange={(v) => onChange({ contato: { ...config.contato, whatsapp: v } })} />
          <Texto rotulo="E-mail" max={120} valor={config.contato.email} onChange={(v) => onChange({ contato: { ...config.contato, email: v } })} />
          <Texto rotulo="Instagram" max={60} placeholder="@heelcloth" valor={config.contato.instagram} onChange={(v) => onChange({ contato: { ...config.contato, instagram: v } })} />
          <Texto rotulo="CNPJ" max={30} valor={config.contato.cnpj} onChange={(v) => onChange({ contato: { ...config.contato, cnpj: v } })} />
          <Texto className="sm:col-span-2" rotulo="Endereço (para retirada)" max={200} valor={config.contato.endereco} onChange={(v) => onChange({ contato: { ...config.contato, endereco: v } })} />
        </div>
      </Cartao>
    </div>
  );
}

// ---------------- ENTREGA E PAGAMENTO ----------------
export function AbaEntrega({ config, mercadoPago, onChange }: { config: ConfigLoja; mercadoPago: boolean; onChange: (c: Partial<ConfigLoja>) => void }) {
  const f = config.frete;
  return (
    <div className="space-y-4">
      <Cartao titulo="Frete">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dinheiro rotulo="Valor do frete" valor={f.valor} onChange={(v) => onChange({ frete: { ...f, valor: v ?? 0 } })} ajuda="Valor único para todo o Brasil. Use 0 para frete sempre grátis." />
          <Dinheiro rotulo="Frete grátis acima de (opcional)" vazio valor={f.gratisAcima} onChange={(v) => onChange({ frete: { ...f, gratisAcima: v } })} ajuda="Deixe em branco para não ter frete grátis." />
          <Texto className="sm:col-span-2" rotulo="Prazo de envio (texto)" max={80} valor={f.prazo} onChange={(v) => onChange({ frete: { ...f, prazo: v } })} />
          <Marcar rotulo="Permitir retirada no local (grátis)" valor={f.retirada} onChange={(v) => onChange({ frete: { ...f, retirada: v } })} />
        </div>
      </Cartao>
      <Cartao titulo="Pagamento (Mercado Pago)">
        <div className={`mb-4 flex items-start gap-3 rounded-lg border p-4 text-sm ${mercadoPago ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          {mercadoPago ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            {mercadoPago ? (
              <p><strong>Conectado.</strong> Os clientes pagam com Pix, cartão ou boleto e o pedido é confirmado sozinho.</p>
            ) : (
              <>
                <p><strong>Mercado Pago não configurado.</strong> Enquanto isso, as compras chegam como “pagamento pendente” e o pagamento é combinado pelo WhatsApp.</p>
                <p className="mt-2">Para ligar: no Mercado Pago, vá em <em>Suas integrações → Credenciais de produção</em>, copie o <strong>Access Token</strong> e crie na Vercel a variável <code className="rounded bg-white/70 px-1">MERCADOPAGO_ACCESS_TOKEN</code>. Depois faça Redeploy.</p>
                <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold underline">Abrir painel do Mercado Pago <ExternalLink className="h-3.5 w-3.5" /></a>
              </>
            )}
          </div>
        </div>
        <Inteiro className="max-w-xs" rotulo="Parcelas máximas no cartão" min={1} max={12} valor={config.pagamento.parcelasMax} onChange={(v) => onChange({ pagamento: { parcelasMax: v } })} />
        <p className="mt-1 text-[11px] text-slate-500">Os juros das parcelas seguem o que estiver configurado na sua conta do Mercado Pago.</p>
      </Cartao>
    </div>
  );
}

// ---------------- PEDIDOS ----------------
interface PedidoLoja {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: { name: string; whatsapp: string };
  items: { product: string; size: string | null; quantity: number }[];
}
const STATUS: Record<string, { rotulo: string; cor: string }> = {
  PAGAMENTO_PENDENTE: { rotulo: "Aguardando pagamento", cor: "bg-amber-50 text-amber-700" },
  PAGAMENTO_CONFIRMADO: { rotulo: "Pago", cor: "bg-emerald-50 text-emerald-700" },
  ENTREGUE: { rotulo: "Entregue", cor: "bg-blue-50 text-blue-700" },
  CONCLUIDO: { rotulo: "Concluído", cor: "bg-slate-100 text-slate-700" },
  CANCELADO: { rotulo: "Cancelado", cor: "bg-rose-50 text-rose-700" },
};

export function AbaPedidos() {
  const [pedidos, setPedidos] = useState<PedidoLoja[] | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    fetch("/api/admin/loja/pedidos", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.erro || "Não foi possível carregar os pedidos.");
        setPedidos(j.pedidos);
      })
      .catch((e) => setErro(e.message));
  }, []);
  return (
    <Cartao titulo="Pedidos da loja" descricao="Os 100 mais recentes. Clique para abrir o pedido completo e mudar a situação.">
      {erro ? (
        <p className="text-sm text-rose-700">{erro}</p>
      ) : !pedidos ? (
        <p className="py-8 text-center text-sm text-slate-500">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nenhuma compra ainda.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {pedidos.map((p) => {
            const s = STATUS[p.status] ?? { rotulo: p.status, cor: "bg-slate-100 text-slate-700" };
            return (
              <li key={p.id}>
                <a href={`/admin/pedidos/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-slate-50">
                  <span className="font-mono text-xs font-semibold text-slate-900">{p.orderNumber}</span>
                  <span className="text-sm text-slate-700">{p.customer.name}</span>
                  <span className="text-xs text-slate-500">{p.items.map((i) => `${i.quantity}× ${i.product}${i.size ? ` (${i.size})` : ""}`).join(", ")}</span>
                  <span className="ml-auto text-sm font-semibold tabular-nums text-slate-900">{brl(p.totalAmount)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cor}`}>{s.rotulo}</span>
                  <span className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}
