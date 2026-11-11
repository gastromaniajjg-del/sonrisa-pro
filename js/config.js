// Configuración central de «La misión de la sonrisa» (versión «Escapa en 2 minutos»).
// Todo lo que depende del tiempo sale de aquí: temporizador, música, radio y escenario.

export const TOTAL_SECONDS = 120;
export const SEGMENT_SECONDS = 30;

// Rejilla musical a 128 pulsaciones por minuto → 1 compás = 1,875 s.
// 16 compases = 30 s exactos: cada nivel (cuadrante) dura justo 16 compases
// y cada paso de 4 compases dura 7,5 s.
export const BPM = 128;
export const BEAT_SECONDS = 60 / BPM; // 0,46875
export const BAR_SECONDS = BEAT_SECONDS * 4; // 1,875
export const BARS_PER_SEGMENT = 16;
export const PHRASE_BARS = 4;
export const PHRASE_SECONDS = PHRASE_BARS * BAR_SECONDS; // 7,5

// Cada cuadrante de la boca es un nivel. «derecha/izquierda» son las de Dani.
// El escáner de la boca se dibuja en «vista espejo»: su lado derecho aparece a la
// derecha de la pantalla, igual que cuando se mira en un espejo.
export const SEGMENTS = [
  { id: 'sup-der', index: 0, arch: 'upper', side: 'right', label: 'Arriba a la derecha', level: 'Nivel 1', theme: 'oficinas' },
  { id: 'sup-izq', index: 1, arch: 'upper', side: 'left', label: 'Arriba a la izquierda', level: 'Nivel 2', theme: 'sotano' },
  { id: 'inf-izq', index: 2, arch: 'lower', side: 'left', label: 'Abajo a la izquierda', level: 'Nivel 3', theme: 'azulejos' },
  { id: 'inf-der', index: 3, arch: 'lower', side: 'right', label: 'Abajo a la derecha', level: 'Nivel 4', theme: 'emergencia' },
].map((s, i) => ({ ...s, start: i * SEGMENT_SECONDS, end: (i + 1) * SEGMENT_SECONDS }));

// Cada nivel se divide en 4 pasos de 7,5 s que coinciden con las frases musicales.
export const STEPS = [
  { id: 'zona', label: 'Cepillo a 45° hacia la encía', brush: 'colocar', hint: 'Colócalo y empieza suave' },
  { id: 'fuera', label: 'Círculos por fuera', brush: 'circulos-fuera', hint: 'Pequeños, sin apretar' },
  { id: 'dentro', label: 'Cara interna', brush: 'circulos-dentro', hint: 'Diente a diente' },
  { id: 'muelas', label: 'Muelas: adelante y atrás', brush: 'adelante-atras', hint: 'Por encima, donde se mastica' },
];

export function segmentAt(t) {
  const i = Math.min(SEGMENTS.length - 1, Math.max(0, Math.floor(t / SEGMENT_SECONDS)));
  return SEGMENTS[i];
}

export function stepAt(t) {
  const within = Math.max(0, Math.min(t, TOTAL_SECONDS - 1e-9)) % SEGMENT_SECONDS;
  const i = Math.min(STEPS.length - 1, Math.floor(within / PHRASE_SECONDS));
  return STEPS[i];
}

export const AUDIO_MODES = {
  MUSICA_RADIO: 'musica-radio', // música + instrucciones por radio
  RADIO: 'radio', // solo instrucciones por radio
  MUSICA: 'musica', // solo música (las instrucciones se leen en pantalla)
};

// Recursos de audio grabados (opcionales). Si existen, sustituyen a la síntesis.
// Ver assets/audio/README.md para las especificaciones exactas.
// Estructura: assets/audio/<temática>/musica.mp3 y assets/audio/<temática>/voz/<id>.mp3
export const AUDIO_FILES = {
  dir: 'assets/audio/',
};
