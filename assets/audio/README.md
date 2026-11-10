# Audio grabado (opcional)

La app funciona sin ningún archivo de esta carpeta: la música se sintetiza en el móvil y la voz usa la del sistema. Cuando haya grabaciones originales, se colocan aquí y se activan en `manifest.json`.

## Archivos

| Archivo | Para qué | Requisitos |
|---|---|---|
| `cancion-voz.mp3` | Voz cantada (solo voz, sin música) | Empieza en 0:00 exacto, 128 BPM, alineada con la pista guía. 120,0 s (si es más larga, se corta) |
| `cancion-instrumental.mp3` | Sustituye a la música sintetizada | Igual que arriba. Si se graba con la melodía tocada, que no choque con la voz |
| `voz/<id>.mp3` | Frases habladas de Denti | Una por frase. Los `id`, textos y duración máxima están en `docs/tiempos.md` |

Formato recomendado: MP3 a 128–192 kbps, 44,1 kHz, mono para voces y estéreo para la música. Volumen normalizado a −14 LUFS aproximadamente (es el nivel de volumen percibido, para que todas las pistas suenen igual de fuertes).

## Cómo activarlos

Editar `manifest.json`:

```json
{
  "instrumental": true,
  "vocal": true,
  "voz": ["z1", "z1-fuera", "z1-dentro", "z1-muelas", "z2", "final"]
}
```

Después, subir la versión de la caché en `sw.js` (`VERSION = 'mision-sonrisa-v2'`) para que los móviles que ya tienen la app instalada descarguen los audios nuevos y los guarden para usarlos sin conexión.

## Reglas que aplica la app

- El temporizador manda. Los archivos se reproducen desde el segundo en que esté el temporizador (también al reanudar tras una pausa).
- Todo se corta en el segundo 120, haya terminado el archivo o no.
- Si el audio se desvía más de 40 ms del temporizador, se recoloca.
- Cada frase hablada se corta si se alarga hasta la siguiente o hasta el final.
- Con `cancion-voz.mp3` activo, el modo «Canción y voz» no añade frases habladas (la propia letra avisa de los cambios de zona) y el sintetizador deja de tocar la melodía para no doblar la voz.
