# Audio grabado (opcional)

La app funciona sin ningún archivo de esta carpeta: la música se genera en el móvil y la radio usa la voz del sistema. Cuando haya grabaciones originales, se colocan aquí y se activan en `manifest.json`.

## Archivos

| Archivo | Para qué | Requisitos |
|---|---|---|
| `radio/<id>.mp3` | Mensajes de la Base | Uno por mensaje. Los `id`, textos y duración máxima están en `docs/tiempos.md`. Voz limpia: el efecto de radio lo pone la app |
| `banda-sonora.mp3` | Sustituye a la música generada | Empieza en 0:00 exacto, 128 BPM, mismos cambios de nivel (0:30, 1:00, 1:30). Si dura más de 120 s, se corta |

Formato recomendado: MP3 a 128–192 kbps, 44,1 kHz, mono para la voz y estéreo para la música. Volumen normalizado a unos −14 LUFS (el volumen percibido, para que todo suene igual de fuerte).

## Cómo activarlos

Editar `manifest.json`:

```json
{
  "instrumental": true,
  "radio": ["n1", "n1-fuera", "n1-dentro", "n1-muelas", "n2", "salida"]
}
```

Después, subir la versión de la caché en `sw.js` (por ejemplo `VERSION = 'mision-sonrisa-v3'`) para que los móviles con la app instalada descarguen los audios y los guarden para usarlos sin conexión.

## Reglas que aplica la app

- El temporizador manda. Los archivos se reproducen desde el segundo en que esté el temporizador (también al reanudar tras una pausa).
- Todo se corta en el segundo 120, haya terminado el archivo o no.
- Si el audio se desvía más de 40 ms del temporizador, se recoloca.
- Cada mensaje se corta si se alarga hasta el siguiente o hasta el final.
- Mientras habla la radio, la música baja de volumen.
