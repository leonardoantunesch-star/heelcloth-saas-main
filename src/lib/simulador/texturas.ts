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

  // barra da camisa: faixa fina na cor dos punhos
  ctx.fillStyle = p.corPunho;
  ctx.fillRect(0, h - 26, w, 26);

  // gola (faixa no topo; a forma V ou redonda vem da própria peça 3D)
  ctx.fillStyle = p.corGola;
  ctx.fillRect(0, 0, w, 74);
  ctx.fillStyle = clarear(p.corGola, -0.25);
  ctx.fillRect(0, 70, w, 5);

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
    ctx.drawImage(imgEscudo, w / 2 - w * 0.095 - dw / 2, h * 0.28 - dh / 2, dw, dh);
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
export function pintarTecido(canvas: HTMLCanvasElement) {
  const s = 256;
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, s, s);
  const img = ctx.getImageData(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const trama = ((x + y) % 4 < 2 ? 10 : -10);
      const ruido = (Math.random() - 0.5) * 36;
      const v = 128 + trama + ruido;
      const i = (y * s + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
