import React from "react";
import Link from "next/link";
import { PaginaPolitica, estilo } from "@/components/politicas/PaginaPolitica";
import { EMPRESA } from "@/lib/empresa";

export const metadata = {
  title: "Termos de uso",
  description: "Regras de uso do site e da loja Heel Cloth: pedidos de uniformes, compras, pagamento, conta de cliente e responsabilidades.",
  alternates: { canonical: "/termos" },
};

const { h2, p, ul, link } = estilo;

// Só descreve como o site funciona hoje. Pontos que dependem de decisão da empresa estão sinalizados em
// docs/conformidade-site.md e não foram inventados aqui.
export default function TermosPage() {
  return (
    <PaginaPolitica
      atual="/termos"
      titulo="Termos de uso"
      versao="Versão 1 · 8 de novembro de 2026"
      resumo={`Estas são as regras para usar o site da ${EMPRESA.nome}: a loja online e os pedidos de uniformes personalizados. Elas não tiram nenhum direito que você tem pelo Código de Defesa do Consumidor.`}
    >
      <h2 className={h2}>1. O que o site oferece</h2>
      <ul className={ul}>
        <li><strong>Loja online:</strong> venda de camisas e roupas da marca, com pagamento por Pix e entrega ou retirada, conforme mostrado no carrinho.</li>
        <li><strong>Uniformes personalizados:</strong> você monta o pedido, informa os jogadores e recebe um orçamento. O pedido mínimo é de 10 camisas.</li>
        <li><strong>Acompanhamento:</strong> consulta do andamento do pedido pelo código recebido ou pela sua conta.</li>
      </ul>

      <h2 className={h2}>2. Preços, orçamento e pagamento</h2>
      <ul className={ul}>
        <li>Na loja, vale o preço mostrado no carrinho no momento da compra, com o frete informado antes do pagamento. O pagamento é por Pix, processado pelo Mercado Pago, e o pedido é confirmado quando o Pix é recebido.</li>
        <li>Nos uniformes, o valor que aparece no formulário é uma estimativa. O valor final é confirmado depois que você envia o pedido e aprova o layout digital. A produção só começa depois dessa aprovação.</li>
        <li>Se um preço aparecer com erro evidente, avisamos você antes de cobrar e você decide se segue com a compra.</li>
      </ul>

      <h2 className={h2}>3. Personalização</h2>
      <ul className={ul}>
        <li>Nomes, números, escudos e artes enviados por você são usados só para produzir o seu pedido.</li>
        <li>Envie apenas escudos, logos e imagens que você tem direito de usar. Podemos recusar artes que reproduzam marcas de terceiros sem autorização ou conteúdo ofensivo.</li>
        <li>Confira nomes, números e tamanhos no layout antes de aprovar: o uniforme é produzido exatamente como aprovado.</li>
      </ul>

      <h2 className={h2}>4. Conta de cliente</h2>
      <ul className={ul}>
        <li>A conta é opcional e pessoal. Mantenha a senha em segredo; o login por e-mail pede um código enviado para você.</li>
        <li>Você pode corrigir seus dados ou excluir a conta quando quiser em <Link href="/loja/conta" className={link}>Minha conta</Link>.</li>
        <li>Podemos bloquear acessos com sinais de fraude ou abuso (por exemplo, muitas tentativas de login).</li>
      </ul>

      <h2 className={h2}>5. Entrega, trocas e devoluções</h2>
      <p className={p}>
        Prazos e valores de frete aparecem antes do pagamento. As regras de troca, arrependimento e reembolso estão em{" "}
        <Link href="/trocas" className={link}>Trocas, devoluções e reembolso</Link>.
      </p>

      <h2 className={h2}>6. Uso do site</h2>
      <ul className={ul}>
        <li>Não é permitido tentar invadir o site, sobrecarregá-lo, copiar dados de outros clientes ou usar robôs para fazer pedidos.</li>
        <li>Fotos, textos e a marca {EMPRESA.nome} pertencem à empresa ou são usados com autorização; não podem ser copiados para uso comercial sem permissão.</li>
        <li>As cores dos produtos podem variar um pouco conforme a tela do seu aparelho.</li>
      </ul>

      <h2 className={h2}>7. Seus dados</h2>
      <p className={p}>
        O tratamento dos seus dados pessoais está explicado na <Link href="/privacidade" className={link}>Política de privacidade e cookies</Link>.
      </p>

      <h2 className={h2}>8. Atendimento e mudanças</h2>
      <p className={p}>
        Dúvidas e reclamações: pelo WhatsApp {EMPRESA.whatsapp} ou pelo e-mail {EMPRESA.email}. Quando estes termos mudarem, atualizamos a versão no topo; a compra já feita segue a versão em vigor na data dela.
      </p>
    </PaginaPolitica>
  );
}
