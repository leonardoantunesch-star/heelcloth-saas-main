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
  ClipboardList,
  Images,
  Store,
  Shield,
  Stethoscope,
  LineChart,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminShell } from "./admin-shell-context";
import { PERFIL_INFO, areasDoPerfil, type Area, type Perfil } from "@/lib/permissoes";

// Ícone de cada área. Quem pode abrir cada área (e o título) vem de "@/lib/permissoes", a fonte única.
const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/pedidos": ShoppingCart,
  "/admin/orcamentos": FileText,
  "/admin/cotacao": ClipboardList,
  "/admin/loja": Store,
  "/admin/catalogo": Images,
  "/admin/clientes": Users,
  "/admin/producao": Layers,
  "/admin/coreldraw": Shirt,
  "/admin/estoque": Package,
  "/admin/financeiro": DollarSign,
  "/admin/nfe": Receipt,
  "/admin/whatsapp": MessageSquare,
  "/admin/configuracoes": Settings,
  "/admin/equipe": UserCheck,
  "/admin/analytics": LineChart,
  "/admin/relatorios": BarChart3,
  "/admin/auditoria": Shield,
  "/admin/diagnostico": Stethoscope,
};

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav, isCollapsed, toggleCollapse } = useAdminShell();
  const [userRole, setUserRole] = useState<string>("");

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

  const nomeDoPerfil = PERFIL_INFO[userRole as Perfil]?.nome ?? userRole;
  const areas = areasDoPerfil(userRole);
  const principais = areas.filter((a) => a.grupo === "principal");
  const daEquipe = areas.filter((a) => a.grupo === "equipe");

  const renderLink = (item: Area, isMobile: boolean) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
    const Icon = ICONES[item.href] ?? LayoutDashboard;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={isMobile ? closeMobileNav : undefined}
        title={isCollapsed && !isMobile ? item.titulo : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all select-none min-h-[42px]",
          isActive
            ? "bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-100/60"
            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
          isCollapsed && !isMobile && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", isActive ? "text-blue-600" : "text-slate-400")} />
        {(!isCollapsed || isMobile) && <span className="truncate">{item.titulo}</span>}
      </Link>
    );
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {principais.map((item) => renderLink(item, isMobile))}
      {daEquipe.length > 0 && (
        <>
          {!isCollapsed || isMobile ? (
            <p className="px-3 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Equipe e Analytics</p>
          ) : (
            <div className="mx-3 my-3 border-t border-slate-200" role="separator" />
          )}
          {daEquipe.map((item) => renderLink(item, isMobile))}
        </>
      )}
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
                  Heel Cloth
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
            <div className="font-semibold text-slate-800">Heel Cloth SaaS v1.0</div>
            <div className="mt-0.5">
              Perfil: <span className="text-blue-600 font-bold">{nomeDoPerfil}</span>
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
                Heel Cloth
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
              <span className="font-semibold text-slate-700 block truncate">Heel Cloth ERP</span>
              <span className="text-[10px] text-blue-600 font-semibold">{nomeDoPerfil}</span>
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
