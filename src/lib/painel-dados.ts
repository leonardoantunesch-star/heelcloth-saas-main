// Cálculos dos gráficos do painel (puros, sem banco): recebem as linhas já lidas e devolvem os números prontos.

export interface PedidoLinha {
  createdAt: Date;
  totalAmount: number;
}

export interface PontoSerie {
  rotulo: string;
  pedidos: number;
  faturamento: number;
}

// Datas do painel seguem o calendário de Brasília: o servidor (UTC) viraria o dia 3 horas antes.
// Devolve uma data "de calendário" (meia-noite) com o dia, mês e ano de Brasília.
export function dataBrasil(d: Date): Date {
  const txt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const [a, m, dia] = txt.split("-").map(Number);
  return new Date(a, m - 1, dia);
}

export const hojeBrasil = (): Date => dataBrasil(new Date());

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Segunda-feira (00:00) da semana de uma data. O painel conta a semana de segunda a domingo.
function inicioDaSemana(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = r.getDay(); // 0 = domingo
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1));
  return r;
}

// Últimas "n" semanas (a atual é a última), com a quantidade de pedidos e o valor vendido em cada uma.
export function seriePorSemana(pedidos: PedidoLinha[], hoje: Date, n = 8): PontoSerie[] {
  const atual = inicioDaSemana(hoje);
  const pontos: PontoSerie[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ini = new Date(atual);
    ini.setDate(ini.getDate() - i * 7);
    pontos.push({ rotulo: `${String(ini.getDate()).padStart(2, "0")}/${String(ini.getMonth() + 1).padStart(2, "0")}`, pedidos: 0, faturamento: 0 });
  }
  const primeira = new Date(atual);
  primeira.setDate(primeira.getDate() - (n - 1) * 7);
  for (const p of pedidos) {
    const t = dataBrasil(new Date(p.createdAt));
    if (t < primeira) continue;
    const semana = Math.floor((inicioDaSemana(t).getTime() - primeira.getTime()) / (7 * 86400000) + 0.5);
    if (semana < 0 || semana >= n) continue;
    pontos[semana].pedidos += 1;
    pontos[semana].faturamento += p.totalAmount || 0;
  }
  return pontos;
}

// Últimos "n" meses (o atual é o último).
export function serieMensal(pedidos: PedidoLinha[], hoje: Date, n = 6): PontoSerie[] {
  const pontos: PontoSerie[] = [];
  const chaves: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    chaves.push(`${m.getFullYear()}-${m.getMonth()}`);
    pontos.push({ rotulo: MESES[m.getMonth()], pedidos: 0, faturamento: 0 });
  }
  for (const p of pedidos) {
    const t = dataBrasil(new Date(p.createdAt));
    const idx = chaves.indexOf(`${t.getFullYear()}-${t.getMonth()}`);
    if (idx < 0) continue;
    pontos[idx].pedidos += 1;
    pontos[idx].faturamento += p.totalAmount || 0;
  }
  return pontos;
}

export interface Progresso {
  concluido: number;
  producao: number;
  pendente: number;
  total: number;
}

// Junta os status dos pedidos em três grupos (como o "Campaign Progress" do painel de referência).
export function progressoPorStatus(contagens: { status: string; quantidade: number }[]): Progresso {
  const r: Progresso = { concluido: 0, producao: 0, pendente: 0, total: 0 };
  for (const c of contagens) {
    if (c.status === "CANCELADO") continue;
    r.total += c.quantidade;
    if (["CONCLUIDO", "ENTREGUE", "PRONTO"].includes(c.status)) r.concluido += c.quantidade;
    else if (["EM_PRODUCAO", "CONTROLE_QUALIDADE", "EM_ATRASO"].includes(c.status)) r.producao += c.quantidade;
    else r.pendente += c.quantidade;
  }
  return r;
}

// Soma por chave e devolve as "n" maiores (ex.: clientes que mais compraram).
export function maioresPor<T>(itens: T[], chave: (i: T) => string, valor: (i: T) => number, n = 5): { nome: string; valor: number; quantidade: number }[] {
  const mapa = new Map<string, { valor: number; quantidade: number }>();
  for (const i of itens) {
    const k = chave(i);
    if (!k) continue;
    const a = mapa.get(k) ?? { valor: 0, quantidade: 0 };
    a.valor += valor(i);
    a.quantidade += 1;
    mapa.set(k, a);
  }
  return [...mapa.entries()]
    .map(([nome, a]) => ({ nome, ...a }))
    .sort((x, y) => y.valor - x.valor)
    .slice(0, n);
}

// Dias de hoje até uma data "AAAA-MM-DD" (negativo = já passou). Ignora a hora.
export function diasAte(data: string, hoje: Date): number {
  const [a, m, d] = data.split("-").map(Number);
  if (!a || !m || !d) return 0;
  const alvo = Date.UTC(a, m - 1, d);
  const ref = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - ref) / 86400000);
}

export function textoPrazo(dias: number): string {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return "atrasada 1 dia";
  return `atrasada ${-dias} dias`;
}
