import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
