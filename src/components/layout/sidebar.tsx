"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Layers,
  Package,
  DollarSign,
  Receipt,
  MessageSquare,
  BarChart3,
  UserCheck,
  Settings,
  Shirt,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminShell } from "./admin-shell-context";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingCart,
  },
  {
    title: "Orçamentos",
    href: "/admin/orcamentos",
    icon: FileText,
    roles: ["ADMIN", "VENDEDOR"],
  },
  {
    title: "Clientes",
    href: "/admin/clientes",
    icon: Users,
    roles: ["ADMIN", "VENDEDOR"],
  },
  {
    title: "Produção",
    href: "/admin/producao",
    icon: Layers,
    roles: ["ADMIN", "PRODUCAO"],
  },
  {
    title: "CorelDRAW",
    href: "/admin/coreldraw",
    icon: Shirt,
    roles: ["ADMIN", "PRODUCAO"],
  },
  {
    title: "Estoque",
    href: "/admin/estoque",
    icon: Package,
    roles: ["ADMIN", "PRODUCAO"],
  },
  {
    title: "Financeiro",
    href: "/admin/financeiro",
    icon: DollarSign,
    roles: ["ADMIN", "FINANCEIRO"],
  },
  {
    title: "NF-e Fiscal",
    href: "/admin/nfe",
    icon: Receipt,
    roles: ["ADMIN"],
  },
  {
    title: "WhatsApp",
    href: "/admin/whatsapp",
    icon: MessageSquare,
    roles: ["ADMIN", "PRODUCAO", "VENDEDOR"],
  },
  {
    title: "Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
    roles: ["ADMIN", "FINANCEIRO"],
  },
  {
    title: "Usuários",
    href: "/admin/usuarios",
    icon: UserCheck,
    roles: ["ADMIN"],
  },
  {
    title: "Auditoria",
    href: "/admin/auditoria",
    icon: Shield,
    roles: ["ADMIN"],
  },
  {
    title: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav, isCollapsed, toggleCollapse } = useAdminShell();
  const [userRole, setUserRole] = useState<string>("ADMIN");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.autenticado && data.usuario?.perfil) {
          setUserRole(data.usuario.perfil);
        }
      })
      .catch(() => {});
  }, []);

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isMobile ? closeMobileNav : undefined}
            title={isCollapsed && !isMobile ? item.title : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all select-none min-h-[42px]",
              isActive
                ? "bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-100/60"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
          >
            <Icon
              className={cn(
                "h-4.5 w-4.5 shrink-0 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            {(!isCollapsed || isMobile) && <span className="truncate">{item.title}</span>}
            {(!isCollapsed || isMobile) && item.badge && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Drawer Overlay & Sidebar (< 1024px) */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-opacity duration-300",
          isMobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300",
            isMobileNavOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobileNav}
          aria-hidden="true"
        />

        {/* Off-canvas panel */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl border-r border-slate-200 transition-transform duration-300 ease-in-out",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header Mobile Brand */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shadow-2xs p-1">
                <Image
                  src="/logo.png"
                  alt="Heelcloth"
                  width={20}
                  height={38}
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                  Heelcloth
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Confecção SaaS
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobileNav}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav List Mobile */}
          {renderNavLinks(true)}

          {/* Footer Mobile */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div className="font-semibold text-slate-800">Heelcloth SaaS v1.0</div>
            <div className="mt-0.5">
              Perfil: <span className="text-blue-600 font-bold">{userRole}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. Desktop Sticky Sidebar (>= 1024px) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-200 bg-white h-screen shrink-0 sticky top-0 transition-all duration-300 ease-in-out z-20",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-100 gap-3 px-4",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shadow-2xs shrink-0 p-1">
            <Image
              src="/logo.png"
              alt="Heelcloth"
              width={20}
              height={38}
              className="h-6 w-auto object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight truncate">
                Heelcloth
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                Gestão & Confecção
              </span>
            </div>
          )}
        </div>

        {/* Navigation list */}
        {renderNavLinks(false)}

        {/* Footer & Collapse Toggle Button */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-xs text-slate-500 truncate mr-2">
              <span className="font-semibold text-slate-700 block truncate">Heelcloth ERP</span>
              <span className="text-[10px] text-blue-600 font-semibold">{userRole}</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            className={cn(
              "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0",
              isCollapsed && "mx-auto"
            )}
            aria-label="Alternar barra lateral"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
