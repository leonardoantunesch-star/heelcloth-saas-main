import type { ProjetoUniforme } from "./projeto";

// Pinta, em canvas 2D, as texturas que são coladas nas peças 3D.
// Convenção: no tronco, x = 0 é o centro das COSTAS e x = largura / 2 é o centro da FRENTE.
// O topo do canvas (y = 0) é a gola; a base é a barra.

export const TRONCO_W = 2048;
export const TRONCO_H = 1024;

const clarear = (hex: string, q: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (q >= 0 ? (255 - v) * q : v * q))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
};

function listrasVerticais(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, cor: string) {
  const pares = Math.max(2, n) * 2; // faixas totais (par = cor de fundo, ímpar = detalhe)
  const larg = w / pares;
  ctx.fillStyle = cor;
  // desloca meia faixa para uma listra ficar centrada na frente
  for (let i = 0; i < pares; i += 2) ctx.fillRect(i * larg + larg / 2, 0, larg, h);
  ctx.fillRect(-larg / 2, 0, larg, h);
}

export function pintarTronco(canvas: HTMLCanvasElement, p: ProjetoUniforme, imgEscudo: HTMLImageElement | null) {
  const w = TRONCO_W, h = TRONCO_H;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = p.corBase;
  ctx.fillRect(0, 0, w, h);

  switch (p.padrao) {
    case "curvas": {
      const cx = w / 2;
      ctx.strokeStyle = p.corDetalhe;
      ctx.lineWidth = 15;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.23, h * 0.36);
      ctx.bezierCurveTo(cx - w * 0.04, h * 0.44, cx - w * 0.22, h * 0.88, cx - w * 0.13, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, h * 0.6);
      ctx.bezierCurveTo(cx - w * 0.06, h * 0.36, cx + w * 0.16, h * 0.5, cx + w * 0.11, h);
      ctx.stroke();
      break;
    }
    case "esportivo": {
      const cx = w / 2;
      // cabeçada preta nos ombros, descendo em diagonal pela frente
      ctx.fillStyle = p.corDetalhe;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.36, 0);
      ctx.lineTo(cx + w * 0.36, 0);
      ctx.lineTo(cx + w * 0.36, h * 0.12);
      ctx.lineTo(cx - w * 0.36, h * 0.42);
      ctx.closePath();
      ctx.fill();
      // faixas claras acompanhando a diagonal
      ctx.fillStyle = "#ffffff";
      const faixas: [number, number, number, number][] = [
        [-0.06, 0.4, 0.3, 0.018],
        [-0.02, 0.48, 0.34, 0.03],
        [0.04, 0.5, 0.3, 0.014],
        [-0.1, 0.56, 0.24, 0.022],
        [0.1, 0.62, 0.2, 0.012],
      ];
      for (const [dx, dy, comp, esp] of faixas) {
        const x0 = cx + w * dx, y0 = h * (0.4 - dy * 0.28 + 0.1);
        const x1 = x0 + w * comp * 0.9, y1 = y0 - h * comp * 0.36;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + w * 0.006, y1 + h * esp);
        ctx.lineTo(x0 + w * 0.006, y0 + h * esp);
        ctx.closePath();
        ctx.fill();
      }
      // costas: faixa preta nos ombros
      ctx.fillStyle = p.corDetalhe;
      ctx.fillRect(0, 0, w * 0.34, h * 0.17);
      ctx.fillRect(w * 0.66, 0, w * 0.34, h * 0.17);
      break;
    }
    case "listras-v":
      listrasVerticais(ctx, w, h, p.listras, p.corDetalhe);
      break;
    case "listras-h": {
      const n = Math.max(2, p.listras);
      const alt = h / (n * 2);
      ctx.fillStyle = p.corDetalhe;
      for (let i = 0; i < n; i++) ctx.fillRect(0, i * alt * 2 + alt, w, alt);
      break;
    }
    case "diagonal": {
      // faixa larga cruzando a frente (do ombro direito do jogador à barra esquerda)
      ctx.fillStyle = p.corDetalhe;
      const cx = w / 2;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.16, 0);
      ctx.lineTo(cx + w * 0.02, 0);
      ctx.lineTo(cx + w * 0.2, h);
      ctx.lineTo(cx + w * 0.02, h);
      ctx.closePath();
      ctx.fill();
      // e uma fina ao lado
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.06, 0);
      ctx.lineTo(cx + w * 0.1, 0);
      ctx.lineTo(cx + w * 0.28, h);
      ctx.lineTo(cx + w * 0.24, h);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "metades":
      ctx.fillStyle = p.corDetalhe;
      ctx.fillRect(w / 2, 0, w / 2, h);
      break;
    case "degrade": {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, p.corBase);
      g.addColorStop(1, p.corDetalhe);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    default:
      break;
  }

  // corte raglan: a manga sobe até o pescoço em diagonal, com costura aparente
  if (p.raglan) {
    ctx.fillStyle = p.corManga;
    for (const c of [0.25, 0.75]) {
      ctx.beginPath();
      ctx.moveTo(w * (c + 0.2), 0);
      ctx.lineTo(w * (c + 0.08), h * 0.3);
      ctx.lineTo(w * (c - 0.08), h * 0.3);
      ctx.lineTo(w * (c - 0.2), 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    for (const c of [0.25, 0.75]) {
      for (const lado of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(w * (c + lado * 0.2), 0);
        ctx.lineTo(w * (c + lado * 0.08), h * 0.3);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
  }

  // barra da camisa: faixa fina na cor dos punhos
  ctx.fillStyle = p.corPunho;
  ctx.fillRect(0, h - 26, w, 26);

  // costura da barra
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, h - 44);
  ctx.lineTo(w, h - 44);
  ctx.stroke();
  ctx.setLineDash([]);

  // gola (faixa no topo; a forma V ou redonda vem da própria peça 3D)
  ctx.fillStyle = p.corGola;
  ctx.fillRect(0, 0, w, 44);

  // textos
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fonte = (px: number) => `800 ${px}px "Arial Black", Impact, Arial, sans-serif`;
  const contorno = (txt: string, x: number, y: number, px: number) => {
    ctx.font = fonte(px);
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(4, px * 0.07);
    ctx.strokeStyle = clarear(p.corTexto, -0.75);
    ctx.globalAlpha = 0.35;
    ctx.strokeText(txt, x, y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.corTexto;
    ctx.fillText(txt, x, y);
  };
  // desenha em x e nas cópias de ±w para o texto atravessar a emenda do canvas
  const emTodasAsVoltas = (fn: (x: number) => void, x0: number) => {
    fn(x0);
    if (x0 < w * 0.25) fn(x0 + w);
    if (x0 > w * 0.75) fn(x0 - w);
  };

  const nome = p.nome.trim().toUpperCase();
  const numero = p.numero.trim();
  if (nome) {
    const px = Math.min(104, 1100 / Math.max(6, nome.length) * 1.5);
    emTodasAsVoltas((x) => contorno(nome, x, h * 0.27, px), 0);
  }
  if (numero) {
    emTodasAsVoltas((x) => contorno(numero, x, h * 0.55, 400), 0);
    if (p.numeroFrente) contorno(numero, w / 2, h * 0.5, 190);
  }
  if (imgEscudo) {
    // peito esquerdo de quem olha a frente (lado do coração do jogador fica à direita de quem vê)
    const alvo = 170;
    const escala = Math.min(alvo / imgEscudo.width, alvo / imgEscudo.height);
    const dw = imgEscudo.width * escala, dh = imgEscudo.height * escala;
    ctx.drawImage(imgEscudo, w / 2 + w * 0.1 - dw / 2, h * 0.28 - dh / 2, dw, dh);
  }
  return canvas;
}

export function pintarManga(canvas: HTMLCanvasElement, p: ProjetoUniforme) {
  const w = 512, h = 256;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = p.corManga;
  ctx.fillRect(0, 0, w, h);
  if (p.padrao === "listras-h") {
    const n = Math.max(2, p.listras);
    const alt = h / (n * 2);
    ctx.fillStyle = p.corDetalhe;
    for (let i = 0; i < n; i++) ctx.fillRect(0, i * alt * 2 + alt, w, alt);
  }
  // punho: faixa na ponta (a ponta fica embaixo do canvas)
  ctx.fillStyle = p.corPunho;
  ctx.fillRect(0, h - 38, w, 38);
  ctx.fillStyle = clarear(p.corPunho, -0.25);
  ctx.fillRect(0, h - 40, w, 3);
  return canvas;
}

export function pintarShort(canvas: HTMLCanvasElement, p: ProjetoUniforme, ladoDireito: boolean) {
  const w = 512, h = 512;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = p.shortBase;
  ctx.fillRect(0, 0, w, h);
  // faixa lateral externa: a perna direita (x > 0) tem o lado de fora em u = 0.25; a esquerda em u = 0.75
  const centro = (ladoDireito ? 0.25 : 0.75) * w;
  ctx.fillStyle = p.shortFaixa;
  ctx.fillRect(centro - 26, 0, 52, h);
  // barra
  ctx.fillStyle = p.shortFaixa;
  ctx.fillRect(0, h - 14, w, 14);
  return canvas;
}

export function pintarCos(canvas: HTMLCanvasElement, p: ProjetoUniforme) {
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = p.shortCos;
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = clarear(p.shortCos, 0.35);
  ctx.fillRect(0, 30, 256, 3);
  return canvas;
}

// Textura de tecido: ruído fino usado como relevo, para a peça não parecer de plástico.
// Gola de malha canelada: listras claras e finas costuras em pé, como na gola em V das camisas de verdade.
export function pintarGola(canvas: HTMLCanvasElement, p: ProjetoUniforme) {
  const w = 256, h = 64;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = p.corGola;
  ctx.fillRect(0, 0, w, h);
  // o topo do canvas é a borda do decote; as listras ficam perto dela
  ctx.fillStyle = p.corGolaListra;
  ctx.fillRect(0, h * 0.1, w, h * 0.18);
  ctx.fillRect(0, h * 0.36, w, h * 0.14);
  // canelado: uma linha escura e uma clara a cada 8 px
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(x + 3, 0, 2, h);
  }
  return canvas;
}

// Textura de tecido: malha de jersey (pequenos "V" em coluna), usada como relevo.
export function pintarTecido(canvas: HTMLCanvasElement) {
  const s = 64;
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(0, 0, s, s);
  const passo = 4;
  for (let r = 0; r < s / passo; r++) {
    for (let c = 0; c < s / passo; c++) {
      const x = c * passo, y = r * passo;
      ctx.strokeStyle = "#f0f0f0";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y + 3);
      ctx.lineTo(x + 4, y);
      ctx.stroke();
      ctx.strokeStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.moveTo(x, y + 3.6);
      ctx.lineTo(x + 2, y + 3.6);
      ctx.lineTo(x + 4, y + 3.6);
      ctx.stroke();
    }
  }
  return canvas;
}
