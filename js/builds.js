// Construcciones de «Mundo Cubo»: mientras se cepilla, cada zona levanta una construcción
// bloque a bloque (casa, torre, puente, castillo). Al terminar se ven las cuatro sobre islas
// flotantes, y en el inicio aparece el «pueblo» con lo construido en misiones anteriores.

import * as THREE from '../vendor/three.module.min.js';

export const BUILD_TYPES = ['casa', 'torre', 'puente', 'castillo'];
const BS = 0.16; // tamaño de bloque de las construcciones

/** Lista de bloques { x, y, z, c } ordenada de abajo arriba (así crece con naturalidad). */
export function structureBlocks(type) {
  const out = [];
  const add = (x, y, z, c) => out.push({ x, y, z, c });
  switch (type) {
    case 'casa': {
      for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 4; z++) {
        const edge = x === 0 || x === 4 || z === 0 || z === 3;
        const door = z === 0 && x === 2 && y < 2;
        const win = y === 1 && ((z === 0 && (x === 1 || x === 3)) || (x === 0 && z === 2) || (x === 4 && z === 1));
        if (edge && !door) add(x, y, z, win ? 0x8fd8ff : 0xf2d7a0);
      }
      for (let x = -1; x <= 5; x++) for (let z = -1; z <= 4; z++) add(x, 3, z, 0xd8584a);
      for (let x = 0; x <= 4; x++) for (let z = 0; z <= 3; z++) add(x, 4, z, 0xc24a3e);
      for (let x = 1; x <= 3; x++) for (let z = 1; z <= 2; z++) add(x, 5, z, 0xd8584a);
      add(4, 5, 0, 0x8a8f99); add(4, 6, 0, 0x8a8f99); // chimenea
      break;
    }
    case 'torre': {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) {
        if (x === 1 && z === 1) continue;
        const win = y % 3 === 2 && x === 1 && z === 0;
        add(x, y, z, win ? 0x2b3140 : y % 2 ? 0xa9b0bc : 0x9aa1ad);
      }
      for (let x = -1; x <= 3; x++) for (let z = -1; z <= 3; z++) {
        const edge = x === -1 || x === 3 || z === -1 || z === 3;
        if (edge) add(x, 8, z, 0x7d8694);
        if (edge && (x + z) % 2 === 0) add(x, 9, z, 0x7d8694);
      }
      add(1, 9, 1, 0x6b4a2b); add(1, 10, 1, 0x6b4a2b); add(1, 11, 1, 0xe0384b); add(2, 11, 1, 0xe0384b); // bandera
      break;
    }
    case 'puente': {
      for (const px of [0, 8]) for (let y = 0; y < 3; y++) for (let z = 0; z < 2; z++) add(px, y, z, 0x8a8f99);
      for (let x = 0; x <= 8; x++) for (let z = 0; z < 2; z++) add(x, 3, z, 0x9a6a3e);
      for (let x = 0; x <= 8; x++) {
        for (const z of [-1, 2]) {
          if (x % 2 === 0) add(x, 4, z, 0xc89a62);
          add(x, 5, z, 0xc89a62);
        }
      }
      for (const x of [3, 4, 5]) for (let z = 0; z < 2; z++) add(x, 2, z, 0x9a6a3e); // arco
      break;
    }
    case 'castillo': {
      for (let y = 0; y < 3; y++) for (let x = 0; x < 7; x++) for (let z = 0; z < 7; z++) {
        const edge = x === 0 || x === 6 || z === 0 || z === 6;
        const gate = z === 0 && (x === 3) && y < 2;
        if (edge && !gate) add(x, y, z, 0xc9c2b4);
      }
      for (let x = 0; x < 7; x++) for (let z = 0; z < 7; z++) {
        const edge = x === 0 || x === 6 || z === 0 || z === 6;
        if (edge && (x + z) % 2 === 0) add(x, 3, z, 0xb3ab9c);
      }
      for (const [cx, cz] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
        for (let y = 3; y < 6; y++) add(cx, y, cz, 0xe8e2d4);
        add(cx, 6, cz, 0x2f7bf6);
      }
      for (let y = 0; y < 5; y++) add(3, y, 3, 0xe8e2d4);
      add(3, 5, 3, 0xffd84a); // torre central con cristal dorado
      break;
    }
    default:
      break;
  }
  return out.sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
}

const boxGeo = new THREE.BoxGeometry(BS * 0.96, BS * 0.96, BS * 0.96);

function instanced(blocks, mat) {
  const mesh = new THREE.InstancedMesh(boxGeo, mat, blocks.length);
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of blocks) { minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x); minZ = Math.min(minZ, b.z); maxZ = Math.max(maxZ, b.z); }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  blocks.forEach((b, i) => {
    m.makeTranslation((b.x - cx) * BS, b.y * BS + BS / 2, (b.z - cz) * BS);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.setHex(b.c));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData.size = { w: maxX - minX + 1, d: maxZ - minZ + 1 };
  return mesh;
}

function islandBlocks(w, d) {
  const out = [];
  const hw = Math.ceil(w / 2) + 1, hd = Math.ceil(d / 2) + 1;
  for (let x = -hw; x <= hw; x++) for (let z = -hd; z <= hd; z++) out.push({ x, y: -1, z, c: 0x5fb848 });
  for (let x = -hw + 1; x <= hw - 1; x++) for (let z = -hd + 1; z <= hd - 1; z++) out.push({ x, y: -2, z, c: 0xa0703f });
  for (let x = -hw + 2; x <= hw - 2; x++) for (let z = -hd + 2; z <= hd - 2; z++) out.push({ x, y: -3, z, c: 0x8a5a34 });
  return out;
}

export class Builder {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.mode = 'hidden';
    this.zone = 0;
    this.frac = 0;
    this.villageCount = 0;
    this.blocks = BUILD_TYPES.map((t) => structureBlocks(t));
    // Construcción en curso (una por zona) sobre una isla flotante junto al compañero.
    this.live = this.blocks.map((b) => {
      const g = new THREE.Group();
      const m = instanced(b, this.mat);
      m.count = 0;
      const { w, d } = m.userData.size;
      g.add(m, instanced(islandBlocks(w, d), this.mat));
      g.userData.mesh = m;
      g.visible = false;
      this.group.add(g);
      return g;
    });
    // Islas flotantes del final (las 4 de hoy).
    this.today = BUILD_TYPES.map((t, i) => this._island(i));
    this.today.forEach((g) => { g.visible = false; this.group.add(g); });
    this.village = [];
  }

  _island(typeIndex) {
    const g = new THREE.Group();
    const s = instanced(this.blocks[typeIndex], this.mat);
    const { w, d } = s.userData.size;
    const isl = instanced(islandBlocks(w, d), this.mat);
    g.add(s, isl);
    g.userData.phase = typeIndex * 1.7;
    return g;
  }

  /** Cuántas construcciones lleva en total (misiones de Mundo Cubo × 4). */
  setVillage(n) {
    this.villageCount = n;
    const show = Math.min(12, n);
    while (this.village.length < show) {
      const g = this._island(this.village.length % 4);
      g.scale.setScalar(0.8);
      this.group.add(g);
      this.village.push(g);
    }
    this.village.forEach((g, i) => { g.visible = i < show; });
  }

  setProgress(zone, frac) {
    this.zone = zone;
    this.frac = Math.max(0, Math.min(1, frac));
  }

  setMode(mode) {
    this.mode = mode;
  }

  update(cam, t, active) {
    this.group.visible = active;
    if (!active) return;
    const brush = this.mode === 'brush';
    this.live.forEach((g, i) => {
      g.visible = brush && i === this.zone;
      if (g.visible) {
        g.userData.mesh.count = Math.max(1, Math.floor(this.frac * this.blocks[i].length));
        g.position.set(cam.position.x - 0.5, cam.position.y + 0.3 + Math.sin(t * 1.2) * 0.03, cam.position.z - 3.4);
        g.rotation.set(0.15, 0.6 + Math.sin(t * 0.5) * 0.1, 0);
        g.scale.setScalar(0.55);
      }
    });
    const done = this.mode === 'done';
    this.today.forEach((g, i) => {
      g.visible = done;
      if (done) {
        const col = i % 2, row = Math.floor(i / 2);
        g.position.set(cam.position.x + (col ? 1.25 : -1.25), 2.9 + (1 - row) * 1.05 + Math.sin(t * 1.2 + g.userData.phase) * 0.05, cam.position.z - 8);
        g.scale.setScalar(0.85);
        g.rotation.y = 0.5 + Math.sin(t * 0.4 + i) * 0.15;
      }
    });
    const home = this.mode === 'home' || this.mode === 'hangar';
    this.village.forEach((g, i) => {
      if (!home || i >= Math.min(12, this.villageCount)) { g.visible = false; return; }
      g.visible = true;
      const row = Math.floor(i / 4), col = i % 4;
      g.position.set(cam.position.x - 2.6 + col * 1.75 + (row % 2) * 0.5, 2.6 + row * 0.75 + Math.sin(t + g.userData.phase + i) * 0.06, cam.position.z - 8.5 - row * 2.2);
      g.rotation.y = 0.6 + i * 0.4;
    });
  }
}
