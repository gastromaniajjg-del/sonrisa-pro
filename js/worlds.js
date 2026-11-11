// Mundos abiertos de las temáticas (todo menos «Escapa», que usa los pasillos de scene.js).
// Cada mundo es una cinta de módulos que se reciclan mientras la cámara avanza,
// con cuatro paletas (una por nivel), decorados laterales y partículas.
// Geometría y texturas generadas aquí: sin archivos externos, funciona sin conexión.

import * as THREE from '../vendor/three.module.min.js';

export const OPEN_L = 6; // largo de cada módulo
const COUNT = 8;
const GROUND_W = 44;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function tex(size, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(base, dots, n, r = rng(3)) {
  return (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < n; i++) {
      g.fillStyle = dots[i % dots.length];
      g.globalAlpha = 0.35 + r() * 0.4;
      g.fillRect(r() * s, r() * s, 2 + r() * 3, 2 + r() * 3);
    }
    g.globalAlpha = 1;
  };
}

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });

// ── Paletas por mundo y nivel ─────────────────────────────────────────────────
// sky: color de fondo y niebla · amb: intensidad de luz ambiente · light: color de la luz · speed: m/s
const PALETTES = {
  sonrisa: [
    { sky: 0x9fd8ff, light: 0xffffff, amb: 2.2, ground: 0x7ed36a, speed: 1.0 },
    { sky: 0xffd6ea, light: 0xfff4fb, amb: 2.2, ground: 0x8fdc7a, speed: 1.1 },
    { sky: 0xbff3e4, light: 0xffffff, amb: 2.2, ground: 0x6fcf8a, speed: 1.2 },
    { sky: 0xfff0b3, light: 0xfffbe8, amb: 2.4, ground: 0x9ad86b, speed: 1.3 },
  ],
  mar: [
    { sky: 0x3fb7c9, light: 0xd8fbff, amb: 1.9, ground: 0xe6d29a, speed: 0.8 },
    { sky: 0x2f8f74, light: 0xd8ffe8, amb: 1.7, ground: 0xc9bb84, speed: 0.9 },
    { sky: 0x7b4f8f, light: 0xffd8f0, amb: 1.6, ground: 0xb79a8a, speed: 1.0 },
    { sky: 0x0e2348, light: 0x8fe8ff, amb: 1.3, ground: 0x4a5a7a, speed: 1.1 },
  ],
  bosque: [
    { sky: 0xbfe6a6, light: 0xfffbe6, amb: 2.0, ground: 0x5fae4a, speed: 0.9 },
    { sky: 0xf6bf8e, light: 0xffe2c4, amb: 1.9, ground: 0x6aa84a, speed: 1.0 },
    { sky: 0x9cc3e2, light: 0xe8f4ff, amb: 1.8, ground: 0x4f9a68, speed: 1.1 },
    { sky: 0x222a5c, light: 0xb9c4ff, amb: 1.3, ground: 0x2f5a46, speed: 1.2 },
  ],
  jungla: [
    { sky: 0xb4d68c, light: 0xfffbe0, amb: 2.0, ground: 0x8a7046, speed: 1.0 },
    { sky: 0x96cfc8, light: 0xf0fff8, amb: 1.9, ground: 0x7a6a4a, speed: 1.1 },
    { sky: 0xeab27a, light: 0xffe4c0, amb: 2.0, ground: 0xb07a46, speed: 1.2 },
    { sky: 0x7a3426, light: 0xffb08a, amb: 1.6, ground: 0x5a3426, speed: 1.3 },
  ],
  espacio: [
    { sky: 0x0b1a33, light: 0xd8ecff, amb: 1.4, ground: null, speed: 1.4, planet: 0xcfe8ff },
    { sky: 0x220b08, light: 0xffd2c0, amb: 1.4, ground: null, speed: 1.6, planet: 0xd8583a },
    { sky: 0x0b0b14, light: 0xe0e0e8, amb: 1.4, ground: null, speed: 1.8, planet: 0x9a9088 },
    { sky: 0x0b1442, light: 0xc8d8ff, amb: 1.5, ground: null, speed: 2.0, planet: 0x4f7bff },
  ],
  cubos: [
    { sky: 0x8fd3ff, light: 0xffffff, amb: 2.2, ground: 0x6cc24a, speed: 0.6 },
    { sky: 0x9fd6b0, light: 0xf4fff0, amb: 2.0, ground: 0x4f9a3a, speed: 0.6 },
    { sky: 0xcfe3f2, light: 0xffffff, amb: 2.2, ground: 0xb8c0c8, speed: 0.6 },
    { sky: 0x2a1f4a, light: 0xd8c8ff, amb: 1.6, ground: 0x4a3a6a, speed: 0.6 },
  ],
  estadio: [
    { sky: 0x8fd0ff, light: 0xffffff, amb: 2.1, ground: 0x3f9e3a, speed: 1.2 },
    { sky: 0xf4b06a, light: 0xffe6c8, amb: 2.0, ground: 0x3a9136, speed: 1.3 },
    { sky: 0x3d4f8a, light: 0xe0e8ff, amb: 1.8, ground: 0x358a33, speed: 1.4 },
    { sky: 0x0f1630, light: 0xffffff, amb: 1.9, ground: 0x2f8a30, speed: 1.6 },
  ],
};

// ── Decorados ────────────────────────────────────────────────────────────────
function makeProps(id) {
  const r = rng(id.length * 131);
  switch (id) {
    case 'sonrisa': {
      const handle = lam(0x35c3a8), bristle = lam(0xffffff), tubeMat = lam(0xffffff), cap = lam(0x2f7bf6), cloud = lam(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.25 });
      const brush = () => {
        const g = new THREE.Group();
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 10), handle);
        h.position.y = 1.6;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), handle);
        head.position.y = 3.4;
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.35), bristle);
        br.position.set(0, 3.4, 0.3);
        g.add(h, head, br);
        g.rotation.z = (r() - 0.5) * 0.4;
        return g;
      };
      const tube = () => {
        const g = new THREE.Group();
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.8, 16), tubeMat);
        t.position.y = 0.9;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), cap);
        c.position.y = 1.95;
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.25, 16), lam(0xe0384b));
        stripe.position.y = 0.9;
        g.add(t, c, stripe);
        return g;
      };
      const hill = () => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(2.5, 18, 12), lam(0x86d873));
        m.scale.set(1.4, 0.55, 1);
        return m;
      };
      const cloudF = () => {
        const g = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 + r() * 0.4, 12, 8), cloud);
          s.position.set(i * 0.7 - 1, r() * 0.3, 0);
          g.add(s);
        }
        g.position.y = 5 + r() * 2;
        return g;
      };
      return { near: [brush, tube, brush], far: [hill, cloudF] };
    }
    case 'mar': {
      const weedMat = lam(0x2f9a52, { side: THREE.DoubleSide }), rockMat = lam(0x6a6a72), corals = [0xff7a8a, 0xffb347, 0xc77dff, 0xff5fa2].map((c) => lam(c));
      const weed = () => {
        const g = new THREE.Group();
        const n = 3 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 2 + r() * 2, 1, 6), weedMat);
          m.geometry.translate(0, m.geometry.parameters.height / 2, 0);
          m.position.set((r() - 0.5) * 0.8, 0, (r() - 0.5) * 0.8);
          m.rotation.y = r() * 3;
          m.userData.sway = r() * 6;
          g.add(m);
        }
        g.userData.weed = true;
        return g;
      };
      const coral = () => {
        const g = new THREE.Group();
        const mat = corals[Math.floor(r() * corals.length)];
        for (let i = 0; i < 5; i++) {
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.6 + r() * 0.8, 6), mat);
          c.position.set((r() - 0.5) * 0.6, 0.4, (r() - 0.5) * 0.6);
          c.rotation.set((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9);
          g.add(c);
        }
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat);
        ball.position.y = 0.2;
        g.add(ball);
        return g;
      };
      const rock = () => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + r() * 0.9, 0), rockMat);
        m.position.y = 0.2;
        return m;
      };
      const fish = () => {
        const g = new THREE.Group();
        const col = [0xffa53a, 0xffe14a, 0x4ad3ff, 0xff6ad5][Math.floor(r() * 4)];
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lam(col));
        body.scale.set(1.6, 1, 0.6);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), lam(col));
        tail.rotation.z = Math.PI / 2;
        tail.position.x = 0.42;
        g.add(body, tail);
        g.position.y = 1 + r() * 2.5;
        g.userData.swim = { phase: r() * 6, speed: 0.6 + r() * 0.8 };
        return g;
      };
      return { near: [weed, coral, rock, weed], far: [rock, fish, fish] };
    }
    case 'bosque': {
      const trunk = lam(0x6b4a2b), crowns = [0x3f8f3a, 0x2f7a3a, 0x5aa84a].map((c) => lam(c)), capMat = lam(0xe04040), stem = lam(0xf4ecd8), dot = lam(0xffffff);
      const tree = () => {
        const g = new THREE.Group();
        const h = 1.6 + r() * 1.2;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, h, 8), trunk);
        t.position.y = h / 2;
        g.add(t);
        const crown = crowns[Math.floor(r() * crowns.length)];
        if (r() < 0.5) {
          for (let i = 0; i < 3; i++) {
            const c = new THREE.Mesh(new THREE.ConeGeometry(1.1 - i * 0.25, 1.3, 10), crown);
            c.position.y = h + i * 0.7;
            g.add(c);
          }
        } else {
          const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), crown);
          c.position.y = h + 0.7;
          g.add(c);
        }
        return g;
      };
      const mush = () => {
        const g = new THREE.Group();
        const s = 0.5 + r() * 0.8;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.16 * s, 0.6 * s, 10), stem);
        st.position.y = 0.3 * s;
        const cp = new THREE.Mesh(new THREE.SphereGeometry(0.45 * s, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
        cp.position.y = 0.55 * s;
        g.add(st, cp);
        for (let i = 0; i < 5; i++) {
          const d = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 6, 4), dot);
          const a = r() * Math.PI * 2, rad = 0.25 * s;
          d.position.set(Math.cos(a) * rad, 0.55 * s + 0.3 * s, Math.sin(a) * rad);
          g.add(d);
        }
        return g;
      };
      const flower = () => {
        const g = new THREE.Group();
        const col = [0xff8fd0, 0xfff07a, 0xb59bff][Math.floor(r() * 3)];
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), lam(0x3f8f3a));
        st.position.y = 0.2;
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lam(col, { emissive: col, emissiveIntensity: 0.3 }));
        f.position.y = 0.42;
        g.add(st, f);
        return g;
      };
      return { near: [mush, flower, mush, flower], far: [tree, tree] };
    }
    case 'jungla': {
      const trunk = lam(0x7a5a3a), leaf = lam(0x3f9a3a, { side: THREE.DoubleSide }), fernMat = lam(0x4fae4a), rockMat = lam(0x8a7a6a);
      const palm = () => {
        const g = new THREE.Group();
        const h = 2.4 + r() * 1.4;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 8), trunk);
        t.position.y = h / 2;
        t.rotation.z = (r() - 0.5) * 0.25;
        g.add(t);
        for (let i = 0; i < 6; i++) {
          const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.8), leaf);
          l.geometry.translate(0, 0.9, 0);
          l.position.y = h;
          l.rotation.set(1.1, (i / 6) * Math.PI * 2, 0, 'YXZ');
          g.add(l);
        }
        return g;
      };
      const fern = () => {
        const g = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const c = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 5), fernMat);
          c.position.set((r() - 0.5) * 0.5, 0.45, (r() - 0.5) * 0.5);
          c.rotation.set((r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6);
          g.add(c);
        }
        return g;
      };
      const rock = () => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + r() * 0.8, 0), rockMat);
        m.position.y = 0.3;
        return m;
      };
      const dino = () => {
        // Dinosaurio de cuello largo, amable y lejano.
        const g = new THREE.Group();
        const col = [0x7fb06a, 0x9a8ad0, 0xd0a060][Math.floor(r() * 3)];
        const m = lam(col);
        const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), m);
        body.scale.set(1.6, 0.9, 0.9);
        body.position.y = 1.8;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.6, 8), m);
        neck.position.set(1.6, 3.1, 0);
        neck.rotation.z = -0.6;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), m);
        head.scale.set(1.5, 1, 1);
        head.position.set(2.5, 4.2, 0);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 8), m);
        tail.rotation.z = Math.PI / 2 + 0.3;
        tail.position.set(-2.2, 1.6, 0);
        g.add(body, neck, head, tail);
        [[-0.8, 0.4], [-0.8, -0.4], [0.8, 0.4], [0.8, -0.4]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.4, 8), m);
          leg.position.set(x, 0.7, z);
          g.add(leg);
        });
        g.rotation.y = r() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
        g.userData.dino = true;
        return g;
      };
      return { near: [fern, rock, fern], far: [palm, palm, dino] };
    }
    case 'espacio': {
      const rockMat = lam(0x8a8580), cols = [0xd8583a, 0xcfe8ff, 0xe8c070, 0x7ad0a0, 0xb08ae0];
      const asteroid = () => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + r() * 0.7, 0), rockMat);
        m.position.y = 0.5 + r() * 3;
        m.userData.spin = (r() - 0.5) * 1.2;
        return m;
      };
      const planet = () => {
        const g = new THREE.Group();
        const col = cols[Math.floor(r() * cols.length)];
        const p = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 1.5, 24, 16), lam(col, { emissive: col, emissiveIntensity: 0.15 }));
        g.add(p);
        if (r() < 0.5) {
          const ring = new THREE.Mesh(new THREE.RingGeometry(p.geometry.parameters.radius * 1.4, p.geometry.parameters.radius * 2, 32), basic(0xf0e0c0, { side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
          ring.rotation.x = 1.2;
          g.add(ring);
        }
        g.position.y = 2 + r() * 4;
        return g;
      };
      return { near: [asteroid, asteroid], far: [planet, asteroid] };
    }
    case 'cubos': {
      const B = 0.5; // tamaño del bloque del paisaje
      const box = new THREE.BoxGeometry(B * 0.98, B * 0.98, B * 0.98);
      const mats = {
        trunk: lam(0x8a5a34), leaf: lam(0x3fae4a), leaf2: lam(0x2f8f3f), rock: lam(0x9aa3ad), snow: lam(0xf4f8ff),
        water: lam(0x3fa9f5, { transparent: true, opacity: 0.75 }), crystal: lam(0xb27dff, { emissive: 0x7a3fff, emissiveIntensity: 0.6 }),
        hill: lam(0x5fb848), dirt: lam(0xa0703f),
      };
      const cube = (g, x, y, z, m) => { const c = new THREE.Mesh(box, mats[m]); c.position.set(x * B, y * B + B / 2, z * B); g.add(c); };
      const tree = () => {
        const g = new THREE.Group();
        const h = 3 + Math.floor(r() * 3);
        for (let y = 0; y < h; y++) cube(g, 0, y, 0, 'trunk');
        for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) for (let y = h - 1; y <= h; y++) if (!(x === 0 && z === 0 && y < h)) cube(g, x, y, z, r() < 0.5 ? 'leaf' : 'leaf2');
        cube(g, 0, h + 1, 0, 'leaf');
        return g;
      };
      const hill = () => {
        const g = new THREE.Group();
        const w = 3 + Math.floor(r() * 2);
        for (let y = 0; y < w; y++) for (let x = -w + y; x <= w - y; x++) for (let z = -1; z <= 1; z++) cube(g, x, y, z, y === w - 1 ? 'snow' : r() < 0.15 ? 'dirt' : 'hill');
        return g;
      };
      const rock = () => {
        const g = new THREE.Group();
        cube(g, 0, 0, 0, 'rock'); cube(g, 1, 0, 0, 'rock'); cube(g, 0, 1, 0, 'rock');
        return g;
      };
      const pool = () => {
        const g = new THREE.Group();
        for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) { const c = new THREE.Mesh(box, mats.water); c.scale.y = 0.2; c.position.set(x * B, 0.05, z * B); g.add(c); }
        return g;
      };
      const crystal = () => {
        const g = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const c = new THREE.Mesh(box, mats.crystal);
          c.scale.set(0.5, 1.2 + r(), 0.5);
          c.position.set((r() - 0.5) * 0.6, 0.4, (r() - 0.5) * 0.6);
          c.rotation.set(0, Math.PI / 4, (r() - 0.5) * 0.4);
          g.add(c);
        }
        return g;
      };
      return { near: [rock, pool, crystal, rock], far: [tree, tree, hill] };
    }
    case 'estadio': {
      const crowd = tex(128, (g, s) => {
        const rr = rng(9);
        g.fillStyle = '#2b2f45';
        g.fillRect(0, 0, s, s);
        const cs = ['#ffd84a', '#e0384b', '#ffffff', '#2f7bf6', '#35c3a8', '#ff9a3c'];
        for (let y = 4; y < s; y += 10) for (let x = 3; x < s; x += 7) { g.fillStyle = cs[Math.floor(rr() * cs.length)]; g.beginPath(); g.arc(x + rr() * 2, y, 2.4, 0, Math.PI * 2); g.fill(); }
      }, 3, 2);
      const standMat = lam(0xffffff, { map: crowd });
      const poleMat = lam(0xb0b6c0), lightMat = basic(0xffffff);
      const stand = () => {
        const g = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, OPEN_L), standMat);
          step.position.set(i * 1.1, 0.3 + i * 0.6, 0);
          g.add(step);
        }
        g.userData.stand = true;
        return g;
      };
      const pole = () => {
        const g = new THREE.Group();
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 8), poleMat);
        p.position.y = 3.5;
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.2), lightMat);
        lamp.position.y = 7.1;
        g.add(p, lamp);
        return g;
      };
      return { near: [stand], far: [pole], fixedSides: true };
    }
    default:
      return { near: [], far: [] };
  }
}

function groundTexture(id) {
  switch (id) {
    case 'mar': return tex(256, speckle('#e6d29a', ['#c9b277', '#fff2c4'], 900), 6, 1);
    case 'jungla': return tex(256, speckle('#8a7046', ['#6a5434', '#a88a5a', '#5f8a3a'], 900), 6, 1);
    case 'estadio': return tex(256, (g, s) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3f9e3a' : '#47a842'; g.fillRect(0, (i * s) / 8, s, s / 8); }
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(s * 0.31, 0, 4, s); // líneas de banda del campo
      g.fillRect(s * 0.69 - 4, 0, 4, s);
    }, 1, 1);
    case 'cubos': return tex(256, (g, s) => {
      // Cuadrícula de bloques lisos con ligeras variaciones de tono (estilo propio, sin texturas pixeladas).
      const rr = rng(21);
      const n = 8;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const v = 0.88 + rr() * 0.12;
        g.fillStyle = `rgb(${Math.round(255 * v)},${Math.round(255 * v)},${Math.round(255 * v)})`;
        g.fillRect((x * s) / n, (y * s) / n, s / n, s / n);
      }
      g.strokeStyle = 'rgba(0,0,0,.12)';
      g.lineWidth = 2;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo((i * s) / n, 0); g.lineTo((i * s) / n, s); g.stroke(); g.beginPath(); g.moveTo(0, (i * s) / n); g.lineTo(s, (i * s) / n); g.stroke(); }
    }, 11, 1.5);
    default: return tex(256, speckle('#7ed36a', ['#5fae4a', '#9ae07a', '#ffffff'], 700), 6, 1);
  }
}

/**
 * Construye un mundo abierto. Devuelve { group, modules, palettes, recycle, animate, particles }.
 */
export function buildOpenWorld(id) {
  const r = rng(id.length * 977 + 5);
  const group = new THREE.Group();
  const palettes = PALETTES[id];
  const props = makeProps(id);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (palettes[0].ground != null) groundMat.map = groundTexture(id);
  const groundG = new THREE.PlaneGeometry(GROUND_W, OPEN_L);
  const modules = [];

  const fill = (m) => {
    // Vacía y vuelve a decorar el módulo.
    m.userData.props.forEach((p) => m.remove(p));
    m.userData.props = [];
    const add = (factory, x) => {
      const p = factory();
      p.position.x = x;
      p.position.z = (r() - 0.5) * OPEN_L * 0.8;
      if (props.fixedSides && p.userData.stand) {
        p.position.z = 0;
        p.rotation.y = x < 0 ? Math.PI : 0;
      }
      m.add(p);
      m.userData.props.push(p);
    };
    for (const side of [-1, 1]) {
      if (props.fixedSides) {
        if (props.near[0]) add(props.near[0], side * 5.2);
        if (r() < 0.5 && props.far[0]) add(props.far[0], side * 4.4);
        continue;
      }
      const nNear = 1 + Math.floor(r() * 2);
      for (let i = 0; i < nNear; i++) add(props.near[Math.floor(r() * props.near.length)], side * (2 + r() * 2.5));
      if (r() < 0.7) add(props.far[Math.floor(r() * props.far.length)], side * (6 + r() * 7));
    }
  };

  for (let i = 0; i < COUNT; i++) {
    const m = new THREE.Group();
    if (palettes[0].ground != null) {
      const ground = new THREE.Mesh(groundG, groundMat);
      ground.rotation.x = -Math.PI / 2;
      m.add(ground);
    }
    m.userData.props = [];
    m.position.z = -i * OPEN_L;
    fill(m);
    group.add(m);
    modules.push(m);
  }

  // Partículas: burbujas, luciérnagas, estrellas o polvo según el mundo.
  const pcfg = {
    sonrisa: { n: 60, color: 0xffffff, size: 0.12, rise: 0.4, spread: [8, 4] },
    mar: { n: 120, color: 0xe8ffff, size: 0.08, rise: 0.6, spread: [8, 5] },
    bosque: { n: 70, color: 0xfff27a, size: 0.09, rise: 0.05, spread: [8, 3], glow: true },
    jungla: { n: 40, color: 0xfff6c0, size: 0.05, rise: 0.02, spread: [8, 3] },
    espacio: { n: 700, color: 0xffffff, size: 0.07, rise: 0, spread: [26, 18], stars: true },
    estadio: { n: 0 },
    cubos: { n: 0 },
  }[id];
  let particles = null;
  if (pcfg && pcfg.n) {
    const pos = new Float32Array(pcfg.n * 3);
    for (let i = 0; i < pcfg.n; i++) {
      pos[i * 3] = (r() - 0.5) * pcfg.spread[0] * 2;
      pos[i * 3 + 1] = pcfg.stars ? (r() - 0.3) * pcfg.spread[1] : r() * pcfg.spread[1];
      pos[i * 3 + 2] = -r() * 30;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(g, new THREE.PointsMaterial({ color: pcfg.color, size: pcfg.size, transparent: true, opacity: 0.85, depthWrite: false, fog: !pcfg.stars }));
    particles.userData = pcfg;
    group.add(particles);
  }

  // Planeta grande de fondo (espacio): cambia de color con el nivel.
  let backdrop = null;
  if (id === 'espacio') {
    backdrop = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 20), new THREE.MeshLambertMaterial({ color: palettes[0].planet, emissive: palettes[0].planet, emissiveIntensity: 0.25, fog: false }));
    group.add(backdrop);
  }
  // Volcán lejano (jungla).
  if (id === 'jungla') {
    backdrop = new THREE.Group();
    const v = new THREE.Mesh(new THREE.ConeGeometry(9, 9, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0x5a3a2a, fog: false }));
    v.position.y = 4.5;
    const lava = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), new THREE.MeshBasicMaterial({ color: 0xff7a2a, fog: false }));
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = 8.6;
    backdrop.add(v, lava);
    group.add(backdrop);
  }

  return {
    id,
    group,
    modules,
    palettes,
    length: OPEN_L,
    groundMat,
    recycle(m) { fill(m); },
    setPalette(i) {
      const p = palettes[i];
      if (p.ground != null) groundMat.color.setHex(0xffffff).lerp(new THREE.Color(p.ground), 0.35);
      if (backdrop && p.planet) { backdrop.material.color.setHex(p.planet); backdrop.material.emissive.setHex(p.planet); }
    },
    animate(t, dt, cam) {
      if (particles) {
        const a = particles.geometry.attributes.position;
        const c = particles.userData;
        for (let i = 0; i < a.count; i++) {
          let y = a.array[i * 3 + 1] + c.rise * dt;
          let z = a.array[i * 3 + 2];
          if (c.glow) a.array[i * 3] += Math.sin(t * 1.3 + i) * 0.003;
          if (y > c.spread[1]) y = 0;
          // Mantener la nube alrededor de la cámara.
          if (z > cam.position.z + 2) z -= 30;
          a.array[i * 3 + 1] = y;
          a.array[i * 3 + 2] = z;
        }
        a.needsUpdate = true;
        if (c.glow) particles.material.opacity = 0.6 + Math.sin(t * 2) * 0.3;
      }
      if (backdrop) backdrop.position.set(id === 'espacio' ? 7 : -16, id === 'espacio' ? 5 : 0, cam.position.z - 30);
      for (const m of modules) {
        for (const p of m.userData.props) {
          if (p.userData.weed) p.children.forEach((w) => { w.rotation.z = Math.sin(t * 1.2 + w.userData.sway) * 0.15; });
          if (p.userData.swim) { const s = p.userData.swim; p.position.x += Math.sin(t * s.speed + s.phase) * 0.01; p.rotation.y = Math.sin(t * s.speed + s.phase) * 0.5; }
          if (p.userData.spin) { p.rotation.x += p.userData.spin * dt; p.rotation.y += p.userData.spin * dt * 0.7; }
          if (p.userData.dino) p.position.y = Math.abs(Math.sin(t * 1.5 + p.position.z)) * 0.05;
        }
      }
    },
  };
}
