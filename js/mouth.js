// Escáner de la boca en SVG: dientes según la edad (20 de leche, 24 en dentición mixta
// o 28 definitivos), cuadrante activo resaltado, cepillo mostrando el movimiento
// correcto, espuma y limpieza progresiva.
// Vista espejo: el lado derecho del niño se dibuja a la derecha de la pantalla.

import { SEGMENTS, SEGMENT_SECONDS } from './config.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};

// Dientes por cuadrante desde la línea media hacia fuera, según la edad (aproximado).
const DENTITIONS = {
  leche: {
    teeth: [
      { name: 'incisivo central', w: 15, h: 19 }, { name: 'incisivo lateral', w: 13, h: 17 }, { name: 'canino', w: 14, h: 18 },
      { name: 'primera muela', w: 19, h: 18 }, { name: 'segunda muela', w: 22, h: 19 },
    ],
    angles: [0.1, 0.29, 0.5, 0.78, 1.12], molarFrom: 3, center: 2, molar: 4,
  },
  mixta: {
    teeth: [
      { name: 'incisivo central', w: 14, h: 18 }, { name: 'incisivo lateral', w: 12, h: 16 }, { name: 'canino', w: 13, h: 17 },
      { name: 'primer premolar o muela de leche', w: 14, h: 15 }, { name: 'segundo premolar o muela de leche', w: 15, h: 15 },
      { name: 'primer molar', w: 19, h: 17 },
    ],
    angles: [0.08, 0.23, 0.39, 0.57, 0.77, 1.06], molarFrom: 3, center: 3, molar: 5,
  },
  definitiva: {
    teeth: [
      { name: 'incisivo central', w: 13, h: 18 }, { name: 'incisivo lateral', w: 11, h: 16 }, { name: 'canino', w: 12, h: 17 },
      { name: 'primer premolar', w: 13, h: 15 }, { name: 'segundo premolar', w: 13, h: 15 },
      { name: 'primer molar', w: 18, h: 17 }, { name: 'segundo molar', w: 17, h: 16 },
    ],
    angles: [0.07, 0.2, 0.34, 0.5, 0.67, 0.89, 1.13], molarFrom: 3, center: 3, molar: 5,
  },
};

const C = { x: 160, yU: 118, yL: 132, rx: 112, ry: 82 };

function toothPosition(arch, side, a) {
  // a: ángulo desde la línea media (0) hasta el fondo (~70°).
  const sx = side === 'right' ? 1 : -1;
  const x = C.x + sx * Math.sin(a) * C.rx;
  const y = arch === 'upper' ? C.yU - Math.cos(a) * C.ry : C.yL + Math.cos(a) * C.ry;
  const rot = (arch === 'upper' ? 1 : -1) * sx * (a * 180) / Math.PI;
  return { x, y, rot, a };
}

export class Mouth {
  constructor(container, dentition = 'definitiva') {
    this.container = container;
    this._build(dentition);
  }

  /** Cambia el juego de dientes (al cambiar la edad). */
  setDentition(dentition) {
    if (dentition === this.dentition || !DENTITIONS[dentition]) return;
    this.svg.remove();
    this._build(dentition);
  }

  _build(dentition) {
    const D = (this.D = DENTITIONS[dentition] || DENTITIONS.definitiva);
    this.dentition = dentition;
    const container = this.container;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.svg = el('svg', { viewBox: '0 0 320 250', class: 'mouth-svg', role: 'img', 'aria-label': 'Boca con los dientes que toca cepillar' });
    container.appendChild(this.svg);

    const defs = el('defs', {}, this.svg);
    defs.innerHTML = `
      <radialGradient id="gum" cx="50%" cy="50%" r="60%">
        <stop offset="0%" style="stop-color: var(--gum-1, #5a2a35)"/><stop offset="100%" style="stop-color: var(--gum-2, #3a1820)"/>
      </radialGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e9feff" stop-opacity="1"/>
        <stop offset="60%" stop-color="#7ff6ff" stop-opacity=".25"/>
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;

    // Encías
    el('path', { d: this._archPath('upper'), fill: 'url(#gum)', class: 'gum' }, this.svg);
    el('path', { d: this._archPath('lower'), fill: 'url(#gum)', class: 'gum' }, this.svg);
    // Lengua
    el('ellipse', { cx: C.x, cy: C.yL + 22, rx: 52, ry: 30, style: 'fill: var(--tongue, #7a3444)', opacity: 0.5 }, this.svg);

    // Zonas resaltables (debajo de los dientes)
    this.zones = SEGMENTS.map((s) => {
      const sx = s.side === 'right' ? 1 : 0;
      const x = sx ? C.x : C.x - C.rx - 26;
      const y = s.arch === 'upper' ? 8 : C.yL - 6;
      return el('rect', { x, y, width: C.rx + 26, height: 116, rx: 22, class: 'zone', 'data-zone': s.id }, this.svg);
    });

    // Etiquetas de lado
    el('text', { x: 14, y: 125, class: 'side-label', 'text-anchor': 'start' }, this.svg).textContent = 'IZQ';
    el('text', { x: 306, y: 125, class: 'side-label', 'text-anchor': 'end' }, this.svg).textContent = 'DER';

    // Dientes
    this.teeth = SEGMENTS.map((s) =>
      D.teeth.map((tt, i) => {
        const p = toothPosition(s.arch, s.side, D.angles[i]);
        const g = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(1)})`, class: 'tooth' }, this.svg);
        const molar = i >= D.molarFrom;
        const hw = tt.w / 2;
        const hh = tt.h / 2;
        const d = molar
          ? `M${-hw} ${-hh + 4} Q${-hw} ${-hh} ${-hw + 5} ${-hh} Q0 ${-hh + 3} ${hw - 5} ${-hh} Q${hw} ${-hh} ${hw} ${-hh + 4} L${hw} ${hh - 5} Q${hw} ${hh} ${hw - 5} ${hh} L${-hw + 5} ${hh} Q${-hw} ${hh} ${-hw} ${hh - 5} Z`
          : `M${-hw} ${-hh + 5} Q${-hw} ${-hh} ${-hw + 5} ${-hh} L${hw - 5} ${-hh} Q${hw} ${-hh} ${hw} ${-hh + 5} L${hw - 1} ${hh - 3} Q0 ${hh + 2} ${-hw + 1} ${hh - 3} Z`;
        const base = el('path', { d, class: 'tooth-base' }, g);
        const shine = el('path', { d, class: 'tooth-shine', fill: 'url(#shine)', opacity: 0 }, g);
        const spark = el('path', { d: 'M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z', class: 'tooth-spark', transform: `translate(${hw - 3} ${-hh + 3})`, opacity: 0 }, g);
        el('title', {}, g).textContent = `${tt.name}, ${s.label.toLowerCase()}`;
        return { g, base, shine, spark, p, molar };
      }),
    );

    // Capa de burbujas
    this.bubbleLayer = el('g', { class: 'bubbles' }, this.svg);

    // Cepillo
    this.brushPos = el('g', { class: 'brush-pos' }, this.svg);
    this.brushMove = el('g', { class: 'brush-move' }, this.brushPos);
    this.brushMove.innerHTML = `
      <g class="brush-tilt">
        <rect x="-6" y="-9" width="34" height="10" rx="3" fill="#e8fbff" stroke="#4ff0ff" stroke-width="1.5"/>
        <g fill="#bff8ff">${Array.from({ length: 6 }, (_, i) => `<rect x="${-4 + i * 5}" y="-15" width="3" height="7" rx="1"/>`).join('')}</g>
        <rect x="-6" y="-3" width="72" height="11" rx="5.5" fill="#35c3a8"/>
        <rect x="30" y="-1" width="28" height="4" rx="2" fill="#ffffff" opacity=".45"/>
      </g>`;
    this.brushPos.style.display = 'none';

    this.activeIndex = -1;
    this._lastBubble = 0;
  }

  _archPath(arch) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = -1.3 + (i / 24) * 2.6;
      const x = C.x + Math.sin(a) * (C.rx + 16);
      const y = arch === 'upper' ? C.yU - Math.cos(a) * (C.ry + 16) : C.yL + Math.cos(a) * (C.ry + 16);
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    for (let i = 24; i >= 0; i--) {
      const a = -1.3 + (i / 24) * 2.6;
      const x = C.x + Math.sin(a) * (C.rx - 18);
      const y = arch === 'upper' ? C.yU - Math.cos(a) * (C.ry - 18) : C.yL + Math.cos(a) * (C.ry - 18);
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  }

  reset() {
    this.activeIndex = -1;
    this.zones.forEach((z) => z.classList.remove('active', 'done'));
    this.teeth.flat().forEach((t) => {
      t.shine.setAttribute('opacity', 0);
      t.spark.setAttribute('opacity', 0);
      t.base.classList.remove('clean');
      t.g.classList.remove('active');
    });
    this.brushPos.style.display = 'none';
    this.bubbleLayer.replaceChildren();
  }

  /**
   * Actualiza el dibujo para el segundo `t` del cepillado.
   * @param {number} t     segundos transcurridos
   * @param {object} step  paso actual (de config.STEPS)
   */
  update(t, step) {
    const idx = Math.min(3, Math.floor(t / SEGMENT_SECONDS));
    const seg = SEGMENTS[idx];
    if (idx !== this.activeIndex) {
      this.activeIndex = idx;
      this.zones.forEach((z, i) => {
        z.classList.toggle('active', i === idx);
        z.classList.toggle('done', i < idx);
      });
      this.teeth.forEach((q, i) => q.forEach((tooth) => tooth.g.classList.toggle('active', i === idx)));
    }

    // Brillo: los cuadrantes terminados brillan del todo; el actual va ganando brillo.
    this.teeth.forEach((q, i) => {
      const p = i < idx ? 1 : i > idx ? 0 : (t - seg.start) / SEGMENT_SECONDS;
      q.forEach((tooth, k) => {
        // Cada diente se limpia un poco desfasado para que el brillo «avance».
        const local = Math.max(0, Math.min(1, p * 1.3 - k * 0.04));
        tooth.shine.setAttribute('opacity', (local * 0.95).toFixed(2));
        tooth.base.classList.toggle('clean', local > 0.6);
        const sparkOn = i < idx ? 0.9 : local > 0.95 ? 1 : 0;
        tooth.spark.setAttribute('opacity', sparkOn);
      });
    });

    this._placeBrush(seg, step, t);
    this._bubbles(t);
  }

  _placeBrush(seg, step, t) {
    const q = this.teeth[seg.index];
    let target;
    let inward = 0;
    if (step.id === 'muelas') target = q[this.D.molar].p; // superficie de masticar de las muelas
    else target = q[this.D.center].p; // centro del cuadrante
    if (step.id === 'dentro') inward = 1;

    // Hacia dentro = hacia el centro del arco.
    const cy = seg.arch === 'upper' ? C.yU : C.yL;
    const vx = C.x - target.x;
    const vy = cy - target.y;
    const len = Math.hypot(vx, vy) || 1;
    const off = inward ? 20 : step.id === 'muelas' ? 6 : -14;
    const x = target.x + (vx / len) * off;
    const y = target.y + (vy / len) * off;
    const mirror = seg.side === 'right' ? 1 : -1;
    // Las cerdas siempre miran hacia los dientes.
    const outside = seg.arch === 'upper' ? -1 : 1;
    const flip = inward ? -outside : outside;
    this.brushPos.style.display = '';
    this.brushPos.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${mirror} ${flip})`);
    if (this.brushMove.dataset.motion !== step.brush) {
      this.brushMove.dataset.motion = step.brush;
    }
  }

  _bubbles(t) {
    if (this.reducedMotion || t - this._lastBubble < 0.45) return;
    this._lastBubble = t;
    if (this.bubbleLayer.childElementCount >= 8) this.bubbleLayer.firstElementChild.remove();
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(this.brushPos.getAttribute('transform') || '');
    if (!m) return;
    const x = +m[1] + (Math.random() - 0.5) * 30;
    const y = +m[2] + (Math.random() - 0.5) * 16;
    const r = 2.5 + Math.random() * 4;
    const b = el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), class: 'bubble' }, this.bubbleLayer);
    b.style.setProperty('--dx', `${((Math.random() - 0.5) * 20).toFixed(0)}px`);
    b.addEventListener('animationend', () => b.remove());
  }

  /** Todo brillante al terminar. */
  finish() {
    this.zones.forEach((z) => { z.classList.remove('active'); z.classList.add('done'); });
    this.teeth.flat().forEach((tooth) => {
      tooth.shine.setAttribute('opacity', 0.95);
      tooth.spark.setAttribute('opacity', 1);
      tooth.base.classList.add('clean');
      tooth.g.classList.remove('active');
    });
    this.brushPos.style.display = 'none';
  }
}
