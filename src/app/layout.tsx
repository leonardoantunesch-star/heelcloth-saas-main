import type { Metadata } from "next";
import "./globals.css";
import { TelaCarregamento } from "@/components/TelaCarregamento";
import { EfeitoToque } from "@/components/EfeitoToque";
import { SITE_DESCRICAO, SITE_ENDERECO, SITE_NOME, SITE_TITULO, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITULO, template: `%s | ${SITE_NOME}` },
  description: SITE_DESCRICAO,
  applicationName: SITE_NOME,
  keywords: [
    "Heel Cloth",
    "uniformes personalizados",
    "camisas sublimadas",
    "uniforme de futebol",
    "sublimação esportiva",
    "roupas esportivas",
    "Itaúna MG",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NOME,
    title: SITE_TITULO,
    description: SITE_DESCRICAO,
  },
  twitter: { card: "summary", title: SITE_TITULO, description: SITE_DESCRICAO },
  // Código de verificação do Google Search Console (opcional; veja o passo a passo).
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// Dados estruturados: ajudam o Google a entender que a Heel Cloth é uma empresa local.
const DADOS_EMPRESA = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: SITE_NOME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  description: SITE_DESCRICAO,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_ENDERECO.rua,
    addressLocality: SITE_ENDERECO.cidade,
    addressRegion: SITE_ENDERECO.estado,
    addressCountry: "BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes de desenhar a página, para não piscar. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('heelcloth-tema')==='escuro')document.documentElement.classList.add('tema-escuro')}catch(e){}",
          }}
        />
      </head>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DADOS_EMPRESA) }} />
        <TelaCarregamento />
        <EfeitoToque />
        {children}
      </body>
    </html>
  );
}
