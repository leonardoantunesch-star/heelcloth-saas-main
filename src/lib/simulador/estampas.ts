// Estampas, letras e etiquetas desenhadas em canvas para a camisa 3D.

// ---------------- ruído 2D ----------------
function h2(i: number, j: number, s: number) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function ruido2(x: number, y: number, s = 1) {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = h2(i, j, s), b = h2(i + 1, j, s), c = h2(i, j + 1, s), d = h2(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function aleatorio(semente: number) {
  let t = semente >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexParaRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function misturar(a: string, b: string, t: number) {
  const A = hexParaRgb(a), B = hexParaRgb(b);
  return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(",")})`;
}

type Pt = [number, number];

// Linhas de fluxo igualmente espaçadas (algoritmo de Jobard–Lefer): cada linha segue o campo de
// direções e para quando chega perto demais de outra, então elas não se amontoam em feixes.
function linhasEspacadas(W: number, H: number, angulo: (x: number, y: number) => number, dsep: (x: number, y: number) => number, rnd: () => number, minimo = 60) {
  const cel = 24;
  const gw = Math.ceil(W / cel) + 2, gh = Math.ceil(H / cel) + 2;
  const grade: number[][] = Array.from({ length: gw * gh }, () => []);
  const xs: number[] = [], ys: number[] = [], dono: number[] = [], ordem: number[] = [];
  const passo = 3.2;
  const margem = 40;
  const celula = (x: number, y: number) => Math.floor((x + margem) / cel) + gw * Math.floor((y + margem) / cel);
  const perto = (x: number, y: number, d: number, linha: number, idx: number) => {
    const r = Math.ceil(d / cel);
    const cx = Math.floor((x + margem) / cel), cy = Math.floor((y + margem) / cel);
    for (let j = cy - r; j <= cy + r; j++) {
      if (j < 0 || j >= gh) continue;
      for (let i = cx - r; i <= cx + r; i++) {
        if (i < 0 || i >= gw) continue;
        for (const k of grade[i + gw * j]) {
          if (dono[k] === linha && Math.abs(ordem[k] - idx) < 40) continue;
          const dx = xs[k] - x, dy = ys[k] - y;
          if (dx * dx + dy * dy < d * d) return true;
        }
      }
    }
    return false;
  };
  const linhas: Pt[][] = [];
  const fila: Pt[] = [];
  for (let i = 0; i < 6; i++) fila.push([rnd() * W, rnd() * H]);
  let guarda = 0;
  while (fila.length && guarda++ < 4000) {
    const [sx, sy] = fila.shift()!;
    if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
    const ds = dsep(sx, sy);
    if (perto(sx, sy, ds * 0.95, -1, 0)) continue;
    const id = linhas.length;
    // a própria linha também não pode se aproximar de si mesma (evita espirais)
    const propria = new Map<number, Pt[]>();
    const pertoDeSi = (x: number, y: number, d: number, recentes: Pt[]) => {
      const cx = Math.floor((x + margem) / cel), cy = Math.floor((y + margem) / cel);
      const r = Math.ceil(d / cel);
      for (let j = cy - r; j <= cy + r; j++)
        for (let i = cx - r; i <= cx + r; i++) {
          for (const p of propria.get(i + gw * j) ?? []) {
            if (recentes.includes(p)) continue;
            const dx = p[0] - x, dy = p[1] - y;
            if (dx * dx + dy * dy < d * d) return true;
          }
        }
      return false;
    };
    const guardar = (p: Pt) => {
      const kk = celula(p[0], p[1]);
      (propria.get(kk) ?? propria.set(kk, []).get(kk)!).push(p);
    };
    const inicio: Pt = [sx, sy];
    guardar(inicio);
    const tracar = (sentido: number) => {
      const out: Pt[] = [];
      let x = sx, y = sy;
      let anterior = angulo(x, y);
      for (let k = 1; k < 1500; k++) {
        const a = angulo(x, y);
        // curva fechada demais (centro de redemoinho): para
        let da = a - anterior;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) > 0.12) break;
        anterior = a;
        x += Math.cos(a) * passo * sentido;
        y += Math.sin(a) * passo * sentido;
        if (x < -margem + 2 || x > W + margem - 2 || y < -margem + 2 || y > H + margem - 2) break;
        const dmin = dsep(x, y) * 0.48;
        if (perto(x, y, dmin, id, sentido * k)) break;
        const recentes = out.slice(-Math.ceil((dmin * 2.2) / passo));
        if (k > 20 && pertoDeSi(x, y, dmin, k < 30 ? [...recentes, inicio] : recentes)) break;
        const p: Pt = [x, y];
        out.push(p);
        guardar(p);
      }
      return out;
    };
    const ida = tracar(1), volta = tracar(-1);
    const linha: Pt[] = [...volta.reverse(), [sx, sy], ...ida];
    if (linha.length < minimo) continue;
    linha.forEach(([x, y], k) => {
      const i = xs.length;
      xs.push(x); ys.push(y); dono.push(id); ordem.push(k);
      grade[celula(x, y)]?.push(i);
    });
    linhas.push(linha);
    // novas sementes ao lado da linha
    for (let k = 0; k < linha.length; k += 12) {
      const a = linha[Math.max(0, k - 1)], b = linha[Math.min(linha.length - 1, k + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const d = dsep(linha[k][0], linha[k][1]) * (0.85 + rnd() * 0.3);
      fila.push([linha[k][0] - (dy / l) * d, linha[k][1] + (dx / l) * d]);
      fila.push([linha[k][0] + (dy / l) * d, linha[k][1] - (dx / l) * d]);
    }
  }
  return linhas;
}

// Linhas que fluem pela camisa (como na arte de referência): uma camada principal quase vertical,
// com ondas suaves, e uma camada de redemoinhos que cruza a primeira. Desenha a cor e uma máscara
// (branco onde há linha) usada para dar brilho metálico só nas linhas.
export function pintarOndas(cor: HTMLCanvasElement, mascara: HTMLCanvasElement, base: string, linha: string, semente = 11) {
  const W = cor.width, H = cor.height;
  const k = W / 2048;
  const c = cor.getContext("2d")!;
  const m = mascara.getContext("2d")!;
  c.fillStyle = base;
  c.fillRect(0, 0, W, H);
  m.fillStyle = "#000";
  m.fillRect(0, 0, W, H);
  const rnd = aleatorio(semente);

  // camada A: quase vertical, ondulando
  const angA = (x: number, y: number) => {
    const nx = x / W, ny = y / H;
    const T = Math.PI * 2;
    return (
      Math.PI / 2 +
      0.5 * Math.sin(T * (nx * 0.85 + ny * 0.55) + 1.3) +
      0.42 * Math.sin(T * (ny * 1.35 - nx * 0.45) + 4.1) +
      0.22 * Math.sin(T * (nx * 1.9 + ny * 1.6) + 2.2) +
      (ruido2(nx * 2.2, ny * 1.8, semente) - 0.5) * 1.1
    );
  };
  const dA = (x: number, y: number) => k * (78 + 62 * ruido2(x / W * 3, y / H * 3, semente + 21));
  // camada B: redemoinhos em volta de alguns centros
  const vortices = Array.from({ length: 9 }, () => ({
    x: rnd() * W, y: rnd() * H, r: (260 + rnd() * 320) * k, f: (rnd() < 0.5 ? -1 : 1) * (1.4 + rnd() * 1.4),
  }));
  const angB = (x: number, y: number) => {
    let vx = Math.sin(y / H * 4 + semente) * 0.25, vy = 1;
    for (const v of vortices) {
      const dx = x - v.x, dy = y - v.y;
      const e = Math.exp(-(dx * dx + dy * dy) / (v.r * v.r));
      vx += (-dy / v.r) * v.f * e;
      vy += (dx / v.r) * v.f * e;
    }
    return Math.atan2(vy, vx);
  };
  const dB = (x: number, y: number) => k * (135 + 85 * ruido2(x / W * 2.5, y / H * 2.5, semente + 33));

  const camadas: { linhas: Pt[][]; larg: [number, number]; tons: number[] }[] = [
    { linhas: linhasEspacadas(W, H, angA, dA, rnd, 70), larg: [5.5, 10.5], tons: [0.05, 0.2, 0.35, -0.1, 0.5] },
    { linhas: linhasEspacadas(W, H, angB, dB, rnd, 130), larg: [5, 9], tons: [-0.15, -0.3, 0.0, 0.15, -0.45] },
  ];
  for (const camada of camadas.slice().reverse()) {
    for (const pts of camada.linhas) {
      const largura = (camada.larg[0] + rnd() * (camada.larg[1] - camada.larg[0]) + (rnd() < 0.06 ? 5 : 0)) * k;
      const tom = camada.tons[Math.floor(rnd() * camada.tons.length)];
      const corLinha = tom >= 0 ? misturar(linha, "#fff3cf", tom) : misturar(linha, "#2a1c08", -tom);
      // contorno com afinamento nas pontas (as linhas "se fundem" nas vizinhas)
      const n = pts.length;
      const esq: Pt[] = [], dir: Pt[] = [];
      const ponta = Math.min(28, n / 3);
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        const t = Math.min(1, i / ponta, (n - 1 - i) / ponta);
        const w = (largura / 2) * Math.sqrt(Math.max(0, t));
        esq.push([pts[i][0] - (dy / l) * w, pts[i][1] + (dx / l) * w]);
        dir.push([pts[i][0] + (dy / l) * w, pts[i][1] - (dx / l) * w]);
      }
      const desenhar = (ctx: CanvasRenderingContext2D, estilo: string) => {
        ctx.beginPath();
        ctx.moveTo(esq[0][0], esq[0][1]);
        for (const p of esq) ctx.lineTo(p[0], p[1]);
        for (let i = dir.length - 1; i >= 0; i--) ctx.lineTo(dir[i][0], dir[i][1]);
        ctx.closePath();
        ctx.fillStyle = estilo;
        ctx.fill();
      };
      desenhar(c, corLinha);
      desenhar(m, `rgba(255,255,255,${tom >= -0.2 ? 1 : 0.65})`);
      // reflexo fino no meio
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = misturar(linha, "#fffbea", 0.55);
      c.globalAlpha = 0.35;
      c.lineWidth = largura * 0.28;
      c.stroke();
      c.globalAlpha = 1;
    }
  }
}

// Malha de tricô (relevo fino do tecido), usada como mapa de normais.
export function pintarMalhaTecido(canvas: HTMLCanvasElement) {
  const W = canvas.width, H = canvas.height;
  const c = canvas.getContext("2d")!;
  const img = c.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // pequenos "V" do tricô: relevo em colunas com inclinação alternada
      const col = x / 6, lin = y / 5;
      const fase = (Math.floor(col) % 2 ? 1 : -1) * (col % 1 - 0.5);
      const hx = Math.sin((col % 1) * Math.PI * 2) * 0.5;
      const hy = Math.sin((lin + fase) * Math.PI * 2) * 0.5;
      const o = (y * W + x) * 4;
      img.data[o] = 128 + hx * 60;
      img.data[o + 1] = 128 + hy * 60;
      img.data[o + 2] = 255;
      img.data[o + 3] = 255;
    }
  c.putImageData(img, 0, 0);
}

// Ribana (gola e punhos): listras finas verticais em relevo na cor do acabamento.
export function pintarRibana(canvas: HTMLCanvasElement, cor: string, listra: string | null, passo = 4) {
  const W = canvas.width, H = canvas.height;
  const c = canvas.getContext("2d")!;
  c.fillStyle = cor;
  c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += passo) {
    c.fillStyle = "rgba(0,0,0,0.22)";
    c.fillRect(x, 0, passo * 0.35, H);
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.fillRect(x + passo * 0.55, 0, passo * 0.25, H);
  }
  if (listra) {
    c.fillStyle = listra;
    c.fillRect(0, H * 0.62, W, H * 0.12);
  }
}

// ---------------- fonte esportiva desenhada em traços ----------------
// Cada letra é feita de traços grossos (centro do traço em coordenadas 0–1 dentro da caixa da letra).
// Junções arredondadas por fora e retas por dentro, como nas fontes de camisa de time.
type Traco = { p: [number, number][]; fechado?: boolean };
type Glifo = { w: number; t: Traco[]; chanfro?: "sd" | "ie" };
const R = (pts: [number, number][], fechado = false): Traco => ({ p: pts, fechado });
const CX: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const GLIFOS: Record<string, Glifo> = {
  "0": { w: 4.6, t: [R(CX, true)] },
  "1": { w: 3.2, t: [R([[0, 0.17], [0.72, 0], [0.72, 1.05]])] },
  "2": { w: 4.6, t: [R([[0, 0], [1, 0], [1, 0.5], [0, 0.5], [0, 1], [1, 1]])] },
  "3": { w: 4.6, t: [R([[0, 0], [1, 0], [1, 1], [0, 1]]), R([[0.3, 0.48], [1, 0.48]])] },
  "4": { w: 4.6, t: [R([[0, -0.05], [0, 0.62], [1, 0.62]]), R([[1, -0.05], [1, 1.05]])] },
  "5": { w: 4.6, t: [R([[1, 0], [0, 0], [0, 0.47], [1, 0.47], [1, 1], [0, 1]])] },
  "6": { w: 4.6, t: [R([[1, 0], [0, 0], [0, 1], [1, 1], [1, 0.47], [0, 0.47]])], chanfro: "sd" },
  "7": { w: 4.6, t: [R([[0, 0], [1, 0], [1, 0.25], [0.42, 1.05]])] },
  "8": { w: 4.6, t: [R(CX, true), R([[0, 0.48], [1, 0.48]])] },
  "9": { w: 4.6, t: [R([[0, 1], [1, 1], [1, 0], [0, 0], [0, 0.53], [1, 0.53]])], chanfro: "ie" },
  A: { w: 7.2, t: [R([[-0.02, 1.06], [0.38, 0], [0.62, 0], [1.02, 1.06]]), R([[0.12, 0.68], [0.88, 0.68]])] },
  B: { w: 6.0, t: [R([[0, 1.05], [0, 0], [0.85, 0], [0.85, 0.47], [0, 0.47]]), R([[0, 0.47], [1, 0.47], [1, 1], [0, 1]])] },
  C: { w: 5.6, t: [R([[1, 0], [0, 0], [0, 1], [1, 1]])] },
  D: { w: 6.2, t: [R([[0, 0], [0.72, 0], [1, 0.2], [1, 0.8], [0.72, 1], [0, 1]], true)] },
  E: { w: 5.4, t: [R([[1, 0], [0, 0], [0, 1], [1, 1]]), R([[0, 0.48], [0.86, 0.48]])] },
  F: { w: 5.2, t: [R([[1, 0], [0, 0], [0, 1.05]]), R([[0, 0.48], [0.86, 0.48]])] },
  G: { w: 6.2, t: [R([[1, 0], [0, 0], [0, 1], [1, 1], [1, 0.52], [0.5, 0.52]])] },
  H: { w: 6.2, t: [R([[0, -0.05], [0, 1.05]]), R([[1, -0.05], [1, 1.05]]), R([[0, 0.48], [1, 0.48]])] },
  I: { w: 1.4, t: [R([[0.5, -0.05], [0.5, 1.05]])] },
  J: { w: 5.2, t: [R([[1, -0.05], [1, 1], [0, 1], [0, 0.68]])] },
  K: { w: 6.4, t: [R([[0, -0.05], [0, 1.05]]), R([[1.02, -0.06], [0.08, 0.56]]), R([[0.36, 0.38], [1.02, 1.06]])] },
  L: { w: 4.8, t: [R([[0, -0.05], [0, 1], [1, 1]])] },
  M: { w: 8.2, t: [R([[0, 1.05], [0, 0], [0.5, 0.62], [1, 0], [1, 1.05]])] },
  N: { w: 6.4, t: [R([[0, 1.05], [0, 0], [1, 1], [1, -0.05]])] },
  O: { w: 6.4, t: [R(CX, true)] },
  P: { w: 6.0, t: [R([[0, 1.05], [0, 0], [1, 0], [1, 0.52], [0, 0.52]])] },
  Q: { w: 6.4, t: [R(CX, true), R([[0.58, 0.76], [1.06, 1.1]])] },
  R: { w: 6.4, t: [R([[0, 1.05], [0, 0], [1, 0], [1, 0.5], [0, 0.5]]), R([[0.48, 0.5], [1.02, 1.06]])] },
  S: { w: 5.8, t: [R([[1, 0], [0, 0], [0, 0.48], [1, 0.48], [1, 1], [0, 1]])] },
  T: { w: 6.0, t: [R([[-0.05, 0], [1.05, 0]]), R([[0.5, 0], [0.5, 1.05]])] },
  U: { w: 6.2, t: [R([[0, -0.05], [0, 1], [1, 1], [1, -0.05]])] },
  V: { w: 6.8, t: [R([[-0.02, -0.06], [0.5, 1], [1.02, -0.06]])] },
  W: { w: 9.2, t: [R([[-0.01, -0.06], [0.24, 1], [0.5, 0.3], [0.76, 1], [1.01, -0.06]])] },
  X: { w: 6.6, t: [R([[-0.02, -0.06], [1.02, 1.06]]), R([[1.02, -0.06], [-0.02, 1.06]])] },
  Y: { w: 7.0, t: [R([[-0.02, -0.06], [0.5, 0.56], [1.02, -0.06]]), R([[0.5, 0.5], [0.5, 1.05]])] },
  Z: { w: 6.0, t: [R([[0, 0], [1, 0], [0, 1], [1, 1]])] },
  "-": { w: 3.4, t: [R([[0, 0.55], [1, 0.55]])] },
  ".": { w: 1.4, t: [R([[0.5, 0.9], [0.5, 1.05]])] },
  " ": { w: 3.0, t: [] },
};
const ALTURA = 10; // altura da letra (unidades)

export function limparTexto(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split("")
    .filter((ch) => GLIFOS[ch])
    .join("");
}

function larguraTexto(t: string, espaco: number) {
  let w = 0;
  for (const ch of t) w += GLIFOS[ch].w + espaco;
  return Math.max(0, w - espaco);
}

// Desenha uma letra com o canto superior esquerdo da caixa em (0,0).
function desenharGlifo(c: CanvasRenderingContext2D, ch: string, T: number) {
  const g = GLIFOS[ch];
  const iw = Math.max(0, g.w - T), ih = ALTURA - T;
  c.save();
  c.beginPath();
  c.rect(0, 0, g.w, ALTURA);
  c.clip();
  c.lineWidth = T;
  c.lineJoin = "round";
  c.lineCap = "butt";
  for (const tr of g.t) {
    const p = tr.p.map(([u, v]) => [T / 2 + u * iw, T / 2 + v * ih] as [number, number]);
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    if (tr.fechado) c.closePath();
    c.stroke();
  }
  if (g.chanfro) {
    // corte em diagonal num canto (como no 6 e no 9 das camisas)
    const k = T * 1.15;
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    if (g.chanfro === "sd") {
      c.moveTo(g.w - k, -1);
      c.lineTo(g.w + 1, -1);
      c.lineTo(g.w + 1, k);
    } else {
      c.moveTo(-1, ALTURA - k);
      c.lineTo(-1, ALTURA + 1);
      c.lineTo(k, ALTURA + 1);
    }
    c.closePath();
    c.fill();
  }
  c.restore();
}

export interface OpcoesTexto {
  arcoRaio?: number; // raio do arco em alturas de letra (0 = reto)
  espessura?: number; // espessura do traço (unidades; a letra tem 10 de altura)
  espaco?: number; // espaço entre letras (unidades)
  altura?: number; // altura da letra como fração da altura do canvas (texto reto)
}

// Escreve um texto centralizado no canvas e devolve quantas "alturas de letra" cabem na altura do canvas
// (para o decalque ter o tamanho certo na camisa).
export function pintarTexto(canvas: HTMLCanvasElement, texto: string, cor: string, o: OpcoesTexto = {}) {
  const T = o.espessura ?? 1.35;
  const esp = o.espaco ?? 1.0;
  const c = canvas.getContext("2d")!;
  c.clearRect(0, 0, canvas.width, canvas.height);
  const t = limparTexto(texto);
  const W = canvas.width, H = canvas.height;
  if (!t) return H / (H * (o.altura ?? 0.8));
  const lw = larguraTexto(t, esp);
  c.fillStyle = cor;
  c.strokeStyle = cor;
  if (!o.arcoRaio) {
    let px = (H * (o.altura ?? 0.8)) / ALTURA;
    px = Math.min(px, (W * 0.96) / lw);
    c.save();
    c.translate(W / 2 - (lw * px) / 2, H / 2 - (ALTURA * px) / 2);
    c.scale(px, px);
    let x = 0;
    for (const ch of t) {
      c.save();
      c.translate(x, 0);
      desenharGlifo(c, ch, T);
      c.restore();
      x += GLIFOS[ch].w + esp;
    }
    c.restore();
    return H / (px * ALTURA);
  }
  // em arco: as letras giram em volta de um centro abaixo do texto
  let raio = o.arcoRaio * ALTURA;
  if (lw / raio > 1.25) raio = lw / 1.25;
  const meia = lw / 2 / raio; // meio ângulo
  // caixa do texto em arco (unidades): largura e altura
  const largU = 2 * (raio + ALTURA) * Math.sin(meia) + 2 * 4;
  const altU = ALTURA + raio * (1 - Math.cos(meia)) + ALTURA * Math.sin(meia) * 0.6;
  const px = Math.min((W * 0.98) / largU, (H * 0.98) / altU);
  const cx = W / 2;
  const topoY = H / 2 - (altU * px) / 2; // topo da letra do meio
  const cy = topoY + (ALTURA + raio) * px; // centro do arco
  let x = 0;
  for (const ch of t) {
    const meio = x + GLIFOS[ch].w / 2 - lw / 2;
    const ang = meio / raio;
    c.save();
    c.translate(cx + Math.sin(ang) * raio * px, cy - Math.cos(ang) * raio * px);
    c.rotate(ang);
    c.scale(px, px);
    c.translate(-GLIFOS[ch].w / 2, -ALTURA);
    desenharGlifo(c, ch, T);
    c.restore();
    x += GLIFOS[ch].w + esp;
  }
  return H / (px * ALTURA);
}

// Escudo de exemplo (igual ao da referência) ou a imagem enviada pela pessoa, recortada em círculo.
export function pintarEscudo(canvas: HTMLCanvasElement, img: HTMLImageElement | null) {
  const c = canvas.getContext("2d")!;
  const W = canvas.width;
  const r = W / 2;
  c.clearRect(0, 0, W, W);
  const disco = (raio: number, cor: string) => {
    c.fillStyle = cor;
    c.beginPath();
    c.arc(r, r, raio, 0, Math.PI * 2);
    c.fill();
  };
  if (img) {
    c.save();
    c.beginPath();
    c.arc(r, r, r * 0.98, 0, Math.PI * 2);
    c.clip();
    const s = Math.min(img.width, img.height);
    c.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, W, W);
    c.restore();
    return;
  }
  disco(r * 0.99, "#e9d430");
  disco(r * 0.93, "#4a4a4a");
  disco(r * 0.63, "#e9d430");
  disco(r * 0.58, "#ffffff");
  // estrela vermelha
  c.fillStyle = "#e3262d";
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.12 : r * 0.29;
    c.lineTo(r + Math.cos(a) * rr, r + 0.02 * r + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  // dois pontinhos brancos no anel
  for (const a of [Math.PI * 0.94, Math.PI * 0.06 + Math.PI * 0.0]) {
    const px = r + Math.cos(a) * r * 0.78, py = r + Math.sin(a) * r * 0.78 + (a > 1 ? -r * 0.06 : r * 0.1);
    c.fillStyle = "#bdbdbd";
    c.beginPath();
    c.arc(px, py, r * 0.075, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(px, py, r * 0.045, 0, Math.PI * 2);
    c.fill();
  }
}
