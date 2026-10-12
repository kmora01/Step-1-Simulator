# Step One Studio

Simulador de estudio para dos personas, listo para alojar en GitHub Pages. No requiere instalar Node, compilar, contratar una API ni ejecutar un servidor de aplicación.

## Empezar

1. Descomprime `step1-simulator-github.zip`.
2. Copia **todos los archivos y carpetas extraídos**, incluido `assets/`, a tu repositorio. No subas el ZIP como sustituto de los archivos.
3. Si es un repositorio dedicado al simulador, deja `index.html` en la raíz. Si ya tienes una página y deseas conservarla, coloca todo en una carpeta `step1/` y entra después a esa ruta.
4. Confirma y sube los archivos con GitHub Desktop o Git.
5. En GitHub abre **Settings → Pages → Build and deployment → Deploy from a branch**. Selecciona tu rama, por ejemplo `main`, y la carpeta `/ (root)`; guarda. Si tu sitio ya está publicado, conserva su fuente y añade el simulador dentro de esa fuente.
6. Abre la URL HTTPS que muestra GitHub Pages. Un repositorio dedicado suele tener una dirección `https://TU-USUARIO.github.io/TU-REPOSITORIO/`; si usaste la subcarpeta, añade `step1/`.
7. Entra con el perfil `kevin` o `esposa` y la contraseña correspondiente del archivo personal de credenciales entregado por separado.

El ZIP incluye las páginas e información del libro en archivos cifrados; por ello tiene más de cien megabytes y muchas imágenes individuales. GitHub Desktop facilita subir la carpeta completa. La página solo descarga una imagen cuando se consulta.

**No copies el archivo personal de contraseñas al repositorio.** Las contraseñas no están en el código. La aplicación contiene verificadores y una clave de contenido envuelta con la clave derivada de cada contraseña.

## Qué contiene

- Banco de **2.800 preguntas originales**, cinco alternativas por pregunta y explicaciones en español.
- Viñetas en inglés, con concepto evaluado y justificación de cada opción.
- Estudio por capítulos siguiendo el libro, o selección por sistema/tema.
- Filtros de preguntas pendientes, falladas y marcadas.
- Exámenes completos de **280 preguntas**, 14 bloques de 20 preguntas y 30 minutos.
- **280 versiones** de examen; las primeras **10** no comparten ninguna pregunta entre sí. Las 270 restantes recombinan el mismo banco.
- Tutorial opcional de 5 minutos, descanso inicial de 55 minutos y presupuesto total de 8 horas.
- Respuestas editables únicamente dentro del bloque activo, y corrección al finalizar el examen.
- Corrección inmediata en el modo estudio, con explicación y referencia al libro.
- Progreso individual cifrado, reanudación y estadísticas de primer intento/acumuladas.
- Texto buscable y las imágenes de las **869 páginas** del archivo aportado, incluidas figuras y tablas originales.
- Consulta bajo demanda de páginas, con zoom; durante el examen solo se habilitan los valores de laboratorio.
- Exportación e importación de respaldo para cambiar de dispositivo o navegador.

## Elegir el modo

**Estudiar:** confirma una respuesta para ver el resultado, los distractores y las páginas relevantes. El orden del libro es útil para una primera pasada. Para repasar, combina sistemas o filtra por errores. Puedes practicar con o sin cronómetro y pausar la práctica.

**Simular:** elige una versión, completa el tutorial o sáltalo, y comienza los bloques. El tiempo sigue corriendo si cambias de pestaña, cierras el navegador o recargas. No se puede regresar a un bloque cerrado. Las claves y las páginas temáticas se desbloquean cuando finaliza el examen.

La calificación inmediata tiene una función de aprendizaje; un examen fiel mantiene las claves ocultas. Las dos experiencias se ofrecen de forma explícita.

## Dos perfiles y cómo guardar el progreso

Los datos de Kevin y Esposa se guardan por separado y cifrados en el navegador actual. Para pasar del celular al computador, exporta un respaldo desde el perfil correspondiente y después impórtalo en el mismo perfil del otro dispositivo. El respaldo también se cifra con la contraseña de ese perfil.

Cerrar sesión no borra tus datos. Borrar los datos del sitio, usar otro navegador, perder el dispositivo o la eliminación de almacenamiento por el sistema puede quitar el historial local; conserva un respaldo reciente. El navegador privado puede descartar datos al cerrar la sesión. La aplicación no sincroniza automáticamente por internet ni envía contraseñas o resultados a un servidor.

Si se olvida una contraseña, el historial cifrado de ese perfil no se puede recuperar desde GitHub. Conserva el archivo personal de credenciales fuera del repositorio y del sitio público.

## Cómo interpretar las estadísticas

El primer intento indica rendimiento al ver una pregunta por primera vez; el acumulado incorpora los repasos. Usa ambos junto con la cobertura por sistema y tema. Un porcentaje de aciertos de una categoría con pocos intentos no representa una estimación estable de fortaleza o debilidad.

El porcentaje de aciertos es descriptivo: **no es una puntuación USMLE ni una probabilidad de aprobar**. Las preguntas tienen revisión editorial y controles estructurales; no cuentan con calibración psicométrica oficial ni validación clínica independiente de cada ítem. El detalle de la investigación y las pruebas aparece en `INVESTIGACION.md` y `VALIDACION.md`.

El balance se impone por sistemas. La cobertura por disciplinas no reproduce todos los intervalos oficiales: microbiología, en particular, está menos representada; fisiología, patología y ciencias conductuales también difieren. `VALIDACION.md` muestra los recuentos. No interpretes un buen porcentaje en este banco como evidencia de preparación completa en todas las disciplinas.

## Conexión e instalación en el celular

La primera visita necesita internet para cargar la aplicación y el banco cifrado. El navegador puede instalar la aplicación desde su menú o añadirla a la pantalla de inicio. En **Ajustes** puedes preparar el banco sin conexión o descargar las 869 páginas del libro. Mantén abierta la pestaña hasta que la descarga termine. Una página que todavía no se ha consultado o descargado necesita conexión; el navegador puede eliminar la caché si requiere espacio, por lo que conviene conservar respaldos del progreso.

Usa la URL HTTPS de GitHub Pages. Abrir `index.html` directamente con doble clic puede bloquear la carga de archivos y la criptografía del navegador; si necesitas probarlo localmente, sirve la carpeta con un servidor local, por ejemplo:

```bash
python -m http.server 8080
```

Luego abre `http://localhost:8080/`. Este comando se ejecuta dentro de la carpeta que contiene el `index.html` de la entrega.

## Estructura de la entrega

```text
index.html
app.js
core.js
styles.css
credentials.json
manifest.webmanifest
service-worker.js
icon.svg
data/questions.bin
data/book.bin
data/toc.bin
assets/book/page-0001.bin ... page-0869.bin
README.md
INVESTIGACION.md
VALIDACION.md
fuentes.json
```

Los `.bin` son contenido cifrado, no archivos dañados. El archivo de credenciales de la entrega contiene claves envueltas y verificadores, por eso sí forma parte del sitio; el archivo de contraseñas personal se entrega aparte.

Si deseas revisar o editar el banco, también se entrega una copia JSON separada. Esa copia contiene claves y explicaciones en texto claro y no es necesaria para publicar la aplicación cifrada. Las referencias de ese JSON usan números de página PDF y el visor también muestra la numeración impresa.

## Actualizar una entrega

Conserva el mismo nombre y ruta del repositorio: el almacenamiento del navegador está asociado al origen del sitio. Antes de reemplazar código o contenido, exporta un respaldo. Mantén `credentials.json` de esta entrega si quieres conservar las mismas contraseñas y las claves del historial. No combines arbitrariamente contenido cifrado de una entrega con credenciales de otra.

La app y el banco de preguntas son originales; USMLE, NBME, UWorld y First Aid son referencias o marcas de sus respectivos titulares. El simulador no está afiliado a esas organizaciones. Las páginas del libro corresponden al archivo proporcionado por el usuario para este proyecto.
