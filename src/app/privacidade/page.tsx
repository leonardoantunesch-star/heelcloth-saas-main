import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LinkPreferenciasCookies } from "@/components/LinkPreferenciasCookies";
import { EMPRESA } from "@/lib/empresa";

export const metadata = {
  title: "Privacidade e cookies",
  description: "Quais dados a Heel Cloth guarda, para que usamos, com quem compartilhamos e como você exerce seus direitos.",
};

const VERSAO = "Versão 1 · 7 de novembro de 2026";

const h2 = "mt-10 text-lg font-bold sm:text-xl";
const p = "mt-3 text-sm leading-relaxed text-[#121212]/80 sm:text-base";
const ul = "mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#121212]/80 sm:text-base";

// Texto descreve o que o código do site faz hoje. Se uma integração ou um campo mudar, esta página precisa mudar junto.
export default function PrivacidadePage() {
  return (
    <div className="font-editorial flex min-h-screen flex-col bg-white text-[#121212] selection:bg-[#121212] selection:text-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#121212]/60">{VERSAO}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Privacidade e cookies</h1>
        <p className={p}>
          Esta página explica, em linguagem simples, quais dados pessoais a {EMPRESA.nome} guarda quando você usa o site e a loja, para que servem e como pedir a correção ou a exclusão deles.
        </p>

        <h2 className={h2}>Quem é responsável</h2>
        <p className={p}>
          {EMPRESA.nome}, confecção de uniformes e camisas, com endereço em {EMPRESA.endereco}. Contato para assuntos de privacidade:{" "}
          <a className="font-semibold underline underline-offset-2" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> ou WhatsApp{" "}
          <a className="font-semibold underline underline-offset-2" href={EMPRESA.whatsappLink}>{EMPRESA.whatsapp}</a>.
        </p>

        <h2 className={h2}>Quais dados guardamos e para quê</h2>
        <ul className={ul}>
          <li>
            <strong>Pedido de uniformes (página “Fazer pedido”):</strong> nome ou time, contato (WhatsApp ou e-mail), nomes, números e tamanhos dos jogadores, observações e forma de pagamento escolhida. Usamos para orçar, produzir, cobrar e entregar o pedido e para você acompanhar o andamento pelo código recebido.
          </li>
          <li>
            <strong>Compra na loja:</strong> nome, WhatsApp, e-mail, CPF e, quando há entrega, endereço completo. Usamos para registrar o pedido, receber o pagamento, entregar, emitir documentos fiscais e falar com você sobre a compra.
          </li>
          <li>
            <strong>Conta de cliente (opcional):</strong> nome, e-mail, telefone e senha. A senha fica guardada de forma embaralhada (não conseguimos ler). Se você entrar com o Google, recebemos nome e e-mail dessa conta Google. No login por e-mail enviamos um código de 6 dígitos para confirmar que é você.
          </li>
          <li>
            <strong>Segurança:</strong> para impedir abuso (muitas tentativas de login, consultas ou pedidos), guardamos temporariamente uma impressão (hash) do seu endereço de IP junto de um contador de tentativas. Cada registro vale por no máximo algumas horas e é apagado em cerca de um dia.
          </li>
          <li>
            <strong>Contato:</strong> se você nos escreve por WhatsApp ou e-mail, guardamos a conversa para dar o atendimento.
          </li>
        </ul>
        <p className={p}>Não vendemos seus dados e não usamos eles para publicidade de terceiros. Não coletamos dados sensíveis.</p>

        <h2 className={h2}>Com quem compartilhamos</h2>
        <p className={p}>Só com empresas que precisam receber o dado para o serviço funcionar:</p>
        <ul className={ul}>
          <li><strong>Vercel:</strong> hospedagem do site (os servidores ficam fora do Brasil).</li>
          <li><strong>Supabase:</strong> banco de dados onde ficam pedidos, contas e registros (servidores fora do Brasil).</li>
          <li><strong>Mercado Pago:</strong> processa o pagamento por Pix da loja, quando ativo. Recebe seu nome, e-mail, CPF e o valor.</li>
          <li><strong>Resend:</strong> envia os e-mails do site, como o código de login.</li>
          <li><strong>Google:</strong> somente se você escolher “Entrar com o Google”.</li>
          <li><strong>ViaCEP:</strong> quando você digita o CEP no checkout, o seu navegador consulta esse serviço público para preencher o endereço.</li>
          <li><strong>Transportadora ou Correios:</strong> recebem nome, telefone e endereço para entregar a encomenda.</li>
        </ul>
        <p className={p}>Parte desses serviços funciona em outros países, o que envolve transferência internacional de dados. Também podemos informar dados a autoridades quando a lei exigir.</p>

        <h2 className={h2}>Cookies e armazenamento do navegador</h2>
        <p className={p}>Não usamos cookies de publicidade nem de análise de audiência. Hoje só existem estes itens:</p>
        <ul className={ul}>
          <li>
            <strong>Essenciais (sempre ligados):</strong> cookie de sessão do login do cliente (dura até 14 dias) e da equipe (24 horas); cookie temporário do login com Google (10 minutos); carrinho e rascunho do simulador, guardados no navegador; e o registro da sua escolha neste aviso (<code>heelcloth-cookies</code>).
          </li>
          <li>
            <strong>Preferências (só se você aceitar):</strong> lembrar o tema claro ou escuro (<code>heelcloth-tema</code>), sem prazo de validade até você apagar ou desligar.
          </li>
        </ul>
        <p className={p}>
          As fontes das letras são servidas pelo próprio site, sem pedir nada ao Google Fonts. Para mudar a sua escolha, use o botão abaixo ou “Preferências de cookies” no rodapé. Ao desligar as preferências, o item de tema é apagado do seu navegador.
        </p>
        <p className="mt-4">
          <LinkPreferenciasCookies className="inline-flex h-11 items-center rounded-full border-2 border-[#121212] px-5 text-sm font-semibold transition-colors hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2" />
        </p>

        <h2 className={h2}>Por quanto tempo guardamos</h2>
        <p className={p}>
          Guardamos os dados de pedidos e pagamentos pelo tempo necessário para entregar, dar garantia e atendimento e cumprir obrigações fiscais e legais. Os dados da conta ficam até você pedir a exclusão. Os registros de segurança são apagados sozinhos em cerca de um dia.
        </p>

        <h2 className={h2}>Seus direitos</h2>
        <p className={p}>Pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), você pode pedir:</p>
        <ul className={ul}>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>exclusão dos dados que não precisamos guardar por obrigação legal;</li>
          <li>informação sobre com quem compartilhamos;</li>
          <li>retirada de um consentimento que você tenha dado.</li>
        </ul>
        <p className={p}>
          Escreva para{" "}
          <a className="font-semibold underline underline-offset-2" href={`mailto:${EMPRESA.email}?subject=Meus%20dados%20(LGPD)`}>{EMPRESA.email}</a>{" "}
          pelo e-mail cadastrado na conta ou no pedido. Podemos pedir uma confirmação de identidade antes de entregar ou apagar qualquer dado. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>

        <h2 className={h2}>Segurança</h2>
        <p className={p}>
          O site usa conexão criptografada (HTTPS), a área da equipe exige login com permissões por função, senhas ficam embaralhadas e as consultas públicas têm limite de tentativas. Nenhum sistema é totalmente imune; se houver um incidente que afete você, avisaremos como a lei determina.
        </p>

        <h2 className={h2}>Mudanças nesta página</h2>
        <p className={p}>Quando algo mudar, atualizamos o texto e a versão no topo. Veja também <Link href="/contato" className="font-semibold underline underline-offset-2">como falar com a gente</Link>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
