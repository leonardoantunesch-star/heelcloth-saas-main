/**
 * Regras de precificação, cálculo de orçamento e geração de protocolo
 * Portado e tipado a partir de netlify/lib/comum.mjs
 */

export interface TabelaPrecos {
  camisa: number;
  camisa_punho: number;
  camisa_text: number;
  manga_longa: number;
  short: number;
  short_text: number;
  camisa_dry: number;
  short_dry: number;
  meiao: number;
  [key: string]: number;
}

export const PRECOS_PADRAO: TabelaPrecos = {
  camisa: 44.9,
  camisa_punho: 49.9,
  camisa_text: 59.9,
  manga_longa: 20,
  short: 24.9,
  short_text: 34.9,
  camisa_dry: 41.9, // camisa dry-fit
  short_dry: 21.9, // calção dry-fit
  // VALOR PROVISÓRIO: confirme o preço do par de meiões e ajuste aqui (muda no pedido, no catálogo e na cotação).
  meiao: 15,
};

// Cores de meião disponíveis no pedido.
export const CORES_MEIAO = [
  { valor: "branco", rotulo: "Branco", hex: "#ffffff" },
  { valor: "preto", rotulo: "Preto", hex: "#121212" },
  { valor: "azul", rotulo: "Azul", hex: "#1d4ed8" },
  { valor: "verde", rotulo: "Verde", hex: "#15803d" },
  { valor: "vermelho", rotulo: "Vermelho", hex: "#dc2626" },
] as const;
export type CorMeiao = (typeof CORES_MEIAO)[number]["valor"];

export const OPCOES_DISPONIVEIS = ["texturizada", "dryfit", "manga_longa", "punhos"] as const;
export type OpcaoItem = (typeof OPCOES_DISPONIVEIS)[number];

export const STATUS_FLUXO = [
  "Orçamento",
  "Aguardando aprovação",
  "Aprovado",
  "Pagamento pendente",
  "Pagamento confirmado",
  "Em produção",
  "Controle de qualidade",
  "Pronto",
  "Entregue",
  "Concluído",
  "Cancelado",
  "Em atraso",
  "Aguardando alteração",
] as const;

export type StatusPedido = (typeof STATUS_FLUXO)[number];

export interface ItemPedidoOrcamento {
  nome?: string;
  numero?: string;
  tamCamisa?: string;
  tamShort?: string;
  goleiro?: boolean;
  meiao?: string; // cor do meião ("" = sem meião)
  opcoes?: string[];
  obs?: string;
}

export interface LinhaOrcamento {
  d: string;
  v: number;
  combinar?: boolean;
}

export interface ResultadoOrcamento {
  linhas: LinhaOrcamento[];
  total: number;
  aCombinar: boolean;
  // subtotais por tipo de peça (para gravar o pedido por linha)
  totais: { camisas: number; shorts: number; meioes: number };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function calcularOrcamento(
  precos: TabelaPrecos,
  itens: ItemPedidoOrcamento[],
  padraoOpcoes: string[] = []
): ResultadoOrcamento {
  const pl = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural);
  const brl = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cam: Record<string, { f: { tex: boolean; dry: boolean; pun: boolean; man: boolean }; n: number }> = {};
  const sho: Record<string, { tex: boolean; dry: boolean; n: number }> = {};
  const mei: Record<string, number> = {};
  const linhas: LinhaOrcamento[] = [];

  const extrairFlags = (i: ItemPedidoOrcamento) => {
    const o = Array.isArray(i.opcoes) ? i.opcoes : padraoOpcoes;
    const tex = o.includes("texturizada");
    return {
      tex,
      // dry-fit e textura são tecidos diferentes: se vier os dois, vale a textura
      dry: o.includes("dryfit") && !tex,
      pun: o.includes("punhos"),
      man: o.includes("manga_longa"),
    };
  };

  for (const i of itens) {
    const f = extrairFlags(i);
    // Na camisa texturizada os punhos personalizados já estão inclusos
    f.pun = f.pun && !f.tex;

    if (i.tamCamisa) {
      const k = (f.tex ? "1" : "0") + (f.dry ? "1" : "0") + (f.pun ? "1" : "0") + (f.man ? "1" : "0");
      if (!cam[k]) {
        cam[k] = { f, n: 0 };
      }
      cam[k].n++;
    }

    if (i.meiao) {
      mei[i.meiao] = (mei[i.meiao] || 0) + 1;
    }

    if (i.tamShort) {
      const k = f.tex ? "t" : f.dry ? "d" : "p";
      if (!sho[k]) {
        sho[k] = { tex: f.tex, dry: f.dry, n: 0 };
      }
      sho[k].n++;
    }
  }

  // Linhas das camisas
  for (const k of Object.keys(cam).sort()) {
    const { f, n } = cam[k];
    const mangaOk = (precos.manga_longa ?? 0) > 0;
    const precoBase = f.tex ? precos.camisa_text : f.dry ? precos.camisa_dry : precos.camisa;
    const adicionalPunho = f.pun ? precos.camisa_punho - precos.camisa : 0;
    const adicionalManga = f.man && mangaOk ? precos.manga_longa : 0;
    const unit = r2(precoBase + adicionalPunho + adicionalManga);
    const combinar = f.man && !mangaOk;

    const descTipo = f.tex
      ? `${pl(n, "texturizada", "texturizadas")} (punhos inclusos)`
      : f.dry
        ? "dry-fit"
        : "tecido padrão";
    const descPunho = f.pun ? " com punhos personalizados" : "";
    const descManga = f.man ? " manga longa" : "";
    const descCombinar = combinar ? " (manga longa a combinar)" : "";

    linhas.push({
      d: `${n} ${pl(n, "camisa", "camisas")} ${descTipo}${descPunho}${descManga} × ${brl(unit)}${descCombinar}`,
      v: r2(n * unit),
      combinar,
    });
  }

  const indiceCamisas = linhas.length;

  // Linhas dos shorts
  for (const k of Object.keys(sho).sort()) {
    const { tex, dry, n } = sho[k];
    const precoShort = tex ? precos.short_text : dry ? precos.short_dry : precos.short;
    linhas.push({
      d: `${n} ${pl(n, "short", "shorts")}${tex ? " texturizado" + (n === 1 ? "" : "s") : dry ? " dry-fit" : ""} × ${brl(precoShort)}`,
      v: r2(n * precoShort),
    });
  }

  const indiceShorts = linhas.length;

  // Linhas dos meiões (uma por cor)
  const precoMeiao = precos.meiao ?? 0;
  for (const cor of CORES_MEIAO) {
    const n = mei[cor.valor];
    if (!n) continue;
    linhas.push({
      d: `${n} ${pl(n, "meião", "meiões")} ${cor.rotulo.toLowerCase()} × ${brl(precoMeiao)}`,
      v: r2(n * precoMeiao),
    });
  }

  const soma = (de: number, ate: number) => r2(linhas.slice(de, ate).reduce((acc, l) => acc + l.v, 0));
  const totais = {
    camisas: soma(0, indiceCamisas),
    shorts: soma(indiceCamisas, indiceShorts),
    meioes: soma(indiceShorts, linhas.length),
  };
  const total = r2(linhas.reduce((acc, l) => acc + l.v, 0));
  const aCombinar = linhas.some((l) => l.combinar);

  return { linhas, total, aCombinar, totais };
}

const ALFABETO_PROTOCOLO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarProtocolo(data: Date = new Date()): string {
  const ym = data.toISOString().slice(0, 7); // YYYY-MM
  const randomBytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 4; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let sufixo = "";
  for (const b of randomBytes) {
    sufixo += ALFABETO_PROTOCOLO[b % 32];
  }

  return `HC-${ym.slice(2, 4)}${ym.slice(5, 7)}-${sufixo}`;
}
