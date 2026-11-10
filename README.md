# sonrisa-pro

Aplicación móvil para aprender a cepillarse los dientes mediante música, animaciones y recordatorios.

## La misión de la sonrisa · Escapa en 2 minutos

Versión para 11-12 años. Dani recorre cuatro niveles de pasillos liminales (oficinas, sótano, azulejos, luz de emergencia), uno por zona de la boca, guiado por radio y acompañado por **Denti**, un dron explorador. Cada nivel dura 30 s y tiene 4 pasos de 7,5 s: colocar el cepillo, círculos por fuera, cara interna y muelas. A los **120 s exactos** encuentra la salida.

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
| `js/config.js` | Duraciones, niveles, pasos y modos de audio |
| `js/timer.js` | Temporizador maestro. Única fuente de verdad del tiempo |
| `js/soundtrack.js` | Banda sonora, guion de radio y parpadeos de luz con sus tiempos |
| `js/music-engine.js` | Síntesis en tiempo real de la música (Web Audio) |
| `js/audio-director.js` | Modos de audio, volúmenes, efecto radio, sincronía y corte en 120 s |
| `js/scene.js` | Pasillos 3D infinitos y el dron Denti (Three.js) |
| `js/mouth.js` | Escáner de la boca: 28 dientes, zona activa, cepillo animado, espuma y limpieza |
| `js/progress.js` | Fragmentos de mapa, misiones y mejoras guardados en el móvil |
| `js/accessories.js` | Mejoras desbloqueables del dron |
| `sw.js` | Caché para funcionar sin conexión |
| `docs/banda-sonora.md` | Ficha de la música y encargo de grabación de la radio |
| `docs/tiempos.md` | Hoja de tiempos generada desde `js/soundtrack.js` |
| `tools/exportar-pista-guia.html` | Exporta la banda sonora y un metrónomo en WAV |

### Cómo se garantiza que dura 120 s

El temporizador calcula el tiempo con el reloj del sistema (`performance.now`), no contando fotogramas ni siguiendo a la música. El audio se programa a partir del temporizador y lleva un fundido de 30 ms que termina justo en el segundo 120; además, al completar se corta todo. Si el audio se desvía más de 40 ms, se recoloca.

### Audio

- **Música + radio**: banda sonora y la Base dando cada instrucción.
- **Solo radio**: instrucciones sin música.
- **Solo música**: sin voz; las instrucciones se leen en pantalla y la alarma avisa del cambio de nivel.

Volumen de música y de radio por separado. Los mensajes de radio **aún no están grabados**: ver `docs/banda-sonora.md` y `assets/audio/README.md`.
