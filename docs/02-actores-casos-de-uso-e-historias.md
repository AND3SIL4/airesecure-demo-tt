# 02 · Actores, casos de uso e historias de usuario

📊 Diagramas:
- [Diagrama de casos de uso](diagramas/02-casos-de-uso/casos-de-uso.html)
- [User journey del operador](diagramas/02-user-journey/user-journey.html)

## 1. Actores

| Actor | Tipo | Descripción | Objetivos |
|---|---|---|---|
| **Operador** | Humano, principal | Personal del centro de monitoreo que atiende alertas en primera instancia | Saber qué ocurre ahora, priorizar, decidir y dejar traza |
| **Supervisor** | Humano, secundario | Responsable de la operación de seguridad | Gestionar incidentes, analizar tendencias, exportar y configurar la demo |
| **Simulador** | Sistema | Componente del backend que emite eventos simulados cada cierto intervalo o bajo demanda | Mantener la sensación de "tiempo real" |
| **Equipos de respuesta** | Externo, no usa la app | Seguridad T1, Patrulla de plataforma, Unidad EOD, Policía aeroportuaria, Servicios médicos, Operaciones | Recibir la asignación (solo se registra; no hay notificación real) |

Los usuarios de la demo son ficticios: **Operador 01**, **Operador 02**, **Supervisor A**.

## 2. Matriz de casos de uso

| ID | Caso de uso | Operador | Supervisor | Sistema |
|---|---|:-:|:-:|:-:|
| UC-01 | Iniciar sesión simulada (elegir perfil) | ✔ | ✔ | |
| UC-02 | Consultar resumen operativo | ✔ | ✔ | |
| UC-03 | Monitorear alertas en tiempo real (lista, búsqueda, filtros) | ✔ | ✔ | |
| UC-04 | Explorar el mapa 3D de zonas | ✔ | ✔ | |
| UC-05 | Revisar el detalle de una alerta | ✔ | ✔ | |
| UC-06 | Confirmar alerta (crea incidente) | ✔ | ✔ | |
| UC-07 | Descartar alerta como falso positivo | ✔ | ✔ | |
| UC-08 | Comentar una alerta | ✔ | ✔ | |
| UC-09 | Asignar equipo a un incidente | ✔ | ✔ | |
| UC-10 | Iniciar la atención del incidente | ✔ | ✔ | |
| UC-11 | Escalar un incidente | ✔ | ✔ | |
| UC-12 | Resolver un incidente | ✔ | ✔ | |
| UC-13 | Reportar un evento manual | ✔ | ✔ | |
| UC-14 | Consultar el registro de incidentes | ✔ | ✔ | |
| UC-15 | Consultar el detalle e historial de un incidente | ✔ | ✔ | |
| UC-16 | Analizar tendencias y anomalías | ◐ (solo lectura) | ✔ | |
| UC-17 | Exportar reporte CSV | | ✔ | |
| UC-18 | Configurar umbrales y simulador | | ✔ | |
| UC-19 | Reiniciar la demo o disparar un escenario | | ✔ | |
| UC-20 | Generar alerta simulada | | | ✔ |
| UC-21 | Calcular prioridad y detectar anomalías | | | ✔ |

> Como no hay permisos reales, el supervisor también puede ejecutar las acciones del operador. La interfaz solo **oculta** del menú del operador las opciones de Reportes y Configuración.

## 3. Especificación de los casos de uso clave

### UC-06 · Confirmar alerta

- **Actor:** Operador.
- **Precondición:** la alerta está en estado `nueva` o `en_revision`.
- **Flujo principal:**
  1. El operador abre la alerta. Si está en `nueva`, pasa automáticamente a `en_revision`.
  2. Revisa la evidencia, la confianza, el desglose del score y la recomendación.
  3. Pulsa **Confirmar incidente** y escribe opcionalmente una nota.
  4. Acepta el diálogo de confirmación.
  5. El sistema pasa la alerta a `confirmada`, crea el incidente `INC-xxxx` en estado `abierto`, registra ambos eventos en la timeline y emite los eventos SSE.
  6. La interfaz lleva al operador al detalle del incidente.
- **Postcondición:** el incidente existe, vinculado a la alerta.
- **Excepciones:** si la alerta ya está en un estado final, el sistema responde `409` y muestra un mensaje: "La alerta ya fue procesada por *actor* a las *hora*".

### UC-07 · Descartar como falso positivo

- **Precondición:** la alerta está en `nueva` o `en_revision`.
- **Flujo principal:** el operador pulsa **Marcar como falso positivo**, elige un motivo (lista o texto libre), confirma el diálogo y el sistema pasa la alerta a `descartada`, registrando el motivo y el actor.
- **Excepciones:** si no hay motivo, se muestra un error de validación y no se envía nada. Si el operador cancela el diálogo, la alerta sigue en `en_revision`.

### UC-09 a UC-12 · Gestionar incidente

- **Asignar (UC-09):** se elige un equipo del catálogo; se registra en la timeline. Puede reasignarse.
- **Atender (UC-10):** requiere un equipo asignado; el incidente pasa a `en_atencion`.
- **Escalar (UC-11):** requiere el equipo especializado de destino y un motivo; pasa a `escalado`; pide confirmación.
- **Resolver (UC-12):** requiere una nota de cierre; pasa a `resuelto`; pide confirmación; calcula el tiempo de resolución.

### UC-13 · Reportar evento manual

Formulario con tipo, zona, severidad sugerida y descripción (mínimo 10 caracteres). Crea una alerta con fuente `reporte_manual`, confianza no aplicable ("N/A: reporte humano") y estado `nueva`.

### UC-19 · Reiniciar la demo o disparar un escenario

- **Reiniciar:** restaura los datos semilla relativos a la hora actual; pide confirmación.
- **Disparar escenario:** inyecta una alerta predefinida, por ejemplo "Equipaje abandonado, crítica, Sala de equipajes", para el guion de la presentación.

### UC-20 y UC-21 · Simulador y priorización

Cada 45-90 s (configurable y apagable), el simulador genera un evento ponderado (más eventos de severidad baja que críticos). El sistema calcula el score, aplica el umbral del tipo y, si se supera, publica la alerta. El detector de anomalías evalúa, por zona y por tipo, la última hora frente a la media de los últimos 7 días.

## 4. Historias de usuario

Formato: *Como … quiero … para …*. La prioridad usa MoSCoW: M = Must, S = Should, C = Could.

### Épica E1 · Acceso y contexto

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-01 | Como **operador** quiero elegir mi perfil al entrar para que mis acciones queden registradas a mi nombre | M | Muestra Operador y Supervisor; el perfil persiste en la sesión del navegador; la barra superior muestra el alias; se puede cerrar sesión |
| HU-02 | Como **usuario** quiero ver siempre que estoy en modo demostración para no confundir lo simulado con datos reales | M | Banner fijo visible en todas las vistas con el texto "Modo demostración: detecciones simuladas, requieren validación humana" |

### Épica E2 · Monitoreo

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-03 | Como **operador** quiero ver un resumen con KPIs para entender el estado de seguridad en segundos | M | KPIs: alertas activas, críticas, incidentes en atención, resueltos hoy, tiempo medio de respuesta, con su variación frente a ayer |
| HU-04 | Como **operador** quiero ver las alertas recientes ordenadas por prioridad para saber qué atender primero | M | Ordenadas por score descendente; muestran severidad (texto e icono), tipo, zona y hora relativa; al hacer clic se abre el detalle |
| HU-05 | Como **operador** quiero recibir las alertas nuevas sin recargar la página para reaccionar a tiempo | M | Llegan por SSE en ≤ 2 s; aparece un toast y se actualizan el contador del menú, la lista y el mapa; animación sutil al entrar |
| HU-06 | Como **operador** quiero filtrar y buscar alertas para centrarme en lo relevante | M | Filtros por estado, severidad, zona, tipo y fuente; búsqueda por texto en ID y descripción; los filtros se reflejan en la URL; estado vacío si no hay resultados |
| HU-07 | Como **operador** quiero un acceso rápido a las alertas críticas desde cualquier vista | M | Botón "Críticas (N)" en la barra superior que abre la lista filtrada |
| HU-08 | Como **operador** quiero ver un mapa 3D de la terminal con las zonas coloreadas por riesgo para ubicar los eventos | S | Maqueta 3D con orbitar y hacer zoom; zonas con color e indicador de texto por nivel; marcadores de alertas activas; al hacer clic en una zona se filtran sus alertas; fallback 2D si no hay WebGL |
| HU-09 | Como **operador** quiero un mini-mapa 2D en el resumen para ver de un vistazo dónde hay alertas | S | Plano SVG con zonas y marcadores por severidad |

### Épica E3 · Revisión y decisión de alertas

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-10 | Como **operador** quiero ver el detalle de una alerta para entender qué, dónde, cuándo y por qué | M | Encabezado con severidad, estado y hora; descripción; evidencia simulada; zona en el plano; confianza; desglose del score; recomendación; protocolo; timeline |
| HU-11 | Como **operador** quiero que al abrir una alerta nueva pase a "en revisión" para que el equipo sepa que alguien la atiende | M | La transición es automática y queda en la timeline con el actor |
| HU-12 | Como **operador** quiero confirmar una alerta para convertirla en incidente | M | Diálogo de confirmación; crea `INC-xxxx` vinculado; redirige al incidente; toast de éxito |
| HU-13 | Como **operador** quiero marcar una alerta como falso positivo indicando el motivo | M | Motivo obligatorio; diálogo de confirmación; estado `descartada`; queda auditado |
| HU-14 | Como **operador** quiero comentar una alerta para dejar contexto | S | Comentario de 3 a 500 caracteres; aparece en la timeline |
| HU-15 | Como **operador** quiero reportar un evento manualmente para registrar lo que me comunica el personal | S | Formulario validado; crea una alerta `nueva` de fuente `reporte_manual` |

### Épica E4 · Gestión de incidentes

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-16 | Como **operador** quiero asignar un equipo al incidente para que alguien lo atienda | M | Selector de equipos; se registra; permite reasignar |
| HU-17 | Como **operador** quiero marcar el incidente "en atención" para reflejar que la respuesta está en curso | M | Requiere un equipo asignado; si no lo hay, el botón se deshabilita con un tooltip explicativo |
| HU-18 | Como **operador** quiero escalar un incidente a un equipo especializado | M | Destino y motivo obligatorios; diálogo de confirmación; estado `escalado` |
| HU-19 | Como **operador** quiero resolver un incidente con una nota de cierre | M | Nota obligatoria (≥ 10 caracteres); diálogo de confirmación; estado `resuelto`; se calcula el tiempo de resolución |
| HU-20 | Como **operador** quiero ver la timeline del incidente y de su alerta de origen | M | Orden cronológico; icono por acción; actor y hora |

### Épica E5 · Historial y análisis

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-21 | Como **supervisor** quiero consultar el registro de incidentes con filtros y orden | M | Búsqueda; rango de fechas; filtros por severidad, zona, tipo y estado; orden por fecha, severidad o tiempo de respuesta; paginación de 20 |
| HU-22 | Como **supervisor** quiero ver gráficos de incidentes por zona, por tipo y en el tiempo | M | Gráficos de barras y líneas con rango de 7, 14 o 30 días; tooltips; estado vacío |
| HU-23 | Como **supervisor** quiero ver el % de alertas confirmadas frente a falsos positivos y los tiempos medios | M | Dona o barra apilada con porcentajes; tiempo medio de respuesta y de resolución |
| HU-24 | Como **supervisor** quiero ver las anomalías detectadas, como "Aumento inusual +65 %" | S | Lista de anomalías activas con zona, tipo y variación; etiqueta "basado en reglas, demostrativo" |
| HU-25 | Como **supervisor** quiero exportar los incidentes filtrados a CSV | S | Descarga un CSV con los filtros activos, en UTF-8 con BOM para Excel |

### Épica E6 · Administración de la demo

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|:-:|---|
| HU-26 | Como **supervisor** quiero encender o apagar el simulador y ajustar su intervalo para controlar la presentación | M | Interruptor e intervalo (15-300 s); el cambio se aplica sin reiniciar |
| HU-27 | Como **supervisor** quiero disparar un escenario predefinido para el guion de la demo | M | Lista de 3 a 5 escenarios; la alerta aparece en ≤ 2 s |
| HU-28 | Como **supervisor** quiero reiniciar los datos de la demo | M | Diálogo de confirmación; datos semilla relativos a la hora actual; los clientes conectados se refrescan |
| HU-29 | Como **supervisor** quiero ajustar el umbral de confianza por tipo de alerta | C | Valores entre 0,50 y 0,99; afecta solo a las alertas nuevas |

## 5. User journey: resumen

Ver el [diagrama](diagramas/02-user-journey/user-journey.html).

| Fase | Hace | Siente | Touchpoint | Oportunidad |
|---|---|---|---|---|
| Ingresar | Elige su perfil | Tranquilo | Login simulado | Entrar en un clic |
| Detectar | Ve la alerta crítica | Urgencia | Toast, contador y mapa | Destacar sin saturar; rojo solo para lo crítico |
| Entender | Revisa la evidencia | Necesita contexto | Detalle de alerta | Score explicable, ubicación y protocolo |
| Decidir | Confirma | Seguro de su decisión | Diálogo | Confirmación clara; la decisión es humana |
| Responder | Asigna y escala | En control | Detalle del incidente | Timeline en vivo y equipos a un clic |
| Cerrar | Resuelve | Alivio | KPIs y análisis | Ver el impacto de su acción en los indicadores |
