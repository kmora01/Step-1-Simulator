# Diseño del simulador Step One Studio

Consulta de fuentes: 11 de octubre de 2026. Este documento separa hechos oficiales, decisiones de diseño y límites de la herramienta.

## Formato que se reproduce

Desde el 14 de mayo de 2026, Step 1 utiliza 14 bloques de 30 minutos, con un máximo de 20 preguntas por bloque, en una jornada de 8 horas. El tutorial opcional dura 5 minutos y el descanso inicial mínimo es de 55 minutos. El tiempo ahorrado al terminar un bloque o el tutorial puede incrementar el descanso. No se puede regresar a bloques cerrados. En este simulador se usa el máximo de 280 preguntas por examen. [1,2]

El libro adjunto conserva en sus páginas iniciales el formato anterior de 7 bloques de 60 minutos, tutorial de 15 minutos y descansos de 45 minutos. Sus contenidos científicos se emplean como referencia; para las reglas de administración prevalece la información oficial vigente. No se emplea el año de la portada como garantía de que todas las reglas operativas ya estén actualizadas.

## Qué significan las 280 versiones

2.800 / 280 = 10 exámenes completos sin reutilizar preguntas. Las formas 1–10 son una partición del banco completo: cada pregunta aparece una sola vez en esa serie. Las otras 270 formas son combinaciones adicionales de ese mismo banco. Cada forma contiene 280 identificadores diferentes, y se comprueba que las 280 formas tengan composiciones distintas. Entre formas 11–280 se reutilizan preguntas. El progreso de un usuario permite practicar con preguntas aún no vistas hasta agotar el banco.

No existe una forma honesta de ofrecer 280 exámenes completos enteramente nuevos con 2.800 preguntas: se necesitarían 78.400 preguntas. El requisito original de 100 exámenes sin repetición equivalía a 28.000 preguntas. El alcance posterior solicitado es de 2.800, que es el que se implementa.

## Distribución por sistemas

USMLE publica intervalos de contenido, no una cantidad fija obligatoria para cada formulario. Se seleccionó una distribución entera dentro de todos esos intervalos, cercana a sus puntos medios normalizados. Es una decisión editorial propia. [3]

| Sistema o área | Intervalo oficial | Por examen | Banco total |
|---|---:|---:|---:|
| Desarrollo humano | 1–3% | 5 | 50 |
| Sangre, sistema linforreticular e inmunidad | 9–13% | 30 | 300 |
| Salud conductual, sistema nervioso y sentidos | 10–14% | 33 | 330 |
| Musculoesquelético, piel y tejido subcutáneo | 8–12% | 28 | 280 |
| Cardiovascular | 7–11% | 25 | 250 |
| Respiratorio, renal y urinario | 11–15% | 36 | 360 |
| Gastrointestinal | 6–10% | 22 | 220 |
| Reproductivo y endocrino | 12–16% | 39 | 390 |
| Procesos y trastornos multisistémicos | 8–12% | 27 | 270 |
| Bioestadística, epidemiología y salud poblacional | 4–6% | 14 | 140 |
| Comunicación y habilidades interpersonales | 6–9% | 21 | 210 |
| **Total** | | **280** | **2.800** |

Las ciencias básicas se integran en los sistemas. Una pregunta puede evaluar simultáneamente patología, fisiología, farmacología o nutrición; esas etiquetas no deben sumar 100%. Las categorías del examen y los capítulos del libro son dimensiones diferentes: estudiar Bioquímica en orden no implica añadir una cuota independiente de Bioquímica a las cuotas por sistema.

## Nutrición y competencias

En junio de 2026 se reforzó la evaluación de nutrición en los tres Steps; sigue integrada en los sistemas y no tiene una ponderación independiente que cambie por sí sola la calificación. La especificación actual incluye nutrición entre las disciplinas. [3,4]

Se etiqueta nutrición cuando el objetivo realmente requiere una inferencia nutricional, metabólica, de absorción o de deficiencia. La etiqueta no se añade solo porque un órgano esté relacionado con la alimentación. Los intervalos de disciplinas y competencias sirven como controles secundarios de cobertura, no como prueba de equivalencia del banco con una evaluación oficial.

## Preguntas y explicaciones

Las preguntas y sus objetivos están escritos en inglés para practicar el idioma del examen; las explicaciones y justificaciones se presentan en español. Cada ítem tiene una sola mejor respuesta editorial, cinco alternativas, explicación de la clave y de los distractores, objetivo, capítulo, tema, sistema y referencias a páginas PDF reales del libro.

Se emplean casos clínicos, experimentos, mecanismos fisiológicos, farmacología e interpretación de datos. La redacción favorece un enunciado enfocado que pueda resolverse antes de leer las alternativas; las opciones deben responder al mismo tipo de pregunta. Se evita la repetición por sustitución de edad, nombre o cifras y se revisan posibles duplicados de texto y de objetivo. Estas decisiones se apoyan en los principios de construcción de ítems de NBME. [5]

## Libro y orden de aprendizaje

Se extrajeron las 869 páginas del archivo adjunto y su índice detallado. Hay texto completo buscable e imágenes fieles de las páginas, incluidas las figuras, tablas y créditos originales. La consulta de páginas es bajo demanda para reducir descargas en el celular. Las referencias distinguen página impresa y página PDF: la primera no siempre coincide con el índice digital.

El banco se ordena por la primera página de su concepto de referencia. El modo por capítulos permite avanzar según el libro; los exámenes mezclan los sistemas. Las figuras del libro se muestran para estudiar después de responder, o al revisar un examen finalizado. Durante un examen activo solo está disponible la referencia de laboratorio de las páginas PDF 20–21.

La extracción de texto puede representar de forma imperfecta exponentes, flechas o símbolos: la imagen de la página es la referencia visual fiel. No se modifica el contenido de esas imágenes. Tener todas las páginas disponibles no significa que las 2.800 preguntas evalúen individualmente cada frase del libro.

Se verificó una errata impresa en la descripción de la terapia triple para EPOC: la página PDF 728 (impresa 706) llama agonistas a los fármacos muscarínicos de acción prolongada. LAMA corresponde a antagonistas muscarínicos, como especifica GOLD. La pregunta correspondiente aclara la corrección y enlaza la fuente adicional; la página original se conserva intacta. [12]

## Dos modos con propósitos distintos

**Estudio:** corrección tras confirmar una respuesta, análisis de distractores y consulta de la página del libro. Se puede practicar en orden o con filtros de temas, pendientes, falladas y marcadas.

**Examen:** 14 bloques cronometrados; se pueden modificar respuestas dentro del bloque abierto y las claves permanecen ocultas hasta finalizar. Las preguntas sin responder cuentan como incorrectas. Cerrar la pestaña o recargar no reinicia el plazo: los tiempos se calculan con marcas absolutas y el estado se guarda.

La corrección inmediata solicitada y una administración fiel del examen tienen fines diferentes, por eso se ofrecen como modos explícitos. Practicar y recibir retroalimentación es útil para retención; no se deduce de esa evidencia que completar cierta cantidad de simulacros garantice aprobar. [6]

## Progreso y estadísticas

Cada usuario tiene su propio historial cifrado. Las estadísticas muestran intentos, aciertos, errores, cobertura y resultados por sistema y tema; los capítulos sirven como filtro de práctica. Se distinguen resultados de primer intento de resultados acumulados para que repetir preguntas no parezca aprendizaje completamente nuevo. Las categorías con pocas respuestas requieren interpretación prudente; no se calculan percentiles ni probabilidad oficial de aprobación.

El progreso reside en el navegador y dispositivo actual. Exportar/importar una copia permite trasladarlo manualmente; no hay sincronización automática ni base de datos de usuarios en un servidor. Dos personas pueden usar el mismo dispositivo entrando en su perfil correspondiente.

## Acceso y despliegue

GitHub Pages aloja archivos estáticos. [7] Para permitir dos accesos sin servidor, el banco y todas las páginas se cifran con AES-256-GCM; cada contraseña deriva una clave que permite abrir la clave de contenido compartida. El progreso se cifra separadamente para cada perfil. Las contraseñas y la clave de contenido en texto plano se excluyen del ZIP publicable. El acceso se ejecuta en el navegador; no proporciona sesiones de servidor, revocación remota, limitación de intentos ni sincronización.

La aplicación usa rutas relativas, sin API de pago ni bibliotecas externas, y se puede publicar en la raíz de un repositorio de GitHub Pages. La criptografía requiere un navegador moderno y un contexto HTTPS o localhost. [8] Las imágenes se distribuyen como archivos pequeños; el PDF original de gran tamaño no se sube al sitio. Los tamaños de la entrega se comprueban frente a los límites de Pages. [9]

## Límites de validación

Se comprueban los 2.800 identificadores, la unicidad de los enunciados, las cuotas, las alternativas y claves, la integridad de las referencias, las páginas extraídas y los componentes del motor. Se revisan por muestreo contenido médico y posibles duplicados semánticos, con correcciones documentadas. Estos controles no equivalen a validación clínica independiente de cada ítem ni a calibración psicométrica con candidatos.

Los grados fácil/medio/difícil son estimaciones editoriales. Las formas no están equiparadas estadísticamente. La puntuación porcentual sirve para entrenamiento y no se transforma en puntuación USMLE, percentil ni probabilidad de aprobación. Las autoevaluaciones oficiales de NBME sí tienen su propia metodología de interpretación, que no se puede atribuir a este simulador. [10]

## Fuentes verificadas

1. USMLE. Step 1: formato y duración. https://www.usmle.org/step-exams/step-1
2. USMLE. Test Delivery Software Updates for Step 2 CK and Step 1 Coming in May 2026. https://www.usmle.org/test-delivery-software-updates-step-2-ck-and-step-1-coming-may-2026
3. USMLE. Step 1 Content Outline and Specifications. https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications
4. USMLE. Enhancements to Nutrition Content on USMLE Step Exams Coming in June 2026. Actualizado 10 de junio de 2026. https://www.usmle.org/enhancements-nutrition-content-usmle-step-exams-coming-june-2026
5. NBME. Item-Writing Guide. 6.ª ed. https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf
6. Larsen DP, Butler AC, Roediger HL III. Repeated testing improves long-term retention relative to repeated study: a randomised controlled trial. Med Educ. 2009;43(12):1174–1181. doi:10.1111/j.1365-2923.2009.03518.x. https://pubmed.ncbi.nlm.nih.gov/19930508/
7. GitHub. What is GitHub Pages? https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
8. MDN. SubtleCrypto. https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
9. GitHub. GitHub Pages limits. https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
10. NBME. Comprehensive Basic Science Self-Assessment. https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment/
11. Le T, Bhushan V, et al. First Aid for the USMLE Step 1 2026. Archivo aportado por el usuario; ISBN 978-1-264-77578-1. Referencia científica y material visual del simulador.
12. GOLD. Pocket Guide to COPD Diagnosis, Management, and Prevention, 2025. Definición de LAMA y terapia triple. https://goldcopd.org/wp-content/uploads/2024/11/Pocket-Guide-2025-v1.0-12Nov2024_WMV-Draft.pdf

No se copiaron preguntas de UWorld ni de los bancos oficiales. El producto no tiene afiliación con esas organizaciones.
