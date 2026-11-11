// Dientín: diente blanco sonriente con capa azul (compañero de la temática «Dientín»).
// Personaje original. Sin modelos externos: todo se genera aquí y funciona sin conexión.

import * as THREE from '../vendor/three.module.min.js';
import { TOOTH_ACCESSORIES as ACCESSORIES } from './accessories.js';

const WHITE = 0xfbfdff;
const BLUE = 0x2f7bf6;
const INK = 0x1b2a4a;

// Objetivos de cada expresión (se interpolan suavemente).
const EXPRESSIONS = {
  feliz: { lid: 0.0, brow: 0.15, browY: 0, smile: 1, open: 0.15, stars: 0 },
  concentrado: { lid: 0.42, brow: -0.25, browY: -0.02, smile: 0.45, open: 0, stars: 0 },
  animado: { lid: 0.0, brow: 0.35, browY: 0.05, smile: 1, open: 0.85, stars: 0 },
  contento: { lid: 0.0, brow: 0.4, browY: 0.06, smile: 1, open: 1, stars: 1 },
};

function starShape(r = 1) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  return s;
}


export class ToothMascot {
  constructor(scene) {
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene = { add: (o) => this.inner.add(o) };
    // holder: lo coloca el escenario · inner: la animación propia del personaje.
    this.holder = new THREE.Group();
    this.inner = new THREE.Group();
    this.holder.add(this.inner);
    this.holder.scale.setScalar(0.3);
    scene.add(this.holder);
    this.expr = { ...EXPRESSIONS.feliz };
    this.target = EXPRESSIONS.feliz;
    this.mood = 'feliz';
    this.brushMotion = null;
    this.shine = 0;
    this._burst = 0;
    this._build();
  }

  set visible(v) { this.holder.visible = v; }
  get visible() { return this.holder.visible; }

  _build() {
    const root = (this.root = new THREE.Group());
    this.scene.add(root);
    const body = (this.body = new THREE.Group());
    root.add(body);

    this.toothMat = new THREE.MeshPhysicalMaterial({
      color: WHITE, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.02,
    });
    const ink = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.4 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Corona: perfil de torno (forma redondeada, más ancha arriba).
    const pts = [];
    const prof = [
      [0.0, -0.95], [0.62, -0.92], [0.92, -0.6], [1.05, -0.1], [1.08, 0.35], [1.0, 0.75], [0.8, 1.02], [0.45, 1.12], [0.0, 1.06],
    ];
    for (const [x, y] of prof) pts.push(new THREE.Vector2(x, y));
    const crown = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(40), 48), this.toothMat);
    crown.scale.set(1, 1, 0.82);
    body.add(crown);

    // Cúspides (los dos «bultitos» de arriba de una muela).
    [-0.45, 0.45].forEach((x) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), this.toothMat);
      c.position.set(x, 0.92, 0);
      c.scale.set(1, 0.6, 0.8);
      body.add(c);
    });

    // Raíces = piernas.
    this.legs = [-0.42, 0.42].map((x) => {
      const g = new THREE.Group();
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 8, 20), this.toothMat);
      leg.position.y = -0.38;
      g.add(leg);
      g.position.set(x, -0.8, 0);
      g.rotation.z = x > 0 ? 0.12 : -0.12;
      body.add(g);
      return g;
    });

    // Brazos.
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 1.0, 0.05, 0.1);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.45, 6, 12), this.toothMat);
      arm.position.set(side * 0.28, -0.12, 0);
      arm.rotation.z = side * 1.1;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), this.toothMat);
      hand.position.set(side * 0.52, -0.28, 0);
      pivot.add(arm, hand);
      body.add(pivot);
      return { pivot, hand, side };
    });

    // Cepillo de dientes en la mano derecha (lado +x en pantalla).
    const brush = (this.brush = new THREE.Group());
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.75, 4, 10), new THREE.MeshStandardMaterial({ color: 0x35c3a8, roughness: 0.4 }));
    handle.rotation.z = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0x35c3a8 }));
    head.position.set(-0.45, 0, 0);
    const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.09), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    bristles.position.set(-0.45, 0.09, 0);
    brush.add(handle, head, bristles);
    brush.position.copy(this.arms[1].hand.position);
    this.arms[1].pivot.add(brush);
    brush.visible = false;

    // Cara.
    const face = (this.face = new THREE.Group());
    face.position.set(0, 0.3, 0.84);
    body.add(face);

    this.eyes = [-0.32, 0.32].map((x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.08, 0);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), ink);
      pupil.scale.set(1, 1.25, 0.5);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), white);
      glint.position.set(0.05, 0.08, 0.07);
      const star = new THREE.Mesh(
        new THREE.ExtrudeGeometry(starShape(0.2), { depth: 0.04, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xffa800, emissiveIntensity: 0.4 }),
      );
      star.visible = false;
      // Párpado: media esfera del color del diente que baja para entornar los ojos.
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.toothMat);
      lid.scale.set(1, 1.3, 0.6);
      lid.position.z = 0.02;
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), ink);
      brow.rotation.z = Math.PI / 2;
      brow.position.y = 0.32;
      g.add(pupil, glint, star, lid, brow);
      face.add(g);
      return { g, pupil, glint, star, lid, brow, side: Math.sign(x) };
    });

    // Boca: sonrisa (toro parcial) + boca abierta (elipse oscura con lengua).
    this.smile = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 32, Math.PI), ink);
    this.smile.rotation.z = Math.PI;
    this.smile.position.set(0, -0.16, 0.02);
    face.add(this.smile);

    const mouthOpen = (this.mouthOpen = new THREE.Group());
    const cavity = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5a1a2b }));
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), new THREE.MeshBasicMaterial({ color: 0xff7b93 }));
    tongue.position.set(0, -0.14, 0.003);
    tongue.scale.y = 0.6;
    mouthOpen.add(cavity, tongue);
    mouthOpen.position.set(0, -0.14, 0.04);
    face.add(mouthOpen);

    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff9db0, transparent: true, opacity: 0.55 });
    [-0.58, 0.58].forEach((x) => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), cheekMat);
      c.position.set(x, -0.08, -0.06);
      c.rotation.y = x * 0.6;
      face.add(c);
    });

    // Capa: plano subdividido que ondea con el movimiento.
    const capeGeo = new THREE.PlaneGeometry(2.3, 1.9, 16, 14);
    capeGeo.translate(0, -0.9, 0);
    this.capeBase = capeGeo.attributes.position.array.slice();
    this.capeMat = new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.55, side: THREE.DoubleSide });
    this.cape = new THREE.Mesh(capeGeo, this.capeMat);
    this.cape.position.set(0, 0.75, -0.72);
    this.cape.rotation.x = 0.12;
    body.add(this.cape);
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.6, roughness: 0.3 }));
    clasp.position.set(0, 0.72, 0.62);
    body.add(clasp);
    // Cordón de la capa alrededor del «cuello».
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.035, 8, 48, Math.PI), this.capeMat);
    cord.rotation.set(Math.PI / 2 - 0.12, 0, 0);
    cord.position.set(0, 0.72, -0.05);
    cord.scale.set(1, 0.72, 1);
    body.add(cord);

    // Destellos alrededor de Denti cuando brilla.
    this.sparkles = new THREE.Group();
    const spMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.09)), spMat.clone());
      const a = (i / 6) * Math.PI * 2;
      s.userData = { a, r: 1.55 + (i % 2) * 0.25, phase: i * 0.9 };
      this.sparkles.add(s);
    }
    root.add(this.sparkles);

    this._buildAccessories();
  }

  _buildAccessories() {
    const A = (this.accessoryMeshes = {});
    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, ...extra });

    // Gafas de sol
    const gafas = new THREE.Group();
    [-0.32, 0.32].forEach((x) => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24), std(0x18233d, { metalness: 0.3, roughness: 0.15 }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 0.08, 0.1);
      gafas.add(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.04), std(0x18233d));
    bridge.position.set(0, 0.14, 0.1);
    gafas.add(bridge);
    this.face.add(gafas);
    A.gafas = gafas;

    // Antifaz de superhéroe
    const antifaz = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.11, 8, 40, Math.PI * 0.62), std(0xe0384b));
    antifaz.rotation.z = Math.PI / 2 - Math.PI * 0.31;
    antifaz.scale.set(1, 0.6, 0.5);
    antifaz.position.set(0, -0.2, 0.0);
    this.face.add(antifaz);
    A.heroe = antifaz;

    // Gorra
    const gorra = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std(0xff6b3d));
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32, 1, false, -Math.PI / 2, Math.PI), std(0xff6b3d));
    visor.position.set(0, 0.02, 0.45);
    visor.scale.set(1, 1, 1.1);
    gorra.add(dome, visor);
    gorra.position.set(0, 1.05, 0);
    gorra.scale.set(1.05, 0.9, 0.9);
    this.body.add(gorra);
    A.gorra = gorra;

    // Corona
    const corona = new THREE.Group();
    const gold = std(0xffc83d, { metalness: 0.7, roughness: 0.25, emissive: 0x6b4a00, emissiveIntensity: 0.3 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 0.22, 32, 1, true), gold);
    band.material.side = THREE.DoubleSide;
    corona.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 12), gold);
      spike.position.set(Math.sin(a) * 0.48, 0.22, Math.cos(a) * 0.48);
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), std(i % 2 ? 0x2f7bf6 : 0xe0384b));
      gem.position.set(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5);
      corona.add(spike, gem);
    }
    corona.position.set(0, 1.3, 0);
    this.body.add(corona);
    A.corona = corona;

    // Gorro de mago
    const mago = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 32), std(0x6c4bd8));
    cone.position.y = 0.55;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32), std(0x6c4bd8));
    const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.13), { depth: 0.03, bevelEnabled: false }), gold);
    st.position.set(0.1, 0.5, 0.36);
    st.rotation.x = -0.45;
    mago.add(cone, brim, st);
    mago.position.set(0, 1.18, 0);
    mago.rotation.z = -0.1;
    this.body.add(mago);
    A.mago = mago;

    // Pajarita
    const pajarita = new THREE.Group();
    const bowMat = std(0xe0384b);
    [-1, 1].forEach((s) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 4), bowMat);
      wing.rotation.z = (s * Math.PI) / 2;
      wing.position.x = s * 0.13;
      pajarita.add(wing);
    });
    pajarita.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bowMat));
    pajarita.position.set(0, -0.45, 0.9);
    this.body.add(pajarita);
    A.pajarita = pajarita;

    Object.values(A).forEach((m) => { m.visible = false; });
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  setExpression(mood) {
    if (!EXPRESSIONS[mood]) return;
    this.mood = mood;
    this.target = EXPRESSIONS[mood];
    if (mood === 'animado' || mood === 'contento') this._burst = 1;
  }

  /** Cambio de zona: Denti se anima un momento y vuelve a concentrarse. */
  cheer(ms = 1600) {
    this.setExpression('animado');
    clearTimeout(this._cheerTimer);
    this._cheerTimer = setTimeout(() => {
      if (this.mood === 'animado') this.setExpression('concentrado');
    }, ms);
  }

  setBrushMotion(motion) {
    this.brushMotion = motion;
    this.brush.visible = !!motion;
  }

  /** 0..1: lo brillantes que están los dientes. Denti brilla con ellos. */
  setShine(v) {
    this.shine = Math.max(0, Math.min(1, v));
  }

  setEquipped(equipped) {
    Object.entries(this.accessoryMeshes).forEach(([id, mesh]) => {
      mesh.visible = Object.values(equipped).includes(id);
    });
    this._rainbow = false;
    let cape = BLUE;
    if (equipped.cara === 'heroe') cape = ACCESSORIES.find((a) => a.id === 'heroe').cape;
    const capeAcc = ACCESSORIES.find((a) => a.id === equipped.capa);
    if (capeAcc?.color === 'rainbow') this._rainbow = true;
    else if (capeAcc) cape = capeAcc.color;
    this.capeMat.color.setHex(cape);
  }


  update(dt, t) {
    const k = 1 - Math.pow(0.001, dt); // interpolación independiente de los FPS
    for (const key of Object.keys(this.expr)) this.expr[key] += (this.target[key] - this.expr[key]) * k;
    const e = this.expr;
    const m = this.reducedMotion ? 0.35 : 1;
    this._burst = Math.max(0, this._burst - dt * 0.8);

    // Cuerpo
    let bob = Math.sin(t * 2.2) * 0.05 * m;
    let jump = 0;
    let spin = 0;
    if (this.mood === 'animado') jump = Math.abs(Math.sin(t * 7)) * 0.18 * m * (0.4 + this._burst);
    if (this.mood === 'contento') {
      jump = Math.abs(Math.sin(t * 5)) * 0.35 * m;
      spin = this.reducedMotion ? 0 : Math.sin(t * 1.4) * 0.5;
    }
    if (this.mood === 'concentrado') bob *= 0.5;
    this.root.position.y = bob + jump - 0.15;
    this.root.rotation.y = spin + 0.38 + Math.sin(t * 0.7) * 0.18 * m; // tres cuartos: se ve la capa
    const squash = 1 - jump * 0.15;
    this.body.scale.set(1 + jump * 0.08, squash, 1 + jump * 0.08);

    // Piernas
    this.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(t * 6 + i * Math.PI) * jump * 0.8; });

    // Brazos
    const [left, right] = this.arms;
    if (this.mood === 'contento' || (this.mood === 'animado' && this._burst > 0.2)) {
      left.pivot.rotation.z = -1.9 + Math.sin(t * 9) * 0.35 * m;
      right.pivot.rotation.z = 1.9 + Math.sin(t * 9 + 1) * 0.35 * m;
    } else {
      left.pivot.rotation.z = Math.sin(t * 2) * 0.08 * m;
      right.pivot.rotation.z = 0.2;
    }
    right.pivot.rotation.x = 0;
    right.pivot.position.set(1.0, 0.05, 0.1);

    // Demostración del movimiento del cepillo
    if (this.brushMotion && this.mood !== 'contento') {
      right.pivot.rotation.z = 1.25; // brazo levantado hacia la cara
      const speed = this.reducedMotion ? 3 : 6;
      let dx = 0, dy = 0;
      switch (this.brushMotion) {
        case 'circulos-fuera':
        case 'circulos-dentro':
          dx = Math.cos(t * speed) * 0.08;
          dy = Math.sin(t * speed) * 0.08;
          break;
        case 'adelante-atras':
          dx = Math.sin(t * speed * 1.2) * 0.16;
          break;
        default: // colocar: inclinación suave a 45°
          dy = Math.sin(t * 2) * 0.02;
      }
      right.pivot.position.x += dx;
      right.pivot.position.y += dy;
      this.brush.rotation.z = this.brushMotion === 'colocar' ? -0.5 + Math.sin(t * 2) * 0.1 : -0.6;
    }

    // Ojos: parpadeo natural + expresión
    const blink = (t % 3.7) < 0.12 ? 1 : 0;
    this.eyes.forEach((eye) => {
      const lid = Math.max(e.lid, blink);
      eye.lid.position.y = 0.36 - lid * 0.28;
      eye.lid.scale.y = 0.4 + lid * 0.9;
      eye.lid.visible = lid > 0.02;
      eye.brow.rotation.z = Math.PI / 2 + eye.side * -e.brow;
      eye.brow.position.y = 0.32 + e.browY - e.lid * 0.04;
      const starOn = e.stars > 0.5;
      eye.star.visible = starOn;
      eye.pupil.visible = !starOn;
      eye.glint.visible = !starOn && lid < 0.6;
      if (starOn) eye.star.rotation.z = t * 2;
    });

    // Boca
    this.smile.scale.set(0.8 + e.smile * 0.35, 0.3 + e.smile * 0.9, 1);
    this.smile.visible = e.open < 0.5;
    this.mouthOpen.visible = e.open >= 0.5;
    this.mouthOpen.scale.set(1, 0.6 + e.open * 0.6, 1);

    // Capa ondeando (más fuerte al saltar)
    const pos = this.cape.geometry.attributes.position;
    const base = this.capeBase;
    const wind = (0.05 + jump * 0.4 + (this.mood === 'contento' ? 0.12 : 0)) * m;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const depth = -y / 1.9; // 0 arriba, 1 abajo
      pos.array[i * 3 + 2] = base[i * 3 + 2] - Math.sin(t * 4 + x * 2.5 + y * 3) * wind * depth - depth * depth * 0.25;
      pos.array[i * 3] = x * (1 + depth * 0.35);
    }
    pos.needsUpdate = true;
    this.cape.geometry.computeVertexNormals();
    if (this._rainbow) this.capeMat.color.setHSL((t * 0.15) % 1, 0.75, 0.55);

    // Brillo
    this.toothMat.emissiveIntensity = 0.02 + this.shine * 0.12;
    this.toothMat.clearcoat = 0.4 + this.shine * 0.6;
    this.sparkles.children.forEach((s) => {
      const { a, r, phase } = s.userData;
      const aa = a + t * 0.5;
      s.position.set(Math.cos(aa) * r, 0.3 + Math.sin(aa) * r * 0.75, 0.5);
      const tw = (Math.sin(t * 3 + phase) + 1) / 2;
      s.material.opacity = this.shine * tw * 0.9;
      s.scale.setScalar(0.6 + tw * 0.8);
      s.rotation.z = t + phase;
    });
  }
}
