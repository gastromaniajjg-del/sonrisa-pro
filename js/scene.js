// Escenario 3D: pasillos liminales infinitos y Denti, el dron explorador.
// Todo se genera aquí (geometría y texturas procedurales): sin modelos ni imágenes externas,
// funciona sin conexión. Estética propia de «espacios liminales», sin copiar obras concretas.

import * as THREE from '../vendor/three.module.min.js';
import { DRONE_ACCESSORIES as ACCESSORIES } from './accessories.js';
import { buildOpenWorld } from './worlds.js';
import { ToothMascot } from './tooth.js';

const W = 3.2; // ancho del pasillo
const H = 2.7; // alto
const L = 4; // largo de cada módulo
const MODULES = 9;

// ── Temas (uno por nivel) ────────────────────────────────────────────────────
const THEMES = {
  oficinas: { wall: '#c9b866', wallDark: '#a8963f', floor: '#8f7f45', ceil: '#d9d3b4', light: 0xfff3c4, fog: 0xb5a45a, amb: 1.25, speed: 0.9 },
  sotano: { wall: '#8b8a83', wallDark: '#62615b', floor: '#55544f', ceil: '#9a9a94', light: 0xdbe7ff, fog: 0x45474a, amb: 0.95, speed: 1.05 },
  azulejos: { wall: '#e6f1f2', wallDark: '#9fc9cf', floor: '#bcdde2', ceil: '#eef6f6', light: 0xe2fbff, fog: 0x9fcfd6, amb: 1.2, speed: 1.2 },
  emergencia: { wall: '#5a4434', wallDark: '#3a2a20', floor: '#3b2b22', ceil: '#4a4038', light: 0xff5544, fog: 0x2a0e0b, amb: 0.75, speed: 1.4 },
};

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTex(size, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function stains(g, s, r, color, n) {
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rad = 10 + r() * s * 0.18;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

function noise(g, s, r, alpha) {
  const img = g.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 255 * alpha;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

function makeTextures(name) {
  const th = THEMES[name];
  const r = rng(name.length * 977);
  const wall = canvasTex(256, (g, s) => {
    g.fillStyle = th.wall;
    g.fillRect(0, 0, s, s);
    if (name === 'azulejos') {
      g.strokeStyle = th.wallDark; g.lineWidth = 3;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * s / 8, 0); g.lineTo(i * s / 8, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 8); g.lineTo(s, i * s / 8); g.stroke(); }
    } else if (name === 'sotano') {
      // Hormigón con tuberías.
      noise(g, s, r, 0.18);
      g.fillStyle = '#4d4c47'; g.fillRect(0, s * 0.12, s, 14); g.fillRect(0, s * 0.2, s, 8);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, s * 0.12 + 2, s, 3);
      for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(i * s / 4, 0, 2, s); }
    } else {
      // Papel pintado de rayas finas con un patrón discreto.
      for (let x = 0; x < s; x += 16) { g.fillStyle = th.wallDark; g.globalAlpha = 0.35; g.fillRect(x, 0, 3, s); }
      g.globalAlpha = 0.18;
      for (let y = 8; y < s; y += 32) for (let x = 8; x < s; x += 32) { g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.closePath(); g.fillStyle = th.wallDark; g.fill(); }
      g.globalAlpha = 1;
    }
    stains(g, s, r, 'rgba(70,55,20,0.18)', 6);
    // Zócalo
    g.fillStyle = th.wallDark; g.fillRect(0, s - 18, s, 18);
  }, 2, 1);
  const floor = canvasTex(256, (g, s) => {
    g.fillStyle = th.floor;
    g.fillRect(0, 0, s, s);
    if (name === 'azulejos') {
      g.strokeStyle = '#86b9c1'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 4); g.lineTo(s, i * s / 4); g.stroke(); }
    } else {
      noise(g, s, r, name === 'sotano' ? 0.2 : 0.3); // moqueta / hormigón
    }
    stains(g, s, r, 'rgba(40,30,10,0.22)', 5);
  }, 1, 1);
  const ceil = canvasTex(256, (g, s) => {
    g.fillStyle = th.ceil;
    g.fillRect(0, 0, s, s);
    noise(g, s, r, 0.08);
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * s / 2, 0); g.lineTo(i * s / 2, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 2); g.lineTo(s, i * s / 2); g.stroke(); }
    stains(g, s, r, 'rgba(120,100,40,0.2)', 3);
  }, 2, 2);
  return { wall, floor, ceil };
}

// ── Cara del dron (pantalla con ojos) ───────────────────────────────────────
function drawEyes(g, mood, blink, t) {
  const w = 256, h = 128;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#05080c';
  g.beginPath();
  g.roundRect(4, 4, w - 8, h - 8, 40);
  g.fill();
  const col = mood === 'contento' ? '#ffd84a' : '#4ff0ff';
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 12;
  g.lineCap = 'round';
  g.shadowColor = col;
  g.shadowBlur = 18;
  [80, 176].forEach((x) => {
    const y = 64;
    if (blink) { g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.stroke(); return; }
    switch (mood) {
      case 'feliz':
        g.beginPath(); g.arc(x, y + 12, 22, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        break;
      case 'concentrado':
        g.fillRect(x - 24, y - 7, 48, 14);
        g.globalAlpha = 0.45; g.fillRect(x - 24 + ((t * 40) % 40), y - 7, 8, 14); g.globalAlpha = 1;
        break;
      case 'animado':
        g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#05080c'; g.beginPath(); g.arc(x + 8, y - 8, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = col;
        break;
      case 'contento': {
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + t;
          const rr = i % 2 ? 11 : 27;
          g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        g.closePath(); g.fill();
        break;
      }
    }
  });
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export class Scene {
  constructor(canvas) {
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 40);
    this.camera.position.set(0, 1.55, 0);

    this.ambient = new THREE.HemisphereLight(0xffffff, 0x554422, 1);
    this.scene.add(this.ambient);
    this.lamp = new THREE.PointLight(0xffffff, 6, 9, 1.6);
    this.scene.add(this.lamp);
    this.scene.fog = new THREE.Fog(0xb5a45a, 1.5, 21);

    this.mode = 'home';
    this.mood = 'feliz';
    this.brushMotion = null;
    this.speed = 0;
    this._targetSpeed = 0.35;
    this._flicker = 0;
    this._flickerSeed = 0;
    this._exit = 0;
    this._burst = 0;
    this._clock = new THREE.Clock();

    this._buildCorridor();
    this._buildDrone();
    this.tooth = new ToothMascot(this.scene);
    this.tooth.visible = false;
    this.mascotType = 'drone';
    this._worlds = {};
    this.open = null;
    this.worldId = 'pasillos';
    this._fogFar = 21;
    this.setTheme('oficinas');

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  // ── Pasillo ─────────────────────────────────────────────────────────────────
  _buildCorridor() {
    this.corridorGroup = new THREE.Group();
    this.scene.add(this.corridorGroup);
    this.wallMat = new THREE.MeshLambertMaterial();
    this.floorMat = new THREE.MeshLambertMaterial();
    this.ceilMat = new THREE.MeshLambertMaterial();
    this.panelOn = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.panelOff = new THREE.MeshLambertMaterial({ color: 0x777766 });
    const doorMat = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x6b5a2a });

    const floorG = new THREE.PlaneGeometry(W, L);
    const wallG = new THREE.PlaneGeometry(L, H);
    const panelG = new THREE.PlaneGeometry(1.1, 0.55);
    const doorG = new THREE.PlaneGeometry(1.1, 2.1);
    const frameG = new THREE.BoxGeometry(1.3, 2.2, 0.04);

    this.modules = [];
    this._r = rng(42);
    for (let i = 0; i < MODULES; i++) {
      const m = new THREE.Group();
      const floor = new THREE.Mesh(floorG, this.floorMat);
      floor.rotation.x = -Math.PI / 2;
      const ceil = new THREE.Mesh(floorG, this.ceilMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = H;
      const left = new THREE.Mesh(wallG, this.wallMat);
      left.rotation.y = Math.PI / 2;
      left.position.set(-W / 2, H / 2, 0);
      const right = new THREE.Mesh(wallG, this.wallMat);
      right.rotation.y = -Math.PI / 2;
      right.position.set(W / 2, H / 2, 0);
      const panel = new THREE.Mesh(panelG, this.panelOn);
      panel.rotation.x = Math.PI / 2;
      panel.position.y = H - 0.01;
      m.add(floor, ceil, left, right, panel);
      const doors = [-1, 1].map((side) => {
        const d = new THREE.Group();
        const frame = new THREE.Mesh(frameG, frameMat);
        const hole = new THREE.Mesh(doorG, doorMat);
        hole.position.z = 0.03;
        d.add(frame, hole);
        d.rotation.y = side * -Math.PI / 2;
        d.position.set(side * (W / 2 - 0.02), 1.05, 0);
        m.add(d);
        return d;
      });
      m.userData = { panel, doors };
      m.position.z = -i * L;
      this._randomize(m);
      this.corridorGroup.add(m);
      this.modules.push(m);
    }
  }

  _randomize(m) {
    const r = this._r;
    m.userData.doors[0].visible = r() < 0.35;
    m.userData.doors[1].visible = r() < 0.35;
    m.userData.panel.material = r() < 0.15 ? this.panelOff : this.panelOn;
  }

  setTheme(name) {
    const th = THEMES[name];
    this.themeName = name;
    this.theme = th;
    const tex = (this._texCache ??= {})[name] ?? (this._texCache[name] = makeTextures(name));
    this.wallMat.map = tex.wall;
    this.floorMat.map = tex.floor;
    this.ceilMat.map = tex.ceil;
    [this.wallMat, this.floorMat, this.ceilMat].forEach((mm) => { mm.needsUpdate = true; });
    this.panelOn.color.setHex(th.light);
    this.lamp.color.setHex(th.light);
    this.ambient.color.setHex(th.light);
    this.scene.fog.color.setHex(th.fog);
    this.scene.fog.near = 1.5;
    this._fogFar = 21;
    this.renderer.setClearColor(th.fog);
  }

  // ── Mundos de las temáticas ─────────────────────────────────────────────────
  /** 'pasillos' (Escapa) o uno de los mundos abiertos de worlds.js. */
  setWorld(worldId) {
    if (worldId === this.worldId && (worldId === 'pasillos' || this.open)) { this.setLevel(0, { instant: true }); return; }
    this.worldId = worldId;
    const corridor = worldId === 'pasillos';
    this.corridorGroup.visible = corridor;
    Object.values(this._worlds).forEach((w) => { w.group.visible = false; });
    this.open = null;
    if (!corridor) {
      const w = (this._worlds[worldId] ??= this._addWorld(worldId));
      w.group.visible = true;
      // Recolocar la cinta de módulos delante de la cámara.
      w.modules.forEach((m, i) => { m.position.z = this.camera.position.z + w.length - i * w.length; });
      this.open = w;
    } else {
      this.modules.forEach((m, i) => { m.position.z = this.camera.position.z + L - i * L; });
    }
    this.setLevel(0, { instant: true });
  }

  _addWorld(id) {
    const w = buildOpenWorld(id);
    this.scene.add(w.group);
    return w;
  }

  _applyOpen(i) {
    const p = this.open.palettes[i];
    this.open.setPalette(i);
    this.theme = { light: p.light, fog: p.sky, amb: p.amb, speed: p.speed };
    this.lamp.color.setHex(p.light);
    this.ambient.color.setHex(p.light);
    this.scene.fog.color.setHex(p.sky);
    this.scene.fog.near = this.worldId === 'espacio' ? 10 : 4;
    this._fogFar = this.worldId === 'espacio' ? 60 : 34;
    this.renderer.setClearColor(p.sky);
  }

  /** Nivel 0-3. El cambio se hace con un apagón corto de los fluorescentes. */
  setLevel(i, { instant = false } = {}) {
    if (this.open) {
      if (instant) { this._applyOpen(i); return; }
      this.flicker(0.35);
      clearTimeout(this._themeTimer);
      this._themeTimer = setTimeout(() => this._applyOpen(i), 180);
      return;
    }
    const name = ['oficinas', 'sotano', 'azulejos', 'emergencia'][i];
    if (instant) { this.setTheme(name); return; }
    this.flicker(1);
    clearTimeout(this._themeTimer);
    this._themeTimer = setTimeout(() => this.setTheme(name), 180);
  }

  /** Parpadeo de luces (0..1). */
  flicker(strength = 0.5) {
    this._flicker = this.reducedMotion ? Math.min(strength, 0.3) : strength;
    this._flickerT = 0;
  }

  // ── Dron ────────────────────────────────────────────────────────────────────
  _buildDrone() {
    const d = (this.drone = new THREE.Group());
    this.scene.add(d);
    const body = (this.droneBody = new THREE.Group());
    d.add(body);

    this.shellMat = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.4, metalness: 0.15 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.5 });

    const shell = (this.shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 24), this.shellMat));
    shell.scale.set(1.3, 0.72, 1.05);
    body.add(shell);
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 24), darkMat);
    belly.position.y = -0.2;
    body.add(belly);

    // Pantalla-cara
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = 256;
    this.faceCanvas.height = 128;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({ map: this.faceTex, transparent: true }));
    face.position.set(0, 0.01, 0.33);
    body.add(face);

    // Brazos y rotores
    this.rotors = [];
    this.arms = [];
    const armG = new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8);
    const discG = new THREE.CircleGeometry(0.16, 28);
    this.discMat = new THREE.MeshBasicMaterial({ color: 0xbfd6e6, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const arm = new THREE.Mesh(armG, darkMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = Math.atan2(z, x) * -1;
      arm.position.set(x * 0.28, 0.05, z * 0.2);
      body.add(arm);
      this.arms.push(arm);
      const rotor = new THREE.Group();
      rotor.position.set(x * 0.44, 0.1, z * 0.32);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), darkMat);
      const disc = new THREE.Mesh(discG, this.discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.035;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.035), darkMat);
      blade.position.y = 0.04;
      rotor.add(hub, disc, blade);
      body.add(rotor);
      this.rotors.push({ rotor, blade, disc });
    }

    // LED de estado
    this.led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3dff8a }));
    this.led.position.set(0, 0.22, 0.05);
    body.add(this.led);

    // Piezas de las variantes (submarino, hada, sonda, balón…)
    const V = (this.variantParts = {});
    const propeller = new THREE.Group();
    const pHub = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 12), darkMat);
    pHub.rotation.x = -Math.PI / 2;
    this.propBlades = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.01), darkMat);
      bl.position.y = 0.08;
      const g = new THREE.Group();
      g.rotation.z = (i / 3) * Math.PI * 2;
      g.add(bl);
      this.propBlades.add(g);
    }
    this.propBlades.position.z = -0.07;
    propeller.add(pHub, this.propBlades);
    propeller.position.z = -0.36;
    body.add(propeller);
    V.propeller = propeller;
    const periscope = new THREE.Group();
    const pTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), darkMat);
    pTube.position.y = 0.11;
    const pTop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.1), darkMat);
    pTop.position.set(0, 0.22, 0.03);
    periscope.add(pTube, pTop);
    periscope.position.set(0.08, 0.18, -0.05);
    body.add(periscope);
    V.periscope = periscope;
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xe8d4ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    this.wings = [-1, 1].map((side) => {
      const w = new THREE.Group();
      const a = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), wingMat);
      a.scale.set(1, 0.6, 1);
      a.position.set(side * 0.2, 0.08, 0);
      const b = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), wingMat);
      b.scale.set(1, 0.6, 1);
      b.position.set(side * 0.16, -0.12, 0);
      w.add(a, b);
      w.position.set(side * 0.18, 0.08, -0.15);
      body.add(w);
      return w;
    });
    V.wings = { set visible(v) { this._v = v; }, get visible() { return this._v; } };
    const thruster = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.7 }));
    thruster.rotation.x = Math.PI / 2;
    thruster.position.z = -0.42;
    body.add(thruster);
    V.thruster = thruster;
    this.thruster = thruster;

    // Pinza con cepillo para enseñar el movimiento
    const claw = (this.claw = new THREE.Group());
    claw.position.set(0, -0.24, 0.08);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), darkMat);
    rod.position.y = -0.08;
    claw.add(rod);
    const brush = (this.brush = new THREE.Group());
    brush.position.y = -0.17;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.035), new THREE.MeshStandardMaterial({ color: 0x35c3a8 }));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.05), new THREE.MeshStandardMaterial({ color: 0x35c3a8 }));
    head.position.x = -0.2;
    const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.045), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    bristles.position.set(-0.2, 0.04, 0);
    brush.add(handle, head, bristles);
    claw.add(brush);
    body.add(claw);
    claw.visible = false;

    this._buildDroneAccessories(body, darkMat);
  }

  _buildDroneAccessories(body, darkMat) {
    const A = (this.acc = {});
    // Linterna con luz real que ilumina el pasillo
    const linterna = new THREE.Group();
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 16), darkMat);
    torch.rotation.x = Math.PI / 2;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), new THREE.MeshBasicMaterial({ color: 0xfffbe0 }));
    lens.position.z = 0.061;
    const spot = new THREE.SpotLight(0xfff4d0, 8, 9, 0.45, 0.5, 1.2);
    spot.position.set(0, 0, 0.06);
    spot.target.position.set(0, -0.6, 4);
    linterna.add(torch, lens, spot, spot.target);
    linterna.position.set(0, -0.12, 0.28);
    body.add(linterna);
    A.linterna = linterna;

    // Faros rojos
    const faros = new THREE.Group();
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
    [-0.2, 0.2].forEach((x) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), redMat);
      f.position.set(x, -0.08, 0.26);
      faros.add(f);
    });
    const redLight = new THREE.PointLight(0xff2a2a, 1.2, 3);
    redLight.position.set(0, -0.1, 0.5);
    faros.add(redLight);
    body.add(faros);
    A.faros = faros;

    // Antena
    const antena = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), darkMat);
    stick.position.y = 0.15;
    this.antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
    this.antennaTip.position.y = 0.31;
    antena.add(stick, this.antennaTip);
    antena.position.set(-0.12, 0.18, -0.08);
    antena.rotation.z = 0.2;
    body.add(antena);
    A.antena = antena;

    // Hélices turbo: no es un objeto, cambia los rotores.
    A.helices = { set visible(v) { this._v = v; }, get visible() { return this._v; } };

    Object.values(A).forEach((m) => { m.visible = false; });
  }

  setEquipped(equipped, mascot = this.mascotType) {
    if (mascot === 'tooth') { this.tooth.setEquipped(equipped); return; }
    this._droneEquipped = equipped;
    const ids = Object.values(equipped);
    for (const [id, m] of Object.entries(this.acc)) m.visible = ids.includes(id);
    const turbo = ids.includes('helices');
    this.rotors.forEach(({ rotor, disc }) => {
      rotor.scale.setScalar(turbo ? 1.35 : 1);
      disc.material.color.setHex(turbo ? 0x4fb3ff : 0xbfd6e6);
    });
    this._holo = false;
    this._legend = false;
    this.shellMat.map = null;
    let color = this.variantColor ?? 0xe9edf0;
    if (!equipped.carcasa && this.variantMap) this.shellMat.map = this.variantMap;
    const skin = ACCESSORIES.find((a) => a.id === equipped.carcasa);
    if (skin?.color === 'holo') this._holo = true;
    else if (skin?.color === 'legend') this._legend = true;
    else if (skin?.color === 'camo') {
      this.shellMat.map = (this._camo ??= canvasTex(128, (g, s) => {
        const r = rng(7);
        g.fillStyle = '#6b7445'; g.fillRect(0, 0, s, s);
        ['#3f4a2a', '#8f8a5a', '#2c2f22'].forEach((c) => {
          for (let i = 0; i < 9; i++) { g.fillStyle = c; g.beginPath(); g.ellipse(r() * s, r() * s, 8 + r() * 18, 6 + r() * 12, r() * 3, 0, Math.PI * 2); g.fill(); }
        });
      }));
    } else if (skin) color = skin.color;
    this.shellMat.color.setHex(this.shellMat.map ? 0xffffff : color);
    this.shellMat.emissive.setHex(this.variant === 'hada' && !skin ? 0x8a3fbf : 0x000000);
    this.shellMat.metalness = skin?.id === 'dorada' || skin?.id === 'leyenda' ? 0.8 : 0.15;
    this.shellMat.needsUpdate = true;
  }

  // ── Variantes del dron ─────────────────────────────────────────────────────
  setVariant(variant) {
    this.variant = variant;
    const rotors = ['dron', 'safari'].includes(variant);
    this.rotors.forEach(({ rotor }) => { rotor.visible = rotors; });
    this.arms.forEach((a) => { a.visible = rotors; });
    const V = this.variantParts;
    V.propeller.visible = variant === 'submarino';
    V.periscope.visible = variant === 'submarino';
    this.wings.forEach((w) => { w.visible = variant === 'hada'; });
    V.thruster.visible = variant === 'sonda';
    this.variantColor = { dron: 0xe9edf0, submarino: 0xffd23a, hada: 0xf3d2ff, safari: 0xc9b67a, sonda: 0xf4f6fa, balon: 0xffffff }[variant] ?? 0xe9edf0;
    this.variantMap = variant === 'balon' ? (this._ballTex ??= canvasTex(256, (g, s) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#1b1f27';
      const hex = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); };
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) hex(x * 64 + (y % 2) * 32 + 16, y * 64 + 32, 15);
    })) : null;
    this.shell.scale.set(variant === 'balon' ? 1.05 : 1.3, variant === 'balon' ? 1.05 : 0.72, 1.05);
    this.droneBody.scale.setScalar(variant === 'hada' ? 0.8 : 1);
    this.setEquipped(this._droneEquipped || {}, 'drone');
  }

  _animateVariant(dt, t) {
    const v = this.variant;
    if (v === 'submarino') this.propBlades.rotation.z += dt * 18;
    if (v === 'hada') this.wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (0.3 + Math.sin(t * 22) * 0.45); });
    if (v === 'sonda') { this.thruster.scale.y = 0.8 + Math.sin(t * 30) * 0.2; this.thruster.material.opacity = 0.5 + Math.sin(t * 17) * 0.2; }
    if (v === 'balon' && this.mode === 'brush') this.shell.rotation.x -= dt * 2;
  }

  // ── API de expresiones y movimiento ──────────────────────────────────────────
  setExpression(mood) {
    this.mood = mood;
    this.tooth.setExpression(mood);
    if (mood === 'animado' || mood === 'contento') this._burst = 1;
  }

  /** Compañero de la temática: 'tooth' (Dientín) o 'drone' con su variante. */
  setMascot(type, variant = 'dron') {
    this.mascotType = type;
    this.tooth.visible = type === 'tooth';
    this.drone.visible = type !== 'tooth';
    if (type !== 'tooth') this.setVariant(variant);
  }

  cheer(ms = 1600) {
    this.setExpression('animado');
    clearTimeout(this._cheerTimer);
    this._cheerTimer = setTimeout(() => { if (this.mood === 'animado') this.setExpression('concentrado'); }, ms);
  }

  setBrushMotion(motion) {
    this.brushMotion = motion;
    this.claw.visible = !!motion;
    this.tooth.setBrushMotion(motion);
  }

  setShine(v) {
    this.tooth.setShine(v);
  }

  /**
   * home: el pasillo avanza despacio · brush: se camina · done: luz de salida · hangar: el dron de cerca
   */
  setMode(mode) {
    this.mode = mode;
    this._exit = 0;
    this._targetSpeed = { home: 0.35, brush: this.theme.speed, done: 0, hangar: 0.12 }[mode];
    if (mode === 'home' || mode === 'hangar') this.setLevel(0, { instant: true });
  }

  start() {
    if (this._running) return;
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this._raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      this._update(Math.min(0.05, this._clock.getDelta()), this._clock.elapsedTime);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _update(dt, t) {
    const m = this.reducedMotion ? 0.3 : 1;
    if (this.mode === 'brush') this._targetSpeed = this.theme.speed;
    this.speed += (this._targetSpeed * (this.reducedMotion ? 0.6 : 1) - this.speed) * Math.min(1, dt * 2);
    const cam = this.camera;
    cam.position.z -= this.speed * dt;
    const walking = this.mode === 'brush';
    cam.position.y = 1.55 + (walking ? Math.sin(t * 6.5) * 0.025 * m : 0);
    cam.position.x = walking ? Math.sin(t * 3.25) * 0.02 * m : 0;
    cam.rotation.set(walking ? Math.sin(t * 6.5 + 1) * 0.004 * m : 0, 0, 0);

    // Reciclar módulos que quedan detrás
    if (this.open) {
      const w = this.open;
      for (const mod of w.modules) {
        if (mod.position.z > cam.position.z + w.length) {
          mod.position.z -= w.modules.length * w.length;
          w.recycle(mod);
        }
      }
      w.animate(t, dt, cam);
    } else {
      for (const mod of this.modules) {
        if (mod.position.z > cam.position.z + L) {
          mod.position.z -= MODULES * L;
          this._randomize(mod);
        }
      }
    }
    this.lamp.position.set(0, H - 0.3, cam.position.z - 1.5);

    // Parpadeo de fluorescentes
    let light = 1;
    if (this._flicker > 0) {
      this._flickerT += dt;
      const k = this._flickerT;
      const pattern = [1, 0.15, 1, 0.05, 0.8, 0.1, 1];
      const idx = Math.floor(k / 0.06);
      if (idx >= pattern.length) this._flicker = 0;
      else light = 1 - (1 - pattern[idx]) * this._flicker;
    }
    // Salida: todo se vuelve blanco.
    if (this.mode === 'done') this._exit = Math.min(1, this._exit + dt * 0.6);
    const exit = this._exit;
    this.ambient.intensity = this.theme.amb * light + exit * 2.5;
    this.lamp.intensity = 6 * light + exit * 10;
    this.lamp.color.setHex(this.theme.light).lerp(new THREE.Color(0xffffff), exit);
    this.ambient.color.setHex(this.theme.light).lerp(new THREE.Color(0xffffff), exit);
    this.panelOn.color.setHex(this.theme.light).multiplyScalar(0.35 + 0.65 * light).lerp(new THREE.Color(0xffffff), exit);
    this.scene.fog.color.setHex(this.theme.fog).lerp(new THREE.Color(0xffffff), exit);
    this.scene.fog.far = this._fogFar - exit * this._fogFar * 0.55;
    this.renderer.setClearColor(this.scene.fog.color);

    // Compañero (dron o Dientín)
    const tooth = this.mascotType === 'tooth';
    const d = tooth ? this.tooth.holder : this.drone;
    // Posición del dron respecto a la cámara: siempre en la franja libre entre los paneles.
    const offset = { home: [0, 0.32, -2.7], brush: [0, 0.45, -2.6], done: [0, 0.42, -2.6], hangar: [0, 0.5, -2.3] }[this.mode];
    const target = new THREE.Vector3(cam.position.x + offset[0], cam.position.y + offset[1], cam.position.z + offset[2]);
    d.position.lerp(target, Math.min(1, dt * 4));
    this._burst = Math.max(0, this._burst - dt * 0.8);
    let hover = Math.sin(t * 2.4) * 0.03 * m;
    let spin = 0;
    if (this.mood === 'animado') hover += Math.abs(Math.sin(t * 9)) * 0.06 * m * (0.3 + this._burst);
    if (this.mood === 'contento') { hover += Math.abs(Math.sin(t * 5)) * 0.1 * m; spin = this.reducedMotion ? 0 : t * 2.2; }
    if (this.mode === 'hangar') spin = Math.sin(t * 0.6) * 0.9;
    if (tooth) {
      // Dientín tiene su propia animación (saltos, capa, brazos): solo lo colocamos.
      d.rotation.set(0, this.mode === 'hangar' ? Math.sin(t * 0.6) * 0.6 : 0, 0);
      this.tooth.update(dt, t);
      return;
    }
    d.position.y += hover;
    d.rotation.set(0.12 + Math.sin(t * 1.3) * 0.05 * m, spin, Math.sin(t * 1.7) * 0.06 * m);
    this._animateVariant(dt, t);

    const rotorSpeed = 40 + (this.mood === 'contento' ? 25 : 0);
    this.rotors.forEach(({ blade }, i) => { blade.rotation.y += dt * rotorSpeed * (i % 2 ? 1 : -1); });
    this.led.material.color.setHex((t % 1.2) < 0.15 ? 0xffffff : this.mood === 'contento' ? 0xffd84a : 0x3dff8a);
    if (this.antennaTip) this.antennaTip.visible = (t % 1) < 0.5;
    if (this._holo) this.shellMat.color.setHSL((t * 0.12) % 1, 0.7, 0.6);
    if (this._legend) { this.shellMat.color.setHSL(0.13, 0.85, 0.55 + Math.sin(t * 3) * 0.08); this.shellMat.emissive.setHSL(0.13, 0.9, 0.1 + Math.sin(t * 3) * 0.05); }

    // Pinza: demostración del movimiento
    if (this.brushMotion && this.mood !== 'contento') {
      const sp = this.reducedMotion ? 3 : 6.5;
      let dx = 0, dy = 0;
      if (this.brushMotion.startsWith('circulos')) { dx = Math.cos(t * sp) * 0.05; dy = Math.sin(t * sp) * 0.05; }
      else if (this.brushMotion === 'adelante-atras') dx = Math.sin(t * sp * 1.2) * 0.09;
      this.brush.position.set(dx, -0.17 + dy, 0);
      this.brush.rotation.z = this.brushMotion === 'colocar' ? -0.55 + Math.sin(t * 2) * 0.08 : this.brushMotion === 'circulos-dentro' ? 0.5 : 0;
    }

    // Cara
    const blink = (t % 4.1) < 0.1;
    const key = `${this.mood}|${blink}|${this.mood === 'concentrado' || this.mood === 'contento' ? Math.floor(t * 20) : 0}`;
    if (key !== this._faceKey) {
      this._faceKey = key;
      drawEyes(this.faceCanvas.getContext('2d'), this.mood, blink, t);
      this.faceTex.needsUpdate = true;
    }
  }
}
