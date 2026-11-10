// Genera docs/tiempos.md a partir de js/soundtrack.js (fuente única de verdad).
// Uso: node tools/generar-hoja-tiempos.mjs
import { writeFileSync } from 'node:fs';
import { SEGMENTS, STEPS, PHRASE_SECONDS } from '../js/config.js';
import { RADIO_CUES, FLICKERS } from '../js/soundtrack.js';

const fmt = (t) => {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(3).padStart(6, '0')}`;
};

let md = '# Hoja de tiempos — Escapa en 2 minutos\n\n';
md += '> Generado con `node tools/generar-hoja-tiempos.mjs`. No editar a mano: cambia `js/soundtrack.js` y vuelve a generarlo.\n\n';
md += '128 BPM · 4/4 · 1 compás = 1,875 s · 1 paso = 4 compases = 7,5 s · 1 nivel = 16 compases = 30 s · total 64 compases = 120,000 s\n\n';
md += '## Niveles y pasos\n\n| Inicio | Nivel | Zona | Paso |\n|---|---|---|---|\n';
for (const seg of SEGMENTS) STEPS.forEach((st, i) => { md += `| ${fmt(seg.start + i * PHRASE_SECONDS)} | ${seg.level} | ${seg.label} | ${st.label} |\n`; });
md += '\n## Mensajes de radio (archivos `assets/audio/radio/<id>.mp3`)\n\n| Archivo | Entra en | Duración máxima | Texto |\n|---|---|---|---|\n';
for (const c of RADIO_CUES) md += `| \`${c.id}.mp3\` | ${fmt(c.t)} | ${(c.maxSeconds - 0.3).toFixed(1)} s | ${c.text} |\n`;
md += `\n## Parpadeos de luz (sonido y escenario a la vez)\n\n${FLICKERS.map(fmt).join(' · ')}\n`;
writeFileSync(new URL('../docs/tiempos.md', import.meta.url), md);
console.log('docs/tiempos.md generado');
