"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type * as T from "three";
import { gradiente, montarCamisa, projetar, suavizarLaço, type CamisaMolde, type V3 } from "@/lib/simulador/molde";
import { pintarEscudo, pintarOndas, pintarRibana, pintarTexto } from "@/lib/simulador/estampas";

export interface ConfigCamisa {
  corBase: string;
  corLinhas: string;
  corAcabamento: string; // gola e punhos
  corTexto: string;
  gola: "v" | "redonda";
  mangaLonga: boolean;
  nome: string;
  numero: string;
  numeroFrente: boolean;
  escudo: string | null; // data URL
  fundo: string;
}

export const CONFIG_PADRAO: ConfigCamisa = {
  corBase: "#2f2f31",
  corLinhas: "#c9a25a",
  corAcabamento: "#c9a462",
  corTexto: "#ffffff",
  gola: "v",
  mangaLonga: false,
  nome: "PLAYER",
  numero: "06",
  numeroFrente: true,
  escudo: null,
  fundo: "#d9b791",
};

export interface Enquadramento {
  angulo: number; // graus (0 = frente, 180 = costas)
  elevacao: number; // graus
  distancia: number;
  fov: number;
  alvoY: number;
}

export interface Camisa3DRef {
  girarPara: (anguloGraus: number, instantaneo?: boolean) => void;
  enquadrar: (e: Enquadramento) => void;
  capturar: () => string | null;
}

type Three = typeof T;
const ESCALA_U = 1 / 0.64; // a estampa cobre a largura da camisa
const ESCALA_V = 1 / 0.8;

// Material da camisa: a estampa é aplicada pela posição no espaço (projeção triplanar), então
// continua igual na frente, nas costas, nas mangas e até nas dobras, sem costuras de textura.
export const AJUSTE_LUZ = { linhaMetal: 0.35, linhaAspereza: 0.42, tecidoAspereza: 0.78, brilhoTecido: 0.25, exposicao: 0.92, ambiente: 0.75, principal: 1.9, contra: 0.6, ceu: 0.4 };

function materialEstampado(THREE: Three, cor: T.Texture, brilho: T.Texture, o: { avesso?: boolean } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.avesso ? 0x777777 : 0xffffff,
    roughness: o.avesso ? 0.95 : AJUSTE_LUZ.tecidoAspereza,
    metalness: 0.0,
    sheen: o.avesso ? 0 : AJUSTE_LUZ.brilhoTecido,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x555555),
    side: o.avesso ? THREE.BackSide : THREE.FrontSide,
  });
  const metal = o.avesso ? 0 : AJUSTE_LUZ.linhaMetal;
  const aspera = o.avesso ? 0.95 : AJUSTE_LUZ.linhaAspereza;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.mapaEstampa = { value: cor };
    sh.uniforms.mapaBrilho = { value: brilho };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPosObj;\nvarying vec3 vNorObj;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosObj = position;\nvNorObj = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D mapaEstampa;
uniform sampler2D mapaBrilho;
varying vec3 vPosObj;
varying vec3 vNorObj;
vec4 triplanar(sampler2D t) {
  vec3 w = pow(abs(normalize(vNorObj)), vec3(14.0));
  w /= (w.x + w.y + w.z);
  vec2 uz = vec2(vPosObj.x * ${ESCALA_U.toFixed(4)} + 0.5, vPosObj.y * ${ESCALA_V.toFixed(4)} + 0.5);
  vec2 ux = vec2(vPosObj.z * ${ESCALA_U.toFixed(4)} + 0.5, vPosObj.y * ${ESCALA_V.toFixed(4)} + 0.5);
  vec2 uy = vec2(vPosObj.x * ${ESCALA_U.toFixed(4)} + 0.5, vPosObj.z * ${ESCALA_U.toFixed(4)} + 0.5);
  return texture2D(t, uz) * w.z + texture2D(t, ux) * w.x + texture2D(t, uy) * w.y;
}`
      )
      .replace("#include <map_fragment>", "vec4 corEstampa = triplanar(mapaEstampa);\ndiffuseColor.rgb *= corEstampa.rgb;\nfloat brilhoEstampa = triplanar(mapaBrilho).r;")
      .replace("#include <roughnessmap_fragment>", `float roughnessFactor = mix(roughness, ${aspera.toFixed(3)}, brilhoEstampa);`)
      .replace("#include <metalnessmap_fragment>", `float metalnessFactor = mix(metalness, ${metal.toFixed(3)}, brilhoEstampa);`);
  };
  return m;
}

// Faixa que acompanha uma borda da camisa (gola, punho, barra). "perfil" é a seção da faixa:
// pares [distância a partir da borda, altura acima do tecido].
function faixaNaBorda(THREE: Three, molde: CamisaMolde, pontos: V3[], perfil: [number, number][], n: number, repeteU: number) {
  const laço = suavizarLaço(pontos, n, 8);
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i < n; i++) {
    const P = projetar(molde.campo, laço[i]);
    const N = gradiente(molde.campo, ...P);
    const a = laço[(i - 1 + n) % n], b = laço[(i + 1) % n];
    const Tg: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    let D: V3 = [N[1] * Tg[2] - N[2] * Tg[1], N[2] * Tg[0] - N[0] * Tg[2], N[0] * Tg[1] - N[1] * Tg[0]];
    const l = Math.hypot(...D) || 1;
    D = [D[0] / l, D[1] / l, D[2] / l];
    if (molde.cortado([P[0] + D[0] * 0.012, P[1] + D[1] * 0.012, P[2] + D[2] * 0.012])) D = [-D[0], -D[1], -D[2]];
    perfil.forEach(([d, h], j) => {
      let q: V3 = [P[0] + D[0] * d, P[1] + D[1] * d, P[2] + D[2] * d];
      if (d > 0.004) q = projetar(molde.campo, q);
      const Nq = d > 0.004 ? gradiente(molde.campo, ...q) : N;
      pos.push(q[0] + Nq[0] * h, q[1] + Nq[1] * h, q[2] + Nq[2] * h);
      uv.push((i / n) * repeteU, j / (perfil.length - 1));
    });
  }
  const m = perfil.length;
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j, b = i2 * m + j, c = i2 * m + j + 1, d = i * m + j + 1;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}


const suaveDegrau = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ponto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function malhaDeFaixa(THREE: Three, linhas: V3[][], repeteU: number) {
  // linhas[i][j]: i ao longo do contorno (fechado), j através da faixa
  const n = linhas.length, m = linhas[0].length;
  const pos: number[] = [];
  const uv: number[] = [];
  linhas.forEach((l, i) => l.forEach((p, j) => {
    pos.push(...p);
    uv.push((i / n) * repeteU, j / (m - 1));
  }));
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j, b = i2 * m + j, c = i2 * m + j + 1, d = i * m + j + 1;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Faixa (ribana) que sai de uma borda e continua para dentro da abertura: na gola sobe em direção ao
// pescoço (nas costas fica em pé), no punho continua a manga. Devolve a borda livre para o acabamento.
function faixaSaindo(
  THREE: Three,
  molde: CamisaMolde,
  pontos: V3[],
  n: number,
  largura: number,
  subida: (P: V3) => number,
  perfil: [number, number][],
  repeteU: number,
  aperto = 0
) {
  const laço = suavizarLaço(pontos, n, 8);
  const linhas: V3[][] = [];
  const borda: V3[] = [], dirs: V3[] = [], normais: V3[] = [];
  for (let i = 0; i < n; i++) {
    const P = projetar(molde.campo, laço[i]);
    const N = gradiente(molde.campo, ...P);
    const a = laço[(i - 1 + n) % n], b = laço[(i + 1) % n];
    const Tg = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    let D = norm(cruz(N, Tg));
    if (molde.cortado([P[0] + D[0] * 0.012, P[1] + D[1] * 0.012, P[2] + D[2] * 0.012])) D = [-D[0], -D[1], -D[2]];
    // direção da faixa: para dentro da abertura, misturada com "para cima"
    const w = subida(P);
    let dir = norm([-D[0] * (1 - w) + N[0] * aperto, -D[1] * (1 - w) + w + N[1] * aperto, -D[2] * (1 - w) + N[2] * aperto]);
    // normal da faixa, virada para fora
    let Nb = norm(cruz(dir, Tg));
    const fora: V3 = [N[0] + P[0] * 2, N[1] * 0.3, N[2] + (P[2] + 0.012) * 2];
    if (ponto(Nb, fora) < 0) Nb = [-Nb[0], -Nb[1], -Nb[2]];
    // corrige a direção para ficar perpendicular ao contorno
    dir = norm(cruz(Tg, Nb));
    if (ponto(dir, [-D[0] * (1 - w), -D[1] * (1 - w) + w, -D[2] * (1 - w)]) < 0) dir = [-dir[0], -dir[1], -dir[2]];
    linhas.push(perfil.map(([t, h]) => [P[0] + dir[0] * t * largura + Nb[0] * h, P[1] + dir[1] * t * largura + Nb[1] * h, P[2] + dir[2] * t * largura + Nb[2] * h] as V3));
    const hf = perfil[perfil.length - 1][1];
    borda.push([P[0] + dir[0] * largura + Nb[0] * hf, P[1] + dir[1] * largura + Nb[1] * hf, P[2] + dir[2] * largura + Nb[2] * hf]);
    dirs.push(dir);
    normais.push(Nb);
  }
  return { geo: malhaDeFaixa(THREE, linhas, repeteU), borda, dirs, normais };
}

// Continuação de uma faixa a partir de uma borda já calculada (a ponta dourada do punho).
function faixaSaindoDe(THREE: Three, borda: V3[], dirs: V3[], normais: V3[], largura: number, n: number, repeteU: number) {
  const perfil: [number, number][] = [[0, 0], [0.45, 0.0005], [0.85, 0.0003], [1, -0.0012]];
  const linhas = borda.map((P, i) =>
    perfil.map(([t, h]) => [P[0] + dirs[i][0] * t * largura + normais[i][0] * h, P[1] + dirs[i][1] * t * largura + normais[i][1] * h, P[2] + dirs[i][2] * t * largura + normais[i][2] * h] as V3)
  );
  void n;
  return malhaDeFaixa(THREE, linhas, repeteU);
}

// Tubo fino na borda livre (o vivo dourado da gola).
function tuboNaBorda(THREE: Three, pontos: V3[], raio: number, n: number, repeteU: number) {
  const curva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p)), true);
  const g = new THREE.TubeGeometry(curva, n, raio, 10, true);
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * repeteU);
  return g;
}

function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

const cache = new Map<string, CamisaMolde>();
function moldeDe(gola: "v" | "redonda", mangaLonga: boolean) {
  const k = `${gola}-${mangaLonga}`;
  let m = cache.get(k);
  if (!m) cache.set(k, (m = montarCamisa({ gola, mangaLonga })));
  return m;
}

export const Camisa3D = forwardRef<Camisa3DRef, { config: ConfigCamisa; girarSozinho?: boolean; className?: string; onPronto?: () => void }>(
  function Camisa3D({ config, girarSozinho = false, className = "", onPronto }, ref) {
    const caixa = useRef<HTMLDivElement>(null);
    const [carregando, setCarregando] = useState(true);
    const motor = useRef<{
      THREE: Three;
      renderer: T.WebGLRenderer;
      scene: T.Scene;
      camera: T.PerspectiveCamera;
      controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
      Decal: typeof import("three/examples/jsm/geometries/DecalGeometry.js").DecalGeometry;
      grupo: T.Group;
      chave: string;
      canvasCor: HTMLCanvasElement;
      canvasBrilho: HTMLCanvasElement;
      texCor: T.CanvasTexture;
      texBrilho: T.CanvasTexture;
      parar: boolean;
      alvo: number | null;
    } | null>(null);
    const cfg = useRef(config);
    cfg.current = config;
    const giro = useRef(girarSozinho);
    giro.current = girarSozinho;

    useImperativeHandle(ref, () => ({
      girarPara: (g, instantaneo) => {
        const m = motor.current;
        if (!m) return;
        const a = (g * Math.PI) / 180;
        if (instantaneo) {
          const p = m.camera.position;
          const r = Math.hypot(p.x, p.z);
          p.set(Math.sin(a) * r, p.y, Math.cos(a) * r);
          m.alvo = null;
        } else m.alvo = a;
      },
      enquadrar: (e) => {
        const m = motor.current;
        if (!m) return;
        const a = (e.angulo * Math.PI) / 180, el = (e.elevacao * Math.PI) / 180;
        m.camera.fov = e.fov;
        m.camera.updateProjectionMatrix();
        m.controls.target.set(0, e.alvoY, 0);
        m.camera.position.set(Math.sin(a) * Math.cos(el) * e.distancia, e.alvoY + Math.sin(el) * e.distancia, Math.cos(a) * Math.cos(el) * e.distancia);
        m.controls.minDistance = 0.5;
        m.controls.maxDistance = 6;
        m.controls.minPolarAngle = 0;
        m.controls.maxPolarAngle = Math.PI;
        m.alvo = null;
        m.controls.update();
      },
      capturar: () => {
        const m = motor.current;
        if (!m) return null;
        m.renderer.render(m.scene, m.camera);
        return m.renderer.domElement.toDataURL("image/png");
      },
    }));

    // Monta (ou remonta) a camisa conforme a configuração.
    const montar = async () => {
      const m = motor.current;
      if (!m) return;
      const c = cfg.current;
      const { THREE } = m;
      const chaveEstampa = `${c.corBase}|${c.corLinhas}`;
      if (m.chave !== chaveEstampa) {
        pintarOndas(m.canvasCor, m.canvasBrilho, c.corBase, c.corLinhas);
        m.texCor.needsUpdate = true;
        m.texBrilho.needsUpdate = true;
        m.chave = chaveEstampa;
      }
      const molde = moldeDe(c.gola, c.mangaLonga);

      // limpa o que havia
      m.grupo.traverse((o) => {
        const mesh = o as T.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mt of mats) {
            const mm = mt as T.MeshStandardMaterial;
            if (mm.map && mm.map !== m.texCor) mm.map.dispose();
            mt.dispose();
          }
        }
      });
      m.grupo.clear();

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(molde.malha.posicoes, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(molde.malha.normais, 3));
      geo.setIndex(new THREE.BufferAttribute(molde.malha.indices, 1));
      const matCamisa = materialEstampado(THREE, m.texCor, m.texBrilho);
      const camisa = new THREE.Mesh(geo, matCamisa);
      m.grupo.add(camisa);
      // avesso (visto pela gola e pelas mangas): a sublimação atravessa o tecido, então a estampa aparece por dentro, mais escura
      const avesso = new THREE.Mesh(geo, materialEstampado(THREE, m.texCor, m.texBrilho, { avesso: true }));
      m.grupo.add(avesso);

      // acabamentos em ribana: faixa escura + borda dourada (como na referência)
      const texRib = (cor: string, linhas: number) => {
        const cv = canvas(1024, 64);
        pintarRibana(cv, cor, null, linhas);
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.anisotropy = 8;
        return t;
      };
      const corFaixa = misturarHex(c.corBase, "#000000", 0.12);
      const matFaixa = (rep: number) =>
        new THREE.MeshPhysicalMaterial({ map: texRib(corFaixa, 4), roughness: 0.85, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x666666), side: THREE.DoubleSide, ...(rep ? {} : {}) });
      const matDourado = () =>
        new THREE.MeshPhysicalMaterial({ map: texRib(c.corAcabamento, 3), roughness: 0.55, metalness: 0.25, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xfff0c8), side: THREE.DoubleSide });
      const matCostura = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9, side: THREE.DoubleSide });
      for (const b of molde.bordas) {
        if (b.tipo === "gola") {
          // a gola sai da costura e sobe em direção ao pescoço; nas costas fica em pé
          const faixa = faixaSaindo(THREE, molde, b.pontos, 300, 0.0165, (P) => 0.25 + 0.65 * suaveDegrau(0.03, -0.07, P[2]), [[0, 0.0004], [0.4, 0.0011], [1, 0.0008]], 30);
          m.grupo.add(new THREE.Mesh(faixa.geo, matFaixa(30)));
          m.grupo.add(new THREE.Mesh(tuboNaBorda(THREE, faixa.borda, 0.0026, 300, 30), matDourado()));
        } else if (b.tipo === "manga") {
          // punho: continua a manga com uma faixa escura e termina numa borda dourada
          const faixa = faixaSaindo(THREE, molde, b.pontos, 200, 0.0185, () => 0, [[0, 0.0006], [0.5, 0.0012], [1, 0.0004]], 22, -0.06);
          m.grupo.add(new THREE.Mesh(faixa.geo, matFaixa(22)));
          const ponta = faixaSaindoDe(THREE, faixa.borda, faixa.dirs, faixa.normais, 0.0068, 200, 22);
          m.grupo.add(new THREE.Mesh(ponta, matDourado()));
        } else {
          // barra: duas costuras paralelas
          for (const d of [0.0265, 0.0305]) {
            const gc = faixaNaBorda(THREE, molde, b.pontos, [[d - 0.00055, 0.0007], [d + 0.00055, 0.0007]], 400, 1);
            m.grupo.add(new THREE.Mesh(gc, matCostura));
          }
        }
      }

      // decalques (número, nome, escudo, etiqueta) projetados sobre a superfície
      camisa.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      const decal = (tex: T.Texture, x: number, y: number, dir: T.Vector3, w: number, h: number, rough = 0.55) => {
        // o raio vem de fora, na direção "dir", passando pelo ponto (x, y) da vista
        const lateral = new THREE.Vector3(dir.z, 0, -dir.x); // direita da vista
        const origem = lateral.clone().multiplyScalar(x).add(new THREE.Vector3(0, y, 0)).add(dir.clone().multiplyScalar(1));
        ray.set(origem, dir.clone().negate());
        const hit = ray.intersectObject(camisa, false)[0];
        if (!hit) return;
        const aux = new THREE.Object3D();
        aux.position.copy(hit.point);
        aux.lookAt(hit.point.clone().add(dir));
        const g = new m.Decal(camisa, hit.point, aux.rotation, new THREE.Vector3(w, h, 0.1));
        const mat = new THREE.MeshPhysicalMaterial({
          map: tex,
          transparent: true,
          roughness: rough,
          sheen: 0.25,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          depthWrite: false,
        });
        m.grupo.add(new THREE.Mesh(g, mat));
      };
      const FRENTE = new THREE.Vector3(0, 0, 1);
      const COSTAS = new THREE.Vector3(0, 0, -1);
      const texDe = (cv: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      };
      if (c.numero.trim()) {
        // costas: número grande (21 cm de altura); frente: 10 cm, no centro do peito
        const cvN = canvas(1024, 1024);
        const kN = pintarTexto(cvN, c.numero.slice(0, 2), c.corTexto, { espessura: 1.38, espaco: 1.25, altura: 0.8 });
        decal(texDe(cvN), 0, 0.026, COSTAS, kN * 0.211, kN * 0.211, 0.5);
        if (c.numeroFrente) {
          const cvF = canvas(512, 512);
          const kF = pintarTexto(cvF, c.numero.slice(0, 2), c.corTexto, { espessura: 1.3, espaco: 1.0, altura: 0.8 });
          decal(texDe(cvF), 0.003, -0.006, FRENTE, kF * 0.099, kF * 0.099, 0.5);
        }
      }
      if (c.nome.trim()) {
        const cvNome = canvas(1280, 512);
        const kNome = pintarTexto(cvNome, c.nome.slice(0, 14), c.corTexto, { arcoRaio: 3.6, espessura: 1.85, espaco: 0.55 });
        const h = kNome * 0.075;
        decal(texDe(cvNome), 0, 0.198, COSTAS, h * (1280 / 512), h, 0.5);
      }
      let img: HTMLImageElement | null = null;
      if (c.escudo) {
        img = new Image();
        img.src = c.escudo;
        await img.decode().catch(() => (img = null));
      }
      const cvE = canvas(256, 256);
      pintarEscudo(cvE, img);
      decal(texDe(cvE), 0.119, 0.166, FRENTE, 0.049, 0.049, 0.4);
      // etiqueta branca na lateral, perto da barra
      const cvT = canvas(256, 64);
      const ct = cvT.getContext("2d")!;
      ct.fillStyle = "#f6f6f6";
      ct.fillRect(0, 0, 256, 64);
      const lado = new THREE.Vector3(Math.sin((62 * Math.PI) / 180), 0, Math.cos((62 * Math.PI) / 180));
      decal(texDe(cvT), 0, molde.barra + 0.065, lado, 0.06, 0.0165, 0.7);
    };

    useEffect(() => {
      let cancelado = false;
      (async () => {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const { DecalGeometry } = await import("three/examples/jsm/geometries/DecalGeometry.js");
        if (cancelado || !caixa.current) return;
        const el = caixa.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = AJUSTE_LUZ.exposicao;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        el.appendChild(renderer.domElement);
        renderer.domElement.style.touchAction = "none";

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(cfg.current.fundo);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = AJUSTE_LUZ.ambiente;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x6b5638, AJUSTE_LUZ.ceu));

        const camera = new THREE.PerspectiveCamera(27, el.clientWidth / el.clientHeight, 0.05, 20);
        camera.position.set(0, 0.03, 2.35);
        // luzes de estúdio presas à câmera: a camisa fica bem iluminada de qualquer ângulo
        const key = new THREE.DirectionalLight(0xffffff, AJUSTE_LUZ.principal);
        key.position.set(1.2, 1.25, 0.7);
        camera.add(key);
        const rim = new THREE.DirectionalLight(0xfff1dd, AJUSTE_LUZ.contra);
        rim.position.set(-1.4, 0.6, -2.6);
        camera.add(rim);
        scene.add(camera);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.0, 0);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = 1.2;
        controls.maxDistance = 3.4;
        controls.minPolarAngle = Math.PI * 0.25;
        controls.maxPolarAngle = Math.PI * 0.72;

        const grupo = new THREE.Group();
        scene.add(grupo);
        const canvasCor = canvas(2048);
        const canvasBrilho = canvas(2048);
        const texCor = new THREE.CanvasTexture(canvasCor);
        texCor.colorSpace = THREE.SRGBColorSpace;
        texCor.wrapS = texCor.wrapT = THREE.MirroredRepeatWrapping;
        texCor.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const texBrilho = new THREE.CanvasTexture(canvasBrilho);
        texBrilho.wrapS = texBrilho.wrapT = THREE.MirroredRepeatWrapping;

        motor.current = { THREE, renderer, scene, camera, controls, Decal: DecalGeometry, grupo, chave: "", canvasCor, canvasBrilho, texCor, texBrilho, parar: false, alvo: null };
        // dá tempo de mostrar o aviso de carregamento antes do cálculo do molde
        await new Promise((r) => setTimeout(r, 30));
        await montar();
        if (cancelado) return;
        setCarregando(false);

        const ro = new ResizeObserver(() => {
          renderer.setSize(el.clientWidth, el.clientHeight);
          camera.aspect = el.clientWidth / el.clientHeight;
          camera.updateProjectionMatrix();
        });
        ro.observe(el);
        let quadros = 0;
        const loop = () => {
          const m = motor.current;
          if (!m || m.parar) return;
          if (m.alvo !== null) {
            const dist = m.camera.position.distanceTo(m.controls.target);
            const atual = Math.atan2(m.camera.position.x, m.camera.position.z);
            let delta = m.alvo - atual;
            delta = Math.atan2(Math.sin(delta), Math.cos(delta));
            const novo = Math.abs(delta) < 0.002 ? m.alvo : atual + delta * 0.12;
            if (novo === m.alvo) m.alvo = null;
            const y = m.camera.position.y;
            const r = Math.sqrt(Math.max(0.01, dist * dist - (y - m.controls.target.y) ** 2));
            m.camera.position.set(Math.sin(novo) * r, y, Math.cos(novo) * r);
          } else if (giro.current) {
            m.grupo.rotation.y += 0.004;
          }
          m.controls.update();
          // o "estúdio" (reflexos) gira junto com a câmera: a luz fica igual de qualquer lado
          m.scene.environmentRotation.y = Math.atan2(m.camera.position.x, m.camera.position.z) - m.grupo.rotation.y;
          m.renderer.render(m.scene, m.camera);
          if (++quadros === 3) onPronto?.();
          requestAnimationFrame(loop);
        };
        loop();
        (motor.current as unknown as { ro: ResizeObserver }).ro = ro;
      })();
      return () => {
        cancelado = true;
        const m = motor.current;
        if (m) {
          m.parar = true;
          (m as unknown as { ro?: ResizeObserver }).ro?.disconnect();
          m.renderer.dispose();
          m.renderer.domElement.remove();
        }
        motor.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // remonta quando a configuração muda
    const chaveConfig = JSON.stringify(config);
    useEffect(() => {
      const m = motor.current;
      if (!m) return;
      m.scene.background = new m.THREE.Color(config.fundo);
      montar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chaveConfig]);

    return (
      <div ref={caixa} className={`relative h-full w-full ${className}`}>
        {carregando && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
            Montando a camisa...
          </div>
        )}
      </div>
    );
  }
);

function misturarHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, "0")}`;
}
