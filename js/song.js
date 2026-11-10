// «La misión de la sonrisa» — canción original.
// Letra, melodía, acordes y cues de voz, todo en un único sitio y medido en segundos
// desde el inicio del temporizador. Nada de lo que hay aquí puede durar más de 120 s:
// los tests (tests/timeline.test.js) lo comprueban.

import { BEAT_SECONDS, PHRASE_SECONDS, SEGMENT_SECONDS, SEGMENTS, TOTAL_SECONDS } from './config.js';

export const SONG = {
  title: 'La misión de la sonrisa',
  key: 'Do mayor',
  bpm: 128,
  duration: TOTAL_SECONDS,
};

// ── Letra ───────────────────────────────────────────────────────────────────
// 4 cuadrantes × 4 frases. Cada frase = 4 compases = 7,5 s.
// Frase A: estribillo + aviso de zona. B: por fuera. C: por dentro. D: muelas.
export const LYRICS = [
  [
    ['¡Misión sonrisa, Denti y yo!', 'Arriba a la derecha… ¡empezó!'],
    ['Cepillo inclinado junto a la encía,', 'circulitos suaves, ¡qué alegría!'],
    ['Ahora por dentro, despacito,', 'cada diente limpio y bonito.'],
    ['Sobre las muelas, adelante y atrás,', 'migas y bichitos, ¡no volváis jamás!'],
  ],
  [
    ['¡Cambio de zona! ¡Cambio, cambio ya!', 'Arriba a la izquierda, ¡vamos allá!'],
    ['Por fuera hacemos circulitos,', 'sin apretar, con mimo y cuidadito.'],
    ['Por dentro también, que no se escape', 'ni un rinconcito que el cepillo no atrape.'],
    ['Muelas de arriba, frota sin parar,', 'adelante y atrás, ¡ya casi está!'],
  ],
  [
    ['¡Cambio de zona! ¡Mitad conseguida!', 'Abajo a la izquierda, ¡qué divertida!'],
    ['Cepillo en la encía, inclinadito,', 'damos vueltas en círculos chiquitos.'],
    ['Ahora por dentro, ¡a por los de abajo!', 'Que el cepillo haga bien su trabajo.'],
    ['Sobre las muelas, adelante y atrás,', 'masticamos limpio, ¡cada vez más!'],
  ],
  [
    ['¡Último cambio! ¡La zona final!', 'Abajo a la derecha, ¡genial, genial!'],
    ['Circulitos fuera, suave y con ritmo,', 'brillan los dientes, ¡lo noto yo mismo!'],
    ['Ahora por dentro, ya llega el final,', 'Denti y yo, un equipo ideal.'],
    ['Muelas de abajo, adelante y atrás…', '¡Misión cumplida! ¡Sonrisa total!'],
  ],
];

// Líneas con su tiempo: cada verso ocupa 2 compases (3,75 s).
export const LYRIC_LINES = LYRICS.flatMap((segment, s) =>
  segment.flatMap((phrase, p) =>
    phrase.map((text, l) => {
      const start = s * SEGMENT_SECONDS + p * PHRASE_SECONDS + l * (PHRASE_SECONDS / 2);
      return { start, end: start + PHRASE_SECONDS / 2, text, segment: s, phrase: p };
    }),
  ),
);

export function lyricAt(t) {
  return LYRIC_LINES.find((l) => t >= l.start && t < l.end) || null;
}

// ── Cues de voz hablada ───────────────────────────────────────────────────────
// modes: en qué modos de audio suena cada cue.
//   'voz'     → modo «Solo instrucciones de voz»: todos los pasos.
//   'cancion' → modo «Canción y voz» SIN pista cantada grabada: solo avisos de zona.
// Si existe assets/audio/voz/<id>.mp3 se reproduce el archivo; si no, voz del sistema.
// maxSeconds: tiempo disponible hasta el siguiente cue (la voz se corta si se pasa).
export const VOICE_CUES = [
  { t: 0.3, id: 'z1', modes: ['voz', 'cancion'], text: '¡Hola! Soy Denti. Empezamos arriba, a la derecha.' },
  { t: 7.5, id: 'z1-fuera', modes: ['voz'], text: 'Circulitos por fuera, junto a la encía.' },
  { t: 15, id: 'z1-dentro', modes: ['voz'], text: 'Ahora por dentro.' },
  { t: 22.5, id: 'z1-muelas', modes: ['voz'], text: 'Sobre las muelas, adelante y atrás.' },
  { t: 30, id: 'z2', modes: ['voz', 'cancion'], text: '¡Cambio de zona! Arriba, a la izquierda.' },
  { t: 37.5, id: 'z2-fuera', modes: ['voz'], text: 'Circulitos por fuera, sin apretar.' },
  { t: 45, id: 'z2-dentro', modes: ['voz'], text: 'Por dentro también.' },
  { t: 52.5, id: 'z2-muelas', modes: ['voz'], text: 'Las muelas de arriba, adelante y atrás.' },
  { t: 60, id: 'z3', modes: ['voz', 'cancion'], text: '¡Cambio de zona! Abajo, a la izquierda. ¡Vamos por la mitad!' },
  { t: 67.5, id: 'z3-fuera', modes: ['voz'], text: 'Circulitos por fuera.' },
  { t: 75, id: 'z3-dentro', modes: ['voz'], text: 'Ahora por dentro.' },
  { t: 82.5, id: 'z3-muelas', modes: ['voz'], text: 'Sobre las muelas, adelante y atrás.' },
  { t: 90, id: 'z4', modes: ['voz', 'cancion'], text: '¡Último cambio! Abajo, a la derecha.' },
  { t: 97.5, id: 'z4-fuera', modes: ['voz'], text: 'Circulitos por fuera.' },
  { t: 105, id: 'z4-dentro', modes: ['voz'], text: 'Por dentro, ya casi está.' },
  { t: 112.5, id: 'z4-muelas', modes: ['voz'], text: 'Muelas de abajo, adelante y atrás.' },
  { t: 116.5, id: 'final', modes: ['voz', 'cancion'], text: 'Tres, dos, uno… ¡Misión cumplida!' },
].map((cue, i, all) => ({ ...cue, maxSeconds: (all[i + 1]?.t ?? TOTAL_SECONDS) - cue.t }));

// ── Composición instrumental ─────────────────────────────────────────────────
// Notas MIDI (60 = Do central). Tiempos en pulsos dentro de una frase de 16 pulsos.
const CHORDS = {
  C: [48, 52, 55], // Do
  G: [43, 47, 50], // Sol
  Am: [45, 48, 52], // La menor
  F: [41, 45, 48], // Fa
  Em: [40, 43, 47], // Mi menor
};

// Progresión por frase (un acorde por compás).
const PROGRESSIONS = {
  A: ['C', 'G', 'Am', 'F'],
  B: ['F', 'C', 'G', 'C'],
  C: ['Am', 'F', 'C', 'G'],
  D: ['F', 'G', 'Em', 'G'],
  Dfinal: ['F', 'G', 'C', 'C'],
};

// [pulso, duración en pulsos, nota]
const MELODIES = {
  A: [
    [0, 0.5, 76], [0.5, 0.5, 79], [1, 0.5, 79], [1.5, 0.5, 81], [2, 1, 79], [3, 1, 76],
    [4, 0.5, 74], [4.5, 0.5, 76], [5, 1, 79], [6, 1.5, 76],
    [8, 0.5, 72], [8.5, 0.5, 76], [9, 1, 81], [10, 0.5, 79], [10.5, 0.5, 76], [11, 1, 74],
    [12, 0.5, 72], [12.5, 0.5, 74], [13, 1, 76], [14, 2, 72],
  ],
  B: [
    [0, 0.5, 69], [0.5, 0.5, 69], [1, 0.5, 72], [1.5, 0.5, 69], [2, 1, 65], [3, 1, 67],
    [4, 0.5, 67], [4.5, 0.5, 72], [5, 1, 76], [6, 1, 74], [7, 1, 72],
    [8, 0.5, 71], [8.5, 0.5, 71], [9, 0.5, 74], [9.5, 0.5, 71], [10, 1, 67], [11, 0.5, 69], [11.5, 0.5, 71],
    [12, 1, 72], [13, 1, 76], [14, 2, 72],
  ],
  C: [
    [0, 0.5, 76], [0.5, 0.5, 76], [1, 0.5, 74], [1.5, 0.5, 72], [2, 1, 76], [3, 1, 69],
    [4, 0.5, 69], [4.5, 0.5, 72], [5, 1, 77], [6, 0.5, 76], [6.5, 0.5, 74], [7, 1, 72],
    [8, 0.5, 67], [8.5, 0.5, 72], [9, 1, 76], [10, 1, 79], [11, 1, 76],
    [12, 1, 74], [13, 0.5, 71], [13.5, 0.5, 72], [14, 2, 74],
  ],
  D: [
    [0, 0.5, 69], [0.5, 0.5, 72], [1, 0.5, 69], [1.5, 0.5, 72], [2, 1, 77], [3, 1, 72],
    [4, 0.5, 71], [4.5, 0.5, 74], [5, 0.5, 71], [5.5, 0.5, 74], [6, 1, 79], [7, 1, 74],
    [8, 0.5, 76], [8.5, 0.5, 79], [9, 0.5, 76], [9.5, 0.5, 79], [10, 1, 71], [11, 1, 76],
    [12, 1, 74], [13, 1, 71], [14, 1, 67],
  ],
  Dfinal: [
    [0, 0.5, 69], [0.5, 0.5, 72], [1, 0.5, 69], [1.5, 0.5, 72], [2, 1, 77], [3, 1, 72],
    [4, 0.5, 71], [4.5, 0.5, 74], [5, 0.5, 71], [5.5, 0.5, 74], [6, 1, 79], [7, 1, 74],
    [8, 1, 76], [9, 1, 79], [10, 2, 84],
    [12, 4, 72],
  ],
};

const PHRASE_KEYS = ['A', 'B', 'C', 'D'];

function phraseKey(segmentIndex, phraseIndex) {
  const k = PHRASE_KEYS[phraseIndex];
  return k === 'D' && segmentIndex === SEGMENTS.length - 1 ? 'Dfinal' : k;
}

/**
 * Devuelve la lista completa de eventos musicales (segundos absolutos).
 * Cada evento: { t, dur, type, note?, notes?, vel }
 * type: 'lead' | 'bass' | 'pad' | 'kick' | 'clap' | 'hat' | 'snare' | 'bell' | 'swell'
 */
export function buildArrangement() {
  const ev = [];
  const b = BEAT_SECONDS;

  SEGMENTS.forEach((seg, s) => {
    for (let p = 0; p < 4; p++) {
      const key = phraseKey(s, p);
      const t0 = seg.start + p * PHRASE_SECONDS;
      const isIntro = s === 0 && p === 0;
      const isLastPhrase = s === SEGMENTS.length - 1 && p === 3;

      // Melodía
      for (const [beat, dur, note] of MELODIES[key]) {
        ev.push({ t: t0 + beat * b, dur: dur * b * 0.92, type: 'lead', note, vel: 0.8 });
      }

      PROGRESSIONS[key].forEach((chordName, bar) => {
        const chord = CHORDS[chordName];
        const tb = t0 + bar * 4 * b;
        const lastBar = isLastPhrase && bar === 3;

        // Acordes de fondo
        ev.push({ t: tb, dur: 4 * b * 0.98, type: 'pad', notes: chord.map((n) => n + 12), vel: 0.5 });

        // Bajo: tónica con un pequeño rebote (pulsos 0, 1.5, 2, 3)
        const root = chord[0] - 12; // Mi1–Do2
        const bassPattern = lastBar ? [[0, 3.8]] : [[0, 1], [1.5, 0.45], [2, 0.9], [3, 0.45], [3.5, 0.45]];
        for (const [beat, dur] of bassPattern) {
          ev.push({ t: tb + beat * b, dur: dur * b, type: 'bass', note: beat === 3.5 ? root + 12 : root, vel: 0.9 });
        }

        // Percusión
        if (isIntro && bar === 0) {
          // Arranque suave: solo palmas.
          [1, 3].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.1, type: 'clap', vel: 0.7 }));
          return;
        }
        if (lastBar) {
          ev.push({ t: tb, dur: 0.3, type: 'kick', vel: 1 });
          ev.push({ t: tb, dur: 0.3, type: 'clap', vel: 0.9 });
          return;
        }
        [0, 1, 2, 3].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.3, type: 'kick', vel: beat % 2 ? 0.7 : 1 }));
        [1, 3].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.12, type: 'clap', vel: 0.85 }));
        for (let h = 0; h < 8; h++) {
          ev.push({ t: tb + h * 0.5 * b, dur: 0.05, type: 'hat', vel: h % 2 ? 0.55 : 0.3 });
        }
      });

      // Redoble que anuncia el cambio de zona (últimos 2 pulsos de la frase D).
      if (p === 3 && !isLastPhrase) {
        for (let i = 0; i < 8; i++) {
          ev.push({ t: t0 + (14 + i * 0.25) * b, dur: 0.08, type: 'snare', vel: 0.35 + i * 0.07 });
        }
        ev.push({ t: t0 + 14 * b, dur: 2 * b, type: 'swell', vel: 0.5 });
      }
    }

    // Campanita de cambio de zona al inicio de cada cuadrante.
    [84, 88, 91, 96].forEach((note, i) => {
      ev.push({ t: seg.start + i * 0.12, dur: 0.6, type: 'bell', note, vel: 0.55 });
    });
  });

  // Recorte de seguridad: nada puede sonar después de 120 s.
  return ev
    .filter((e) => e.t < TOTAL_SECONDS)
    .map((e) => ({ ...e, dur: Math.min(e.dur, TOTAL_SECONDS - e.t) }))
    .sort((a, b2) => a.t - b2.t);
}
