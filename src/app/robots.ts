import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Diz ao Google o que pode aparecer na busca: o painel, o login e as APIs ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/login", "/api/", "/loja/carrinho", "/loja/obrigado"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
