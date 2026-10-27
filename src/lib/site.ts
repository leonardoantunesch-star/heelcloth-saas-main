// Dados do site usados no Google (título, endereço, sitemap, dados estruturados).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://heelclothing.com.br").replace(/\/+$/, "");
export const SITE_NOME = "Heel Cloth";
export const SITE_TITULO = "Heel Cloth | Uniformes personalizados e roupas esportivas em Itaúna - MG";
export const SITE_DESCRICAO =
  "Heel Cloth: uniformes esportivos personalizados por sublimação (camisas, shorts e meiões para times, com nome e número) e loja online de roupas esportivas. Itaúna - MG, entrega para todo o Brasil.";
export const SITE_ENDERECO = {
  rua: "R. Antônio de Matos, 171",
  bairro: "Centro",
  cidade: "Itaúna",
  estado: "MG",
};
