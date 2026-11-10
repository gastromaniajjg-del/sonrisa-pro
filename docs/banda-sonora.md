# «Escapa en 2 minutos» — banda sonora y radio

Versión para 11-12 años de «La misión de la sonrisa». Estética de espacios liminales (pasillos vacíos, fluorescentes, moqueta), con diseño y música propios. No copia personajes, escenas ni sonidos de ninguna serie o juego. Ambiente misterioso, sin sustos: está pensada para usarse antes de dormir.

## Qué existe ya y qué falta

| Recurso | Estado |
|---|---|
| Banda sonora original (120 s) | ✅ Compuesta y programada (`js/soundtrack.js`). Se genera en el móvil en tiempo real, sin conexión |
| Guion de radio (17 mensajes) con tiempos | ✅ Hecho (`docs/tiempos.md`) |
| Exportar la banda sonora en WAV | ✅ `tools/exportar-pista-guia.html` |
| **Mensajes de radio grabados** | ❌ **No existen.** Mientras tanto la app usa la voz en español del sistema |
| Versión de estudio de la música | ❌ Opcional. La sintetizada ya funciona |

Ya no hay canción cantada. Para esta edad, una voz de «operador de radio» que guía funciona mejor que una letra. Las instrucciones están siempre en pantalla, también en el modo «Solo música».

## Estructura musical

- **Duración**: 120,000 s (64 compases). **Tempo**: 128 BPM. **Tonalidad**: La menor, que se resuelve en Do mayor al encontrar la salida.
- **Progresión**: La menor · Fa · Re menor · Mi mayor (el acorde de Mi mayor da la sensación de que «algo no cuadra»). En la recta final pasa a Fa · Sol · Do · Do.
- **Capas por nivel** (la tensión sube poco a poco):

| Nivel | Zona | Ambiente | Qué suena |
|---|---|---|---|
| 1 (0:00–0:30) | Arriba derecha | Oficinas amarillas | Zumbido de fluorescentes (50 Hz), acordes oscuros, arpegio suave, motivo de caja de música |
| 2 (0:30–1:00) | Arriba izquierda | Sótano de hormigón | + bombo a medio tiempo, arpegio más rápido |
| 3 (1:00–1:30) | Abajo izquierda | Azulejos | + charles y bajo pulsante |
| 4 (1:30–2:00) | Abajo derecha | Luz de emergencia | + bombo completo y caja. A 1:52,5 el zumbido se apaga, la música sube a mayor y termina con un acorde luminoso (la salida) justo en 2:00 |

- **Avisos de cambio de nivel**: barrido ascendente en los 2 últimos pulsos del nivel, y en 0:30, 1:00 y 1:30 estática de radio + alarma de dos tonos. En pantalla, el pasillo se apaga un instante y aparece el nuevo nivel.
- **Parpadeos de luz**: 8 chasquidos de fluorescente coordinados con un parpadeo de las luces del escenario. Son breves y no tapan la voz.

## Encargo de grabación (mensajes de radio)

1. Grabar los 17 mensajes de `docs/tiempos.md`, uno por archivo, con el nombre de la columna «Archivo».
2. Voz adulta, tranquila y segura, tipo controlador o piloto. Español de España. Sin efecto de radio: la app se lo pone.
3. Cada mensaje debe caber en su «Duración máxima». Si se pasa, la app lo corta.
4. Entregar según `assets/audio/README.md`.
