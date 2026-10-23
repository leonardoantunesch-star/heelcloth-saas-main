import React from "react";
import { AdminShellProvider, useAdminShell } from "@/components/layout/admin-shell-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function ShellTestComponent() {
  return (
    <AdminShellProvider>
      <div className="flex">
        <Sidebar />
        <Header />
      </div>
    </AdminShellProvider>
  );
}

console.log("✅ App Shell imports verified!");
