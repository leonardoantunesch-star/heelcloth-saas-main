// 1) Mostra o que o projeto esta lendo na DATABASE_URL, SEM mostrar a senha.
// 2) Testa a conexao de verdade com o banco e confere se as tabelas existem.
import fs from "fs";
import path from "path";

const pastas = [".", "prisma"];
const nomes = [".env", ".env.local", ".env.production", "env", "env.txt", ".env.txt"];
const achados = [];
for (const p of pastas) for (const n of nomes) {
  const f = path.join(p, n);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) achados.push(f);
}

console.log("");
console.log("Arquivos de configuracao encontrados na pasta do projeto:");
if (achados.length === 0) console.log("  (nenhum)");
for (const f of achados) console.log("  -", f);

function lerUrl(arquivo) {
  const linhas = fs.readFileSync(arquivo, "utf8").split(/\r?\n/);
  for (const l of linhas) {
    const m = l.match(/^\s*DATABASE_URL\s*=\s*(.*)$/);
    if (m) return m[1].trim();
  }
  return null;
}

let algum = false;
for (const f of achados) {
  const bruto = lerUrl(f);
  if (bruto === null) continue;
  algum = true;
  console.log("");
  console.log("==== " + f + " ====");
  const temAspas = /^["']|["']$/.test(bruto);
  const valor = bruto.replace(/^["']|["']$/g, "");
  console.log("Comeca com postgresql://  :", /^postgres(ql)?:\/\//.test(valor) ? "sim" : "NAO (errado)");
  console.log("Tem aspas no valor        :", temAspas ? "sim (normal dentro do .env)" : "nao");
  const aposProtocolo = valor.replace(/^postgres(ql)?:\/\//, "");
  const antesDoArroba = aposProtocolo.slice(0, aposProtocolo.lastIndexOf("@"));
  if (antesDoArroba.includes("#")) console.log("ATENCAO: ha um # solto na senha. Troque por %23.");
  try {
    const u = new URL(valor);
    const senha = decodeURIComponent(u.password);
    console.log("Usuario                   :", decodeURIComponent(u.username));
    console.log("Servidor                  :", u.hostname);
    console.log("Porta                     :", u.port || "(padrao)");
    console.log("Banco                     :", u.pathname.replace("/", ""));
    console.log("Parametros                :", u.search || "(nenhum)");
    console.log("Tamanho da senha          :", senha.length, "caracteres");
    console.log("Senha termina com #       :", senha.endsWith("#") ? "sim" : "nao");
    if (u.hostname.includes("pooler.supabase.com") && !decodeURIComponent(u.username).startsWith("postgres.")) {
      console.log("ATENCAO: no pooler do Supabase o usuario precisa ser postgres.CODIGO-DO-PROJETO (com ponto).");
    }
    if (/\[|\]/.test(valor)) console.log("ATENCAO: ha colchetes [ ] na URL. Tire os colchetes.");
  } catch {
    console.log("NAO foi possivel ler esta URL. Ela esta mal formatada (confira # sem %23, aspas ou espacos).");
  }
}
if (!algum) console.log("\nNenhum arquivo tem a linha DATABASE_URL.");
console.log("");

// ---------------- Teste real de conexao ----------------
console.log("==== TESTE DE CONEXAO COM O BANCO ====");
let PrismaClient;
try {
  ({ PrismaClient } = await import("@prisma/client"));
} catch {
  console.log("Nao foi possivel carregar o Prisma. Rode primeiro o criar-banco.bat (ele instala os programas) e depois este verificador.");
  process.exit(0);
}
let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.log("O Prisma ainda nao foi preparado. Rode o criar-banco.bat uma vez e tente de novo.");
  console.log("Detalhe:", String(e.message).split("\n")[0].slice(0, 160));
  process.exit(0);
}
function explicar(e) {
  const codigo = e && e.code ? e.code : "";
  const msg = String((e && e.message) || e);
  if (codigo === "P1000" || /Authentication failed/i.test(msg))
    return "SENHA OU USUARIO RECUSADOS pelo Supabase. A senha que esta no .env nao e a senha atual do banco. Redefina a senha no Supabase (Project Settings > Database > Reset database password) e use a mesma no .env.";
  if (codigo === "P1001" || /Can't reach database server/i.test(msg))
    return "NAO ALCANCOU o servidor. Confira se o projeto do Supabase nao esta pausado (Restore project) e a sua internet.";
  if (/Tenant or user not found/i.test(msg))
    return "USUARIO OU SERVIDOR ERRADOS. No pooler o usuario precisa ser postgres.CODIGO-DO-PROJETO e o servidor precisa ser exatamente o que o Supabase mostra.";
  if (codigo === "P1012" || /must start with the protocol|Error validating/i.test(msg))
    return "A DATABASE_URL esta com formato invalido (aspas, colchetes, espacos ou # sem %23).";
  return "Outro erro. Me envie esta linha: " + msg.split("\n").filter(Boolean).slice(-1)[0].slice(0, 200);
}
try {
  await prisma.$queryRawUnsafe("select 1");
  console.log("CONEXAO OK: o Supabase aceitou o usuario e a senha.");
  try {
    const r = await prisma.$queryRawUnsafe('select count(*)::int as n from "User"');
    console.log("TABELAS OK: a tabela User existe e tem", r[0].n, "usuario(s).");
    if (r[0].n === 0) console.log("Falta criar os usuarios: rode o criar-banco.bat.");
  } catch {
    console.log("TABELAS AINDA NAO EXISTEM: rode o criar-banco.bat para cria-las.");
  }
} catch (e) {
  console.log("FALHA NA CONEXAO:", explicar(e));
} finally {
  try { await prisma.$disconnect(); } catch {}
}
console.log("");
