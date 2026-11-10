// Configuración central de «La misión de la sonrisa».
// Todo lo que depende del tiempo sale de aquí: temporizador, música, voz y animaciones.

export const TOTAL_SECONDS = 120;
export const SEGMENT_SECONDS = 30;

// 128 pulsaciones por minuto → 1 compás (4 tiempos) = 1,875 s.
// 16 compases = 30 s exactos, así que cada cuadrante dura justo 16 compases
// y cada frase musical de 4 compases dura 7,5 s.
export const BPM = 128;
export const BEAT_SECONDS = 60 / BPM; // 0,46875
export const BAR_SECONDS = BEAT_SECONDS * 4; // 1,875
export const BARS_PER_SEGMENT = 16;
export const PHRASE_BARS = 4;
export const PHRASE_SECONDS = PHRASE_BARS * BAR_SECONDS; // 7,5

// Orden clásico de cepillado. «derecha/izquierda» son las del niño.
// El dibujo de la boca se muestra en «vista espejo»: el lado derecho del niño
// aparece a la derecha de la pantalla, igual que cuando se mira en un espejo.
export const SEGMENTS = [
  { id: 'sup-der', index: 0, arch: 'upper', side: 'right', label: 'Arriba a la derecha', start: 0 },
  { id: 'sup-izq', index: 1, arch: 'upper', side: 'left', label: 'Arriba a la izquierda', start: 30 },
  { id: 'inf-izq', index: 2, arch: 'lower', side: 'left', label: 'Abajo a la izquierda', start: 60 },
  { id: 'inf-der', index: 3, arch: 'lower', side: 'right', label: 'Abajo a la derecha', start: 90 },
].map((s) => ({ ...s, end: s.start + SEGMENT_SECONDS }));

// Cada cuadrante se divide en 4 pasos de 7,5 s que coinciden con las frases de la canción.
export const STEPS = [
  { id: 'zona', label: 'Coloca el cepillo', brush: 'colocar', hint: 'Inclinado hacia la encía' },
  { id: 'fuera', label: 'Circulitos por fuera', brush: 'circulos-fuera', hint: 'Suave, sin apretar' },
  { id: 'dentro', label: 'Ahora por dentro', brush: 'circulos-dentro', hint: 'Cada diente, despacito' },
  { id: 'muelas', label: 'Muelas: adelante y atrás', brush: 'adelante-atras', hint: 'Por encima de las muelas' },
];

export function segmentAt(t) {
  const i = Math.min(SEGMENTS.length - 1, Math.max(0, Math.floor(t / SEGMENT_SECONDS)));
  return SEGMENTS[i];
}

export function stepAt(t) {
  const within = Math.max(0, t) % SEGMENT_SECONDS;
  const i = Math.min(STEPS.length - 1, Math.floor(within / PHRASE_SECONDS));
  return STEPS[i];
}

export const AUDIO_MODES = {
  CANCION: 'cancion', // canción (letra) + voz
  VOZ: 'voz', // solo instrucciones habladas
  INSTRUMENTAL: 'instrumental', // solo música
};

// Recursos de audio grabados (opcionales). Si existen, sustituyen a la síntesis.
// Ver assets/audio/README.md para las especificaciones exactas.
export const AUDIO_FILES = {
  instrumental: 'assets/audio/cancion-instrumental.mp3',
  vocal: 'assets/audio/cancion-voz.mp3',
  voiceDir: 'assets/audio/voz/',
};
