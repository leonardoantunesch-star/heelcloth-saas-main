import type { Metadata } from "next";
import React from "react";

// A página de login não deve aparecer no Google.
export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
