import React from "react";
import Link from "next/link";
import { PaginaPolitica, estilo } from "@/components/politicas/PaginaPolitica";
import { EMPRESA } from "@/lib/empresa";

export const metadata = {
  title: "Trocas, devoluções e reembolso",
  description: "Como trocar, devolver ou desistir de uma compra na Heel Cloth, prazos do Código de Defesa do Consumidor e como funciona o reembolso.",
  alternates: { canonical: "/trocas" },
};

const { h2, p, ul, link } = estilo;

// Este texto segue o mínimo garantido pelo CDC (arts. 18, 26 e 49) e pelo Decreto 7.962/2013.
// Condições extras (prazo de troca por tamanho, quem paga o frete da troca) dependem de decisão da empresa e
// estão marcadas como pendentes em docs/conformidade-site.md. Não foram inventadas aqui.
export default function TrocasPage() {
  return (
    <PaginaPolitica
      atual="/trocas"
      titulo="Trocas, devoluções e reembolso"
      versao="Versão 1 · 8 de novembro de 2026"
      resumo="Como pedir troca, devolução ou o cancelamento de uma compra, e como o dinheiro volta para você."
    >
      <h2 className={h2}>Como pedir</h2>
      <p className={p}>
        Fale com a gente pelo{" "}
        <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp {EMPRESA.whatsapp}</a> ou pelo e-mail{" "}
        <a href={`mailto:${EMPRESA.email}?subject=Troca%20ou%20devolu%C3%A7%C3%A3o`} className={link}>{EMPRESA.email}</a>, informando o número do pedido e o motivo.
        Respondemos com as instruções de envio ou de retirada. Guarde a peça sem uso, com etiqueta, até a troca ser concluída.
      </p>

      <h2 className={h2}>Desistência da compra pela internet (7 dias)</h2>
      <p className={p}>
        Em compras feitas pelo site, você pode desistir em até 7 dias corridos a partir do dia em que recebeu o produto, sem precisar explicar o motivo (art. 49 do Código de Defesa do Consumidor).
        Nesse caso devolvemos todo o valor pago, incluindo o frete, e o custo do envio de volta não fica com você.
      </p>
      <p className={p}>
        Uniformes personalizados são feitos sob encomenda, com nome, número e escudo de cada jogador. Se quiser desistir de um pedido de uniforme, fale com a gente o quanto antes: antes da aprovação do layout nada foi produzido.
      </p>

      <h2 className={h2}>Produto com defeito</h2>
      <p className={p}>
        Se a peça chegar com defeito de fabricação ou diferente do que foi pedido (tamanho, nome ou número trocados em relação ao layout aprovado), você tem até 90 dias depois de receber para reclamar (art. 26 do CDC).
        Resolvemos em até 30 dias com a troca por uma peça igual, o conserto ou a devolução do valor, como prevê a lei (art. 18 do CDC).
      </p>

      <h2 className={h2}>Troca por tamanho ou cor (sem defeito)</h2>
      <p className={p}>
        Fale com a gente pelo WhatsApp para verificar se temos o tamanho ou a cor que você quer. Antes de comprar, confira a <Link href="/tamanhos" className={link}>tabela de tamanhos</Link>.
      </p>

      <h2 className={h2}>Cancelamento antes do envio</h2>
      <p className={p}>Pedidos da loja ainda não enviados podem ser cancelados pelos mesmos canais; devolvemos o valor pago.</p>

      <h2 className={h2}>Como o dinheiro volta</h2>
      <ul className={ul}>
        <li>Compras pagas com Pix são devolvidas por Pix (estorno pelo Mercado Pago ou transferência para a conta que você indicar).</li>
        <li>Na desistência de 7 dias, a devolução é feita assim que confirmarmos o pedido de desistência, com o valor integral.</li>
        <li>Você recebe a confirmação do reembolso pelo mesmo canal em que fez o pedido.</li>
      </ul>
    </PaginaPolitica>
  );
}
