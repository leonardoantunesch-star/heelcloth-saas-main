import React from "react";

// A loja da Heel não define estas variáveis; a área da conta usa as abaixo (visual reto, como o resto da loja).
export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ "--lj-borda": "rgba(0,0,0,0.2)", "--lj-mudo": "#555555", "--lj-suave": "#f3f3f3", "--lj-pri-txt": "#ffffff", "--lj-r": "0px" } as React.CSSProperties}>
      <style>{".lj-titulo{font-weight:800;text-transform:uppercase;letter-spacing:-0.01em}"}</style>
      {children}
    </div>
  );
}
