# Specification Quality Checklist: Configuración y control de la demo

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

- Sin marcadores: reglas de docs 04 F5, 08 §3.6, 09 §3.10 y 10 §7-§8; qué conserva el reinicio (simulador) y qué restablece (datos y umbrales) documentado como supuesto.

## Verificación manual (T015) · 2026-10-31

- API: settings 403/200; validaciones 422 (`simulator.intervalSeconds`, `thresholds.<code>`); apagar → `running:false`/`nextRunAt:null` sin alertas nuevas; encender → `nextRunAt` inmediato (reschedule); umbral 0,99 reflejado en `/alert-types` con `settings_updated` en la timeline; reinicio 200 (247/159) en una única transacción con `demo_reset` del actor, simulador conservado, umbrales por defecto, `demo.reset` por SSE; 240 lecturas concurrentes durante el reinicio sin errores; escenarios con `triggeredBy`.
- UI (Edge headless vía CDP): Configuración con Simulador (switch, slider, estado), 4 escenarios con severidad y datos, tabla de umbrales y Zona de peligro.
- Linters, tsc y build sin errores.
- `layer-guardian`: corregidos transacción única del reinicio, sondeo de `nextRunAt`, doble envío del reinicio, toasts propios tras `demo.reset`, foco del switch; docs 06 y 08 actualizados con excepciones de capas y la tabla de settings.
- Pendiente por una persona: disparar escenario desde la UI con dos pestañas (aviso solo en la otra); reinicio desde la UI con varias pestañas.
