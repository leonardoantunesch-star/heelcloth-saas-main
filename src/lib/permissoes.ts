// Quem pode abrir cada área do painel. É a fonte única: o menu lateral e a página Equipe leem daqui.

export type Perfil = "ADMIN" | "PRODUCAO" | "FINANCEIRO" | "VENDEDOR";

export const PERFIS: Perfil[] = ["ADMIN", "PRODUCAO", "FINANCEIRO", "VENDEDOR"];

export const PERFIL_INFO: Record<Perfil, { nome: string; resumo: string }> = {
  ADMIN: { nome: "Administrador", resumo: "Acesso total: configurações, equipe, notas fiscais e tudo dos outros perfis." },
  VENDEDOR: { nome: "Vendedor", resumo: "Pedidos, orçamentos, clientes, loja online, catálogo e WhatsApp." },
  PRODUCAO: { nome: "Produção", resumo: "Fila de produção, CorelDRAW, estoque e WhatsApp." },
  FINANCEIRO: { nome: "Financeiro", resumo: "Financeiro, relatórios e Analytics (faturamento e vendas)." },
};

export const ehPerfil = (v: unknown): v is Perfil => typeof v === "string" && (PERFIS as string[]).includes(v);

export interface Area {
  titulo: string;
  href: string;
  // Sem "perfis" = qualquer pessoa com login.
  perfis?: Perfil[];
  // "equipe" aparece na região "Equipe e Analytics" do menu.
  grupo: "principal" | "equipe";
}

export const AREAS: Area[] = [
  { titulo: "Dashboard", href: "/admin/dashboard", grupo: "principal" },
  { titulo: "Pedidos", href: "/admin/pedidos", grupo: "principal" },
  { titulo: "Orçamentos", href: "/admin/orcamentos", perfis: ["ADMIN", "VENDEDOR"], grupo: "principal" },
  { titulo: "Cotação", href: "/admin/cotacao", perfis: ["ADMIN", "VENDEDOR"], grupo: "principal" },
  { titulo: "Loja online", href: "/admin/loja", perfis: ["ADMIN", "VENDEDOR"], grupo: "principal" },
  { titulo: "Catálogo", href: "/admin/catalogo", perfis: ["ADMIN", "VENDEDOR"], grupo: "principal" },
  { titulo: "Clientes", href: "/admin/clientes", perfis: ["ADMIN", "VENDEDOR"], grupo: "principal" },
  { titulo: "Produção", href: "/admin/producao", perfis: ["ADMIN", "PRODUCAO"], grupo: "principal" },
  { titulo: "CorelDRAW", href: "/admin/coreldraw", perfis: ["ADMIN", "PRODUCAO"], grupo: "principal" },
  { titulo: "Estoque", href: "/admin/estoque", perfis: ["ADMIN", "PRODUCAO"], grupo: "principal" },
  { titulo: "Financeiro", href: "/admin/financeiro", perfis: ["ADMIN", "FINANCEIRO"], grupo: "principal" },
  { titulo: "NF-e Fiscal", href: "/admin/nfe", perfis: ["ADMIN"], grupo: "principal" },
  { titulo: "WhatsApp", href: "/admin/whatsapp", perfis: ["ADMIN", "PRODUCAO", "VENDEDOR"], grupo: "principal" },
  { titulo: "Configurações", href: "/admin/configuracoes", perfis: ["ADMIN"], grupo: "principal" },
  { titulo: "Equipe", href: "/admin/equipe", perfis: ["ADMIN"], grupo: "equipe" },
  { titulo: "Analytics", href: "/admin/analytics", perfis: ["ADMIN", "FINANCEIRO"], grupo: "equipe" },
  { titulo: "Relatórios", href: "/admin/relatorios", perfis: ["ADMIN", "FINANCEIRO"], grupo: "equipe" },
  { titulo: "Auditoria", href: "/admin/auditoria", perfis: ["ADMIN"], grupo: "equipe" },
];

export const podeAcessar = (perfil: string | undefined, area: Area): boolean =>
  !area.perfis || (perfil !== undefined && (area.perfis as string[]).includes(perfil));

export const areasDoPerfil = (perfil: string | undefined): Area[] => AREAS.filter((a) => podeAcessar(perfil, a));

// Quem vê números de dinheiro nos gráficos novos (faturamento, ticket médio).
export const verValores = (perfil: string | undefined): boolean => perfil === "ADMIN" || perfil === "FINANCEIRO";
