import type { Metadata } from "next";
import "./globals.css";
import { TelaCarregamento } from "@/components/TelaCarregamento";
import { EfeitoToque } from "@/components/EfeitoToque";

export const metadata: Metadata = {
  title: "Heelcloth — SaaS de Gestão de Confecção",
  description: "Sistema integrado de gestão para confecção de camisas, uniformes e kits personalizados.",
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
        <TelaCarregamento />
        <EfeitoToque />
        {children}
      </body>
    </html>
  );
}
