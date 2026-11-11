// Logros: metas a largo plazo que premian la constancia, no repetir cepillados seguidos.

export const ACHIEVEMENTS = [
  { id: 'primero', icon: '🪥', name: 'Primer cepillado', desc: 'Completa tu primera misión', check: (s) => s.total >= 1 },
  { id: 'dia-perfecto', icon: '🌗', name: 'Día perfecto', desc: 'Cepíllate por la mañana y por la noche el mismo día', check: (s) => s.perfectDays >= 1 },
  { id: 'racha-3', icon: '🔥', name: 'Racha de 3', desc: '3 días seguidos cepillándote', check: (s) => s.bestStreak >= 3 },
  { id: 'racha-7', icon: '🔥', name: 'Semana entera', desc: '7 días seguidos cepillándote', check: (s) => s.bestStreak >= 7 },
  { id: 'semana-perfecta', icon: '🌟', name: 'Semana perfecta', desc: '7 días perfectos seguidos (mañana y noche)', check: (s) => s.bestPerfectStreak >= 7 },
  { id: 'racha-14', icon: '🔥', name: 'Dos semanas', desc: '14 días seguidos cepillándote', check: (s) => s.bestStreak >= 14 },
  { id: 'racha-30', icon: '🏆', name: 'Un mes entero', desc: '30 días seguidos cepillándote', check: (s) => s.bestStreak >= 30 },
  { id: 'madrugador', icon: '🌅', name: 'Madrugador', desc: '10 cepillados por la mañana', check: (s) => s.morning >= 10 },
  { id: 'buenas-noches', icon: '🌙', name: 'Buenas noches', desc: '10 cepillados por la noche', check: (s) => s.night >= 10 },
  { id: 'explorador', icon: '🧭', name: 'Explorador', desc: 'Juega 3 aventuras distintas', check: (s) => s.themes >= 3 },
  { id: 'trotamundos', icon: '🗺️', name: 'Trotamundos', desc: 'Juega las 7 aventuras', check: (s) => s.themes >= 7 },
  { id: 'cepillados-10', icon: '🥉', name: '10 cepillados', desc: 'Completa 10 misiones', check: (s) => s.total >= 10 },
  { id: 'cepillados-50', icon: '🥈', name: '50 cepillados', desc: 'Completa 50 misiones', check: (s) => s.total >= 50 },
  { id: 'cepillados-100', icon: '🥇', name: '100 cepillados', desc: 'Completa 100 misiones', check: (s) => s.total >= 100 },
];
