# Temáticas de «La misión de la sonrisa»

Al abrir la app por primera vez se pide **nombre** y **edad**, y se elige una **aventura**. Se puede cambiar cuando se quiera con el botón 🎒 de la pantalla de inicio. Los datos se guardan solo en el móvil.

- **Nombre**: la voz lo dice al empezar y al terminar.
- **Edad**: sugiere la aventura («PARA TI») y decide qué dientes enseña el escáner. Con menos de 7 años, 20 de leche. De 7 a 11, 24 (dentición mixta, aún sin segundos molares). Desde 12, 28 definitivos. Es aproximado: cada niño muda a su ritmo.
- No se pregunta el sexo. Todas las aventuras están disponibles para todos.

Todas comparten el mismo reloj: cuatro zonas de 30 s y cuatro pasos de 7,5 s, con la música a 128 BPM para que los avisos caigan en el segundo exacto. Las recompensas se acumulan entre aventuras.

| Aventura | Edad | Compañero | Mundo (4 zonas) | Música | Recompensa |
|---|---|---|---|---|---|
| 🦷 Dientín | 3–7 | Dientín, diente con capa | Colina Burbuja · Valle Espuma · Río Brillante · Castillo Sonrisa | Canción infantil original con letra en pantalla | ⭐ estrellas |
| 🐠 Fondo del mar | 5–10 | Burbuja, minisubmarino | Arrecife · Bosque de algas · Cueva de coral · Fosa luminosa | Olas, campanitas y sonar | 🐚 conchas |
| 🍄 Bosque mágico | 4–9 | Chispa, hada luminosa | Claro · Puente de setas · Lago de las hadas · Árbol gigante | Campanitas, pájaros y palmas suaves | 💠 gemas mágicas |
| 🦕 Dinosaurios | 5–11 | Rex-1, dron de expedición | Selva · Río · Cañón · Volcán | Tambores graves y río | 🦴 fósiles |
| 🚀 Misión espacial | 7–12 | Sonda S-1 | Planeta Hielo · Planeta Rojo · Cinturón de asteroides · Nebulosa Azul | Electrónica épica con pitidos de radio | 💎 cristales estelares |
| ⚽ Partido | 6–14 | Bala, balón con cara | Cuatro cuartos | Ritmo de grada, palmas y silbato | 🏅 medallas |
| 🚪 Escapa en 2:00 | 10–14 | Denti, dron explorador | Oficinas · Sótano · Azulejos · Emergencia | Ambiental con zumbido de fluorescentes | 🗺️ fragmentos de mapa |

Todo es original: escenarios y personajes generados con código, sin equipos, escudos ni personajes reales.

## Accesorios

Hay dos juegos: uno para Dientín (gafas, gorra, pajarita, corona, gorro de mago, capas y disfraz de superhéroe) y otro para los compañeros-dron (linterna, antena, faros, hélices y carcasas). Se desbloquean con 1, 2, 3, 5, 7, 10, 14 y 20 recompensas.

## Voz y audio grabado

La voz usa la del móvil en español, con el nombre del niño. Para sustituirla por grabaciones de cada aventura, ver `assets/audio/README.md`. Una frase grabada no puede decir el nombre, así que en la grabación se omite.

## Motivación: rachas, logros y premio pactado

- **Dos premios al día como máximo.** El día tiene dos turnos: mañana (de 4:00 a 13:59) y noche (de 14:00 a 3:59; lo de madrugada cuenta como la noche anterior). Solo el primer cepillado de cada turno da premio. Los demás se registran, pero no suman. Así no se desbloquea todo en una tarde.
- **Racha:** días seguidos con al menos un cepillado. No se rompe hasta que acaba el día. **Día perfecto:** mañana y noche. En el inicio se ve la racha y la semana, con dos marcas por día.
- **Logros (14):** primer cepillado, día perfecto, rachas de 3, 7, 14 y 30 días, semana perfecta, 10 mañanas, 10 noches, probar 3 o las 7 aventuras, y 10, 50 y 100 cepillados. La racha de 7 días desbloquea además un accesorio de leyenda (capa para Dientín, carcasa para los drones).
- **Zona de padres** (botón «👪 Zona de padres» del inicio, protegida con una multiplicación): calendario de las dos últimas semanas, racha, días perfectos y totales. También se puede pactar un premio real, por ejemplo «7 días seguidos = elegir la cena del viernes». La app enseña el progreso, avisa al conseguirlo y se marca como entregado.
