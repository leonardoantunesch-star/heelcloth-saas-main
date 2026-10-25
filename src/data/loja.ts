import { z } from "zod";

// Loja online HEEL CLOTH. — tipos, validação e valores de partida.
// Tudo fica salvo numa linha da tabela Setting ("loja") e é editado pelo painel em /admin/loja.
// Este arquivo é usado tanto no navegador quanto no servidor (não importe nada de servidor aqui).

export const ID_IMAGEM_LOJA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const imagem = z.string().regex(ID_IMAGEM_LOJA).nullable();
const cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use o formato #000000).");
const id = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/, "Código inválido.");
const txt = (max: number) => z.string().trim().max(max);
const preco = z.number().min(0).max(100000);

export const tamanhoSchema = z.object({
  nome: z.string().trim().min(1, "Todo tamanho precisa de um nome.").max(12),
  estoque: z.number().int().min(0).max(100000),
});

export const produtoSchema = z.object({
  id,
  nome: z.string().trim().min(1, "Todo produto precisa de um nome.").max(100),
  descricao: txt(2000),
  categoriaId: z.string().max(80),
  preco,
  precoPromo: preco.nullable(),
  imagens: z.array(z.string().regex(ID_IMAGEM_LOJA)).max(8),
  cor: txt(40),
  tamanhos: z.array(tamanhoSchema).max(20),
  lancamento: z.boolean(),
  destaque: z.boolean(),
  visivel: z.boolean(),
  criadoEm: z.number().int(),
});

export const categoriaSchema = z.object({
  id,
  nome: z.string().trim().min(1, "Toda categoria precisa de um nome.").max(40),
  imagem,
  visivel: z.boolean(),
});

export const bannerSchema = z.object({
  id,
  titulo: txt(80),
  subtitulo: txt(160),
  botao: txt(30),
  link: txt(200),
  imagem,
  textoClaro: z.boolean(), // texto branco (para fotos escuras)
  visivel: z.boolean(),
});

export const blocoSchema = z.object({
  id,
  titulo: txt(40),
  link: txt(200),
  imagem,
});

export const configSchema = z.object({
  aberta: z.boolean(),
  marca: z.object({ nome: z.string().trim().min(1).max(40), logo: imagem, slogan: txt(120) }),
  cores: z.object({ primaria: cor, destaque: cor, fundo: cor, texto: cor }),
  faixa: z.array(txt(90)).max(6),
  banners: z.array(bannerSchema).max(6),
  blocos: z.array(blocoSchema).max(8),
  textos: z.object({
    lancamentos: txt(40),
    destaques: txt(40),
    promocoes: txt(40),
    sobreTitulo: txt(80),
    sobre: txt(1200),
  }),
  contato: z.object({
    whatsapp: txt(20),
    email: txt(120),
    instagram: txt(60),
    endereco: txt(200),
    cnpj: txt(30),
  }),
  frete: z.object({
    valor: preco,
    gratisAcima: preco.nullable(),
    retirada: z.boolean(),
    prazo: txt(80),
  }),
  pagamento: z.object({ parcelasMax: z.number().int().min(1).max(12) }),
});

export const lojaSchema = z.object({
  config: configSchema,
  categorias: z.array(categoriaSchema).max(30),
  produtos: z.array(produtoSchema).max(500),
});

export type Tamanho = z.infer<typeof tamanhoSchema>;
export type ProdutoLoja = z.infer<typeof produtoSchema>;
export type CategoriaLoja = z.infer<typeof categoriaSchema>;
export type BannerLoja = z.infer<typeof bannerSchema>;
export type BlocoLoja = z.infer<typeof blocoSchema>;
export type ConfigLoja = z.infer<typeof configSchema>;
export type Loja = z.infer<typeof lojaSchema>;

export const urlImagemLoja = (id: string) => `/api/loja/imagem/${id}`;

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const precoFinal = (p: Pick<ProdutoLoja, "preco" | "precoPromo">) =>
  p.precoPromo !== null && p.precoPromo > 0 && p.precoPromo < p.preco ? p.precoPromo : p.preco;

export const emPromocao = (p: Pick<ProdutoLoja, "preco" | "precoPromo">) => precoFinal(p) < p.preco;

export const estoqueTotal = (p: Pick<ProdutoLoja, "tamanhos">) => p.tamanhos.reduce((s, t) => s + t.estoque, 0);

export function calcularFrete(config: ConfigLoja, subtotal: number, retirada: boolean) {
  if (retirada && config.frete.retirada) return 0;
  if (config.frete.gratisAcima !== null && subtotal >= config.frete.gratisAcima) return 0;
  return config.frete.valor;
}

export function criarId(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${base || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}

const TAMANHOS_ROUPA = ["P", "M", "G", "GG"].map((nome) => ({ nome, estoque: 10 }));

// Valores de partida: a loja começa fechada, com produtos de exemplo para você ver o layout.
// Apague os exemplos e cadastre os seus antes de abrir a loja.
export const LOJA_PADRAO: Loja = {
  config: {
    aberta: false,
    marca: { nome: "HEEL CLOTH.", logo: null, slogan: "Roupas esportivas e casuais." },
    cores: { primaria: "#121212", destaque: "#c8102e", fundo: "#ffffff", texto: "#121212" },
    faixa: ["Frete grátis acima de R$ 299", "Parcele em até 6x no cartão", "Pague com Pix, cartão ou boleto"],
    banners: [
      {
        id: "banner-principal",
        titulo: "Nova coleção",
        subtitulo: "Peças pensadas para treinar, jogar e viver o dia a dia.",
        botao: "Ver lançamentos",
        link: "/loja/novidades",
        imagem: null,
        textoClaro: true,
        visivel: true,
      },
    ],
    blocos: [
      { id: "bloco-camisetas", titulo: "Camisetas", link: "/loja/categoria/camisetas", imagem: null },
      { id: "bloco-shorts", titulo: "Shorts", link: "/loja/categoria/shorts", imagem: null },
      { id: "bloco-agasalhos", titulo: "Agasalhos", link: "/loja/categoria/agasalhos", imagem: null },
      { id: "bloco-acessorios", titulo: "Acessórios", link: "/loja/categoria/acessorios", imagem: null },
    ],
    textos: {
      lancamentos: "Lançamentos",
      destaques: "Mais vendidos",
      promocoes: "Ofertas",
      sobreTitulo: "Feito para quem vive o esporte",
      sobre:
        "A HEEL CLOTH. produz roupas esportivas com tecidos de alta performance e acabamento cuidadoso. Cada peça é pensada para durar dentro e fora de campo.",
    },
    contato: { whatsapp: "", email: "", instagram: "", endereco: "", cnpj: "" },
    frete: { valor: 25, gratisAcima: 299, retirada: true, prazo: "Envio em até 3 dias úteis após a confirmação do pagamento." },
    pagamento: { parcelasMax: 6 },
  },
  categorias: [
    { id: "camisetas", nome: "Camisetas", imagem: null, visivel: true },
    { id: "shorts", nome: "Shorts", imagem: null, visivel: true },
    { id: "agasalhos", nome: "Agasalhos", imagem: null, visivel: true },
    { id: "acessorios", nome: "Acessórios", imagem: null, visivel: true },
  ],
  produtos: [
    { id: "exemplo-camiseta-dry", nome: "Camiseta Dry Essential (exemplo)", categoriaId: "camisetas", preco: 89.9, precoPromo: null, cor: "Preto", lancamento: true, destaque: true },
    { id: "exemplo-camiseta-treino", nome: "Camiseta Treino (exemplo)", categoriaId: "camisetas", preco: 79.9, precoPromo: 59.9, cor: "Branco", lancamento: false, destaque: true },
    { id: "exemplo-short-run", nome: "Short Run (exemplo)", categoriaId: "shorts", preco: 69.9, precoPromo: null, cor: "Preto", lancamento: true, destaque: false },
    { id: "exemplo-jaqueta", nome: "Jaqueta Corta-vento (exemplo)", categoriaId: "agasalhos", preco: 219.9, precoPromo: 179.9, cor: "Grafite", lancamento: true, destaque: true },
    { id: "exemplo-meiao", nome: "Meião Performance (exemplo)", categoriaId: "acessorios", preco: 29.9, precoPromo: null, cor: "Branco", lancamento: false, destaque: true },
  ].map((p, i) => ({
    ...p,
    descricao: "Produto de exemplo. Edite ou apague no painel em Admin → Loja → Produtos.",
    imagens: [],
    tamanhos: p.categoriaId === "acessorios" ? [{ nome: "Único", estoque: 20 }] : TAMANHOS_ROUPA,
    visivel: true,
    criadoEm: 1767225600000 - i,
  })),
};
