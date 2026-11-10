# «La misión de la sonrisa» — ficha de la canción

Canción infantil original para la app. Letra, melodía y arreglo escritos para este proyecto; no reutiliza canciones comerciales ni melodías conocidas.

## Qué existe ya y qué falta

| Recurso | Estado |
|---|---|
| Letra completa (32 versos) | ✅ Hecha (`js/song.js`) |
| Estructura, tiempos y compases | ✅ Hecha (`docs/tiempos.md`) |
| Melodía, acordes, bajo y percusión | ✅ Compuestos y programados (`js/song.js`) |
| Música instrumental | ✅ Suena en la app: se sintetiza en el móvil en tiempo real, sin conexión |
| Pista guía en WAV para el estudio | ✅ Se exporta con `tools/exportar-pista-guia.html` |
| **Voz cantada grabada** | ❌ **No existe.** Hay que grabarla (ver «Encargo de grabación») |
| Frases de voz de Denti grabadas | ❌ No existen. Mientras tanto la app usa la voz en español del sistema |

Mientras no haya voz cantada, el modo «Canción y voz» reproduce la música con la melodía tocada por un sintetizador, muestra la letra en pantalla tipo karaoke y Denti avisa de cada cambio de zona con voz hablada.

## Datos técnicos

- Duración: **120,000 s** exactos (64 compases).
- Tempo: **128 BPM**, compás 4/4. 1 compás = 1,875 s.
- Tonalidad: Do mayor.
- Estilo: pop infantil moderno. Palmas en los tiempos 2 y 4, bombo a negras, charles a corcheas, bajo con rebote, acordes de fondo y melodía alegre.
- Cada cuadrante dental = 16 compases = 30 s. Cada cuadrante tiene 4 frases de 4 compases (7,5 s):

| Frase | Compases del cuadrante | Qué enseña | Acordes |
|---|---|---|---|
| A — estribillo y aviso de zona | 1–4 | Dónde cepillar ahora | Do · Sol · Lam · Fa |
| B — por fuera | 5–8 | Cepillo a 45° hacia la encía, circulitos suaves | Fa · Do · Sol · Do |
| C — por dentro | 9–12 | Cara interior de los dientes | Lam · Fa · Do · Sol |
| D — muelas | 13–16 | Superficie de masticar, adelante y atrás | Fa · Sol · Mim · Sol (último cuadrante: Fa · Sol · Do · Do) |

Señales de cambio de zona en la música: redoble de caja y barrido ascendente en los 2 últimos pulsos de cada cuadrante, y campanita (4 notas) justo en 0:30, 1:00 y 1:30. El final (1:52,5–2:00) resuelve en Do y la última nota acaba exactamente en 2:00.

## Letra

**Cuadrante 1 · Arriba a la derecha (0:00–0:30)**
> ¡Misión sonrisa, Denti y yo!
> Arriba a la derecha… ¡empezó!
> Cepillo inclinado junto a la encía,
> circulitos suaves, ¡qué alegría!
> Ahora por dentro, despacito,
> cada diente limpio y bonito.
> Sobre las muelas, adelante y atrás,
> migas y bichitos, ¡no volváis jamás!

**Cuadrante 2 · Arriba a la izquierda (0:30–1:00)**
> ¡Cambio de zona! ¡Cambio, cambio ya!
> Arriba a la izquierda, ¡vamos allá!
> Por fuera hacemos circulitos,
> sin apretar, con mimo y cuidadito.
> Por dentro también, que no se escape
> ni un rinconcito que el cepillo no atrape.
> Muelas de arriba, frota sin parar,
> adelante y atrás, ¡ya casi está!

**Cuadrante 3 · Abajo a la izquierda (1:00–1:30)**
> ¡Cambio de zona! ¡Mitad conseguida!
> Abajo a la izquierda, ¡qué divertida!
> Cepillo en la encía, inclinadito,
> damos vueltas en círculos chiquitos.
> Ahora por dentro, ¡a por los de abajo!
> Que el cepillo haga bien su trabajo.
> Sobre las muelas, adelante y atrás,
> masticamos limpio, ¡cada vez más!

**Cuadrante 4 · Abajo a la derecha (1:30–2:00)**
> ¡Último cambio! ¡La zona final!
> Abajo a la derecha, ¡genial, genial!
> Circulitos fuera, suave y con ritmo,
> brillan los dientes, ¡lo noto yo mismo!
> Ahora por dentro, ya llega el final,
> Denti y yo, un equipo ideal.
> Muelas de abajo, adelante y atrás…
> ¡Misión cumplida! ¡Sonrisa total!

Los tiempos de cada verso al milisegundo están en `docs/tiempos.md`.

## Encargo de grabación (voz cantada)

Para quien grabe la voz:

1. Abrir `tools/exportar-pista-guia.html` desde la app servida (por ejemplo `npm start` y entrar en `http://localhost:8080/tools/exportar-pista-guia.html`) y descargar:
   - `mision-sonrisa-guia-con-melodia.wav`: instrumental con la melodía que hay que cantar.
   - `mision-sonrisa-instrumental.wav`: instrumental sin melodía (para mezclar).
   - `mision-sonrisa-claque.wav`: metrónomo; el pitido agudo marca 0:00, 0:30, 1:00 y 1:30.
2. Grabar en una sesión de 128 BPM empezando en 0:00 del proyecto, sin silencio previo ni cuenta atrás en el archivo final.
3. Voz simpática y clara, de adulto o niño, con dicción de España. Sin efectos que tapen las palabras.
4. Respetar los tiempos de `docs/tiempos.md`: la primera sílaba de cada verso cae en el primer pulso de su compás. El arreglo puede ajustarse ligeramente, pero los cambios de zona (0:30, 1:00, 1:30) no se mueven.
5. Entregar los archivos según `assets/audio/README.md`.

Aunque la grabación dure algo más de 120 s (una cola de reverberación, por ejemplo), la app la corta en 2:00 con un fundido de 30 ms. La canción nunca alarga el temporizador.
