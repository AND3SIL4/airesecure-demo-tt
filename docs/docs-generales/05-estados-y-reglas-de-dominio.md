# 05 · Máquinas de estado y reglas de dominio

📊 Diagramas:
- [Ciclo de vida de una alerta](../diagramas/05-estados-alerta/estados-alerta.html)
- [Ciclo de vida de un incidente](../diagramas/05-estados-incidente/estados-incidente.html)

Las reglas de este documento viven en la capa **domain** del backend (`app/domain/state_machine.py`, `app/domain/scoring.py`), escritas en Python puro y sin dependencias. El frontend replica solo lo necesario para habilitar o deshabilitar botones (`src/domain/status.ts`). **La validación definitiva siempre la hace el backend.**

## 1. Conceptos: predicción, alerta e incidente

| Concepto | Qué es | Dónde se ve |
|---|---|---|
| **Predicción** | Resultado del análisis automático: confianza (0-1) y score (0-100). No es un hecho | Medidor de confianza y desglose del score, con la etiqueta "Predicción demostrativa" |
| **Alerta** | Señal que **requiere revisión humana**. Puede terminar confirmada o descartada | Lista de alertas y detalle de alerta |
| **Incidente** | Situación **confirmada por una persona**. Se gestiona hasta resolverse | Registro de incidentes y detalle del incidente |

## 2. Máquina de estados de la alerta

| Estado | Código | Tipo | Descripción |
|---|---|---|---|
| Nueva | `nueva` | Inicial | Generada por el simulador, por un escenario o por un reporte manual |
| En revisión | `en_revision` | Intermedio | Un operador la abrió |
| Confirmada | `confirmada` | **Final** | Se confirmó y generó un incidente |
| Descartada | `descartada` | **Final** | Falso positivo con motivo |

### Transiciones permitidas

| Acción (`action`) | Desde | Hacia | Requisitos | Confirmación en la UI |
|---|---|---|---|---|
| `review` | `nueva` | `en_revision` | Actor. Se dispara automáticamente al abrir el detalle | No |
| `confirm` | `nueva`, `en_revision` | `confirmada` | Actor; nota opcional (≤ 500 caracteres) | **Sí** |
| `dismiss` | `nueva`, `en_revision` | `descartada` | Actor y motivo obligatorio (catálogo, o texto libre de ≥ 10 caracteres si es "Otro") | **Sí** |
| `comment` | Cualquier estado | (sin cambio) | Actor; texto de 3 a 500 caracteres | No |

- Si se ejecuta `confirm` o `dismiss` sobre una alerta `nueva`, el servicio registra primero un `review` implícito, para que la traza siempre muestre quién la revisó.
- `confirm` crea el incidente en la **misma transacción**.
- Cualquier otra combinación devuelve **409 `TRANSICION_INVALIDA`** con el estado actual y el último actor.

## 3. Máquina de estados del incidente

| Estado | Código | Tipo | Descripción |
|---|---|---|---|
| Abierto | `abierto` | Inicial | Recién creado a partir de una alerta confirmada |
| En atención | `en_atencion` | Intermedio | Un equipo asignado está respondiendo |
| Escalado | `escalado` | Intermedio | Transferido a un equipo especializado |
| Resuelto | `resuelto` | **Final** | Cerrado con una nota |

### Transiciones permitidas

| Acción | Desde | Hacia | Requisitos | Confirmación en la UI |
|---|---|---|---|---|
| `assign` | `abierto`, `en_atencion`, `escalado` | (sin cambio) | `teamId` válido | No |
| `start` | `abierto`, `escalado` | `en_atencion` | Equipo asignado (si no lo hay: 422 `EQUIPO_REQUERIDO`) | No |
| `escalate` | `abierto`, `en_atencion` | `escalado` | `teamId` de un equipo **especializado** y motivo de ≥ 10 caracteres | **Sí** |
| `resolve` | `en_atencion`, `escalado` | `resuelto` | Nota de cierre de ≥ 10 caracteres | **Sí** |
| `comment` | Cualquier estado | (sin cambio) | Texto de 3 a 500 caracteres | No |

- Al escalar, `escalated_to_id` toma el equipo especializado y `team_id` pasa a ser ese mismo equipo.
- Al resolver se calcula `resolution_seconds` (desde la detección de la alerta). El `closed_at` de la alerta se fija al confirmarla o descartarla (la alerta se cierra con la decisión humana; el incidente tiene su propio `resolved_at`).

## 4. Catálogos de dominio

### 4.1 Severidad

| Código | Etiqueta | Peso `w_sev` | Color | Icono (lucide) | Orden |
|---|---|---|---|---|---|
| `critica` | Crítica | 1,00 | Rojo `#DC2626` | `octagon-alert` | 4 |
| `alta` | Alta | 0,75 | Naranja `#EA580C` | `triangle-alert` | 3 |
| `media` | Media | 0,50 | Ámbar `#D97706` | `circle-alert` | 2 |
| `baja` | Baja | 0,25 | Azul-gris `#475569` | `info` | 1 |

La severidad siempre se muestra como **icono + texto + color**, nunca solo con color.

### 4.2 Tipos de alerta

| Código | Nombre | Severidad por defecto | Umbral de confianza | Peso en el simulador |
|---|---|---|---|---|
| `equipaje_abandonado` | Equipaje abandonado | crítica | 0,80 | 1 |
| `objeto_inusual` | Objeto inusual | alta | 0,75 | 2 |
| `acceso_restringido` | Acceso a zona restringida | alta | 0,70 | 2 |
| `comportamiento_anomalo` | Comportamiento anómalo | media | 0,65 | 3 |
| `concentracion_personas` | Concentración inusual de personas | media | 0,60 | 3 |
| `permanencia_inusual` | Permanencia inusual | baja | 0,60 | 4 |
| `reporte_operador` | Incidente reportado por un operador | (la elige quien reporta) | N/A | 0 (solo manual) |

El simulador puede subir la severidad un nivel si la zona es restringida (`restricted = true`).

### 4.3 Motivos de descarte

`pertenencia_personal`, `movimiento_normal`, `falla_camara`, `personal_autorizado`, `otro` (requiere texto libre).

## 5. Score de prioridad (explicable)

```
score = round(100 × w_sev(severidad) × confianza × f_zona(criticidad))
f_zona: criticidad 1 → 0,60 · 2 → 0,80 · 3 → 1,00
confianza: reportes manuales → 1,00 (se muestra "N/A: reporte humano")
```

Ejemplo: Equipaje abandonado (crítica, 1,00) × 0,94 × Sala de equipajes (criticidad 3 → 1,00) = **94**.

`score_breakdown_json` guarda cada factor para mostrarlo en el detalle, por ejemplo: "Severidad crítica ×1,00 · Confianza 0,94 · Zona criticidad alta ×1,00 = 94". Las listas de alertas se ordenan por defecto por `score` descendente y, en caso de empate, por `detected_at` descendente.

**Umbral:** si `confianza < confidence_threshold(tipo)`, el evento **no** genera alerta; solo suma al contador "eventos bajo umbral" de Análisis.

## 6. Métricas

| Métrica | Fórmula |
|---|---|
| Tiempo de respuesta | `first_action_at − detected_at` (la primera acción humana: `review`, `confirm` o `dismiss`) |
| Tiempo de resolución | `resolved_at (incidente) − detected_at (alerta)` |
| Alertas activas | Alertas en `nueva` + `en_revision` |
| Incidentes en curso | Incidentes en `abierto` + `en_atencion` + `escalado` |
| Tasa de confirmación | `confirmadas / (confirmadas + descartadas)` en el rango |
| Variación frente a ayer | Valor de hoy (00:00 → ahora) comparado con el de ayer (00:00 → la misma hora) |

## 7. Detección de anomalías (por reglas, demostrativa)

- Para cada **zona** y cada **tipo**, se compara el conteo de alertas de los últimos 60 minutos con la **media horaria de los últimos 7 días**.
- Hay anomalía si `conteo ≥ 3` **y** `conteo ≥ 1,5 × media`. La variación se calcula como `(conteo / media − 1) × 100`, por ejemplo "+65 %".
- Se recalcula en cada consulta a `/api/analytics/anomalies` y al final del ciclo de cada evento simulado. No se persiste.
- En la interfaz se muestra siempre con la etiqueta **"Detección basada en reglas · demostrativa"**.

## 8. Reglas transversales

1. Toda escritura requiere un `actorId` válido (cabecera `X-Actor-Id`); las del simulador usan `actor = null` ("Sistema").
2. Cada cambio inserta un `timeline_events` **en la misma transacción**.
3. La timeline es de solo inserción.
4. Las horas se guardan en **UTC** y se muestran en **America/Bogota**.
5. Los IDs son legibles y secuenciales: `ALT-2001…` e `INC-0401…`, generados por el repositorio.
