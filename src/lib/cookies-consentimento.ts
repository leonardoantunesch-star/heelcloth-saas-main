// Escolha da pessoa sobre cookies e armazenamento do navegador. Fica guardada só no próprio navegador.
//
// Categorias:
//  - essenciais: sempre ligadas (login, carrinho, segurança). Não dependem de escolha.
//  - preferencias: opcional, começa DESLIGADA. Lembra o tema claro/escuro.
//  - estatisticas: opcional, começa DESLIGADA. Só existe quando NEXT_PUBLIC_GA_ID está configurado na Vercel
//    (Google Analytics 4, id no formato G-XXXXXXX). Sem o id, nenhum script de análise é carregado.
// O site não usa cookies de publicidade.

export const CHAVE_COOKIES = "heelcloth-cookies";
export const CHAVE_TEMA = "heelcloth-tema";
export const EVENTO_ABRIR_COOKIES = "heel:abrir-cookies";
export const EVENTO_COOKIES_MUDOU = "heel:cookies-mudou";

// Id do Google Analytics (público, vai no HTML). Só aceita o formato oficial, para não injetar nada estranho.
const idBruto = (process.env.NEXT_PUBLIC_GA_ID || "").trim();
export const GA_ID = /^G-[A-Z0-9]{4,16}$/.test(idBruto) ? idBruto : "";

export interface Consentimento {
  v: 1;
  preferencias: boolean;
  estatisticas?: boolean;
  em: string;
}

export function lerConsentimento(): Consentimento | null {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_COOKIES) || "null") as Consentimento | null;
    if (!c || c.v !== 1 || typeof c.preferencias !== "boolean") return null;
    // Categoria nova (estatísticas) que a pessoa ainda não viu: pergunta de novo.
    if (GA_ID && typeof c.estatisticas !== "boolean") return null;
    return c;
  } catch {
    return null;
  }
}

export const preferenciasPermitidas = (): boolean => lerConsentimento()?.preferencias === true;
export const estatisticasPermitidas = (): boolean => Boolean(GA_ID) && lerConsentimento()?.estatisticas === true;

// Apaga os cookies do Google Analytics do nosso domínio (eles são gravados no domínio principal).
export function apagarCookiesAnalytics(): void {
  try {
    const nomes = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid");
    const partes = location.hostname.split(".");
    const dominios = [""];
    for (let i = 0; i < partes.length - 1; i++) dominios.push(partes.slice(i).join("."));
    for (const n of nomes) for (const d of dominios) document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=.${d}` : ""}`;
  } catch {
    /* sem acesso a cookies */
  }
}

export function gravarConsentimento(escolha: { preferencias: boolean; estatisticas: boolean }): void {
  const estatisticas = Boolean(GA_ID) && escolha.estatisticas;
  try {
    localStorage.setItem(CHAVE_COOKIES, JSON.stringify({ v: 1, preferencias: escolha.preferencias, estatisticas, em: new Date().toISOString() } satisfies Consentimento));
    // Recusou ou desligou: apaga o que já tinha sido guardado em cada categoria.
    if (!escolha.preferencias) localStorage.removeItem(CHAVE_TEMA);
  } catch {
    /* navegador sem armazenamento: a escolha vale só nesta visita */
  }
  if (!estatisticas) apagarCookiesAnalytics();
  window.dispatchEvent(new Event(EVENTO_COOKIES_MUDOU));
}

export const abrirPreferenciasCookies = () => window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES));
