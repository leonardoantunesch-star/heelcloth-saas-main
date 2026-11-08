import React from "react";
import Link from "next/link";
import { LinkPreferenciasCookies } from "@/components/LinkPreferenciasCookies";
import { PaginaPolitica, estilo } from "@/components/politicas/PaginaPolitica";
import { EMPRESA } from "@/lib/empresa";
import { GA_ID } from "@/lib/cookies-consentimento";

export const metadata = {
  title: "Privacidade e cookies",
  description: "Quais dados a Heel Cloth guarda, para que usamos, com quem compartilhamos e como você exerce seus direitos.",
  alternates: { canonical: "/privacidade" },
};

const { h2, p, ul, link } = estilo;

// O texto descreve o que o código do site faz hoje. Se uma integração ou um campo mudar, esta página muda junto.
export default function PrivacidadePage() {
  return (
    <PaginaPolitica
      atual="/privacidade"
      titulo="Privacidade e cookies"
      versao="Versão 2 · 8 de novembro de 2026"
      resumo={`Esta página explica, em linguagem simples, quais dados pessoais a ${EMPRESA.nome} guarda quando você usa o site e a loja, para que servem, com quem são compartilhados e como pedir a correção ou a exclusão deles.`}
    >
      <h2 className={h2}>Quais dados guardamos e para quê</h2>
      <ul className={ul}>
        <li>
          <strong>Pedido de uniformes (“Fazer pedido”):</strong> nome ou time, contato (WhatsApp ou e-mail), nomes, números e tamanhos dos jogadores, observações e forma de pagamento. Servem para orçar, produzir, cobrar e entregar o pedido e para você acompanhar o andamento pelo código recebido. Base legal: execução do contrato que você pediu.
        </li>
        <li>
          <strong>Compra na loja:</strong> nome, WhatsApp, e-mail, CPF e, quando há entrega, endereço. Servem para registrar o pedido, receber o pagamento, entregar, emitir documentos fiscais e falar com você sobre a compra. Base legal: execução do contrato e cumprimento de obrigação legal (fiscal).
        </li>
        <li>
          <strong>Conta de cliente (opcional):</strong> nome, e-mail, telefone (opcional) e senha. A senha fica guardada de forma embaralhada (não conseguimos ler). Se você entrar com o Google, recebemos nome e e-mail dessa conta. No login por e-mail enviamos um código de 6 dígitos para confirmar que é você. Base legal: execução do contrato (manter sua conta).
        </li>
        <li>
          <strong>Segurança:</strong> para impedir abuso (muitas tentativas de login, consultas ou pedidos), guardamos temporariamente uma impressão (hash) do seu endereço de IP junto de um contador. Cada registro vale no máximo algumas horas e é apagado em cerca de um dia. Base legal: legítimo interesse em proteger o site e os clientes.
        </li>
        <li>
          <strong>Atendimento:</strong> se você nos escreve por WhatsApp ou e-mail, guardamos a conversa para dar o atendimento.
        </li>
      </ul>
      <p className={p}>Pedimos só o necessário: campos marcados como opcionais podem ficar em branco. Não vendemos seus dados, não usamos para publicidade de terceiros e não coletamos dados sensíveis.</p>

      <h2 className={h2}>Com quem compartilhamos</h2>
      <p className={p}>Só com empresas que precisam receber o dado para o serviço funcionar:</p>
      <ul className={ul}>
        <li><strong>Vercel:</strong> hospedagem do site (servidores fora do Brasil).</li>
        <li><strong>Supabase:</strong> banco de dados com pedidos, contas e registros (servidores fora do Brasil).</li>
        <li><strong>Mercado Pago:</strong> processa o pagamento por Pix da loja. Recebe nome, e-mail, CPF e o valor.</li>
        <li><strong>Resend:</strong> envia os e-mails do site, como o código de login.</li>
        <li><strong>Google:</strong> somente se você escolher “Entrar com o Google”{GA_ID ? " ou aceitar os cookies de estatísticas (veja abaixo)" : ""}.</li>
        <li><strong>ViaCEP:</strong> quando você digita o CEP no checkout, o seu navegador consulta esse serviço público para preencher o endereço.</li>
        <li><strong>Transportadora ou Correios:</strong> recebem nome, telefone e endereço para entregar a encomenda.</li>
      </ul>
      <p className={p}>Parte desses serviços funciona em outros países, o que envolve transferência internacional de dados. Também podemos informar dados a autoridades quando a lei exigir.</p>

      <h2 className={h2}>Cookies e armazenamento do navegador</h2>
      <p className={p}>Não usamos cookies de publicidade. Estes são os itens que existem hoje:</p>
      <ul className={ul}>
        <li>
          <strong>Essenciais (sempre ligados):</strong> cookie de sessão do login do cliente (até 14 dias) e da equipe (24 horas); cookie temporário do login com Google (10 minutos); carrinho e rascunho do simulador, guardados no navegador; e o registro da sua escolha sobre cookies (<code>heelcloth-cookies</code>).
        </li>
        <li>
          <strong>Preferências (só se você aceitar):</strong> lembrar o tema claro ou escuro (<code>heelcloth-tema</code>), até você apagar ou desligar.
        </li>
        {GA_ID ? (
          <li>
            <strong>Estatísticas (só se você aceitar):</strong> Google Analytics, para contar visitas e páginas mais vistas. Usa os cookies <code>_ga</code> e <code>_ga_*</code> (até 2 anos) e envia ao Google o endereço da página, o tipo de aparelho e um identificador aleatório. Ao recusar ou desligar, o script não carrega e esses cookies são apagados do nosso domínio.
          </li>
        ) : (
          <li>
            <strong>Estatísticas:</strong> hoje não usamos nenhuma ferramenta de análise de audiência. Se um dia usarmos, ela só vai funcionar depois que você aceitar, e esta página será atualizada.
          </li>
        )}
      </ul>
      <p className={p}>
        As fontes das letras são servidas pelo próprio site, sem pedir nada ao Google Fonts. Para mudar a sua escolha a qualquer momento, use o botão abaixo ou “Preferências de cookies” no rodapé.
      </p>
      <p className="mt-4">
        <LinkPreferenciasCookies className="inline-flex h-11 items-center rounded-full border-2 border-[#121212] px-5 text-sm font-semibold transition-colors hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2" />
      </p>

      <h2 className={h2}>Por quanto tempo guardamos</h2>
      <p className={p}>
        Dados de pedidos e pagamentos: pelo tempo necessário para entregar, dar garantia e atendimento e cumprir as obrigações fiscais e legais. Dados da conta: até você excluir a conta ou pedir a exclusão. Registros de segurança: apagados sozinhos em cerca de um dia.
      </p>

      <h2 className={h2}>Seus direitos e como pedir a exclusão</h2>
      <p className={p}>Pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), você pode pedir:</p>
      <ul className={ul}>
        <li>confirmação de que tratamos seus dados e acesso a eles;</li>
        <li>correção de dados incompletos ou desatualizados;</li>
        <li>exclusão dos dados que não precisamos guardar por obrigação legal;</li>
        <li>informação sobre com quem compartilhamos;</li>
        <li>retirada de um consentimento que você tenha dado.</li>
      </ul>
      <ul className={ul}>
        <li>
          <strong>Tem conta?</strong> Em <Link href="/loja/conta" className={link}>Minha conta</Link> você corrige nome e telefone e usa “Excluir minha conta”, que apaga o acesso e os dados da conta na hora. Se você entrou com o Google e não tem senha, crie uma em <Link href="/loja/conta/esqueci" className={link}>Esqueci minha senha</Link> ou peça a exclusão pelo e-mail.
        </li>
        <li>
          <strong>Para qualquer outro pedido</strong>, escreva para{" "}
          <a className={link} href={`mailto:${EMPRESA.email}?subject=Meus%20dados%20(LGPD)`}>{EMPRESA.email}</a> com o assunto “Meus dados (LGPD)”, usando o e-mail do pedido ou da conta. Podemos pedir uma confirmação de identidade antes de entregar ou apagar dados. Pedidos já feitos continuam registrados enquanto a lei fiscal exigir.
        </li>
      </ul>
      <p className={p}>Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <h2 className={h2}>Segurança</h2>
      <p className={p}>
        O site usa conexão criptografada (HTTPS), a área da equipe exige login com permissões por função, senhas ficam embaralhadas e as consultas públicas têm limite de tentativas. Nenhum sistema é totalmente imune; se houver um incidente que afete você, avisaremos como a lei determina.
      </p>

      <h2 className={h2}>Mudanças nesta página</h2>
      <p className={p}>Quando algo mudar, atualizamos o texto e a versão no topo.</p>
    </PaginaPolitica>
  );
}
