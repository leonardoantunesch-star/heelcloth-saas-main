// Tamanhos de camisa disponíveis no pedido.
// Os códigos (valor) são os mesmos usados na versão estática (public/index.html) e no painel,
// então pedidos antigos e novos continuam compatíveis.

export type GrupoTamanho = "infantil" | "babylook" | "adulto";

export interface TamanhoCamisa {
  valor: string;
  rotulo: string; // texto curto da bolinha
  nome: string; // texto completo (leitor de tela, dica e resumo)
  grupo: GrupoTamanho;
}

export const GRUPOS: { id: GrupoTamanho; titulo: string }[] = [
  { id: "infantil", titulo: "Infantil" },
  { id: "babylook", titulo: "Baby look" },
  { id: "adulto", titulo: "Adulto" },
];

// A ordem é: infantil, baby look e adulto. O seletor abre já rolado até os adultos.
export const TAMANHOS_CAMISA: TamanhoCamisa[] = [
  ...["2", "4", "6", "8", "10", "12", "14"].map((n) => ({
    valor: n,
    rotulo: n,
    nome: `Infantil ${n}`,
    grupo: "infantil" as const,
  })),
  ...["P", "M", "G", "GG"].map((t) => ({
    valor: `${t}BABYLOOK`,
    rotulo: t,
    nome: `${t} baby look`,
    grupo: "babylook" as const,
  })),
  ...["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4"].map((t) => ({
    valor: t,
    rotulo: t,
    nome: t,
    grupo: "adulto" as const,
  })),
  { valor: "G5", rotulo: "G5", nome: "G5 extra", grupo: "adulto" },
];

export function nomeDoTamanho(valor: string): string {
  return TAMANHOS_CAMISA.find((t) => t.valor === valor)?.nome ?? valor;
}

// Texto que cabe no botão da tabela de jogadores.
export function rotuloCurto(valor: string): string {
  const t = TAMANHOS_CAMISA.find((x) => x.valor === valor);
  if (!t) return valor;
  if (t.grupo === "babylook") return `${t.rotulo} baby`;
  if (t.grupo === "infantil") return `${t.rotulo} inf.`;
  return t.valor === "G5" ? "G5 extra" : t.rotulo;
}
