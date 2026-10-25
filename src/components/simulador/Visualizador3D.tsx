"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type * as THREE_TYPES from "three";
import type { ProjetoUniforme, TipoGola } from "@/lib/simulador/projeto";
import {
  TRONCO_H,
  TRONCO_W,
  pintarCos,
  pintarGola,
  pintarManga,
  pintarShort,
  pintarTecido,
  pintarTronco,
} from "@/lib/simulador/texturas";

type Three = typeof THREE_TYPES;

export type Vista = "conjunto" | "camisa" | "short";

export interface Visualizador3DRef {
  capturar: () => string | null;
  girarPara: (lado: "frente" | "costas") => void;
}

interface Props {
  projeto: ProjetoUniforme;
  vista: Vista;
  girarSozinho: boolean;
}

// Pontos do contorno do tronco, de baixo (barra) para cima (gola): [altura, meia-largura, meia-profundidade].
const PERFIL: [number, number, number][] = ([
  [0.0, 0.262, 0.168],
  [0.18, 0.252, 0.162],
  [0.4, 0.272, 0.176],
  [0.54, 0.29, 0.182],
  [0.6, 0.272, 0.172],
  [0.65, 0.2, 0.14],
  [0.685, 0.13, 0.102],
  [0.7, 0.115, 0.092],
] as [number, number, number][]).map(([y, a, b]) => [y * 1.14, a * 0.93, b * 0.95] as [number, number, number]);
const Y_TOPO = 0.7 * 1.14;
const SEG_U = 120;
const SEG_V = 48;

const suave = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Interpola o perfil de forma suave (curva cúbica de Catmull-Rom) e devolve amostras com o comprimento acumulado.
function amostrarPerfil() {
  const n = PERFIL.length;
  const pt = (i: number) => PERFIL[Math.min(n - 1, Math.max(0, i))];
  const saida: { y: number; a: number; b: number; s: number }[] = [];
  const por = 24;
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < por; k++) {
      const t = k / por;
      const t2 = t * t, t3 = t2 * t;
      const v = [0, 1, 2].map((c) => {
        const p0 = pt(i - 1)[c], p1 = pt(i)[c], p2 = pt(i + 1)[c], p3 = pt(i + 2)[c];
        return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      });
      saida.push({ y: v[0], a: v[1], b: v[2], s: 0 });
    }
  }
  const ult = PERFIL[n - 1];
  saida.push({ y: ult[0], a: ult[1], b: ult[2], s: 0 });
  for (let i = 1; i < saida.length; i++) {
    const dy = saida[i].y - saida[i - 1].y;
    const da = saida[i].a - saida[i - 1].a;
    saida[i].s = saida[i - 1].s + Math.hypot(dy, da);
  }
  return saida;
}

function criarTronco(THREE: Three, gola: TipoGola) {
  const amostras = amostrarPerfil();
  const total = amostras[amostras.length - 1].s;
  const linhas: { y: number; a: number; b: number; v: number }[] = [];
  for (let j = 0; j <= SEG_V; j++) {
    const alvo = (j / SEG_V) * total;
    let k = 1;
    while (k < amostras.length - 1 && amostras[k].s < alvo) k++;
    const a0 = amostras[k - 1], a1 = amostras[k];
    const f = a1.s === a0.s ? 0 : (alvo - a0.s) / (a1.s - a0.s);
    linhas.push({
      y: a0.y + (a1.y - a0.y) * f,
      a: a0.a + (a1.a - a0.a) * f,
      b: a0.b + (a1.b - a0.b) * f,
      v: j / SEG_V,
    });
  }

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= SEG_V; j++) {
    const L = linhas[j];
    for (let i = 0; i <= SEG_U; i++) {
      const u = i / SEG_U;
      const fi = 2 * Math.PI * u;
      // decote na frente (fi = PI) e uma leve curva atrás
      const dF = Math.abs(((fi - Math.PI + Math.PI * 3) % (2 * Math.PI)) - Math.PI);
      const dT = Math.abs(fi > Math.PI ? 2 * Math.PI - fi : fi);
      let dip = 0;
      if (gola === "v") dip = 0.1 * Math.max(0, 1 - dF / 0.62);
      else if (gola === "v-transp") dip = 0.17 * Math.max(0, 1 - dF / 0.66);
      else dip = 0.052 * Math.max(0, Math.cos((Math.min(dF, 0.62) / 0.62) * (Math.PI / 2)));
      dip += 0.012 * Math.max(0, Math.cos((Math.min(dT, 0.62) / 0.62) * (Math.PI / 2)));
      const y = L.y - dip * suave(0.57, Y_TOPO, L.y);
      const dobra = 1 + 0.009 * Math.sin(fi * 6 + L.y * 16) * (1 - suave(0.3, 0.62, L.y)) + 0.005 * Math.sin(fi * 11 - L.y * 23) * (1 - suave(0.2, 0.55, L.y));
      pos.push(-L.a * dobra * Math.sin(fi), y, -L.b * dobra * Math.cos(fi));
      uv.push(u, L.v);
    }
  }
  const w = SEG_U + 1;
  for (let j = 0; j < SEG_V; j++) {
    for (let i = 0; i < SEG_U; i++) {
      const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // a emenda do canvas (primeira e última coluna) precisa ter a mesma normal para não aparecer uma linha
  const n = g.getAttribute("normal");
  for (let j = 0; j <= SEG_V; j++) {
    const a = j * w, b = j * w + SEG_U;
    const x = (n.getX(a) + n.getX(b)) / 2, y = (n.getY(a) + n.getY(b)) / 2, z = (n.getZ(a) + n.getZ(b)) / 2;
    n.setXYZ(a, x, y, z);
    n.setXYZ(b, x, y, z);
  }
  return g;
}

// Tubo que acompanha uma linha (fileira) do tronco: usado na gola e na barra para dar espessura de verdade.
function anelDoTronco(THREE: Three, g: THREE_TYPES.BufferGeometry, linha: number, raio: number) {
  const pos = g.getAttribute("position");
  const pts: THREE_TYPES.Vector3[] = [];
  for (let i = 0; i < SEG_U; i += 1) {
    const k = linha * (SEG_U + 1) + i;
    pts.push(new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "centripetal"), 360, raio, 8, true);
}

const AMOSTRAS = amostrarPerfil();
function perfilEm(y: number) {
  let k = 1;
  while (k < AMOSTRAS.length - 1 && AMOSTRAS[k].y < y) k++;
  const a0 = AMOSTRAS[k - 1], a1 = AMOSTRAS[k];
  const f = a1.y === a0.y ? 0 : Math.min(1, Math.max(0, (y - a0.y) / (a1.y - a0.y)));
  return { a: a0.a + (a1.a - a0.a) * f, b: a0.b + (a1.b - a0.b) * f };
}

// Gola em V transpassada: duas abas que se cruzam no peito, uma por cima da outra.
function criarTranspassada(THREE: Three, material: THREE_TYPES.Material) {
  const grupo = new THREE.Group();
  const topo = 0.7 * 1.14 - 0.004;
  const abas: { de: number; para: number; folga: number }[] = [
    { de: 1, para: -1, folga: 0.0045 },
    { de: -1, para: 1, folga: 0.0105 },
  ];
  for (const aba of abas) {
    // as abas seguem as bordas do V (do pescoço até a ponta) e passam um pouco do centro, uma sobre a outra
    const larg0 = 0.0175;
    const fora = [aba.de * 0.93 * larg0 * 0.9, -0.37 * larg0 * 0.9];
    const ponta = [aba.de * 0.068, topo - 0.004];
    const fim = [-aba.de * 0.032, topo - 0.166];
    const ctrl = [
      [ponta[0] + fora[0], ponta[1] + fora[1]],
      [(ponta[0] + fim[0]) / 2 + fora[0], (ponta[1] + fim[1]) / 2 + fora[1]],
      [fim[0] + fora[0], fim[1] + fora[1]],
    ];
    const N = 28;
    const pos: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const larg = 0.0175;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = (1 - t) * (1 - t) * ctrl[0][0] + 2 * (1 - t) * t * ctrl[1][0] + t * t * ctrl[2][0];
      const y = (1 - t) * (1 - t) * ctrl[0][1] + 2 * (1 - t) * t * ctrl[1][1] + t * t * ctrl[2][1];
      const dx = 2 * (1 - t) * (ctrl[1][0] - ctrl[0][0]) + 2 * t * (ctrl[2][0] - ctrl[1][0]);
      const dy = 2 * (1 - t) * (ctrl[1][1] - ctrl[0][1]) + 2 * t * (ctrl[2][1] - ctrl[1][1]);
      const { a, b } = perfilEm(y);
      const xx = Math.max(-a * 0.98, Math.min(a * 0.98, x));
      const z = b * Math.sqrt(Math.max(0.02, 1 - (xx / a) ** 2)) + aba.folga;
      // normal da superfície e direção da largura da fita
      const n = new THREE.Vector3(xx / (a * a), 0.12, z / (b * b)).normalize();
      const tg = new THREE.Vector3(dx, dy, 0).normalize();
      const w = new THREE.Vector3().crossVectors(tg, n).normalize().multiplyScalar(larg);
      pos.push(xx + w.x, y + w.y, z + w.z, xx - w.x, y - w.y, z - w.z);
      uvs.push(t * 1.6, 0, t * 1.6, 1);
    }
    for (let i = 0; i < N; i++) {
      const a0 = i * 2;
      idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    grupo.add(new THREE.Mesh(g, material));
  }
  return grupo;
}

// Gola de malha: faixa que acompanha a borda do decote (V, V transpassada ou redonda), com a textura canelada.
function criarBandaGola(THREE: Three, g: THREE_TYPES.BufferGeometry, linhas = 2) {
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const w = SEG_U + 1;
  let comprimento = 0;
  for (let i = 1; i <= SEG_U; i++) {
    const a = SEG_V * w + i - 1, b = SEG_V * w + i;
    comprimento += Math.hypot(pos.getX(b) - pos.getX(a), pos.getY(b) - pos.getY(a), pos.getZ(b) - pos.getZ(a));
  }
  const rep = Math.max(1, Math.round(comprimento / 0.144));
  const P: number[] = [], N: number[] = [], UV: number[] = [], I: number[] = [];
  for (let jj = 0; jj <= linhas; jj++) {
    const j = SEG_V - linhas + jj;
    for (let i = 0; i <= SEG_U; i++) {
      const k = j * w + i;
      P.push(pos.getX(k) + nor.getX(k) * 0.0032, pos.getY(k) + nor.getY(k) * 0.0032, pos.getZ(k) + nor.getZ(k) * 0.0032);
      N.push(nor.getX(k), nor.getY(k), nor.getZ(k));
      UV.push((i / SEG_U) * rep, jj / linhas);
    }
  }
  for (let jj = 0; jj < linhas; jj++) {
    for (let i = 0; i < SEG_U; i++) {
      const a = jj * w + i, b = a + 1, c = a + w, d = c + 1;
      I.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  geo.setIndex(I);
  return geo;
}

function raioPunho(longa: boolean) {
  return longa ? 0.07 : 0.076;
}

function criarPunho(THREE: Three, longa: boolean) {
  const g = new THREE.TorusGeometry(raioPunho(longa), 0.0085, 8, 48);
  g.rotateX(Math.PI / 2);
  g.scale(1, 1, 1.12);
  g.translate(0, longa ? -0.5 : -0.19, 0);
  return g;
}

function criarManga(THREE: Three, longa: boolean) {
  const comp = longa ? 0.5 : 0.19;
  const g = new THREE.CylinderGeometry(0.097, raioPunho(longa), comp, 40, 8, true);
  g.translate(0, -comp / 2, 0); // ombro na origem, punho para baixo
  g.scale(1, 1, 1.12);
  return g;
}

export const Visualizador3D = forwardRef<Visualizador3DRef, Props>(function Visualizador3D(
  { projeto, vista, girarSozinho },
  ref
) {
  const caixa = useRef<HTMLDivElement>(null);
  const estado = useRef<{
    THREE: Three;
    renderer: THREE_TYPES.WebGLRenderer;
    scene: THREE_TYPES.Scene;
    camera: THREE_TYPES.PerspectiveCamera;
    controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
    grupoCamisa: THREE_TYPES.Group;
    grupoShort: THREE_TYPES.Group;
    tronco: THREE_TYPES.Mesh;
    mangaD: THREE_TYPES.Mesh;
    mangaE: THREE_TYPES.Mesh;
    texTronco: THREE_TYPES.CanvasTexture;
    texManga: THREE_TYPES.CanvasTexture;
    texQuadril: THREE_TYPES.CanvasTexture;
    texPernaD: THREE_TYPES.CanvasTexture;
    texPernaE: THREE_TYPES.CanvasTexture;
    texCos: THREE_TYPES.CanvasTexture;
    texGola: THREE_TYPES.CanvasTexture;
    canvases: Record<string, HTMLCanvasElement>;
    golaTubo: THREE_TYPES.Mesh;
    transp: THREE_TYPES.Group;
    ombroD: THREE_TYPES.Mesh;
    ombroE: THREE_TYPES.Mesh;
    cordao: THREE_TYPES.Group;
    meias: THREE_TYPES.Group;
    barraTubo: THREE_TYPES.Mesh;
    punhoD: THREE_TYPES.Mesh;
    punhoE: THREE_TYPES.Mesh;
    golaAtual: TipoGola;
    longaAtual: boolean;
    parar: boolean;
    alvoY: number;
    alvoDist: number;
  } | null>(null);
  const escudoImg = useRef<HTMLImageElement | null>(null);
  const escudoSrc = useRef<string | null>(null);
  const propsAtuais = useRef({ projeto, vista, girarSozinho });
  propsAtuais.current = { projeto, vista, girarSozinho };

  // Repinta as texturas e ajusta as peças conforme o projeto.
  const aplicar = () => {
    const e = estado.current;
    if (!e) return;
    const { projeto: p, vista: v, girarSozinho: g } = propsAtuais.current;
    const { THREE } = e;

    pintarTronco(e.canvases.tronco, p, escudoImg.current);
    pintarManga(e.canvases.manga, p);
    pintarShort(e.canvases.quadril, p, true);
    // o quadril mostra as duas faixas laterais
    const ctxQ = e.canvases.quadril.getContext("2d")!;
    ctxQ.fillStyle = p.shortFaixa;
    ctxQ.fillRect(0.75 * 512 - 26, 0, 52, 512);
    pintarShort(e.canvases.pernaD, p, true);
    pintarShort(e.canvases.pernaE, p, false);
    pintarCos(e.canvases.cos, p);
    pintarGola(e.canvases.gola, p);
    e.texGola.needsUpdate = true;
    [e.texTronco, e.texManga, e.texQuadril, e.texPernaD, e.texPernaE, e.texCos].forEach((t) => (t.needsUpdate = true));

    if (e.golaAtual !== p.gola) {
      e.tronco.geometry.dispose();
      e.tronco.geometry = criarTronco(THREE, p.gola);
      e.golaTubo.geometry.dispose();
      e.golaTubo.geometry = criarBandaGola(THREE, e.tronco.geometry);
      e.golaAtual = p.gola;
    }
    if (e.longaAtual !== p.mangaLonga) {
      e.mangaD.geometry.dispose();
      e.mangaD.geometry = criarManga(THREE, p.mangaLonga);
      e.mangaE.geometry = e.mangaD.geometry;
      e.punhoD.geometry.dispose();
      e.punhoD.geometry = criarPunho(THREE, p.mangaLonga);
      e.punhoE.geometry = e.punhoD.geometry;
      e.longaAtual = p.mangaLonga;
    }
    e.transp.visible = p.gola === "v-transp";
    (e.ombroD.material as THREE_TYPES.MeshStandardMaterial).color.set(p.corManga);
    e.meias.children.forEach((m, i) => {
      const mm = (m as THREE_TYPES.Mesh).material as THREE_TYPES.MeshStandardMaterial;
      mm.color.set(i % 3 === 1 ? p.meiaoFaixa : p.meiao);
    });
    e.cordao.children.forEach((m) => ((m as THREE_TYPES.Mesh).material as THREE_TYPES.MeshStandardMaterial).color.set(p.shortFaixa));
    (e.barraTubo.material as THREE_TYPES.MeshStandardMaterial).color.set(p.corPunho);
    (e.punhoD.material as THREE_TYPES.MeshStandardMaterial).color.set(p.corPunho);
    const ang = p.mangaLonga ? 0.3 : 0.6;
    e.mangaD.rotation.z = ang;
    e.mangaE.rotation.z = -ang;
    e.punhoE.rotation.z = -ang;
    e.punhoD.rotation.z = ang;

    e.grupoCamisa.visible = v !== "short";
    e.grupoShort.visible = v !== "camisa";
    if (v === "conjunto") {
      e.grupoCamisa.position.y = 0.1;
      e.grupoShort.position.y = 0.088;
      e.alvoY = 0.02;
      e.alvoDist = 3.6;
    } else if (v === "camisa") {
      e.grupoCamisa.position.y = 0;
      e.alvoY = 0.4;
      e.alvoDist = 2.2;
    } else {
      e.grupoShort.position.y = 0;
      e.alvoY = -0.3;
      e.alvoDist = 3.0;
    }
    e.controls.autoRotate = g;
  };

  useImperativeHandle(ref, () => ({
    capturar: () => {
      const e = estado.current;
      if (!e) return null;
      e.renderer.render(e.scene, e.camera);
      const origem = e.renderer.domElement;
      const saida = document.createElement("canvas");
      saida.width = origem.width;
      saida.height = origem.height;
      const ctx = saida.getContext("2d")!;
      ctx.fillStyle = "#f2f2f2";
      ctx.fillRect(0, 0, saida.width, saida.height);
      ctx.drawImage(origem, 0, 0);
      return saida.toDataURL("image/png");
    },
    girarPara: (lado) => {
      const e = estado.current;
      if (!e) return;
      const d = e.camera.position.length();
      const alt = e.camera.position.y - e.controls.target.y;
      const z = Math.sqrt(Math.max(0.01, d * d - alt * alt));
      e.camera.position.set(0, e.controls.target.y + alt, lado === "frente" ? z : -z);
      e.controls.update();
    },
  }));

  // Monta a cena uma única vez.
  useEffect(() => {
    let cancelado = false;
    let observador: ResizeObserver | null = null;
    let quadro = 0;

    (async () => {
      const THREE = (await import("three")) as Three;
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const alvo = caixa.current;
      if (cancelado || !alvo) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      alvo.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "none";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0.3, 4.1);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.3;
      controls.maxDistance = 5.2;
      controls.minPolarAngle = Math.PI * 0.28;
      controls.maxPolarAngle = Math.PI * 0.62;
      controls.autoRotateSpeed = 2.2;
      controls.target.set(0, 0.2, 0);

      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.55;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd2d2d2, 0.8));
      const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.5);
      luzPrincipal.position.set(2, 3, 3);
      scene.add(luzPrincipal);
      const luzFundo = new THREE.DirectionalLight(0xffffff, 1.1);
      luzFundo.position.set(-2.5, 1.5, -3);
      scene.add(luzFundo);

      // sombra suave no chão
      const cs = document.createElement("canvas");
      cs.width = cs.height = 128;
      const cx = cs.getContext("2d")!;
      const grad = cx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, "rgba(0,0,0,0.28)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = grad;
      cx.fillRect(0, 0, 128, 128);
      const sombra = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.7),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cs), transparent: true, depthWrite: false })
      );
      sombra.rotation.x = -Math.PI / 2;
      sombra.position.y = -0.83;
      scene.add(sombra);

      const canvases: Record<string, HTMLCanvasElement> = {};
      ["tronco", "manga", "quadril", "pernaD", "pernaE", "cos", "gola", "tecido"].forEach(
        (k) => (canvases[k] = document.createElement("canvas"))
      );
      pintarTecido(canvases.tecido);
      const relevo = new THREE.CanvasTexture(canvases.tecido);
      relevo.wrapS = relevo.wrapT = THREE.RepeatWrapping;
      relevo.repeat.set(44, 22);

      const tex = (c: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      };
      const texTronco = tex(canvases.tronco);
      const texManga = tex(canvases.manga);
      const texQuadril = tex(canvases.quadril);
      const texPernaD = tex(canvases.pernaD);
      const texPernaE = tex(canvases.pernaE);
      const texCos = tex(canvases.cos);
      // pinta uma vez antes de criar os materiais, para os canvases já terem tamanho
      canvases.tronco.width = TRONCO_W;
      canvases.tronco.height = TRONCO_H;

      const mat = (map: THREE_TYPES.Texture) =>
        new THREE.MeshStandardMaterial({
          map,
          bumpMap: relevo,
          bumpScale: 0.45,
          roughness: 0.88,
          metalness: 0,
          side: THREE.DoubleSide,
        });

      const p0 = propsAtuais.current.projeto;
      const grupoCamisa = new THREE.Group();
      const tronco = new THREE.Mesh(criarTronco(THREE, p0.gola), mat(texTronco));
      const geoManga = criarManga(THREE, p0.mangaLonga);
      const mangaD = new THREE.Mesh(geoManga, mat(texManga));
      const mangaE = new THREE.Mesh(geoManga, mat(texManga));
      mangaD.position.set(0.232, 0.682, 0);
      mangaE.position.set(-0.232, 0.682, 0);
      const matFio = () => new THREE.MeshStandardMaterial({ color: p0.corGola, roughness: 0.8 });
      pintarGola(canvases.gola, p0);
      const texGola = tex(canvases.gola);
      texGola.wrapS = THREE.RepeatWrapping;
      const matGola = new THREE.MeshStandardMaterial({ map: texGola, roughness: 0.92, side: THREE.DoubleSide });
      const golaTubo = new THREE.Mesh(criarBandaGola(THREE, tronco.geometry), matGola);
      const barraTubo = new THREE.Mesh(anelDoTronco(THREE, tronco.geometry, 0, 0.0095), matFio());
      const geoPunho = criarPunho(THREE, p0.mangaLonga);
      const matPunho = matFio();
      const punhoD = new THREE.Mesh(geoPunho, matPunho);
      const punhoE = new THREE.Mesh(geoPunho, matPunho);
      punhoD.position.copy(mangaD.position);
      punhoE.position.copy(mangaE.position);
      const matOmbro = () => new THREE.MeshStandardMaterial({ color: p0.corManga, roughness: 0.88, bumpMap: relevo, bumpScale: 0.9 });
      const geoOmbro = new THREE.SphereGeometry(0.092, 28, 18);
      geoOmbro.scale(1, 0.7, 1.05);
      const matOmbroUnico = matOmbro();
      const ombroD = new THREE.Mesh(geoOmbro, matOmbroUnico);
      const ombroE = new THREE.Mesh(geoOmbro, matOmbroUnico);
      ombroD.position.copy(mangaD.position);
      ombroD.position.y -= 0.02;
      ombroE.position.copy(mangaE.position);
      ombroE.position.y -= 0.02;
      const transp = criarTranspassada(THREE, matGola);
      grupoCamisa.add(tronco, mangaD, mangaE, ombroD, ombroE, golaTubo, barraTubo, punhoD, punhoE, transp);

      const grupoShort = new THREE.Group();
      const cos = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.055, 64, 1, true), mat(texCos));
      cos.scale.set(0.238, 1, 0.16);
      cos.position.y = -0.0275;
      // cada perna é um cone elíptico que abre um pouco na barra; as duas se encontram no meio
      const pernaGeo = new THREE.CylinderGeometry(0.128, 0.142, 0.43, 44, 10, true);
      pernaGeo.translate(0, -0.215, 0);
      const pernaD = new THREE.Mesh(pernaGeo, mat(texPernaD));
      const pernaE = new THREE.Mesh(pernaGeo, mat(texPernaE));
      pernaD.scale.z = pernaE.scale.z = 1.04;
      pernaD.position.set(0.108, -0.03, 0);
      pernaE.position.set(-0.108, -0.03, 0);
      pernaD.rotation.z = 0.02;
      pernaE.rotation.z = -0.02;
      const quadril = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01), mat(texQuadril));
      quadril.visible = false;
      // cordão: nó e duas pontas pendendo na frente do cós
      const cordao = new THREE.Group();
      const matCordao = () => new THREE.MeshStandardMaterial({ color: p0.shortFaixa, roughness: 0.7 });
      const no = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 12, 8), matCordao());
      no.position.set(0, -0.03, 0.164);
      cordao.add(no);
      for (const lado of [-1, 1]) {
        const curva = new THREE.CatmullRomCurve3([
          new THREE.Vector3(lado * 0.004, -0.032, 0.174),
          new THREE.Vector3(lado * 0.022, -0.075, 0.178),
          new THREE.Vector3(lado * 0.03, -0.125, 0.18),
        ]);
        cordao.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 12, 0.0042, 6), matCordao()));
      }
      // meiões: canela, faixa e pé
      const meias = new THREE.Group();
      const matMeia = new THREE.MeshStandardMaterial({ color: p0.meiao, roughness: 0.9, bumpMap: relevo, bumpScale: 0.6 });
      const matFaixaMeia = new THREE.MeshStandardMaterial({ color: p0.meiaoFaixa, roughness: 0.8 });
      for (const lado of [-1, 1]) {
        const canela = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.05, 0.36, 32, 4, true), matMeia);
        canela.material.side = THREE.DoubleSide;
        canela.position.set(lado * 0.108, -0.6, 0);
        const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 8, 32), matFaixaMeia);
        faixa.rotation.x = Math.PI / 2;
        faixa.position.set(lado * 0.108, -0.52, 0);
        const pe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), matMeia);
        pe.scale.set(0.95, 0.7, 1.7);
        pe.position.set(lado * 0.108, -0.79, 0.04);
        meias.add(canela, faixa, pe);
      }
      grupoShort.add(pernaD, pernaE, cos, cordao, quadril, meias);

      scene.add(grupoCamisa, grupoShort);

      estado.current = {
        THREE, renderer, scene, camera, controls, grupoCamisa, grupoShort, tronco, mangaD, mangaE,
        texTronco, texManga, texQuadril, texPernaD, texPernaE, texCos, texGola, canvases,
        golaTubo, barraTubo, punhoD, punhoE, transp, ombroD, ombroE, cordao, meias,
        golaAtual: p0.gola, longaAtual: p0.mangaLonga, parar: false, alvoY: 0.2, alvoDist: 3.1,
      };
      if (process.env.NODE_ENV !== "production") (window as unknown as { __sim?: unknown }).__sim = estado.current;
      aplicar();
      controls.target.set(0, estado.current.alvoY, 0);
      camera.position.set(0, estado.current.alvoY + 0.3, estado.current.alvoDist);

      const ajustar = () => {
        const r = alvo.getBoundingClientRect();
        const w = Math.max(200, r.width), h = Math.max(200, r.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      ajustar();
      observador = new ResizeObserver(ajustar);
      observador.observe(alvo);

      const laco = () => {
        const e = estado.current;
        if (!e || e.parar) return;
        // acompanha suavemente o foco da vista escolhida
        e.controls.target.y += (e.alvoY - e.controls.target.y) * 0.1;
        const dist = e.camera.position.length();
        const alvoDist = e.alvoDist;
        if (Math.abs(dist - alvoDist) > 0.01 && !e.controls.autoRotate) {
          // só aproxima/afasta quando a vista muda; depois a pessoa pode dar zoom livremente
        }
        e.controls.update();
        e.renderer.render(e.scene, e.camera);
        quadro = requestAnimationFrame(laco);
      };
      laco();
    })();

    return () => {
      cancelado = true;
      cancelAnimationFrame(quadro);
      observador?.disconnect();
      const e = estado.current;
      if (e) {
        e.parar = true;
        e.controls.dispose();
        e.scene.traverse((o) => {
          const m = o as THREE_TYPES.Mesh;
          if (m.geometry) m.geometry.dispose();
        });
        e.renderer.dispose();
        e.renderer.domElement.remove();
      }
      estado.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O escudo vem como imagem; carrega e repinta quando muda.
  useEffect(() => {
    const src = projeto.escudo;
    if (src === escudoSrc.current) return;
    escudoSrc.current = src;
    if (!src) {
      escudoImg.current = null;
      aplicar();
      return;
    }
    const img = new Image();
    img.onload = () => {
      escudoImg.current = img;
      aplicar();
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto.escudo]);

  // Qualquer mudança no projeto, na vista ou no giro automático.
  useEffect(() => {
    aplicar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto, vista, girarSozinho]);

  // Ao trocar de vista, reposiciona a câmera na distância adequada.
  useEffect(() => {
    const e = estado.current;
    if (!e) return;
    const dir = e.camera.position.clone().sub(e.controls.target).normalize();
    e.camera.position.copy(e.controls.target.clone().add(dir.multiplyScalar(e.alvoDist)));
  }, [vista]);

  return <div ref={caixa} className="h-full w-full" />;
});
