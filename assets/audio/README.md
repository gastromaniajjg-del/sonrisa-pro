# Audio grabado (opcional)

La app funciona sin ningún archivo de esta carpeta: la música de cada aventura se genera en el móvil y la voz usa la del sistema. Si se graban audios originales, van en una carpeta por aventura y se activan en `manifest.json`.

## Estructura

```
assets/audio/<aventura>/musica.mp3        sustituye a la música generada
assets/audio/<aventura>/voz/<id>.mp3      una frase de voz
```

`<aventura>` es uno de estos: `dientin`, `mar`, `bosque`, `dinos`, `espacio`, `partido`, `escapa`. Los `id` de las frases, su texto y la duración máxima de cada una están en `docs/tiempos.md`.

Requisitos:
- **Música**: empieza en 0:00 exacto, a 128 BPM, con los cambios de zona en 0:30, 1:00 y 1:30. Si dura más de 120 s, se corta.
- **Voz**: limpia, sin efectos. En «Escapa», «Mar», «Dinosaurios» y «Espacio» la app le pone efecto de radio. Una grabación no puede decir el nombre del niño, así que se omite.
- Formato: MP3 a 128–192 kbps, 44,1 kHz. Volumen normalizado a unos −14 LUFS (el volumen percibido, para que todo suene igual de fuerte).

## Activarlos

En `manifest.json`, por ejemplo:

```json
"mar": { "instrumental": true, "voz": ["n1", "n1-fuera", "n2", "salida"] }
```

Después, sube la versión de la caché en `sw.js` (`VERSION = 'mision-sonrisa-v5'`) para que los móviles con la app instalada descarguen y guarden los audios nuevos.

## Reglas que aplica la app

- El temporizador manda: los archivos se reproducen desde el segundo en que esté, también al reanudar tras una pausa.
- Todo se corta en el segundo 120.
- Si el audio se desvía más de 40 ms del temporizador, se recoloca.
- Cada frase se corta si se alarga hasta la siguiente o hasta el final.
