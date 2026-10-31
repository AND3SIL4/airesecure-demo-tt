# Specification Quality Checklist: Tiempo real, simulador y escenarios

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-30
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

- Los nombres de eventos (`alert.created`, etc.) forman parte del contrato aprobado en el doc 08 §3.7 y se citan como vocabulario del dominio.
- Decisión de alcance: la UI de escenarios y simulador se deja para 008; aquí solo servicio + comando operativo.
- Validación en 1 iteración.

## Verificación manual (T030) · 2026-10-30

- API: stream con `retry: 3000` y heartbeat; `alert.updated`/`incident.created` tras acciones (solo tras commit; 409 no publica); `alert.created` del simulador (`origin: simulador`, confianza ≥ umbral, severidad elevada en zona restringida) y de escenarios; `belowThreshold` incrementa; escenarios: 4 listados (E-2 crítica), 403 para operador, 404 "El escenario no existe.", timeline `created` + `scenario_triggered`; health `running=false` cuando `simulator.enabled=false`; cierre limpio con stream abierto.
- UI (Edge headless vía CDP, op-01 en /alertas + disparo E-1): toast crítico persistente con "Ver alerta", fila nueva en la lista, badge de pendientes 17, campana con 1 no leída y popover, indicador "En vivo".
- Linters: ruff, eslint, tsc, build sin errores.
- Revisión `layer-guardian`: apto; corregidos `running` de health y banner de conexión accesible (región `role="status"` siempre montada); documentado tope de 5 avisos críticos.
- Deuda para 008: al disparar escenarios desde la UI de Configuración, el supervisor verá el aviso de su propia acción (evento con actorId null) → añadir `triggeredBy` al payload o filtrar en `useLiveEvents`.
- Pendiente de verificar por una persona: indicador "Reconectando…" al detener el backend; píldora con foco en la tabla; Ctrl+C con `start-demo.ps1` (`--reload`).
