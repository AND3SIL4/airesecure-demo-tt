# 09 · UI/UX: navegación, pantallas y sistema visual

Referencia visual: `mockup-airsecure-webapp.png`, con los ajustes de severidades, navegación y perfiles aprobados en los docs 01-08.

## 1. Mapa de navegación

```
/login                         Selector de perfil (Operador 01 · Operador 02 · Supervisor A)
└─ Shell (Sidebar + Topbar + DemoBanner)
   ├─ /                        Resumen
   ├─ /alertas                 Lista de alertas  (?status=&severity=&zone=&type=&source=&q=)
   │  ├─ /alertas/nueva        Reportar evento manual (modal sobre la lista)
   │  └─ /alertas/:id          Detalle de alerta
   ├─ /incidentes              Registro de incidentes (?status=&severity=&zone=&type=&q=&range=hoy|7d|30d|custom&from=&to=&sort=&page=; from/to solo con range=custom)
   │  └─ /incidentes/:id       Detalle de incidente
   ├─ /mapa                    Mapa 3D de la terminal (?zone=)
   ├─ /analisis                Análisis y tendencias (?days=7|14|30)
   ├─ /reportes                Reportes y exportación      [solo supervisor]
   └─ /configuracion           Simulador, escenarios, umbrales, reinicio  [solo supervisor]
```

- Si no hay perfil activo, cualquier ruta de la aplicación redirige a `/login` (la página "No encontrado" de rutas inexistentes es pública). Si un operador entra a una ruta de supervisor, se redirige a `/` con un toast informativo.
- Los filtros viven en la **URL** (query string), de modo que se pueden compartir y se conservan al volver atrás.
- El botón **"Críticas (N)"** de la barra superior lleva a `/alertas?status=activas&severity=critica`.

## 2. Layout (shell)

| Zona | Contenido |
|---|---|
| **DemoBanner** (arriba, fijo, 32 px) | Icono `flask-conical` y el texto "Modo demostración: detecciones simuladas, requieren validación humana". Fondo ámbar suave; no se puede cerrar |
| **Sidebar** (240 px; en tablet se colapsa a 72 px solo con iconos) | Logo AeroSecure AI. Navegación: Resumen, Alertas `[badge de pendientes]`, Incidentes `[badge en curso]`, Mapa, Análisis, y para el supervisor Reportes y Configuración. Abajo, el perfil activo con el botón "Cambiar perfil" |
| **Topbar** (64 px) | Título de la vista, "Aeropuerto Internacional Demo · Terminal 1", reloj en vivo (UTC-5, `dd MMM yyyy HH:mm`), botón "Críticas (N)" (rojo si N > 0), botón "Reportar evento", campana con las últimas 10 notificaciones de la sesión e indicador de conexión en vivo (punto verde "En vivo", o ámbar "Reconectando…") |
| **Contenido** | Ancho máximo de 1440 px con 24 px de padding y grilla de 12 columnas |
| **Toasts** | Esquina inferior derecha; los críticos son persistentes y tienen el botón "Ver alerta" |

## 3. Pantallas

### 3.1 Login simulado (`/login`)
- Tarjeta central con el logo, el texto "Selecciona tu perfil" y 3 tarjetas de perfil (icono, alias y rol).
- Debajo: "Acceso simulado para la demo. No requiere contraseña."
- Al elegir un perfil, se guarda en `localStorage` (`aerosecure.actor`) y se navega a `/`.

### 3.2 Resumen (`/`)
| Fila | Contenido |
|---|---|
| 1 | 5 **KpiCard**: Alertas activas, Críticas activas, Incidentes en curso, Resueltos hoy y Tiempo medio de respuesta (hoy). Cada uno con icono, valor grande y la variación frente a ayer (flecha y color semántico: más alertas es "peor") |
| 2 | **Alertas prioritarias** (col 7: hasta 6 filas `AlertRow`, ordenadas por score, con "Ver todas") + **Mini-mapa 2D** (col 5: SVG con las zonas coloreadas por riesgo, marcadores por severidad y leyenda con texto) |
| 3 | **Incidentes por categoría** (dona, 7 días, total al centro) + **Tendencia 24 h** (línea por hora) + **Anomalías** (lista; estado vacío "Sin anomalías detectadas") |

### 3.3 Alertas (`/alertas`)
- **FilterBar**: búsqueda (con debounce de 300 ms), selectores múltiples de estado, severidad, zona, tipo y fuente, el botón "Limpiar filtros" y un chip por cada filtro activo.
- **Tabla**: columnas Prioridad (badge de severidad), ID, Tipo, Zona, Fuente, Confianza (barra + %), Score, Estado (badge), Hora (relativa, con la absoluta en un tooltip) y una flecha. Al hacer clic en una fila se abre el detalle; también se navega con teclado (↑/↓, Enter).
- **Llegada en vivo**: la fila nueva entra con un resaltado azul que se desvanece en 2 s. No se reordena la tabla mientras el usuario tiene el foco en ella; en su lugar aparece la píldora "N alertas nuevas · Mostrar".
- Paginación de 20 y orden por columna (score, hora o severidad).

### 3.4 Detalle de alerta (`/alertas/:id`)
Layout de 2 columnas (8/4):
- **Encabezado**: badge de severidad, badge de estado, ID, tipo, zona, hora absoluta y relativa, y la etiqueta "Predicción demostrativa".
- **Columna principal**:
  1. **Evidencia** (`EvidenceViewer`): ilustración SVG del tipo de alerta dentro de un marco de cámara (fuente, hora y un recuadro sobre el objeto, nunca sobre personas), con la leyenda "Imagen ilustrativa · sin datos personales".
  2. **Descripción**.
  3. **Por qué se priorizó** (`ScoreBreakdown`): barra del score y sus 3 factores con sus valores.
  4. **Recomendación** y **Protocolo** (checklist visual, no persistente).
  5. **Timeline**.
- **Columna lateral**: **Ubicación** (mini-mapa con la zona resaltada), **Confianza** (`ConfidenceMeter` con su texto) y la **barra de acciones**:
  - `nueva` o `en_revision`: botones **Confirmar incidente** (primario), **Marcar como falso positivo** (secundario) y **Comentar**.
  - `confirmada`: enlace "Ver incidente INC-xxxx".
  - `descartada`: el motivo y quién la descartó.
- Al abrir una alerta `nueva` se envía `review` automáticamente (una sola vez).

### 3.5 Incidentes (`/incidentes`)
- FilterBar con búsqueda, rango de fechas (presets Hoy, 7 días y 30 días, o personalizado), estado, severidad, zona y tipo.
- Tabla: ID, Alerta de origen, Tipo, Severidad, Zona, Estado, Equipo, Abierto, T. respuesta y T. resolución. Se ordena por fecha, severidad o tiempo de respuesta. Paginación de 20.
- Botón "Exportar CSV" (solo supervisor; para el operador no aparece).

### 3.6 Detalle de incidente (`/incidentes/:id`)
- Encabezado: ID, estado, severidad (de la alerta), zona, equipo y tiempos.
- Panel "Alerta de origen": resumen y enlace.
- **Acciones según el estado** (doc 05 §3): Asignar equipo (selector), Atender, Escalar (modal con un selector de equipos especializados y el motivo), Resolver (modal con la nota) y Comentar.
- Los botones deshabilitados muestran un tooltip con el motivo, por ejemplo "Asigna un equipo antes de iniciar la atención".
- Timeline combinada (alerta e incidente).

### 3.7 Mapa (`/mapa`)
- **Escena 3D** (columna 9/12):
  - Losa base de la terminal con las 10 zonas como bloques extruidos (altura de 2-4 m según el tipo); los bordes de las zonas restringidas van con rayado.
  - Color de cada zona por su riesgo: crítica en rojo, alta en naranja, media en ámbar, baja en azul-gris y normal en gris o verde suave.
  - **Etiquetas HTML** sobre cada zona (`CSS2DRenderer`) con el nombre y el nivel en texto.
  - Marcadores de alerta: esferas o pines con un pulso suave, solo en las críticas.
  - `OrbitControls` con límites de ángulo y zoom; botones "Vista superior", "Vista isométrica" y "Reiniciar cámara".
  - Raycasting: pasar sobre una zona la resalta; hacer clic selecciona la zona (`?zone=`); hacer clic en un marcador abre la alerta.
- **Panel lateral** (3/12): lista de zonas con su estado (icono, texto y número de alertas) y, al seleccionar una, sus alertas activas.
- **Fallback**: si WebGL no está disponible, se muestra el mismo plano en SVG 2D, con el aviso "Vista 2D (WebGL no disponible)".
- **Rendimiento**: se renderiza solo ante cambios o interacción (`requestAnimationFrame` controlado) y se liberan las geometrías al desmontar.

### 3.8 Análisis (`/analisis`)
- Selector de rango: 7, 14 o 30 días.
- Grilla 2×3: Incidentes por zona (barras horizontales), Por tipo (barras), Evolución diaria (líneas apiladas por severidad), Confirmadas frente a falsos positivos (dona con %), Tiempos medios (2 KPIs y una línea) y Anomalías (lista con la etiqueta "Detección basada en reglas · demostrativa").
- Cada gráfico tiene un título que responde una pregunta, tooltips y su estado vacío: "¿Dónde ocurren más incidentes?", "¿Qué tipos predominan?", "¿Cómo evolucionan por severidad?", "¿Cuántas alertas se confirman?", "¿Cuánto tardamos en responder y resolver?" y "¿Hay comportamientos inusuales?". Cada bloque carga de forma independiente (un error no rompe los demás). El contador de eventos bajo umbral es acumulado desde la siembra.

### 3.9 Reportes (`/reportes`, supervisor)
- Formulario de filtros (rango, severidad, zona, tipo y estado), vista previa (las 10 primeras filas y el total) y el botón "Descargar CSV".

### 3.10 Configuración (`/configuracion`, supervisor)
- **Simulador**: interruptor, intervalo (slider de 15-300 s) y estado ("Próximo evento en ~40 s").
- **Escenarios**: 4 tarjetas (E-1 a E-4) con el botón "Disparar".
- **Umbrales**: tabla de tipos con un input numérico de 0,50-0,99 y el botón "Guardar".
- **Zona de peligro**: "Reiniciar demo", con un diálogo que pide escribir `REINICIAR` para confirmar.

### 3.11 Reportar evento (modal)
- Campos: Tipo (select), Zona (select), Severidad sugerida (radio con iconos) y Descripción (textarea de 10-500 caracteres con contador).
- Validación en línea; el botón "Reportar" queda deshabilitado mientras el formulario no sea válido.
- Éxito: toast "Evento reportado como ALT-xxxx", el modal se cierra y se resalta la alerta en la lista.

## 4. Estados de interfaz (obligatorios en cada vista)

| Estado | Patrón |
|---|---|
| Carga | Skeletons con la forma del contenido (no spinners a pantalla completa) |
| Vacío | `EmptyState` con icono, mensaje y una acción sugerida ("Limpiar filtros") |
| Error | `ErrorState` con un mensaje comprensible y el botón "Reintentar"; los errores de acción se muestran en un toast con el mensaje del backend |
| Éxito | Toast verde con la acción realizada ("Incidente INC-0412 creado") |
| Desconectado | Banner ámbar "Conexión en vivo perdida. Reintentando…" mientras SSE reconecta |
| Acción en curso | Botón con un spinner interno y deshabilitado (para evitar el doble envío) |

## 5. Sistema visual

### 5.1 Color (tokens de Tailwind)
| Token | Uso | Valor |
|---|---|---|
| `navy-950` / `navy-900` | Sidebar y Topbar | `#0B1B33` / `#10264A` |
| `brand-600` | Primario (botones, enlaces, foco) | `#1D5FD1` |
| `surface` / `surface-muted` | Tarjetas y fondo de contenido | `#FFFFFF` / `#F3F6FA` |
| `sev-critica` | Solo para la severidad crítica | `#DC2626` |
| `sev-alta` | Alta | `#EA580C` |
| `sev-media` | Media | `#D97706` |
| `sev-baja` | Baja | `#475569` |
| `ok` | Resuelto o normal | `#16A34A` |
| `demo` | Banner de demostración | `#FEF3C7` / `#92400E` |
| `*-text` (solo texto) | Variantes oscuras para texto sobre fondo claro (contraste AA): `brand-700` `#1A4FAE`, `sev-critica-text` `#B91C1C`, `sev-alta-text` `#C2410C`, `sev-media-text` `#B45309`, `ok-text` `#15803D` | — |

### 5.2 Tipografía e iconos
- **Inter** (variable, autoalojada con `@fontsource/inter`), con números tabulares en KPIs y tablas.
- Escala: 12 / 14 (base) / 16 / 20 / 24 / 32.
- Iconos lucide de 16 y 20 px, con trazo uniforme.

### 5.3 Componentes base
`Button` (primary, secondary, ghost, danger), `Badge` (`SeverityBadge` y `StatusBadge`, siempre con icono y texto), `Card`, `KpiCard`, `Table`, `FilterBar`, `Select`, `Dialog` / `ConfirmDialog`, `Toast`, `Tooltip`, `Skeleton`, `EmptyState`, `ErrorState`, `Timeline`, `ConfidenceMeter`, `ScoreBreakdown`, `EvidenceViewer`, `MiniMap2D`.

### 5.4 Movimiento
- Solo en la llegada de una alerta (resaltado de 2 s), en los cambios de estado (transición de color de 200 ms) y en el pulso de los marcadores críticos.
- Se respeta `prefers-reduced-motion`.

## 6. Accesibilidad

- La severidad y el estado siempre se comunican con **icono + texto + color**.
- Contraste **WCAG AA** (texto ≥ 4,5:1); foco visible (anillo `brand-600` de 2 px).
- Uso con teclado: navegación, tablas, filtros, acciones y diálogos (que atrapan el foco, se cierran con Esc y devuelven el foco al disparador).
- `aria-live="polite"` para las nuevas alertas y `assertive` solo para las críticas.
- Los gráficos tienen un resumen textual (`aria-label`) y los datos accesibles en el tooltip.
- El mapa 3D tiene la lista de zonas como alternativa accesible.

## 7. Responsive

| Ancho | Comportamiento |
|---|---|
| ≥ 1280 px | Layout completo |
| 1024-1279 px | Los KPIs pasan a 3 + 2; Resumen a 2 columnas |
| 768-1023 px (tablet) | Sidebar colapsado; detalle en 1 columna (el bloque de acciones, ubicación y confianza va primero, para que las acciones sean visibles sin desplazarse); tablas con scroll horizontal y columnas secundarias ocultas; en el Mapa, el panel lateral pasa a un drawer |
| < 768 px | Fuera de alcance (se muestra igual pero sin optimizar) |

## 8. Microcopy (idioma y tono)

- Español neutro, en voz activa y frases cortas. Se usa "Confirmar incidente" y no "Aceptar".
- Nunca se afirma certeza: "Posible equipaje abandonado detectado", no "Hay una bomba".
- Fechas: `30 oct 2026, 15:42`; relativas: "hace 3 min".
- Los estados se muestran con etiquetas legibles: `en_revision` → "En revisión".
