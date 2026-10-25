// Molde 3D da camisa: a forma inteira (tronco, ombros, axilas e mangas) é um volume contínuo
// descrito por uma função de distância. A malha sai desse volume (surface nets), então não há
// emendas de peças coladas: as axilas e os ombros ficam arredondados como tecido de verdade.
// Este arquivo é só matemática (sem three.js), para poder ser testado e reaproveitado.

export type V3 = [number, number, number];

// Medidas do molde (em metros). Tiradas das fotos de referência: tronco estreito e comprido,
// mangas caindo quase retas ao lado do corpo, barra um pouco mais larga que a cintura.
export interface Forma {
  barra: number; // altura da barra
  topo: number; // topo da gola nas costas
  largura: [number, number][]; // meia-largura do tronco por altura
  frente: [number, number][]; // do eixo até a frente, por altura
  tras: [number, number][]; // do eixo até as costas, por altura
  centroZ: [number, number][]; // deslocamento do eixo do tronco para frente/trás, por altura
  quadrado: number; // expoente da seção (2 = elipse; maior = mais "quadrado")
  ombroY: number; // altura do ombro em |x| = 0.107
  ombroQueda: number; // queda do ombro por metro (inclinação)
  punho: V3; // centro da boca da manga (lado +x)
  mangaAngulo: number; // graus a partir da vertical
  mangaComprimento: number; // do punho até o começo da manga (dentro do ombro)
  mangaR1: number;
  mangaR2: number;
  mangaFundo: number; // profundidade / largura da manga
  uniaoAlta: number; // suavidade da junção manga-tronco no ombro
  uniaoBaixa: number; // perto da axila (pequeno = manga solta do corpo)
  golaFundoV: number; // altura do fundo do V
  golaInclinacaoV: number;
  golaLargura: number; // meia-largura da abertura do pescoço
  golaTras: number; // altura da gola nas costas
  punhoFaixa: number; // largura da ribana do punho (a manga de tecido termina antes)
}

export const FORMA_PADRAO: Forma = {
  barra: -0.428,
  topo: 0.352,
  largura: [[-0.43, 0.1984], [-0.39, 0.1984], [-0.35, 0.197], [-0.27, 0.19], [-0.19, 0.186], [-0.115, 0.184], [-0.04, 0.182], [0.06, 0.182], [0.16, 0.186], [0.24, 0.19], [0.36, 0.17]],
  frente: [[-0.43, 0.1566], [-0.27, 0.1544], [-0.1, 0.1566], [0.05, 0.1598], [0.15, 0.1442], [0.24, 0.1269], [0.36, 0.1015]],
  tras: [[-0.43, 0.1334], [-0.27, 0.1316], [-0.1, 0.1334], [0.05, 0.1362], [0.15, 0.1494], [0.24, 0.1391], [0.36, 0.1133]],
  centroZ: [[-0.43, 0], [-0.05, 0], [0.2, -0.0105], [0.36, -0.015]],
  quadrado: 2.25,
  ombroY: 0.3155,
  ombroQueda: 0.437,
  punho: [0.2485, 0.01, -0.0225],
  mangaAngulo: 13.7,
  mangaComprimento: 0.215,
  mangaR1: 0.064,
  mangaR2: 0.057,
  mangaFundo: 1.12,
  uniaoAlta: 0.05,
  uniaoBaixa: 0.006,
  golaFundoV: 0.25,
  golaInclinacaoV: 0.55,
  golaLargura: 0.105,
  golaTras: 0.335,
  punhoFaixa: 0.025,
};

export let BARRA_Y = FORMA_PADRAO.barra;

// ---------------- ruído (para as leves ondulações do tecido) ----------------
function hash(i: number, j: number, k: number) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const suave = (t: number) => t * t * (3 - 2 * t);
export function ruido3(x: number, y: number, z: number) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
  const fx = suave(x - i), fy = suave(y - j), fz = suave(z - k);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (di: number, dj: number, dk: number) => hash(i + di, j + dj, k + dk);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz
  );
}

// ---------------- operações de forma ----------------
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const passo = (e0: number, e1: number, x: number) => suave(clamp((x - e0) / (e1 - e0), 0, 1));

function tabela(y: number, t: [number, number][]) {
  if (y <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (y <= t[i][0]) {
      const k = suave((y - t[i - 1][0]) / (t[i][0] - t[i - 1][0]));
      return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * k;
    }
  }
  return t[t.length - 1][1];
}

// Cone arredondado (de A até B, raio r1 até r2), distância com sinal.
function coneArredondado(p: V3, a: V3, b: V3, r1: number, r2: number) {
  const ba: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2];
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pa: V3 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const y = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2];
  const z = y - l2;
  const xv: V3 = [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y];
  const x2 = xv[0] * xv[0] + xv[1] * xv[1] + xv[2] * xv[2];
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

export interface Manga {
  a: V3; // começo (dentro do ombro)
  b: V3; // fim (boca da manga)
  r1: number;
  r2: number;
  eixo: V3; // direção normalizada de a para b
}

export function mangas(longa: boolean, f: Forma = FORMA_PADRAO): Manga[] {
  return [1, -1].map((s) => {
    const ang = (f.mangaAngulo * Math.PI) / 180;
    // direção do punho para o ombro
    const sobe: V3 = [-s * Math.sin(ang), Math.cos(ang), 0];
    const b0: V3 = [s * f.punho[0], f.punho[1], f.punho[2]];
    const a: V3 = [b0[0] + sobe[0] * f.mangaComprimento, b0[1] + sobe[1] * f.mangaComprimento, b0[2]];
    // a manga de tecido termina antes do punho; a ribana completa o comprimento
    const ext = (longa ? 0.34 : 0) - f.punhoFaixa;
    const b: V3 = [b0[0] - sobe[0] * ext, b0[1] - sobe[1] * ext, b0[2]];
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const n = Math.hypot(...d);
    return { a, b, r1: f.mangaR1, r2: longa ? 0.042 : f.mangaR2, eixo: [d[0] / n, d[1] / n, d[2] / n] as V3 };
  });
}

function tronco(x: number, y: number, z: number, f: Forma) {
  const a = tabela(y, f.largura);
  z -= tabela(y, f.centroZ);
  const b = z > 0 ? tabela(y, f.frente) : tabela(y, f.tras);
  const n = f.quadrado;
  const s = Math.pow(Math.pow(Math.abs(x / a), n) + Math.pow(Math.abs(z / b), n), 1 / n) - 1;
  const ds = s * Math.min(a, b);
  const ax = Math.abs(x);
  // linha do ombro: reta inclinada até o pescoço, arredondada na frente e atrás
  const topo = Math.min(f.topo - 0.004, f.ombroY - f.ombroQueda * (ax - 0.107)) - 1.4 * z * z;
  return smax(ds, (y - topo) * 0.9, 0.035);
}

export function criarCampo(longa: boolean, f: Forma = FORMA_PADRAO) {
  const ms = mangas(longa, f);
  const fundo = 1 / f.mangaFundo;
  return (x: number, y: number, z: number) => {
    let d = tronco(x, y, z, f);
    // junção suave no ombro, quase nenhuma perto da axila (a manga cai solta ao lado do corpo)
    const k = f.uniaoBaixa + (f.uniaoAlta - f.uniaoBaixa) * passo(0.08, 0.22, y);
    for (const m of ms) {
      const p: V3 = [x, y, m.a[2] + (z - m.a[2]) * fundo];
      d = smin(d, coneArredondado(p, m.a, m.b, m.r1, m.r2) * Math.min(1, f.mangaFundo), k);
    }
    // ondulações leves do tecido + dobras suaves na parte de baixo e nas axilas
    const r = ruido3(x * 13, y * 8, z * 13) - 0.5;
    const dobraBaixo = y < -0.1 ? Math.sin(x * 34 + Math.sin(y * 9 + z * 7) * 2.5) * passo(-0.1, -0.4, y) : 0;
    const axila = Math.exp(-Math.pow((Math.abs(x) - 0.19) / 0.04, 2) - Math.pow((y - 0.12) / 0.06, 2));
    d += r * 0.005 + dobraBaixo * 0.002 + Math.sin(y * 110 + x * 30) * axila * 0.002;
    return d;
  };
}

// Abertura da gola (V ou redonda): pontos acima desta altura, dentro da elipse do pescoço, ficam abertos.
// Abertura do pescoço. Em cima é uma elipse vista de cima (costura da gola); na gola V a abertura
// desce pela frente até o fundo do V.
export function corteGola(x: number, y: number, z: number, gola: "v" | "redonda", f: Forma = FORMA_PADRAO) {
  const ax = Math.abs(x);
  if (ax > f.golaLargura) return false;
  const zc = -0.012;
  const fundo = gola === "v" ? 0.088 : 0.118;
  const elipse = (x / f.golaLargura) ** 2 + ((z - zc) / (z > zc ? fundo : 0.088)) ** 2 < 1;
  if (elipse && y > f.golaTras - 0.03) return true;
  if (gola === "v" && z > 0.02) {
    const u = ax / f.golaLargura;
    return y > f.golaFundoV + f.golaInclinacaoV * ax + 0.02 * u * u * u * u;
  }
  return false;
}

// Além do plano da boca da manga, mas só perto do eixo da manga (senão o plano cortaria o tronco).
export function corteManga(p: V3, m: Manga) {
  const d: V3 = [p[0] - m.b[0], p[1] - m.b[1], p[2] - m.b[2]];
  const t = d[0] * m.eixo[0] + d[1] * m.eixo[1] + d[2] * m.eixo[2];
  if (t <= 0) return false;
  const perp = Math.hypot(d[0] - m.eixo[0] * t, d[1] - m.eixo[1] * t, d[2] - m.eixo[2] * t);
  return perp < m.r2 * 1.8;
}

// ---------------- surface nets ----------------
export interface Malha {
  posicoes: Float32Array;
  normais: Float32Array;
  indices: Uint32Array;
}

export function gerarMalha(
  campo: (x: number, y: number, z: number) => number,
  min: V3,
  max: V3,
  passoGrade: number
): { pos: number[]; quads: number[] } {
  const nx = Math.ceil((max[0] - min[0]) / passoGrade) + 1;
  const ny = Math.ceil((max[1] - min[1]) / passoGrade) + 1;
  const nz = Math.ceil((max[2] - min[2]) / passoGrade) + 1;
  // Grade grossa primeiro: longe da superfície não precisa calcular ponto a ponto.
  const G = 4;
  const gx = Math.ceil((nx - 1) / G) + 1, gy = Math.ceil((ny - 1) / G) + 1, gz = Math.ceil((nz - 1) / G) + 1;
  const grossa = new Float32Array(gx * gy * gz);
  for (let k = 0; k < gz; k++)
    for (let j = 0; j < gy; j++)
      for (let i = 0; i < gx; i++)
        grossa[i + gx * (j + gy * k)] = campo(min[0] + i * G * passoGrade, min[1] + j * G * passoGrade, min[2] + k * G * passoGrade);
  const limite = G * passoGrade * 1.6;
  const v = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) {
    const z = min[2] + k * passoGrade;
    const K = Math.min(gz - 2, Math.floor(k / G)), tz = k / G - K;
    for (let j = 0; j < ny; j++) {
      const y = min[1] + j * passoGrade;
      const J = Math.min(gy - 2, Math.floor(j / G)), ty = j / G - J;
      let o = nx * (j + ny * k);
      for (let i = 0; i < nx; i++) {
        const I = Math.min(gx - 2, Math.floor(i / G)), tx = i / G - I;
        const b0 = I + gx * (J + gy * K), sy = gx, sz = gx * gy;
        const c00 = grossa[b0] + (grossa[b0 + 1] - grossa[b0]) * tx;
        const c10 = grossa[b0 + sy] + (grossa[b0 + sy + 1] - grossa[b0 + sy]) * tx;
        const c01 = grossa[b0 + sz] + (grossa[b0 + sz + 1] - grossa[b0 + sz]) * tx;
        const c11 = grossa[b0 + sy + sz] + (grossa[b0 + sy + sz + 1] - grossa[b0 + sy + sz]) * tx;
        const e0 = c00 + (c10 - c00) * ty, e1 = c01 + (c11 - c01) * ty;
        const est = e0 + (e1 - e0) * tz;
        v[o++] = Math.abs(est) > limite ? est : campo(min[0] + i * passoGrade, y, z);
      }
    }
  }
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const cx = nx - 1, cy = ny - 1;
  const celula = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const pos: number[] = [];
  const cantos: V3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const arestas: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const val = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let neg = 0;
        for (let c = 0; c < 8; c++) {
          const [di, dj, dk] = cantos[c];
          val[c] = v[id(i + di, j + dj, k + dk)];
          if (val[c] < 0) neg++;
        }
        if (neg === 0 || neg === 8) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of arestas) {
          const va = val[a], vb = val[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          const A = cantos[a], B = cantos[b];
          sx += A[0] + (B[0] - A[0]) * t;
          sy += A[1] + (B[1] - A[1]) * t;
          sz += A[2] + (B[2] - A[2]) * t;
          n++;
        }
        celula[i + cx * (j + cy * k)] = pos.length / 3;
        pos.push(min[0] + (i + sx / n) * passoGrade, min[1] + (j + sy / n) * passoGrade, min[2] + (k + sz / n) * passoGrade);
      }
  const c = (i: number, j: number, k: number) => celula[i + cx * (j + cy * k)];
  const quads: number[] = [];
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const s0 = v[id(i, j, k)] < 0;
        if (s0 !== v[id(i + 1, j, k)] < 0) quads.push(c(i, j - 1, k - 1), c(i, j, k - 1), c(i, j, k), c(i, j - 1, k));
        if (s0 !== v[id(i, j + 1, k)] < 0) quads.push(c(i - 1, j, k - 1), c(i, j, k - 1), c(i, j, k), c(i - 1, j, k));
        if (s0 !== v[id(i, j, k + 1)] < 0) quads.push(c(i - 1, j - 1, k), c(i, j - 1, k), c(i, j, k), c(i - 1, j, k));
      }
  return { pos, quads };
}

export function gradiente(campo: (x: number, y: number, z: number) => number, x: number, y: number, z: number, e = 0.0015): V3 {
  const gx = campo(x + e, y, z) - campo(x - e, y, z);
  const gy = campo(x, y + e, z) - campo(x, y - e, z);
  const gz = campo(x, y, z + e) - campo(x, y, z - e);
  const n = Math.hypot(gx, gy, gz) || 1;
  return [gx / n, gy / n, gz / n];
}

// Leva um ponto até a superfície (alguns passos de Newton ao longo do gradiente).
export function projetar(campo: (x: number, y: number, z: number) => number, p: V3): V3 {
  let q: V3 = [...p];
  for (let it = 0; it < 4; it++) {
    const d = campo(...q);
    const g = gradiente(campo, ...q);
    q = [q[0] - g[0] * d, q[1] - g[1] * d, q[2] - g[2] * d];
  }
  return q;
}

export type TipoBorda = "barra" | "gola" | "manga";

export interface CamisaMolde {
  barra: number;
  malha: Malha;
  bordas: { tipo: TipoBorda; pontos: V3[] }[];
  campo: (x: number, y: number, z: number) => number;
  cortado: (p: V3) => boolean;
}

// Monta a camisa: gera a superfície, abre a barra, as mangas e a gola, e devolve as bordas
// (para colocar a gola, os punhos e a costura da barra por cima).
export function montarCamisa(opts: { gola: "v" | "redonda"; mangaLonga: boolean; passo?: number; forma?: Forma }): CamisaMolde {
  const f = opts.forma ?? FORMA_PADRAO;
  BARRA_Y = f.barra;
  const campo = criarCampo(opts.mangaLonga, f);
  const ms = mangas(opts.mangaLonga, f);
  const h = opts.passo ?? 0.0058;
  const { pos, quads } = gerarMalha(campo, [-0.4, f.barra - 0.03, -0.22], [0.4, f.topo + 0.03, 0.22], h);

  // um ponto além da boca da manga só é cortado se estiver na manga (e não no tronco encostado nela)
  const fundo = 1 / f.mangaFundo;
  const naManga = (p: V3, m: Manga) =>
    corteManga(p, m) && coneArredondado([p[0], p[1], m.a[2] + (p[2] - m.a[2]) * fundo], m.a, m.b, m.r1, m.r2) < tronco(p[0], p[1], p[2], f);
  const cortado = (p: V3) =>
    p[1] < f.barra || ms.some((m) => naManga(p, m)) || corteGola(p[0], p[1], p[2], opts.gola, f);

  const nv = pos.length / 3;
  const P = (i: number): V3 => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];

  // quads mantidos: centro fora das áreas abertas
  const mantidos: number[] = [];
  for (let q = 0; q < quads.length; q += 4) {
    const a = quads[q], b = quads[q + 1], c = quads[q + 2], d = quads[q + 3];
    if (a < 0 || b < 0 || c < 0 || d < 0) continue;
    const cen: V3 = [0, 1, 2].map((e) => (pos[a * 3 + e] + pos[b * 3 + e] + pos[c * 3 + e] + pos[d * 3 + e]) / 4) as V3;
    if (!cortado(cen)) mantidos.push(a, b, c, d);
  }

  // alinha as bordas da barra e das mangas (corte reto, sem serrilhado)
  const usados = new Uint8Array(nv);
  for (const i of mantidos) usados[i] = 1;
  for (let i = 0; i < nv; i++) {
    if (!usados[i]) continue;
    if (pos[i * 3 + 1] < f.barra) pos[i * 3 + 1] = f.barra;
    for (const m of ms) {
      const p = P(i);
      const t = (p[0] - m.b[0]) * m.eixo[0] + (p[1] - m.b[1]) * m.eixo[1] + (p[2] - m.b[2]) * m.eixo[2];
      if (t > 0 && naManga(p, m)) {
        pos[i * 3] -= m.eixo[0] * t;
        pos[i * 3 + 1] -= m.eixo[1] * t;
        pos[i * 3 + 2] -= m.eixo[2] * t;
      }
    }
  }

  // triângulos com orientação conferida pelo gradiente
  const cacheN = new Map<number, V3>();
  const normalDe = (i: number) => {
    let n = cacheN.get(i);
    if (!n) cacheN.set(i, (n = gradiente(campo, ...P(i))));
    return n;
  };
  const tri: number[] = [];
  const pushTri = (a: number, b: number, c: number) => {
    const A = P(a), B = P(b), C = P(c);
    const u: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const w: V3 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const g = normalDe(a);
    if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] < 0) tri.push(a, c, b);
    else tri.push(a, b, c);
  };
  for (let q = 0; q < mantidos.length; q += 4) {
    pushTri(mantidos[q], mantidos[q + 1], mantidos[q + 2]);
    pushTri(mantidos[q], mantidos[q + 2], mantidos[q + 3]);
  }

  // compacta vértices
  const novo = new Int32Array(nv).fill(-1);
  const posF: number[] = [];
  const norF: number[] = [];
  for (const i of tri) {
    if (novo[i] >= 0) continue;
    novo[i] = posF.length / 3;
    const p = P(i);
    posF.push(...p);
    norF.push(...normalDe(i));
  }
  const indices = new Uint32Array(tri.map((i) => novo[i]));

  // bordas: arestas que pertencem a um só triângulo, percorridas na orientação dos triângulos
  // (assim cada contorno fecha certinho, mesmo com vértices "em gravata").
  const N = posF.length / 3;
  const chave = (a: number, b: number) => (a < b ? a * N + b : b * N + a);
  const contagem = new Map<number, number>();
  for (let t = 0; t < indices.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const k = chave(indices[t + e], indices[t + ((e + 1) % 3)]);
      contagem.set(k, (contagem.get(k) ?? 0) + 1);
    }
  const saida = new Map<number, number[]>();
  let restantes = 0;
  for (let t = 0; t < indices.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const a = indices[t + e], b = indices[t + ((e + 1) % 3)];
      if (contagem.get(chave(a, b)) !== 1) continue;
      (saida.get(a) ?? saida.set(a, []).get(a)!).push(b);
      restantes++;
    }
  const laços: number[][] = [];
  for (const ini of saida.keys()) {
    while ((saida.get(ini)?.length ?? 0) > 0) {
      const laço: number[] = [];
      let atual = ini;
      for (let guarda = 0; guarda < restantes + 1; guarda++) {
        const lista = saida.get(atual);
        if (!lista || lista.length === 0) break;
        const prox = lista.pop()!;
        laço.push(atual);
        atual = prox;
        if (atual === ini) break;
      }
      if (laço.length > 20) laços.push(laço);
    }
  }
  const PF = (i: number): V3 => [posF[i * 3], posF[i * 3 + 1], posF[i * 3 + 2]];
  const bordas = laços.map((l) => {
    const pontos = l.map(PF);
    const cy = pontos.reduce((s, p) => s + p[1], 0) / pontos.length;
    const cx = pontos.reduce((s, p) => s + p[0], 0) / pontos.length;
    const tipo: TipoBorda = Math.abs(cx) > 0.17 ? "manga" : cy < f.barra + 0.1 ? "barra" : "gola";
    return { tipo, pontos };
  });

  return {
    barra: f.barra,
    malha: { posicoes: new Float32Array(posF), normais: new Float32Array(norF), indices },
    bordas,
    campo,
    cortado,
  };
}

// Suaviza e reamostra um contorno fechado em n pontos igualmente espaçados.
export function suavizarLaço(pts: V3[], n: number, iter = 6): V3[] {
  let p = pts.map((x) => [...x] as V3);
  for (let it = 0; it < iter; it++) {
    p = p.map((_, i) => {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4, (a[2] + 2 * b[2] + c[2]) / 4] as V3;
    });
  }
  const acum = [0];
  for (let i = 1; i <= p.length; i++) {
    const a = p[i - 1], b = p[i % p.length];
    acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  const total = acum[acum.length - 1];
  const out: V3[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * total;
    while (acum[j + 1] < s) j++;
    const t = (s - acum[j]) / (acum[j + 1] - acum[j] || 1);
    const a = p[j], b = p[(j + 1) % p.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
  }
  return out;
}
