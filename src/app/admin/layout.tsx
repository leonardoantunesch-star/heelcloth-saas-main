import React from "react";
import { AdminShellProvider } from "@/components/layout/admin-shell-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShellProvider>
      <div className="min-h-screen bg-slate-50 flex w-full">
        {/* Responsive Sidebar (Desktop Sticky + Mobile Drawer) */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AdminShellProvider>
  );
}
