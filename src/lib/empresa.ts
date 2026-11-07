// Dados fixos da empresa, usados no rodapé e nas páginas Institucional e Dúvidas da loja.
export const EMPRESA = {
  nome: "Heel Cloth",
  // Frase que aparece embaixo da logo no rodapé.
  frase: "Confecção de Itaúna (MG): uniformes personalizados por sublimação e camisas com identidade própria, enviados para todo o Brasil.",
  whatsapp: "37 99825-3735",
  whatsappLink: "https://wa.me/5537998253735",
  email: "heel.clths.sublimacao@gmail.com",
  endereco: "R. Antônio de Matos, 171 - Centro, Itaúna - MG, 35680-030",
  enderecoMapa: "https://www.google.com/maps/search/?api=1&query=R.+Ant%C3%B4nio+de+Matos%2C+171+-+Centro%2C+Ita%C3%BAna+-+MG%2C+35680-030",
  horario: "Segunda a sexta: 09h às 18h e sábado: 09h às 13h",
  instagram: "heelclothingoficial",
  instagramLink: "https://www.instagram.com/heelclothingoficial/",
} as const;

// Fotos da faixa do Instagram (página inicial). Ficam em public/instagram/. Para trocar, substitua o arquivo
// mantendo o nome, ou mude a lista abaixo.
export const FOTOS_INSTAGRAM = [
  { arquivo: "caramelo.webp", alt: "Camiseta caramelo Heel Clothing, modelo de lado diante da vitrine da loja" },
  { arquivo: "verde.webp", alt: "Camiseta verde com a prancha bordada, modelo sorrindo na frente da loja" },
  { arquivo: "azul.webp", alt: "Camiseta azul royal com a prancha Heel Clothing estampada, ao ar livre" },
  { arquivo: "rosa.webp", alt: "Camiseta rosa claro com a logo Heel Clothing, ao ar livre" },
  { arquivo: "preta.webp", alt: "Camiseta preta com a logo circular Heel Clothing, com bermuda jeans" },
  { arquivo: "bege.webp", alt: "Camiseta bege mescla com a prancha estampada em letras Heel Clothing" },
] as const;

// Formas de pagamento e envio realmente usadas pela loja (Pix pelo Mercado Pago; frete fixo e retirada).
// Para trocar o texto por logo oficial, ponha o arquivo em public/pagamento/ e informe "logo": "pix.svg".
export const FORMAS_PAGAMENTO: { nome: string; logo?: string }[] = [
  { nome: "Pix" },
  { nome: "Mercado Pago" },
];
