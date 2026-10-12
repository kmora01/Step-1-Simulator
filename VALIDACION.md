# Verificación de Step One Studio

Fecha de cierre: 12 de octubre de 2026. Banco: 9a71d2ff31f697d01f718d17d73f21f94b944ebf3dbac1e777798d84a5decd00.

## Resultados comprobados

- 2.800 IDs y enunciados distintos; cinco alternativas y cinco racionales por ítem.
- Las once cuotas por sistemas coinciden exactamente con la distribución de `INVESTIGACION.md`.
- 280 composiciones diferentes de 280 preguntas cada una, sin IDs repetidos dentro de ninguna forma.
- Las formas 1–10 son disjuntas y cubren las 2.800 preguntas.
- Orden de aprendizaje creciente por primera página PDF de referencia.
- 2,287,103 caracteres comparados página por página con el PDF; 869 imágenes decodificadas y 3.117 entradas de índice cotejadas.
- 501 páginas distintas referenciadas por las preguntas; todo el libro permanece disponible en el visor.
- 872 archivos de contenido cifrado verificados byte a byte al empaquetar: banco, texto, índice y 869 páginas.
- 14 comprobaciones de integración con el banco real, 31 pruebas Node de motor/UI/caché y 16 comprobaciones criptográficas: sin fallos.

El detector no encontró enunciados idénticos, variantes solo numéricas ni parejas con similitud léxica TF-IDF de al menos 0,80. Esta medida no prueba por sí sola ausencia de duplicación semántica. La revisión interna retiró, entre otros, un caso cardiovascular de verapamilo que evaluaba lo mismo que otro.

## Qué cubren las pruebas

Reloj de ocho horas y sus catorce bloques, tutorial, descansos, cierre irreversible de bloques, reanudación tras pestaña suspendida, pausa de estudio, respuestas sin confirmar, primeros intentos, filtros, estadísticas, respaldo entre perfiles y conservación de 280 exámenes con 78.400 intentos.

Las comprobaciones de interfaz usan un DOM simulado. También se revisó el código HTML/CSS para tamaños de 320–480 px y controles táctiles. **No se hizo una prueba visual en navegador real ni en un teléfono físico.** Los comandos Node de referencia fueron `node --test tests/core.test.js tests/ui-render.test.js tests/service-worker.test.js`, `node scripts/test_core.cjs` y `node scripts/test_crypto.cjs` en el proyecto de desarrollo.

La interoperabilidad criptográfica se comprobó con la API Web Crypto de Node: ambas contraseñas abren el contenido, una contraseña incorrecta y un archivo alterado se rechazan, y una clave de perfil no descifra el progreso del otro. Las contraseñas en texto claro están fuera del ZIP publicable.

## Cobertura editorial y límites

El balance obligatorio se impone **por sistemas**, no simultáneamente por todas las disciplinas. Las competencias agregadas del banco son:

| Competencia | Preguntas | Proporción |
|---|---:|---:|
| Ciencias fundamentales | 1878 | 67.1% |
| Diagnóstico | 572 | 20.4% |
| Comunicación | 210 | 7.5% |
| Aprendizaje y mejora | 140 | 5.0% |

Las etiquetas secundarias muestran diferencias de cobertura frente a los intervalos de disciplinas publicados por USMLE:

| Disciplina | Ítems etiquetados | Banco | Intervalo oficial | Comparación |
|---|---:|---:|---:|---|
| Pathology | 1184 | 42.3% | 45–55% | Fuera |
| Physiology | 666 | 23.8% | 30–40% | Fuera |
| Nutrition | 424 | 15.1% | 15–20% | Dentro |
| Anatomy/Embryology | 445 | 15.9% | 10–20% | Dentro |
| Microbiology | 104 | 3.7% | 10–20% | Fuera |
| Pharmacology | 350 | 12.5% | 10–20% | Dentro |
| Behavioral Sciences | 457 | 16.3% | 10–15% | Fuera |
| Biochemistry | 339 | 12.1% | 5–15% | Dentro |
| Histology/Cell Biology | 164 | 5.9% | 5–15% | Dentro |
| Immunology | 190 | 6.8% | 5–15% | Dentro |
| Genetics | 142 | 5.1% | 5–10% | Dentro |

Las etiquetas se superponen y no suman 100%. **Microbiología tiene cobertura inferior al intervalo oficial; también hay diferencias en fisiología, patología y ciencias conductuales.** Por ello las formas cumplen el balance por sistemas, pero no se presentan como equivalentes completos al contenido de una forma oficial. La disponibilidad de todo el texto del libro no implica que cada concepto o frase tenga su propia pregunta.

Las preguntas y explicaciones tienen revisión interna de fuentes, claves, opciones y cálculos. Esa revisión no equivale a validación clínica externa de cada ítem. La dificultad es editorial y las formas no están equiparadas psicométricamente. Los porcentajes describen aciertos en este banco; no son una puntuación USMLE, percentil ni probabilidad de aprobar.

## Correcciones documentadas

Se corrigieron opciones con dos insulinas basales válidas, ambigüedad de anticoncepción de emergencia, sustrato de aromatasa, distinción de fase/volumen cardíaco, lesión de nervio supraescapular, claves de metabolismo vitamínico, explicaciones desalineadas y fuentes demasiado amplias. Las respuestas de comunicación incorporan alternativas corteses que se diferencian por objetivo, secuencia y contexto.

La errata de terapia triple de EPOC del libro se aclara en C0401 con apoyo GOLD. La supuesta inversión de calciuria en la página PDF 649 se descartó al revisar la imagen: el original muestra correctamente disminución de excreción de calcio. Las imágenes del libro conservan su contenido original.

## Uso y despliegue

El progreso es local y cifrado. Exportar/importar permite trasladarlo; no existe sincronización automática entre dispositivos ni cuentas de servidor. El contenido se sirve desde archivos estáticos HTTPS y se descifra después del acceso. La entrega incluye todos los archivos necesarios y rutas relativas para la raíz de un repositorio o una subcarpeta de GitHub Pages.
