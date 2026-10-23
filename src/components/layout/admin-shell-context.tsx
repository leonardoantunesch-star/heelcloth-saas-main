"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

interface AdminShellContextValue {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapse: () => void;
}

const AdminShellContext = React.createContext<AdminShellContextValue | undefined>(undefined);

export function AdminShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Fecha o drawer mobile automaticamente ao mudar de rota
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const toggleMobileNav = React.useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  const closeMobileNav = React.useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <AdminShellContext.Provider
      value={{
        isMobileNavOpen,
        setIsMobileNavOpen,
        toggleMobileNav,
        closeMobileNav,
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
      }}
    >
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const context = React.useContext(AdminShellContext);
  if (!context) {
    throw new Error("useAdminShell deve ser utilizado dentro de um AdminShellProvider");
  }
  return context;
}
