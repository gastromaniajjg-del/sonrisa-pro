// Genera docs/tiempos.md a partir de js/song.js (fuente única de verdad).
// Uso: node tools/generar-hoja-tiempos.mjs
import { writeFileSync } from 'node:fs';
import { SEGMENTS, STEPS, PHRASE_SECONDS } from '../js/config.js';
import { LYRIC_LINES, VOICE_CUES } from '../js/song.js';

const fmt = (t) => {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
};
const bar = (t) => Math.round(t / (PHRASE_SECONDS / 4)) + 1;

let md = '# Hoja de tiempos — La misión de la sonrisa\n\n';
md += '> Generado con `node tools/generar-hoja-tiempos.mjs`. No editar a mano: cambia `js/song.js` y vuelve a generarlo.\n\n';
md += '128 BPM · compás 4/4 · 1 compás = 1,875 s · 1 frase = 4 compases = 7,5 s · 1 cuadrante = 16 compases = 30 s · total 64 compases = 120,000 s\n\n';
md += '## Letra cantada\n\n| Inicio | Fin | Compás | Cuadrante | Paso | Verso |\n|---|---|---|---|---|---|\n';
for (const l of LYRIC_LINES) {
  md += `| ${fmt(l.start)} | ${fmt(l.end)} | ${bar(l.start)} | ${SEGMENTS[l.segment].label} | ${STEPS[l.phrase].label} | ${l.text} |\n`;
}
md += '\n## Frases de voz hablada (archivos `assets/audio/voz/<id>.mp3`)\n\n';
md += '| Archivo | Entra en | Duración máxima | Modos | Texto |\n|---|---|---|---|---|\n';
for (const c of VOICE_CUES) {
  md += `| \`${c.id}.mp3\` | ${fmt(c.t)} | ${(c.maxSeconds - 0.1).toFixed(1)} s | ${c.modes.join(', ')} | ${c.text} |\n`;
}
writeFileSync(new URL('../docs/tiempos.md', import.meta.url), md);
console.log('docs/tiempos.md generado');
