// Genera docs/tiempos.md a partir de js/themes.js (fuente única de verdad).
// Uso: node tools/generar-hoja-tiempos.mjs
import { writeFileSync } from 'node:fs';
import { SEGMENTS, STEPS, PHRASE_SECONDS } from '../js/config.js';
import { THEMES, cuesFor } from '../js/themes.js';

const fmt = (t) => {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(3).padStart(6, '0')}`;
};

let md = '# Hoja de tiempos — La misión de la sonrisa\n\n';
md += '> Generado con `node tools/generar-hoja-tiempos.mjs`. No editar a mano: cambia `js/themes.js` y vuelve a generarlo.\n\n';
md += '128 BPM · 4/4 · 1 compás = 1,875 s · 1 paso = 4 compases = 7,5 s · 1 zona = 16 compases = 30 s · total 120,000 s. Igual en todas las temáticas.\n\n';
md += '## Zonas y pasos\n\n| Inicio | Zona | Paso |\n|---|---|---|\n';
for (const seg of SEGMENTS) STEPS.forEach((st, i) => { md += `| ${fmt(seg.start + i * PHRASE_SECONDS)} | ${seg.label} | ${st.label} |\n`; });
for (const t of THEMES) {
  md += `\n## ${t.emoji} ${t.name} — frases de voz (\`assets/audio/${t.id}/voz/<id>.mp3\`)\n\n`;
  md += `Niveles: ${t.levels.join(' · ')}. «NOMBRE» se sustituye por el nombre del perfil (en una grabación, omítelo).\n\n`;
  md += '| Archivo | Entra en | Duración máxima | Texto |\n|---|---|---|---|\n';
  for (const c of cuesFor(t, 'NOMBRE')) md += `| \`${c.id}.mp3\` | ${fmt(c.t)} | ${(c.maxSeconds - 0.3).toFixed(1)} s | ${c.text} |\n`;
}
writeFileSync(new URL('../docs/tiempos.md', import.meta.url), md);
console.log('docs/tiempos.md generado');
