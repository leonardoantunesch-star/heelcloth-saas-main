// Dados do site usados no Google (título, endereço, sitemap, dados estruturados).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://heelclothing.com.br").replace(/\/+$/, "");
export const SITE_NOME = "Heel Cloth";
// ====== TÍTULOS (é aqui que se troca o título do site) ======
// Título geral: aparece em qualquer página que não tenha título próprio.
export const SITE_TITULO = "Heel Cloth | Camisas e Uniformes Personalizados - Itaúna MG";
// Título da página inicial (a loja).
export const TITULO_LOJA = "Heel Cloth | Loja de Camisas e Roupas Esportivas - Itaúna MG";
// Título da página de uniformes por sublimação (/sublimacao).
export const TITULO_SUBLIMACAO = "Heel Clothing | Uniformes Personalizados e Camisas de Time - Itaúna MG";
// Outros nomes pelos quais a marca é procurada.
export const SITE_NOMES_ALTERNATIVOS = ["Heel", "Heel Cloth", "Heel Clothing", "Heel Camisas", "Heel Itaúna", "Heel Eder Modas"];
export const SITE_DESCRICAO =
  "Heel Cloth (Heel Clothing, Heel Camisas, Heel Eder Modas) em Itaúna - MG: camisas e uniformes esportivos personalizados por sublimação, com nome e número, e loja online de roupas esportivas. Entrega para todo o Brasil.";
export const SITE_ENDERECO = {
  rua: "R. Antônio de Matos, 171",
  bairro: "Centro",
  cidade: "Itaúna",
  estado: "MG",
};
