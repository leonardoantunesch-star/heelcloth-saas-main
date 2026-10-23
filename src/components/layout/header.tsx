"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Search, User, LogOut, Menu, Shirt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminShell } from "./admin-shell-context";

export interface HeaderUser {
  nome: string;
  email: string;
  perfil: string;
}

export function Header() {
  const router = useRouter();
  const { toggleMobileNav } = useAdminShell();
  const [user, setUser] = useState<HeaderUser>({
    nome: "Administrador Geral",
    email: "admin@heelcloth.com.br",
    perfil: "ADMIN",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.autenticado && data.usuario) {
          setUser(data.usuario);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const roleVariant = {
    ADMIN: "info" as const,
    FINANCEIRO: "success" as const,
    PRODUCAO: "warning" as const,
    VENDEDOR: "secondary" as const,
  }[user.perfil] || ("secondary" as const);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Mobile Menu Trigger + Brand on Mobile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center justify-center p-0.5 shadow-2xs">
            <Image
              src="/logo.png"
              alt="Heelcloth"
              width={16}
              height={30}
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-tight">Heelcloth</span>
        </div>
      </div>

      {/* Center: Search Bar (Adaptive) */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedidos, clientes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications and User Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Notificações"
        >
          <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
            {user.nome.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {user.nome}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={roleVariant} className="text-[10px] px-1.5 py-0 h-4">
                {user.perfil}
              </Badge>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Encerrar Sessão"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
