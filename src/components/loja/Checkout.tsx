"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Minus, Plus } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { ImagemLoja } from "./ImagemLoja";
import { brl, calcularFrete, precoFinal, type ProdutoLoja } from "@/data/loja";

const campo = "h-11 w-full border border-black/20 bg-white px-3 text-sm outline-none focus:border-black";
const rotulo = "mb-1 block text-[11px] font-bold uppercase tracking-[0.1em]";

const mascaraCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
const mascaraCpf = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const mascaraFone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3") : d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

export function Checkout({ produtos }: { produtos: ProdutoLoja[] }) {
  const { itens, substituir, alterarQuantidade, remover, limpar, config } = useLoja();
  const router = useRouter();
  const [cliente, setCliente] = useState({ nome: "", whatsapp: "", email: "", cpf: "" });
  const [retirada, setRetirada] = useState(false);
  const [end, setEnd] = useState({ cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);

  // Atualiza o carrinho com preço e estoque atuais (o cliente pode ter adicionado há dias).
  useEffect(() => {
    if (itens.length === 0) return;
    const msgs: string[] = [];
    let mudou = false;
    const novos = itens.flatMap((i) => {
      const p = produtos.find((x) => x.id === i.produtoId);
      const t = p?.tamanhos.find((x) => x.nome === i.tamanho);
      if (!p || !t || t.estoque === 0) {
        msgs.push(`${i.nome} (${i.tamanho}) não está mais disponível e saiu do carrinho.`);
        mudou = true;
        return [];
      }
      const preco = precoFinal(p);
      const quantidade = Math.min(i.quantidade, t.estoque);
      if (quantidade < i.quantidade) msgs.push(`${p.nome} (${t.nome}): só temos ${t.estoque}.`);
      if (preco !== i.preco || quantidade !== i.quantidade || p.nome !== i.nome || (p.imagens[0] ?? null) !== i.imagem) mudou = true;
      return [{ ...i, preco, quantidade, nome: p.nome, imagem: p.imagens[0] ?? null }];
    });
    if (mudou) substituir(novos);
    if (msgs.length) setAvisos(msgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos]);

  const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const frete = calcularFrete(config, subtotal, retirada);
  const total = subtotal + frete;

  const buscarCep = async (cep: string) => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (!j.erro) setEnd((e) => ({ ...e, rua: j.logradouro || e.rua, bairro: j.bairro || e.bairro, cidade: j.localidade || e.cidade, uf: j.uf || e.uf }));
    } catch {}
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/loja/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          retirada,
          endereco: retirada ? null : end,
          itens: itens.map((i) => ({ produtoId: i.produtoId, tamanho: i.tamanho, quantidade: i.quantidade })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.erro || "Não foi possível finalizar a compra.");
      limpar();
      if (j.pagamentoUrl) window.location.href = j.pagamentoUrl;
      else router.push(`/loja/obrigado?pedido=${encodeURIComponent(j.protocolo)}&manual=1`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível finalizar a compra.");
      setEnviando(false);
    }
  };

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight">Seu carrinho está vazio</h1>
        {avisos.map((a) => <p key={a} className="mt-3 text-sm text-black/60">{a}</p>)}
        <Link href="/loja" className="mt-8 inline-flex h-12 items-center bg-[var(--lj-pri)] px-8 text-xs font-bold uppercase tracking-[0.18em] text-white">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Finalizar compra</h1>
        {avisos.length > 0 && (
          <div role="status" className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {avisos.map((a) => <p key={a}>{a}</p>)}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em]">1. Seus dados</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="c-nome" className={rotulo}>Nome completo</label>
              <input id="c-nome" required autoComplete="name" className={campo} value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />
            </div>
            <div>
              <label htmlFor="c-email" className={rotulo}>E-mail</label>
              <input id="c-email" required type="email" autoComplete="email" className={campo} value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="c-whats" className={rotulo}>WhatsApp</label>
              <input id="c-whats" required inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" className={campo} value={cliente.whatsapp} onChange={(e) => setCliente({ ...cliente, whatsapp: mascaraFone(e.target.value) })} />
            </div>
            <div>
              <label htmlFor="c-cpf" className={rotulo}>CPF</label>
              <input id="c-cpf" required inputMode="numeric" placeholder="000.000.000-00" className={campo} value={cliente.cpf} onChange={(e) => setCliente({ ...cliente, cpf: mascaraCpf(e.target.value) })} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em]">2. Entrega</legend>
          {config.frete.retirada && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { v: false, t: "Receber em casa", d: frete > 0 && !retirada ? brl(frete) : calcularFrete(config, subtotal, false) === 0 ? "Grátis" : brl(config.frete.valor) },
                { v: true, t: "Retirar no local", d: "Grátis" },
              ].map((o) => (
                <label key={String(o.v)} className={`flex cursor-pointer items-center justify-between border p-4 text-sm ${retirada === o.v ? "border-black" : "border-black/20"}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="entrega" checked={retirada === o.v} onChange={() => setRetirada(o.v)} className="accent-black" />
                    <span className="font-semibold">{o.t}</span>
                  </span>
                  <span className="text-black/60">{o.d}</span>
                </label>
              ))}
            </div>
          )}
          {retirada ? (
            <p className="text-sm text-black/65">
              Combinamos a retirada pelo WhatsApp depois da confirmação do pagamento.{config.contato.endereco && ` Endereço: ${config.contato.endereco}.`}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="e-cep" className={rotulo}>CEP</label>
                <input id="e-cep" required inputMode="numeric" autoComplete="postal-code" className={campo} value={end.cep} onChange={(e) => { const v = mascaraCep(e.target.value); setEnd({ ...end, cep: v }); buscarCep(v); }} />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="e-rua" className={rotulo}>Rua</label>
                <input id="e-rua" required autoComplete="address-line1" className={campo} value={end.rua} onChange={(e) => setEnd({ ...end, rua: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="e-num" className={rotulo}>Número</label>
                <input id="e-num" required className={campo} value={end.numero} onChange={(e) => setEnd({ ...end, numero: e.target.value })} />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="e-comp" className={rotulo}>Complemento (opcional)</label>
                <input id="e-comp" autoComplete="address-line2" className={campo} value={end.complemento} onChange={(e) => setEnd({ ...end, complemento: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="e-bairro" className={rotulo}>Bairro</label>
                <input id="e-bairro" required className={campo} value={end.bairro} onChange={(e) => setEnd({ ...end, bairro: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="e-cidade" className={rotulo}>Cidade</label>
                <input id="e-cidade" required autoComplete="address-level2" className={campo} value={end.cidade} onChange={(e) => setEnd({ ...end, cidade: e.target.value })} />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="e-uf" className={rotulo}>UF</label>
                <input id="e-uf" required maxLength={2} autoComplete="address-level1" className={`${campo} uppercase`} value={end.uf} onChange={(e) => setEnd({ ...end, uf: e.target.value.replace(/[^a-z]/gi, "").toUpperCase() })} />
              </div>
            </div>
          )}
          {config.frete.prazo && <p className="text-xs text-black/55">{config.frete.prazo}</p>}
        </fieldset>
      </div>

      <aside className="h-fit border border-black/10 bg-black/[0.02] p-6 lg:sticky lg:top-32">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]">Resumo</h2>
        <ul className="mt-4 divide-y divide-black/10">
          {itens.map((i) => (
            <li key={`${i.produtoId}-${i.tamanho}`} className="flex gap-3 py-3">
              <ImagemLoja id={i.imagem} alt={i.nome} className="h-20 w-16 shrink-0" rotulo="" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.nome}</p>
                <p className="text-xs text-black/55">Tam. {i.tamanho}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center border border-black/20">
                    <button type="button" aria-label={`Diminuir ${i.nome}`} className="p-1 disabled:opacity-30" disabled={i.quantidade <= 1} onClick={() => alterarQuantidade(i.produtoId, i.tamanho, i.quantidade - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-xs tabular-nums">{i.quantidade}</span>
                    <button type="button" aria-label={`Aumentar ${i.nome}`} className="p-1" onClick={() => alterarQuantidade(i.produtoId, i.tamanho, i.quantidade + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="text-sm tabular-nums">{brl(i.preco * i.quantidade)}</span>
                </div>
                <button type="button" onClick={() => remover(i.produtoId, i.tamanho)} className="mt-1 text-[11px] text-black/50 underline">Remover</button>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{brl(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Frete</dt><dd className="tabular-nums">{frete === 0 ? "Grátis" : brl(frete)}</dd></div>
          <div className="flex justify-between border-t border-black/10 pt-3 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{brl(total)}</dd></div>
        </dl>
        {erro && <p role="alert" className="mt-4 text-sm font-semibold text-[var(--lj-dest)]">{erro}</p>}
        <button type="submit" disabled={enviando} className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-[var(--lj-pri)] text-xs font-bold uppercase tracking-[0.18em] text-white hover:opacity-90 disabled:opacity-50">
          <Lock className="h-4 w-4" /> {enviando ? "Processando..." : "Ir para o pagamento"}
        </button>
        <p className="mt-3 text-center text-[11px] text-black/50">Você será levado ao Mercado Pago para pagar com Pix, cartão (até {config.pagamento.parcelasMax}x) ou boleto.</p>
      </aside>
    </form>
  );
}
