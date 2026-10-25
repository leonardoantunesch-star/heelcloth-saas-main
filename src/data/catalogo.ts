/**
 * ==============================================================================
 * HEELCLOTH — CATÁLOGO DE PRODUTOS (valores de partida)
 * ==============================================================================
 * Este arquivo traz o catálogo inicial. Fotos e modelos prontos são cadastrados pelo
 * painel de administração (aba "Catálogo") e ficam salvos no banco de dados.
 * Os preços vêm da tabela de preços do sistema (src/lib/orcamento.ts), então mudam juntos.
 * ==============================================================================
 */
import { PRECOS_PADRAO } from "@/lib/orcamento";

export type CategoriaCatalogo = "camisas" | "shorts" | "baby-infantil" | "acessorios";

// Um modelo pronto (desenho já feito pela Heelcloth) de uma peça do catálogo.
export interface ModeloCatalogo {
  id: string;
  nome: string;
  descricao: string;
  imagem: string | null; // id da imagem salva (veja /api/catalogo/imagem/[id])
}

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  categoria: CategoriaCatalogo;
  forma: "camisa" | "short" | "meiao";
  descricao: string;
  destaques: string[];
  precoChave: string; // chave na tabela de preços (PRECOS_PADRAO)
  precoPrefixo?: string; // ex: "a partir de"
  imagem: string | null; // id da foto do produto, se houver
  visivel: boolean;
  modelos: ModeloCatalogo[];
}

// O que a página recebe: o produto já com o preço calculado.
export type ProdutoPublico = ProdutoCatalogo & { preco: number };

export const CATEGORIAS_CATALOGO: { id: "todos" | CategoriaCatalogo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "camisas", rotulo: "Camisas" },
  { id: "shorts", rotulo: "Shorts" },
  { id: "baby-infantil", rotulo: "Baby look e infantil" },
  { id: "acessorios", rotulo: "Meiões" },
];

export function comPreco(p: ProdutoCatalogo): ProdutoPublico {
  return { ...p, preco: PRECOS_PADRAO[p.precoChave] ?? 0 };
}

export const PRODUTOS_PADRAO: ProdutoCatalogo[] = [
  {
    id: "camisa-jogo",
    nome: "Camisa de jogo",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Sublimação completa com o desenho do seu time, nome e número nas costas.",
    destaques: ["PP ao G5", "Nome e número", "Manga curta"],
    precoChave: "camisa",
    precoPrefixo: "a partir de",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "camisa-punho",
    nome: "Camisa com punho",
    categoria: "camisas",
    forma: "camisa",
    descricao: "A camisa de jogo com punhos personalizados nas mangas.",
    destaques: ["Punhos personalizados", "PP ao G5"],
    precoChave: "camisa_punho",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "camisa-textura",
    nome: "Camisa texturizada",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Tecido com textura e acabamento diferenciado. Os punhos já vêm inclusos.",
    destaques: ["Punhos inclusos", "Tecido texturizado"],
    precoChave: "camisa_text",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "camisa-manga-longa",
    nome: "Manga longa",
    categoria: "camisas",
    forma: "camisa",
    descricao: "Qualquer camisa pode ser feita com manga longa. O valor abaixo é somado ao preço da camisa.",
    destaques: ["Adicional por camisa", "Para goleiros e frio"],
    precoChave: "manga_longa",
    precoPrefixo: "+",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "short",
    nome: "Short esportivo",
    categoria: "shorts",
    forma: "short",
    descricao: "Short combinando com a camisa do time. Pode ser pedido junto ou sozinho.",
    destaques: ["Infantil e adulto", "Pode pedir só o short"],
    precoChave: "short",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "short-textura",
    nome: "Short texturizado",
    categoria: "shorts",
    forma: "short",
    descricao: "O mesmo short, no tecido texturizado.",
    destaques: ["Tecido texturizado", "Infantil e adulto"],
    precoChave: "short_text",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "baby-look",
    nome: "Camisa baby look",
    categoria: "baby-infantil",
    forma: "camisa",
    descricao: "Modelagem feminina ajustada, com os mesmos acabamentos da camisa de jogo.",
    destaques: ["P ao GG", "Modelagem feminina"],
    precoChave: "camisa",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "infantil",
    nome: "Camisa infantil",
    categoria: "baby-infantil",
    forma: "camisa",
    descricao: "Para a garotada, dos tamanhos 2 ao 14, pelo mesmo preço da camisa de jogo.",
    destaques: ["Tamanhos 2 ao 14", "Nome e número"],
    precoChave: "camisa",
    imagem: null,
    visivel: true,
    modelos: [],
  },
  {
    id: "meiao",
    nome: "Meião",
    categoria: "acessorios",
    forma: "meiao",
    descricao: "Meião esportivo para fechar o uniforme. Escolha a cor de cada jogador na hora do pedido.",
    destaques: ["Branco", "Preto", "Azul", "Verde", "Vermelho"],
    precoChave: "meiao",
    imagem: null,
    visivel: true,
    modelos: [],
  },
];
