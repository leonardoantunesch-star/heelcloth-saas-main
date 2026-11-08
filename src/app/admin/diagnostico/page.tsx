"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Mail } from "lucide-react";

interface Item { nome: string; ok: boolean; obrigatorio: boolean; para: string }
interface Dados { producao: boolean; itens: Item[]; loginSemCodigo: boolean }
interface Teste { ok: boolean; status: number; detalhe: string; para?: string; erro?: string }

// Mostra o que falta configurar para o login e os e-mails funcionarem. Nunca exibe valores secretos, só “configurado” ou “faltando”.
export default function DiagnosticoPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [teste, setTeste] = useState<Teste | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/admin/diagnostico")
      .then(async (r) => (r.ok ? setDados(await r.json()) : setErro((await r.json().catch(() => ({}))).erro || "Não foi possível carregar.")))
      .catch(() => setErro("Sem conexão."));
  }, []);

  const testar = async () => {
    setEnviando(true);
    setTeste(null);
    try {
      const r = await fetch("/api/admin/diagnostico", { method: "POST" });
      setTeste(await r.json());
    } catch {
      setTeste({ ok: false, status: 0, detalhe: "Sem conexão." });
    }
    setEnviando(false);
  };

  const faltaObrigatorio = dados?.itens.some((i) => i.obrigatorio && !i.ok);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Diagnóstico</h1>
        <p className="mt-1 text-sm text-slate-600">Confere se as configurações do login, dos e-mails e do pagamento estão feitas na Vercel. Nenhum valor secreto aparece aqui.</p>
      </div>

      {erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{erro}</p>}

      {dados?.loginSemCodigo && (
        <p role="alert" className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span><strong>LOGIN_SEM_CODIGO está ligado:</strong> o login do cliente pede só e-mail e senha, sem o código de 6 dígitos. É menos seguro. Desligue assim que o envio de e-mails estiver funcionando.</span>
        </p>
      )}

      {dados && (
        <section aria-labelledby="cfg" className="rounded-2xl border border-slate-200 bg-white">
          <h2 id="cfg" className="border-b border-slate-200 px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-700">Configurações</h2>
          <ul className="divide-y divide-slate-100">
            {dados.itens.map((i) => (
              <li key={i.nome} className="flex items-start gap-3 px-5 py-4">
                {i.ok ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : i.obrigatorio ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {i.nome} <span className="font-sans text-xs font-bold text-slate-600">· {i.ok ? "configurado" : i.obrigatorio ? "FALTANDO (obrigatório)" : "faltando (opcional)"}</span>
                  </p>
                  <p className="text-sm text-slate-600">{i.para}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="teste" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="teste" className="text-sm font-bold uppercase tracking-wider text-slate-700">Teste de e-mail</h2>
        <p className="mt-2 text-sm text-slate-600">Envia uma mensagem de teste para o e-mail do seu login. Se falhar, mostra o motivo que o Resend informou.</p>
        <button type="button" onClick={testar} disabled={enviando} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
          <Mail className="h-4 w-4" aria-hidden="true" />
          {enviando ? "Enviando..." : "Enviar e-mail de teste"}
        </button>
        {teste && (
          <p role="status" className={`mt-4 rounded-xl p-4 text-sm ${teste.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>
            <strong>{teste.ok ? "Deu certo" : "Não enviou"}</strong>
            {teste.para && teste.ok ? ` para ${teste.para}.` : "."} {teste.erro || teste.detalhe}
            {!teste.ok && teste.status === 403 && " Isso costuma significar que o domínio do remetente não está verificado no Resend."}
          </p>
        )}
      </section>

      {dados && faltaObrigatorio && (
        <section className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
          <h2 className="font-bold text-slate-900">O que fazer</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>No Resend (resend.com), adicione e verifique o domínio do site (os registros DNS).</li>
            <li>Na Vercel, em Settings → Environment Variables, crie <code>EMAIL_REMETENTE</code> com um valor como <code>Heel Cloth &lt;contato@seudominio.com.br&gt;</code> e marque Sensitive.</li>
            <li>Faça um novo deploy (Redeploy) e volte aqui para o teste de e-mail.</li>
          </ol>
        </section>
      )}
    </div>
  );
}
