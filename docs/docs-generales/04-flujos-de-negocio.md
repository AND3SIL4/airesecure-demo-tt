# 04 · Flujos de negocio

📊 Diagramas:
- [Flujo: atender una alerta crítica](../diagramas/04-flujo-alerta-critica/flujo-alerta-critica.html)
- [Flujo: descartar un falso positivo](../diagramas/04-flujo-falso-positivo/flujo-falso-positivo.html)
- [Flujo conceptual de la solución](../diagramas/01-flujo-conceptual/flujo-conceptual.html)

## 1. Flujo F1: atender una alerta crítica (flujo principal)

| # | Actor | Paso | Estado resultante | Evento o traza |
|---|---|---|---|---|
| 1 | Sistema | Un evento supera el umbral del tipo y se genera la alerta crítica | Alerta `nueva` | `alert.created` (SSE); timeline: "Alerta generada por CAM-T1-034" |
| 2 | Sistema | Notifica: toast, contador del menú, lista del resumen y marcador en el mapa | — | — |
| 3 | Operador | Abre la alerta | Alerta `en_revision` | Timeline: "Revisión iniciada por Operador 01" |
| 4 | Operador | Revisa la evidencia, la confianza, el desglose del score, la recomendación y el protocolo | — | — |
| 5 | Operador | **Decisión:** ¿requiere atención? Si la respuesta es no, se sigue el flujo F2 | — | — |
| 6 | Operador | Confirma (con diálogo y nota opcional) | Alerta `confirmada`, incidente `abierto` | `alert.updated`, `incident.created`; timeline de ambos |
| 7 | Operador | Asigna el equipo (por ejemplo, Seguridad T1) y añade una nota | Incidente `abierto` (con equipo) | Timeline: "Asignado a Seguridad T1" |
| 8 | Operador | Marca "En atención" | Incidente `en_atencion` | `incident.updated` |
| 9 | Equipo | Atiende en sitio según el protocolo (fuera del sistema) | — | — |
| 10 | Operador | **Si excede la capacidad:** escala a un equipo especializado (EOD, policía, médico) con un motivo, previa confirmación | Incidente `escalado` | Timeline: "Escalado a Unidad EOD: motivo" |
| 11 | Operador | Resuelve con una nota de cierre, previa confirmación | Incidente `resuelto` | `incident.updated`; se calcula el tiempo de resolución |
| 12 | Sistema | Recalcula los KPIs y la analítica | — | Las vistas se refrescan por SSE |

**Reglas del flujo**

- Confirmar, escalar y resolver siempre piden un diálogo de confirmación.
- No se puede pasar a `en_atencion` sin un equipo asignado.
- Un incidente `escalado` puede volver a `en_atencion` (lo toma el equipo especializado) o pasar directamente a `resuelto`.
- Cada paso guarda el **actor** y la **hora**.

## 2. Flujo F2: descartar un falso positivo (flujo alterno)

| # | Actor | Paso | Estado resultante | Evento o traza |
|---|---|---|---|---|
| 1 | Sistema | Se genera la alerta | Alerta `nueva` | `alert.created` |
| 2 | Operador | Abre la alerta | Alerta `en_revision` | Timeline |
| 3 | Operador | Revisa la evidencia | — | — |
| 4 | Operador | **Decisión:** ¿es un falso positivo? Si la respuesta es no, se sigue el flujo F1 | — | — |
| 5 | Operador | Pulsa "Marcar como falso positivo" y elige un motivo | — | — |
| 5a | Sistema | **Validación:** sin motivo, se muestra un error en el formulario y no se envía nada | — | — |
| 6 | Operador | Confirma el diálogo (acción irreversible) | — | — |
| 6a | Operador | **Si cancela:** la alerta sigue `en_revision` | — | — |
| 7 | Sistema | Descarta la alerta y registra el motivo y el actor | Alerta `descartada` | `alert.updated`; timeline: "Descartada por Operador 01: Movimiento normal de pasajeros" |
| 8 | Sistema | Actualiza la tasa de falsos positivos en Análisis | — | — |

**Catálogo de motivos de descarte**

1. Objeto identificado como pertenencia del personal.
2. Movimiento normal de pasajeros.
3. Falla, reflejo u obstrucción de la cámara.
4. Personal autorizado en la zona.
5. Otro (texto libre obligatorio, ≥ 10 caracteres).

## 3. Flujo F3: llegada de una alerta en tiempo real

1. El simulador (por intervalo) o el supervisor (al disparar un escenario) crea un evento.
2. El servicio de alertas calcula el score: `severidad_base(tipo) × confianza × criticidad(zona)`, normalizado de 0 a 100.
3. Si `confianza ≥ umbral(tipo)`, se persiste la alerta `nueva` y se publica `alert.created`. Si no se alcanza el umbral, el evento solo se registra en las estadísticas como "por debajo del umbral" y no genera alerta.
4. Los clientes conectados al stream SSE reciben el evento y actualizan la caché de datos: lista, contador, KPIs y mapa.
5. Si la severidad es `critica`, se muestra un toast persistente con un enlace directo a la alerta.

## 4. Flujo F4: reporte manual de un evento

1. El operador abre "Reportar evento" desde Alertas o desde la barra superior.
2. Completa el tipo, la zona, la severidad sugerida y la descripción, con validación en el cliente y en el servidor.
3. El sistema crea una alerta `nueva` con fuente `reporte_manual`, confianza "N/A: reporte humano" y el score calculado con un factor de confianza fijo de 1,0.
4. La alerta sigue el flujo F1 o F2 como cualquier otra.

## 5. Flujo F5: control de la demo (supervisor)

1. El supervisor entra en Configuración.
2. Puede: (a) encender o apagar el simulador y ajustar su intervalo; (b) disparar un escenario; (c) ajustar los umbrales; (d) reiniciar la demo.
3. Reiniciar pide confirmación, vacía la base de datos, vuelve a sembrar los datos relativos a "ahora" y emite `demo.reset`. Todos los clientes invalidan su caché y vuelven al Resumen.

### Escenarios predefinidos para disparar

| Escenario | Tipo | Severidad | Zona | Confianza |
|---|---|---|---|---|
| E-1 | Equipaje abandonado | Crítica | Sala de equipajes | 0,94 |
| E-2 | Acceso a zona restringida | Alta | Plataforma | 0,88 |
| E-3 | Concentración inusual de personas | Media | Sala de embarque A | 0,71 |
| E-4 | Permanencia inusual | Baja | Zona comercial | 0,62 |
