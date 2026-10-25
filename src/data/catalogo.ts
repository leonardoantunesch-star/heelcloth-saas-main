/**
 * ==============================================================================
 * HEELCLOTH — CATÁLOGO DE PRODUTOS
 * ==============================================================================
 * Para trocar o desenho de exemplo por uma foto real:
 * 1. Coloque a foto em public/images/catalogo/ (ex: public/images/catalogo/camisa-jogo.jpg).
 * 2. No produto abaixo, troque  src: null  por  src: "/images/catalogo/camisa-jogo.jpg".
 * Os preços vêm da tabela de preços do sistema (src/lib/orcamento.ts), então mudam juntos.
 * ==============================================================================
 */
import { PRECOS_PADRAO } from "@/lib/orcamento";

export type CategoriaCatalogo = "camisas" | "shorts" | "baby-infantil";

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  categoria: CategoriaCatalogo;
  forma: "camisa" | "short";
  descricao: string;
  destaques: string[];
  preco: number;
  precoPrefixo?: string; // ex: "a partir de"
  src?: string | null;
}

export const CATEGORIAS_CATALOGO: { id: "todos" | CategoriaCatalogo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "camisas", rotulo: "Camisas" },
  { id: "shorts", rotulo: "Shorts" },
  { id: "baby-infantil", rotulo: "Baby look e infantil" },
];

export const PRODUTOS_CATALOGO: ProdutoCatalogo[] = [
  {
    id: "camisa-jogo",
    nome: "Camisa de jogo",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Sublimação completa com o desenho do seu time, nome e número nas costas.",
    destaques: ["PP ao G5", "Nome e número", "Manga curta"],
    preco: PRECOS_PADRAO.camisa,
    precoPrefixo: "a partir de",
    src: null,
  },
  {
    id: "camisa-punho",
    nome: "Camisa com punho",
    categoria: "camisas",
    forma: "camisa",
    descricao: "A camisa de jogo com punhos personalizados nas mangas.",
    destaques: ["Punhos personalizados", "PP ao G5"],
    preco: PRECOS_PADRAO.camisa_punho,
    src: null,
  },
  {
    id: "camisa-textura",
    nome: "Camisa texturizada",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Tecido com textura e acabamento diferenciado. Os punhos já vêm inclusos.",
    destaques: ["Punhos inclusos", "Tecido texturizado"],
    preco: PRECOS_PADRAO.camisa_text,
    src: null,
  },
  {
    id: "camisa-manga-longa",
    nome: "Manga longa",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Qualquer camisa pode ser feita com manga longa. O valor abaixo é somado ao preço da camisa.",
    destaques: ["Adicional por camisa", "Para goleiros e frio"],
    preco: PRECOS_PADRAO.manga_longa,
    precoPrefixo: "+",
    src: null,
  },
  {
    id: "short",
    nome: "Short esportivo",
    categoria: "shorts",
    forma: "short",
    descricao: "Short combinando com a camisa do time. Pode ser pedido junto ou sozinho.",
    destaques: ["Infantil e adulto", "Pode pedir só o short"],
    preco: PRECOS_PADRAO.short,
    src: null,
  },
  {
    id: "short-textura",
    nome: "Short texturizado",
    categoria: "shorts",
    forma: "short",
    descricao: "O mesmo short, no tecido texturizado.",
    destaques: ["Tecido texturizado", "Infantil e adulto"],
    preco: PRECOS_PADRAO.short_text,
    src: null,
  },
  {
    id: "baby-look",
    nome: "Camisa baby look",
    categoria: "baby-infantil",
    forma: "camisa",
    descricao: "Modelagem feminina ajustada, com os mesmos acabamentos da camisa de jogo.",
    destaques: ["P ao GG", "Modelagem feminina"],
    preco: PRECOS_PADRAO.camisa,
    src: null,
  },
  {
    id: "infantil",
    nome: "Camisa infantil",
    categoria: "baby-infantil",
    forma: "camisa",
    descricao: "Para a garotada, dos tamanhos 2 ao 14, pelo mesmo preço da camisa de jogo.",
    destaques: ["Tamanhos 2 ao 14", "Nome e número"],
    preco: PRECOS_PADRAO.camisa,
    src: null,
  },
];
