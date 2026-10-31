# Specification Quality Checklist: Mapa 3D de la terminal

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

- Three.js se menciona como dependencia aprobada en la constitución (stack fijado por el usuario).
- Sin cambios de backend.

## Verificación manual (T012) · 2026-10-31

- UI (Edge headless con WebGL por software SwiftShader, vía CDP): escena con 10 zonas en su posición, colores de riesgo, etiquetas con texto, restringidas rayadas y con borde; 12 marcadores; `?zone=T1-EMBARQUE-A` preselecciona y resalta; panel de zonas con nombre completo, severidad con texto y "Restringida"; encuadre inicial con la losa completa.
- Build: Three.js solo en el chunk diferido `MapPage-*.js`; el chunk principal no lo contiene.
- Linters y tsc sin errores.
- `layer-guardian`: apto; menores corregidos (encuadre automático, paneo acotado, presets exactos con damping, `webglcontextlost` → 2D, leyenda veraz con reduced-motion, `webgl.ts` a presentation/map3d, skill actualizado, sin doble anuncio de riesgo en el panel). Límite de 100 marcadores documentado en la spec.
- Pendiente de verificar por una persona: orbitar/zoom con ratón y fluidez (≥ 30 fps) en GPU real; cajón "Zonas" en tablet; fallback 2D con `--disable-webgl`.
