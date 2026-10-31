# Specification Quality Checklist: Resumen operativo

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Decisiones tomadas sin aclaración: definición de "variación frente a ayer" por KPI (FR-002) y mínimo de referencia 1 alerta/h para anomalías (FR-004), porque con el volumen histórico sembrado la media horaria por zona es casi cero. Se documentan en docs 05 §6-§7 y doc 10 §4.
- Recharts se menciona solo como dependencia aprobada (constitución); el resto es tecnológicamente neutro.

## Verificación manual (T018) · 2026-10-31

- API (base nueva, simulador apagado): KPIs 12 activas / 2 críticas / 3 en curso / 6 resueltas hoy (= totales de las listas); top 6 = primera página de Alertas; trend24h 24 horas; anomalías exactamente 2 (Sala de embarque A y Concentración inusual, 5 en la última hora, referencia 1/h).
- UI (Edge headless vía CDP): Resumen completo (KPIs con variación y texto, prioritarias, mini-mapa con marcadores y leyenda, dona, tendencia, anomalías con etiqueta), botón "Críticas (2)" en rojo.
- Nota: cerca de medianoche la ventana "hoy" es corta → variaciones "abs"/"Sin datos"; de día son porcentuales.
- `layer-guardian`: apto; corregidos el texto "Sin datos de hoy", aria-label en leyenda de la dona, vacío de tendencia por suma 0, microcopy de anomalías, aviso de refetch fallido y referencia de anomalías sin la hora evaluada. MIN_COUNT=5 documentado (doc 05 §7).
- Pendiente: code-splitting por el aviso de chunk > 500 kB (009); verificación visual de día.
