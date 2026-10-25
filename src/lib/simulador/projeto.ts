// Projeto do uniforme no simulador: tudo o que a pessoa pode editar.

export type Padrao = "liso" | "listras-v" | "listras-h" | "diagonal" | "metades" | "degrade";
export type TipoGola = "redonda" | "v";

export interface ProjetoUniforme {
  padrao: Padrao;
  listras: number; // quantidade de listras (padrões de listras)
  corBase: string;
  corDetalhe: string;
  corManga: string;
  corGola: string;
  corPunho: string;
  corTexto: string;
  gola: TipoGola;
  mangaLonga: boolean;
  nome: string;
  numero: string;
  numeroFrente: boolean;
  escudo: string | null; // imagem em data URL
  shortBase: string;
  shortFaixa: string;
  shortCos: string;
}

export const PROJETO_INICIAL: ProjetoUniforme = {
  padrao: "listras-v",
  listras: 10,
  corBase: "#f4f4f4",
  corDetalhe: "#121212",
  corManga: "#121212",
  corGola: "#121212",
  corPunho: "#121212",
  corTexto: "#c9a227",
  gola: "redonda",
  mangaLonga: false,
  nome: "SEU NOME",
  numero: "10",
  numeroFrente: true,
  escudo: null,
  shortBase: "#121212",
  shortFaixa: "#f4f4f4",
  shortCos: "#121212",
};

export interface ModeloPronto {
  id: string;
  nome: string;
  projeto: Partial<ProjetoUniforme>;
}

export const MODELOS_PRONTOS: ModeloPronto[] = [
  {
    id: "classico",
    nome: "Clássico",
    projeto: {
      padrao: "liso", corBase: "#ffffff", corDetalhe: "#1d4ed8", corManga: "#ffffff", corGola: "#1d4ed8",
      corPunho: "#1d4ed8", corTexto: "#1d4ed8", gola: "redonda", shortBase: "#1d4ed8", shortFaixa: "#ffffff", shortCos: "#1d4ed8",
    },
  },
  {
    id: "listrado",
    nome: "Listrado",
    projeto: {
      padrao: "listras-v", listras: 10, corBase: "#ffffff", corDetalhe: "#b91c1c", corManga: "#b91c1c", corGola: "#b91c1c",
      corPunho: "#b91c1c", corTexto: "#111111", gola: "v", shortBase: "#111111", shortFaixa: "#b91c1c", shortCos: "#b91c1c",
    },
  },
  {
    id: "noturno",
    nome: "Noturno",
    projeto: {
      padrao: "degrade", corBase: "#0b1020", corDetalhe: "#2a3b8f", corManga: "#0b1020", corGola: "#d4af37",
      corPunho: "#d4af37", corTexto: "#d4af37", gola: "redonda", shortBase: "#0b1020", shortFaixa: "#d4af37", shortCos: "#0b1020",
    },
  },
  {
    id: "faixa",
    nome: "Faixa",
    projeto: {
      padrao: "diagonal", corBase: "#15803d", corDetalhe: "#facc15", corManga: "#15803d", corGola: "#facc15",
      corPunho: "#facc15", corTexto: "#ffffff", gola: "v", shortBase: "#15803d", shortFaixa: "#facc15", shortCos: "#15803d",
    },
  },
  {
    id: "metades",
    nome: "Metades",
    projeto: {
      padrao: "metades", corBase: "#f97316", corDetalhe: "#111111", corManga: "#111111", corGola: "#ffffff",
      corPunho: "#ffffff", corTexto: "#ffffff", gola: "redonda", shortBase: "#111111", shortFaixa: "#f97316", shortCos: "#111111",
    },
  },
  {
    id: "retro",
    nome: "Retrô",
    projeto: {
      padrao: "listras-h", listras: 8, corBase: "#7c3aed", corDetalhe: "#fde68a", corManga: "#7c3aed", corGola: "#fde68a",
      corPunho: "#fde68a", corTexto: "#fde68a", gola: "v", shortBase: "#7c3aed", shortFaixa: "#fde68a", shortCos: "#fde68a",
    },
  },
];

export const PADROES: { id: Padrao; rotulo: string }[] = [
  { id: "liso", rotulo: "Liso" },
  { id: "listras-v", rotulo: "Listras verticais" },
  { id: "listras-h", rotulo: "Listras horizontais" },
  { id: "diagonal", rotulo: "Faixa diagonal" },
  { id: "metades", rotulo: "Metades" },
  { id: "degrade", rotulo: "Degradê" },
];

const NOME_PADRAO: Record<Padrao, string> = {
  liso: "liso",
  "listras-v": "listras verticais",
  "listras-h": "listras horizontais",
  diagonal: "faixa diagonal",
  metades: "metades",
  degrade: "degradê",
};

// Texto curto que vai junto com o pedido, para a confecção saber o que foi montado no simulador.
export function descreverProjeto(p: ProjetoUniforme): string {
  const partes = [
    `Modelo do simulador: camisa ${NOME_PADRAO[p.padrao]}${
      p.padrao === "listras-v" || p.padrao === "listras-h" ? ` (${p.listras})` : ""
    }, gola ${p.gola === "v" ? "em V" : "redonda"}, manga ${p.mangaLonga ? "longa" : "curta"}.`,
    `Cores da camisa: principal ${p.corBase}, secundária ${p.corDetalhe}, mangas ${p.corManga}, gola ${p.corGola}, punhos ${p.corPunho}, texto ${p.corTexto}.`,
    `Short: principal ${p.shortBase}, faixa ${p.shortFaixa}, cós ${p.shortCos}.`,
  ];
  if (p.nome.trim() || p.numero.trim())
    partes.push(`Nome/número de exemplo: ${p.nome.trim() || "-"} / ${p.numero.trim() || "-"}${p.numeroFrente ? " (número na frente)" : ""}.`);
  partes.push(p.escudo ? "Escudo enviado no simulador (enviar o arquivo pelo WhatsApp)." : "Sem escudo.");
  return partes.join(" ");
}

export const CHAVE_SIMULADOR = "heelcloth-simulador";
