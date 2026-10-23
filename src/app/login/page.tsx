"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shirt, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Falha na autenticação. Verifique os dados.");
        setIsLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Erro de conexão com o servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-white border border-slate-200 items-center justify-center shadow-xs p-1.5">
            <Image
              src="/logo.png"
              alt="Logo Heelcloth"
              width={32}
              height={60}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Heelcloth SaaS</h1>
          <p className="text-sm text-slate-500">
            Sistema Integrado de Gestão para Confecção de Uniformes
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Acesso ao Painel</CardTitle>
            <CardDescription>
              Informe suas credenciais para entrar no sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@heelcloth.com.br"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full gap-2 mt-2">
                Entrar no Sistema
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick Demo Credentials for Fast Testing */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Perfis de Demonstração (Seção 25):
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials("admin@heelcloth.com.br", "admin123")}
                  className="text-left p-2 rounded-md border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Administrador</div>
                  <div className="text-[11px] text-slate-400">Acesso Total</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("producao@heelcloth.com.br", "prod123")}
                  className="text-left p-2 rounded-md border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Produção</div>
                  <div className="text-[11px] text-slate-400">Fábrica & Corel</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("financeiro@heelcloth.com.br", "fin123")}
                  className="text-left p-2 rounded-md border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Financeiro</div>
                  <div className="text-[11px] text-slate-400">Contas & Relatórios</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("vendedor@heelcloth.com.br", "vendas123")}
                  className="text-left p-2 rounded-md border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Vendedor</div>
                  <div className="text-[11px] text-slate-400">Orçamentos & Clientes</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Heelcloth Gestão de Confecção. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
