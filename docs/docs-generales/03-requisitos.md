# 03 · Requisitos funcionales y no funcionales

Trazabilidad: cada requisito funcional (RF) apunta a sus historias de usuario (HU) del doc 02.

## 1. Requisitos funcionales

### RF-A · Acceso y shell

| ID | Requisito | HU |
|---|---|---|
| RF-A1 | El sistema permite elegir un perfil simulado (Operador 01, Operador 02, Supervisor A) sin contraseña y lo conserva en `localStorage` | HU-01 |
| RF-A2 | Todas las peticiones de acción envían el `actorId` del perfil activo | HU-01 |
| RF-A3 | La interfaz muestra un banner permanente de modo demostración | HU-02 |
| RF-A4 | La navegación lateral muestra Resumen, Alertas (con el contador de pendientes), Incidentes, Mapa y Análisis, y, solo para el supervisor, Reportes y Configuración | HU-07 |
| RF-A5 | La barra superior muestra el aeropuerto ficticio, la terminal, la fecha y hora en vivo (UTC-5), el botón "Críticas (N)", la campana de notificaciones y el perfil | HU-07 |

### RF-B · Resumen

| ID | Requisito | HU |
|---|---|---|
| RF-B1 | Muestra 5 KPIs: alertas activas (`nueva` + `en_revision`), críticas activas, incidentes en curso (`abierto` + `en_atencion` + `escalado`), resueltos hoy y tiempo medio de respuesta de hoy, cada uno con su variación frente a ayer | HU-03 |
| RF-B2 | Lista hasta 6 alertas activas ordenadas por score descendente, con el enlace "Ver todas" | HU-04 |
| RF-B3 | Muestra un mini-mapa SVG con marcadores por severidad | HU-09 |
| RF-B4 | Muestra una dona de incidentes por categoría (últimos 7 días) y una tendencia de las últimas 24 h | HU-03 |
| RF-B5 | Muestra un aviso de anomalía si existe alguna activa | HU-24 |

### RF-C · Alertas

| ID | Requisito | HU |
|---|---|---|
| RF-C1 | Lista paginada con filtros (estado, severidad, zona, tipo, fuente), búsqueda de texto y orden (score, fecha, severidad) | HU-06 |
| RF-C2 | Las alertas nuevas se reciben por SSE y se insertan sin recargar la página, con un toast y una animación | HU-05 |
| RF-C3 | El detalle muestra los campos de la alerta, la evidencia, la ubicación, la confianza, el desglose del score, la recomendación, el checklist de protocolo y la timeline | HU-10 |
| RF-C4 | Al abrir una alerta `nueva`, pasa automáticamente a `en_revision` | HU-11 |
| RF-C5 | Acciones: confirmar (crea un incidente), descartar (motivo obligatorio) y comentar; confirmar y descartar piden un diálogo de confirmación | HU-12, HU-13, HU-14 |
| RF-C6 | Formulario de reporte manual con validación | HU-15 |
| RF-C7 | Las transiciones inválidas muestran un mensaje claro procedente del backend (`409`) | HU-12, HU-13 |

### RF-D · Incidentes

| ID | Requisito | HU |
|---|---|---|
| RF-D1 | Registro con búsqueda, rango de fechas, filtros (severidad, zona, tipo, estado), orden (fecha, severidad, tiempo de respuesta) y paginación de 20 | HU-21 |
| RF-D2 | El detalle muestra los datos del incidente, la alerta de origen, el equipo, el responsable y la timeline combinada | HU-20 |
| RF-D3 | Acciones: asignar o reasignar, atender (requiere equipo), escalar (destino y motivo), comentar y resolver (nota) | HU-16 a HU-19 |

### RF-E · Mapa

| ID | Requisito | HU |
|---|---|---|
| RF-E1 | Vista 3D (Three.js) de la Terminal 1 ficticia con las 10 zonas extruidas, orbitar, zoom y reiniciar cámara | HU-08 |
| RF-E2 | Cada zona se colorea según su nivel de riesgo (máxima severidad activa) y muestra una etiqueta de texto | HU-08 |
| RF-E3 | Marcadores de alertas activas con tooltip; al hacer clic se abre el detalle | HU-08 |
| RF-E4 | Panel lateral con la lista de zonas y su estado; al hacer clic en una zona se filtran sus alertas | HU-08 |
| RF-E5 | Si WebGL no está disponible, se muestra el plano 2D (SVG) | HU-08 |

### RF-F · Análisis y reportes

| ID | Requisito | HU |
|---|---|---|
| RF-F1 | Gráficos: incidentes por zona (barras), por tipo (barras), evolución diaria (líneas) y confirmadas frente a falsos positivos (dona) | HU-22, HU-23 |
| RF-F2 | Tiempos medios de respuesta y de resolución, con el selector de rango (7, 14 o 30 días) | HU-23 |
| RF-F3 | Lista de anomalías detectadas con la etiqueta "basado en reglas" | HU-24 |
| RF-F4 | Exportación CSV de incidentes con los filtros activos | HU-25 |

### RF-G · Configuración y simulación

| ID | Requisito | HU |
|---|---|---|
| RF-G1 | Encender o apagar el simulador e intervalo de 15-300 s, aplicados en caliente | HU-26 |
| RF-G2 | Disparar escenarios predefinidos | HU-27 |
| RF-G3 | Reiniciar la demo: vuelve a sembrar los datos relativos a la hora actual y notifica a los clientes por SSE (`demo.reset`) | HU-28 |
| RF-G4 | Umbral de confianza por tipo de alerta | HU-29 |

### RF-H · Auditoría

| ID | Requisito |
|---|---|
| RF-H1 | Toda transición de estado, asignación, comentario y acción de la demo genera un `TimelineEvent` con actor, fecha y hora, acción y datos asociados |
| RF-H2 | La timeline es de solo lectura: no se edita ni se borra |

## 2. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Ejecución | Se levanta en local con un solo comando (`start-demo.ps1` o `npm run dev` en la raíz); backend en `:8000` y frontend en `:5173` |
| RNF-02 | Coste | Cero servicios externos de pago, sin claves de API y sin dependencias en la nube. Funciona sin internet una vez instaladas las dependencias |
| RNF-03 | Rendimiento | Las vistas cargan en < 1 s en local; un evento SSE llega a la interfaz en ≤ 2 s; el mapa 3D va a ≥ 30 fps en un portátil estándar |
| RNF-04 | Arquitectura | Capas estrictas (doc 06): cada capa depende solo de la inferior; las reglas de negocio viven en `services`; el acceso a datos, solo en `repositories` |
| RNF-05 | Extensibilidad | El simulador y el análisis por reglas se sustituyen por fuentes y modelos reales sin tocar la capa de presentación (mediante interfaces y puertos) |
| RNF-06 | Usabilidad | Interfaz en español; formatos de fecha `es-CO`; zona horaria UTC-5; mensajes de error comprensibles |
| RNF-07 | Accesibilidad | La severidad se comunica siempre con texto e icono además del color; contraste WCAG AA; foco visible; los controles principales se usan con teclado; los diálogos atrapan el foco |
| RNF-08 | Responsive | Escritorio (≥ 1280 px) y tablet (≥ 768 px); el menú lateral se colapsa en tablet |
| RNF-09 | Estados de UI | Toda vista con datos remotos tiene los estados de carga (skeleton), vacío, error (con reintento) y éxito (toast) |
| RNF-10 | Privacidad | Sin datos personales; evidencia sin rostros identificables; alias ficticios |
| RNF-11 | IA responsable | Etiquetas visibles de "demostrativo"; ninguna acción irreversible automática; las predicciones se distinguen de las alertas y los incidentes |
| RNF-12 | Calidad | Sin suite de pruebas. Se exige código tipado (TypeScript estricto y type hints en Python), un linter básico (ruff y eslint) y la validación manual con el guion de la demo (doc 11) |
| RNF-13 | Documentación de la API | OpenAPI generado automáticamente por FastAPI en `/docs` |
| RNF-14 | Persistencia | SQLite en un archivo local (`backend/data/aerosecure.db`), recreable con el reinicio de la demo |
| RNF-15 | Compatibilidad | Últimas versiones de Chrome y Edge (navegadores objetivo de la presentación) |
