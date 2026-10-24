// Chave usada para assinar a sessão. Fica separada do auth.ts para poder ser usada também no middleware.
// Em produção ela precisa vir da variável de ambiente JWT_SECRET (mínimo de 16 caracteres).
// Só em desenvolvimento local existe uma chave de teste.
export const JWT_SECRET_AUSENTE = "JWT_SECRET_AUSENTE";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(JWT_SECRET_AUSENTE);
  }
  return "chave-apenas-para-desenvolvimento-local";
}
