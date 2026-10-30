# AirSecure AI — Plan de acción para la demo local

> ⚠️ **Documento histórico.** Las decisiones de §7 ya se tomaron y sustituyen partes de este plan: el nombre es AeroSecure AI, el stack se actualizó y no habrá pruebas. La referencia vigente es el set de documentos `01-…` a `12-…`.

> Basado en `airsecure-context.md`, `flow-proposal-airsecure.png` y `mockup-airsecure-webapp.png`.
> Estado actual del repositorio: solo documentación, no hay código. La demo se construye desde cero y corre en local.

---

## 1. Diagnóstico de la documentación

### 1.1 Lo que está bien definido

- Usuario principal (operador del centro de monitoreo) y sus 7 objetivos.
- Alcance del MVP y lo que queda fuera (sin CCTV real, sin biometría, sin ML real, sin notificaciones reales).
- Campos mínimos de una alerta y ejemplo JSON.
- Los dos flujos clave: atender una alerta crítica y descartar un falso positivo.
- Dirección visual: azul de confianza, rojo solo para lo crítico, severidad con texto e icono, no solo color.
- Criterios de aceptación y principios de IA responsable (siempre con revisión humana, la demo se declara demostrativa).

### 1.2 Inconsistencias entre documento y mockup (hay que decidir)

| # | Tema | Documento | Mockup / infografía | Propuesta |
|---|------|-----------|---------------------|-----------|
| 1 | Nombre | **AirSecure AI** | **AeroSecure AI** (y así en Loop) | Unificar. Recomiendo **AeroSecure AI** porque ya está en el material visual y en Loop. |
| 2 | Severidades | 4: crítica, alta, media, baja | 3: Alta, Media, Baja (rojo para Alta) | Usar las **4**. El rojo queda solo para *crítica*; *alta* en naranja. |
| 3 | Estados | nueva, en revisión, escalada, confirmada, descartada, resuelta. El flujo además usa "En atención" | Abierto, En revisión, Resuelto | Definir una máquina de estados única (ver §3.3). |
| 4 | Navegación | Resumen, Alertas, Incidentes, Mapa, Análisis, Configuración | Inicio, Incidentes, Análisis de patrones, Alertas, Reportes, Recomendaciones, Configuración (sin Mapa) | Resumen, Alertas, Incidentes, Mapa, Análisis, Reportes y Configuración. Las *Recomendaciones* van dentro del detalle de alerta y del dashboard, no como sección aparte. |
| 5 | Perfiles | La gestión avanzada de roles queda fuera; los usuarios son operador, personal, supervisor, administrador y equipos de emergencia | 3 perfiles con botón "Ingresar": Operador, Supervisor, **Coordinador** | Selector de perfil simulado (sin contraseña ni permisos reales) con Operador y Supervisor. Sirve para registrar quién hizo cada acción. |
| 6 | Evidencia visual | Sin rostros ni datos personales | Foto de una multitud con cajas de detección sobre personas | Usar ilustraciones o imágenes sin rostros identificables (siluetas, vista cenital, objeto aislado). |
| 7 | Fechas | 2026-10-29, UTC-5 | 15 abr 2025 | Generar los datos de prueba **relativos a "ahora"** para que la demo siempre parezca en vivo. |
| 8 | Alerta e incidente | Pide diferenciar predicción, alerta e incidente confirmado, pero no define la relación | Muestra KPIs separados ("Alertas activas 4", "Incidentes reportados 28") | Una alerta confirmada **genera** un incidente vinculado (ver §3.2). |

### 1.3 Información que falta

Para cada punto propongo un valor por defecto y así no frenar el desarrollo:

1. **Aeropuerto y zonas.** No se dice si es un solo aeropuerto ni si tiene una o varias terminales, y no hay un plano.
   → Por defecto: un aeropuerto ficticio ("Aeropuerto Internacional Demo") con 1 terminal y unas 10 zonas, dibujado en un plano SVG propio.
   Zonas: Hall principal, Check-in, Filtro de seguridad, Migración, Sala de embarque A, Puertas 10-14, Sala de equipajes, Zona comercial, Puerta de servicio, Plataforma (zona restringida).
2. **Fuentes.** No hay catálogo de cámaras ni de sensores.
   → Por defecto: unas 15 cámaras (`CAM-T1-0xx`) y 5 sensores de acceso asignados a las zonas.
3. **Equipos de respuesta.** El flujo dice "asignar al equipo correspondiente", pero no hay equipos definidos.
   → Por defecto: Seguridad T1, Patrulla de plataforma, Unidad antiexplosivos (EOD), Policía aeroportuaria, Servicios médicos y Operaciones.
4. **Criterios de priorización.** La etapa 3 de la infografía habla de "criterios previamente definidos", pero no los define.
   → Por defecto: una regla explicable `score = severidad base del tipo × confianza × criticidad de la zona`. El detalle muestra el desglose del cálculo, lo que transmite transparencia y no una caja negra.
5. **Detección de patrones o anomalías.** El mockup muestra "Aumento inusual +65 %".
   → Por defecto: una regla estadística simple (conteo de la última hora frente a la media móvil de 7 días) etiquetada como *"Análisis demostrativo, basado en reglas"*.
6. **Definición de métricas.** No se definen "tiempo de respuesta" ni "tiempo de resolución".
   → Por defecto: respuesta = de la creación a la primera acción humana; resolución = de la creación al cierre.
7. **Recomendaciones y protocolos.** Ni el mockup ("Ver protocolo") ni el documento definen el contenido.
   → Por defecto: un texto de recomendación y una checklist de protocolo por cada tipo de alerta, como datos de prueba editables.
8. **Sección Configuración.** No tiene contenido definido.
   → Por defecto: umbrales de confianza por tipo, activar o desactivar el simulador, velocidad del simulador y botón "Reiniciar demo".
9. **Reportes y exportación.** El mockup tiene un botón "Exportar", pero el documento no lo menciona.
   → Por defecto: exportar a CSV la lista filtrada de incidentes.
10. **Reporte manual.** "Incidente reportado por un operador" es un tipo de alerta, pero no hay un formulario de creación.
    → Por defecto: un formulario "Reportar evento" con validación.
11. **Idioma y zona horaria.** → Por defecto: español y America/Bogota (UTC-5).

---

## 2. Stack propuesto

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Backend | **Python 3.12 + FastAPI + SQLModel + SQLite** | Ligero, sin infraestructura, con documentación OpenAPI automática (`/docs`) que sirve para mostrar "la API". Python encaja con el equipo y facilita conectar modelos de IA reales en el futuro. |
| Tiempo real | **Server-Sent Events (SSE)** | Más simple que WebSockets y suficiente, porque el servidor empuja las alertas nuevas y los cambios de estado. |
| Frontend | **React + Vite + TypeScript** | Rápido de levantar y con tipos para alertas, incidentes y usuarios, como pide el documento. |
| UI | **Tailwind CSS + lucide-react (iconos)** | Diseño consistente sin una librería de componentes pesada. |
| Datos en front | **TanStack Query + React Router** | Caché, estados de carga y error y reintentos casi sin código. Las rutas quedan separadas por vista. |
| Gráficos | **Recharts** | Suficiente para dona, líneas y barras. |
| Mapa | **SVG propio** del plano de la terminal | No depende de mapas reales ni de tiles externos, y las zonas son clicables. |
| Pruebas | pytest (back) y Playwright (flujo E2E crítico) | El documento pide verificar el flujo completo de punta a punta. |

Para ejecutar en local se usa un solo comando (`npm run dev` en la raíz con `concurrently`, o `start-demo.ps1`). Levanta la API en `:8000` y el front en `:5173`, con proxy `/api` desde Vite.

Alternativa más rápida, si el backend no es imprescindible para la demo: solo frontend con mocks (MSW). Se pierde el "tiempo real" multi-pestaña y la API visible. **Recomiendo el backend** porque el usuario lo pidió explícitamente y porque deja el camino listo hacia la API real.

---

## 3. Backend

### 3.1 Estructura

```
backend/
  app/
    main.py              # FastAPI, CORS, routers, startup (seed + simulador)
    db.py                # engine SQLite, sesión
    models.py            # SQLModel: Zone, Source, Team, User, Alert, Incident, TimelineEvent
    schemas.py           # DTOs de entrada/salida
    state_machine.py     # transiciones válidas + reglas (motivo obligatorio, etc.)
    scoring.py           # cálculo de prioridad explicable
    analytics.py         # agregaciones + detección de anomalías por reglas
    simulator.py         # generador de eventos en background
    events.py            # bus SSE (broadcast a clientes)
    seed/                # zonas, cámaras, equipos, tipos, protocolos, alertas históricas
    routers/
      alerts.py  incidents.py  catalog.py  dashboard.py
      analytics.py  reports.py  stream.py  demo.py
  tests/
```

### 3.2 Modelo de datos

- **Zone**: id, nombre, terminal, criticidad (1-3), restringida (bool), polígono o coordenadas en el plano.
- **Source**: id (`CAM-T1-034`), tipo (cámara, sensor, reporte manual o análisis), zona.
- **Team**: id, nombre, especialidad.
- **User** (perfil simulado): id, alias ficticio, rol (operador o supervisor).
- **Alert**: id (`ALT-2048`), tipo, severidad, estado, zona, fuente, timestamp, confianza, descripción, recomendación, score, equipo asignado, motivo de descarte e `incident_id`.
- **Incident**: id (`INC-0412`), `alert_id` de origen, estado, equipo, responsable, abierto en, resuelto en, nota de resolución.
- **TimelineEvent** (auditoría): entidad, acción, actor, timestamp, payload y comentario. **Toda acción deja traza.**

Distinción conceptual (requisito §13):
*Predicción de IA* (confianza y score) → *Alerta* (requiere revisión humana) → *Incidente* (solo existe si un humano confirma la alerta).

### 3.3 Máquina de estados propuesta

```
ALERTA
  nueva ──► en_revision ──► confirmada ──(crea)──► INCIDENTE
    │            │
    └────────────┴──► descartada (falso positivo; motivo obligatorio)

INCIDENTE
  abierto ──► en_atencion (requiere equipo asignado) ──► resuelto (nota obligatoria)
     │              │
     └──────────────┴──► escalado ──► en_atencion / resuelto
```

- Las transiciones inválidas devuelven `409` con un mensaje claro.
- *Descartar*, *Resolver* y *Escalar* piden confirmación en el front.

### 3.4 Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/dashboard/summary` | KPIs: alertas activas, críticas, en investigación, resueltos hoy, tiempo medio de respuesta, estado de zonas |
| GET | `/api/alerts` | Filtros `status, severity, zone, type, source, q, from, to`, `sort` y paginación |
| GET | `/api/alerts/{id}` | Detalle con timeline, desglose del score y protocolo |
| POST | `/api/alerts/{id}/actions` | `{action: review, confirm, dismiss, comment, assign; actor; reason/comment/teamId}` |
| POST | `/api/alerts` | Reporte manual de un operador |
| GET | `/api/incidents` y `/api/incidents/{id}` | Lista con filtros y orden (fecha, severidad, tiempo de respuesta), y detalle |
| POST | `/api/incidents/{id}/actions` | `assign, start, escalate, comment, resolve` |
| GET | `/api/zones`, `/api/teams`, `/api/users`, `/api/alert-types` | Catálogos |
| GET | `/api/analytics/{by-zone, by-type, trend, resolution-time, confirmation-rate, anomalies}` | Datos para gráficos |
| GET | `/api/reports/incidents.csv` | Exportación con los mismos filtros |
| GET | `/api/stream` | SSE: `alert.created`, `alert.updated`, `incident.updated` |
| POST | `/api/demo/reset` | Restaura los datos de prueba iniciales |
| POST | `/api/demo/trigger` | Inyecta un escenario (p. ej. "equipaje abandonado crítico en Sala de equipajes") para el guion de la demo |
| GET/PUT | `/api/settings` | Simulador encendido o apagado, intervalo y umbrales |

### 3.5 Datos de prueba y simulador

- **Semilla**: unos 30 días de histórico (unos 150 incidentes ya cerrados) para que Análisis tenga tendencias, más **12 alertas activas** que cubren todas las severidades, estados, zonas y tipos (el documento pide entre 8 y 15).
- **Simulador**: cada 45-90 s, configurable, genera una alerta aleatoria ponderada (más bajas que críticas) y la emite por SSE. Se puede apagar para una presentación controlada.
- Nombres de operador ficticios ("Operador 01", "Supervisor A"). Sin datos personales.

---

## 4. Frontend

### 4.1 Estructura

```
frontend/src/
  api/          # cliente HTTP + hooks TanStack Query + suscripción SSE
  types/        # Alert, Incident, Zone, Team, User, enums de severidad/estado
  components/   # SeverityBadge, StatusBadge, KpiCard, AlertRow, ConfidenceMeter,
                # Timeline, ConfirmDialog, Toast, EmptyState, ErrorState, Skeleton,
                # AirportMap (SVG), DemoBanner, FilterBar
  features/
    dashboard/  alerts/  incidents/  map/  analytics/  reports/  settings/
  layout/       # Sidebar con contador de pendientes, Topbar (aeropuerto, hora, campana, perfil)
  lib/          # formatos de fecha (es-CO, UTC-5), colores/iconos por severidad
```

### 4.2 Pantallas y rutas

| Ruta | Contenido | Referencia en el mockup |
|------|-----------|--------------------|
| `/login` | Selector de perfil simulado (Operador o Supervisor) | Bloque 6 |
| `/` Resumen | KPIs con variación frente a ayer, alertas recientes priorizadas, mini-mapa, dona por categoría, tendencia de 24 h y aviso de anomalía | Panel principal |
| `/alertas` | Tabla con búsqueda y filtros (estado, severidad, zona, tipo), resaltado de las nuevas y animación sutil al llegar | Bloque 3 |
| `/alertas/:id` | Encabezado (severidad, estado, hora), evidencia simulada, ubicación en el plano, medidor de confianza, desglose del score, recomendación, checklist de protocolo, timeline y barra de acciones | Bloque 4 y 5 |
| `/incidentes` | Registro con búsqueda, rango de fechas, filtros, orden, paginación y "Exportar CSV" | Bloque 1 |
| `/incidentes/:id` | Detalle del incidente: equipo, escalar, resolver y timeline | — |
| `/mapa` | Plano completo de la terminal con zonas coloreadas por nivel de riesgo y marcadores de alertas; al hacer clic en una zona se filtra | Mapa del panel |
| `/analisis` | Incidentes por zona y por tipo, evolución temporal, tiempo medio de resolución, % confirmadas frente a falsos positivos y anomalías detectadas | Bloque 2 |
| `/reportes` | Resumen exportable (CSV) por periodo | Menú del mockup |
| `/configuracion` | Umbrales, simulador y reinicio de la demo | — |

Elementos globales:
- **Banner fijo "Modo demostración: detecciones simuladas, requieren validación humana".**
- Botón o atajo "Críticas (N)" visible desde cualquier sección.
- Toasts de éxito y error, skeletons de carga, estados vacíos ("Sin alertas que coincidan") y estado de error con reintento.

### 4.3 Sistema visual

- Tema oscuro azul marino para el shell y tarjetas claras para el contenido, como en el mockup.
- Severidades: Crítica en rojo con el icono `octagon-alert`, Alta en naranja con `triangle-alert`, Media en ámbar con `alert-circle` y Baja en azul o gris con `info`. **Siempre texto e icono.**
- Verde solo para resuelto o normal.
- Navegación por teclado en la tabla y en las acciones, foco visible, contraste AA.
- Responsive: escritorio (≥1280) y tablet (≥768), con el sidebar colapsable.

---

## 5. Plan de trabajo por fases

| Fase | Entregable | Estimado |
|------|-----------|----------|
| **0. Decisiones** | Cerrar las inconsistencias de §1.2 y los valores por defecto de §1.3 | 0,5 día |
| **1. Base del proyecto** | Monorepo `backend/` y `frontend/`, script único de arranque, README, linters | 0,5 día |
| **2. Backend core** | Modelos, semilla, catálogos, alertas e incidentes con filtros, máquina de estados, auditoría y tests de transiciones | 1,5 días |
| **3. Backend en vivo** | Bus SSE, simulador, `demo/reset`, `demo/trigger`, analítica, anomalías y CSV | 1 día |
| **4. Shell del front** | Layout, sidebar con contador, topbar, banner de demo, login simulado, tokens visuales, componentes base | 1 día |
| **5. Pantallas principales** | Resumen, Alertas, Detalle de alerta con todas las acciones y diálogos, Incidentes | 2 días |
| **6. Pantallas de apoyo** | Mapa SVG, Análisis, Reportes, Configuración | 1,5 días |
| **7. Pulido** | Estados de carga, vacío, error y éxito, accesibilidad, tablet, animaciones de llegada | 1 día |
| **8. Verificación y guion** | Test E2E Playwright del flujo crítico y del falso positivo, checklist de criterios de aceptación (§12 del contexto), guion de presentación | 0,5 día |

**Total aproximado: 9-10 días de trabajo.** Si hay prisa, las fases 2-5 forman una demo mínima presentable en unos 5 días (sin Mapa completo, Reportes ni Configuración).

---

## 6. Guion de la demo (5 minutos)

1. **Reiniciar la demo** y entrar como *Operador 01*. El Resumen muestra el estado general.
2. Desde Configuración o con un atajo se dispara el escenario: llega **"Equipaje abandonado, CRÍTICA, Sala de equipajes"** con una animación, sube el contador y la alerta aparece en el mapa.
3. Abrir la alerta: evidencia simulada, confianza del 94 %, por qué se priorizó (desglose del score) y la recomendación.
4. Pasar a **En revisión** y luego **Confirmar**, lo que crea el incidente `INC-xxxx`.
5. **Asignar** a la Unidad EOD, añadir una nota y **Escalar**. Todo queda en el timeline con actor y hora.
6. **Resolver** con una nota de cierre. Se actualizan los KPIs y Análisis.
7. Flujo alterno: abrir una alerta media de "Concentración inusual", **marcarla como falso positivo** con un motivo y ver cómo cambia el % de falsos positivos.
8. Cierre: Análisis (tendencias y anomalía detectada) y Exportar CSV. Mensaje final: *"La IA prioriza; la decisión es humana."*

---

## 7. Decisiones pendientes con el equipo

1. ¿Nombre final: **AeroSecure AI** o **AirSecure AI**?
2. ¿Confirmamos el stack FastAPI + React, o prefieren otro (p. ej. Node/Nest, Angular)?
3. ¿Se aprueba la máquina de estados de §3.3, con la alerta y el incidente separados?
4. ¿Perfiles en la demo: solo Operador y Supervisor, o también Coordinador como en el mockup?
5. ¿Hay algún aeropuerto o terminal de referencia para el plano, o seguimos con uno ficticio?
6. ¿Para cuándo es la demo y quién es la audiencia (cliente, comité interno)? Esto define si hacemos la versión completa o la mínima.
