// Escolha da pessoa sobre cookies e armazenamento do navegador. Fica guardada só no próprio navegador.
//
// Categorias:
//  - essenciais: sempre ligadas (login, carrinho, segurança). Não dependem de escolha.
//  - preferencias: opcional, começa DESLIGADA. Hoje serve só para lembrar o tema claro/escuro.
// O site não usa cookies de publicidade nem de análise. Se um dia usar, crie uma categoria nova aqui e só
// carregue o script depois de `lerConsentimento()?.<categoria> === true`.

export const CHAVE_COOKIES = "heelcloth-cookies";
export const CHAVE_TEMA = "heelcloth-tema";
export const EVENTO_ABRIR_COOKIES = "heel:abrir-cookies";
export const EVENTO_COOKIES_MUDOU = "heel:cookies-mudou";

export interface Consentimento {
  v: 1;
  preferencias: boolean;
  em: string;
}

export function lerConsentimento(): Consentimento | null {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_COOKIES) || "null") as Consentimento | null;
    return c && c.v === 1 && typeof c.preferencias === "boolean" ? c : null;
  } catch {
    return null;
  }
}

export const preferenciasPermitidas = (): boolean => lerConsentimento()?.preferencias === true;

export function gravarConsentimento(preferencias: boolean): void {
  try {
    localStorage.setItem(CHAVE_COOKIES, JSON.stringify({ v: 1, preferencias, em: new Date().toISOString() } satisfies Consentimento));
    // Recusou ou desligou: apaga o que já tinha sido guardado nessa categoria.
    if (!preferencias) localStorage.removeItem(CHAVE_TEMA);
  } catch {
    /* navegador sem armazenamento: a escolha vale só nesta visita */
  }
  window.dispatchEvent(new Event(EVENTO_COOKIES_MUDOU));
}

export const abrirPreferenciasCookies = () => window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES));
