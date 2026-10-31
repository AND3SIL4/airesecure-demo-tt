<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (PATCH: aclaración, sin cambios de principios)
- Modified sections: Restricciones tecnológicas → la tipografía aprobada se cita como `@fontsource-variable/inter`
  (variante variable del mismo paquete Inter, ya en uso desde la feature 001 y justificada en specs/001-fundacion/plan.md).
- Added sections: none · Removed sections: none
- Templates requiring updates: ✅ none
- Approved by: usuario (2026-10-31)
-->

# AeroSecure AI (demo MVP) Constitution

## Core Principles

### I. La documentación manda
`docs/docs-generales/` (01-05) y `docs/arquitectura-y-diseño/` (06-12) son la fuente de verdad del producto.
Toda especificación, plan y tarea MUST citar las secciones de la documentación que implementa. Si una
especificación contradice la documentación, gana la documentación; si la documentación no responde una duda,
se decide con el usuario y se actualiza el documento correspondiente **antes** de implementar.

### II. Arquitectura por capas estricta
- Backend (`backend/app/`): `api → services → repositories → domain`, más `infrastructure` (db, event bus,
  simulador, seed). Frontend (`frontend/src/`): `presentation → application → domain`, con `infrastructure`
  (HTTP, SSE) como adaptador usado por `application`.
- Una capa solo importa capas inferiores; `domain` no importa nada del proyecto.
- Las reglas de negocio (máquinas de estado, score, métricas, anomalías) viven solo en `domain` y `services`.
- Los componentes de `presentation` nunca llaman a `fetch` ni a la API directamente.
Razón: mantener el código extensible hacia fuentes y modelos reales sin reescribir la interfaz.

### III. Humano en el bucle (NO NEGOCIABLE)
- Ninguna alerta se convierte en incidente sin confirmación humana explícita.
- Las acciones irreversibles (confirmar, descartar, escalar, resolver, reiniciar la demo) MUST pedir confirmación en la UI.
- Toda escritura MUST registrar actor y hora en `timeline_events`, en la misma transacción que el cambio.
- Ninguna acción irreversible se ejecuta de forma automática.

### IV. Transparencia de la IA simulada
- Banner permanente de "Modo demostración" en todas las vistas.
- Las predicciones (confianza y score) se etiquetan como demostrativas, el score MUST mostrar su desglose y
  las anomalías se etiquetan como "basadas en reglas".
- Nunca se presenta una alerta como prueba de una amenaza. Lo simulado no se presenta como una integración real.

### V. Privacidad por diseño
Sin datos personales reales, rostros ni biometría. Los usuarios son alias ficticios y la evidencia visual son
ilustraciones SVG con el recuadro de detección sobre objetos, nunca sobre personas.

### VI. Accesibilidad
La severidad y el estado se comunican siempre con icono, texto y color. Contraste WCAG AA, foco visible, uso
con teclado en los controles principales, diálogos con foco atrapado y `prefers-reduced-motion` respetado.
Toda vista con datos remotos implementa los estados de carga, vacío, error y éxito.

### VII. Simplicidad y coste cero
Solo se usa el stack aprobado (ver Restricciones tecnológicas). Sin servicios externos de pago, claves de API
ni infraestructura en la nube. Añadir una dependencia nueva requiere justificarlo en `plan.md` (Complexity
Tracking). YAGNI: no se construye nada fuera del alcance de los docs 01-11.

### VIII. Sin pruebas automatizadas (decisión del proyecto)
No se escriben pruebas unitarias, de integración, de contrato ni E2E, y `/speckit-tasks` MUST NOT generar
tareas de pruebas. La calidad se asegura con TypeScript estricto, type hints en Python, `ruff`, `eslint`,
`tsc --noEmit` y la verificación manual del checklist de `docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md`.
Cada feature termina con una tarea de "Verificación manual".

### IX. Ejecución local con un solo comando
`start-demo.ps1` levanta el backend (`:8000`) y el frontend (`:5173`). La base de datos SQLite se crea y se
siembra sola, con datos relativos a la hora actual. La demo funciona sin internet una vez instaladas las dependencias.

### X. Idioma y nomenclatura
Interfaz, documentación, especificaciones y mensajes de commit en español. El código (identificadores, tablas,
rutas de API) va en inglés. Los valores de enum siguen el doc 05 (`nueva`, `en_revision`, `critica`…). La API
usa JSON en camelCase, la cabecera `X-Actor-Id` y el formato de error `{ error: { code, message, details } }`.

## Restricciones tecnológicas

| Capa | Stack aprobado |
|---|---|
| Backend | Python 3.12+, FastAPI, SQLModel, SQLite, uv; SSE con `StreamingResponse`; ruff |
| Frontend | React 18, Vite, TypeScript (strict), Tailwind CSS, TanStack Query, React Router, Recharts, Three.js, lucide-react, `@fontsource-variable/inter`; Bun como gestor y runtime; ESLint |
| Herramientas | GitHub Spec Kit, Claude Code (agentes, skills y comandos de `.claude/`), Archify (solo para documentación), Git |

Rendimiento objetivo: las vistas cargan en menos de 1 s en local, los eventos SSE llegan en 2 s o menos y el
mapa 3D va a 30 fps o más.

## Flujo de desarrollo

1. Una feature por rama (`NNN-nombre`), en el orden definido en el doc 12 §3.
2. Ciclo: `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze`
   → `/speckit-implement` → revisión de `layer-guardian` → `/check-layers` → `/demo-walkthrough parcial`.
3. Las tareas se ordenan por capas: domain → repositories → services → api, y luego infrastructure del front → application → presentation.
4. Commits con el formato `feat(NNN-nombre): descripción` y otros tipos convencionales (`fix`, `docs`, `chore`).
5. Una feature se da por terminada cuando pasan los linters y los ítems aplicables del checklist del doc 11.

## Governance

Esta constitución prevalece sobre cualquier otra práctica del proyecto. Las enmiendas requieren la aprobación
del usuario, la actualización de este archivo con un Sync Impact Report y el ajuste de la documentación afectada.
Versionado semántico: MAJOR para principios eliminados o redefinidos, MINOR para principios o secciones nuevas,
PATCH para aclaraciones. Cada plan (`/speckit-plan`) MUST incluir un "Constitution Check" contra los principios
I-X, y `layer-guardian` verifica su cumplimiento al cierre de cada feature. La guía operativa del día a día
está en `CLAUDE.md`.

**Version**: 1.0.1 | **Ratified**: 2026-10-30 | **Last Amended**: 2026-10-31
