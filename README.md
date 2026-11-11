# sonrisa-pro

Aplicación móvil para aprender a cepillarse los dientes mediante música, animaciones y recordatorios.

## La misión de la sonrisa

Dos minutos exactos de cepillado en cuatro zonas de la boca (30 s cada una, con 4 pasos de 7,5 s). Al abrirla se pide nombre y edad y se elige una de **siete aventuras**: Dientín, Fondo del mar, Bosque mágico, Dinosaurios, Misión espacial, Partido y Escapa en 2:00. Cada una tiene su mundo 3D, su compañero, su música y su voz. Para mantener la motivación hay rachas (máximo dos premios al día, mañana y noche), 14 logros y una zona de padres para pactar un premio real. Detalle en `docs/tematicas.md`.

Es una PWA (web instalable): se abre en el navegador del móvil, se añade a la pantalla de inicio y, una vez cargada, funciona sin Internet. Publicada en https://gastromaniajjg-del.github.io/sonrisa-pro/

### Arrancar

```bash
npm start        # sirve la app en http://localhost:8080
npm test         # tests del temporizador, las aventuras y el progreso
```

No hace falta instalar dependencias. Three.js va incluido en `vendor/` (licencia MIT en `vendor/three.LICENSE`).

### Estructura

| Archivo | Qué hace |
|---|---|
| `js/config.js` | Duraciones, zonas, pasos y modos de audio |
| `js/timer.js` | Temporizador maestro. Única fuente de verdad del tiempo |
| `js/themes.js` | Las siete aventuras: textos, voz, niveles, compañero, recompensa y música |
| `js/arrangements.js` | Música de cada aventura sobre la misma rejilla de 120 s |
| `js/song-dientin.js` · `js/soundtrack.js` | Canción de Dientín y banda sonora de Escapa |
| `js/music-engine.js` | Síntesis en tiempo real (Web Audio) |
| `js/audio-director.js` | Modos, volúmenes, voz, sincronía y corte en 120 s |
| `js/scene.js` · `js/worlds.js` | Escenario 3D: pasillos de Escapa y mundos abiertos del resto |
| `js/tooth.js` | Dientín en 3D |
| `js/mouth.js` | Dientes según la edad, zona activa, cepillo animado y limpieza |
| `js/progress.js` · `js/accessories.js` · `js/achievements.js` | Perfil, turnos, rachas, logros, premio pactado y accesorios, guardados en el móvil |
| `sw.js` | Caché para funcionar sin conexión |
| `docs/tematicas.md` · `docs/tiempos.md` | Aventuras y hoja de tiempos de todas las voces |
| `tools/exportar-pista-guia.html` | Exporta en WAV la música de cualquier aventura |

### Cómo se garantiza que dura 120 s

El temporizador calcula el tiempo con el reloj del sistema (`performance.now`), no contando fotogramas ni siguiendo a la música. El audio se programa a partir del temporizador y lleva un fundido de 30 ms que termina justo en el segundo 120; además, al completar se corta todo. Si el audio se desvía más de 40 ms, se recoloca.
