# sonrisa-pro

Aplicación móvil infantil para aprender a cepillarse los dientes mediante música, animaciones y recordatorios.

## La misión de la sonrisa (modo musical)

Dani se cepilla durante **2 minutos exactos** junto a **Denti**, un diente 3D con capa azul. La boca se divide en 4 cuadrantes de 30 s, y cada cuadrante en 4 pasos de 7,5 s (colocar el cepillo, por fuera, por dentro, muelas). La música, la letra, la voz y las animaciones siguen ese mismo reparto.

Es una PWA (web instalable): se abre en el navegador del móvil, se añade a la pantalla de inicio y, una vez cargada, funciona sin Internet.

### Arrancar

```bash
npm start        # sirve la app en http://localhost:8080
npm test         # tests del temporizador, la línea de tiempo y el progreso
```

No hace falta instalar dependencias. Three.js va incluido en `vendor/` (licencia MIT en `vendor/three.LICENSE`).

### Estructura

| Archivo | Qué hace |
|---|---|
| `js/config.js` | Duraciones, cuadrantes, pasos y modos de audio |
| `js/timer.js` | Temporizador maestro. Única fuente de verdad del tiempo |
| `js/song.js` | Letra, melodía, acordes y frases de voz con sus tiempos |
| `js/music-engine.js` | Síntesis en tiempo real de la música (Web Audio) |
| `js/audio-director.js` | Modos de audio, volúmenes, sincronía con el temporizador y corte en 120 s |
| `js/denti.js` | Denti en 3D (Three.js) con expresiones y accesorios. Alternativa 2D sin WebGL |
| `js/mouth.js` | Boca en SVG: cuadrante resaltado, cepillo animado, burbujas y brillo |
| `js/progress.js` | Estrellas, misiones y accesorios guardados en el móvil |
| `js/accessories.js` | Accesorios y disfraces desbloqueables |
| `sw.js` | Caché para funcionar sin conexión |
| `docs/cancion-mision-sonrisa.md` | Ficha de la canción y encargo de grabación |
| `docs/tiempos.md` | Hoja de tiempos generada desde `js/song.js` |
| `tools/exportar-pista-guia.html` | Exporta la pista guía en WAV para grabar la voz |

### Cómo se garantiza que dura 120 s

El temporizador calcula el tiempo con el reloj del sistema (`performance.now`), no contando fotogramas ni siguiendo a la canción. El audio se programa a partir del temporizador y lleva un fundido de 30 ms que termina justo en el segundo 120; además, al completar se corta todo. Si el audio se desvía más de 40 ms, se recoloca. Medido en Chromium: cambios de zona a 30,00 / 60,00 / 90,01 s y audio en silencio después del 120.

### Audio

- **Canción y voz**: música + letra en pantalla + avisos de zona de Denti.
- **Solo instrucciones de voz**: Denti explica cada paso, sin música.
- **Solo música instrumental**: sin voz; campanita y redoble avisan del cambio de zona.

Volumen de música y de voz por separado. La voz cantada **aún no está grabada**: ver `docs/cancion-mision-sonrisa.md` y `assets/audio/README.md`.
