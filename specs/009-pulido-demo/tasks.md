---
description: "Lista de tareas de la feature 009-pulido-demo"
---

# Tasks: Pulido final de la demo

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Phase 1: Rendimiento (US2)
- [x] T001 [US2] Configurar `manualChunks` en `frontend/vite.config.ts` (`vendor-react`, `vendor-query`, `vendor-charts` con recharts y d3-*, y `vendor-three`) y cargar con `React.lazy` + `Suspense` (skeleton) las rutas de Resumen, Análisis, Reportes y Configuración (con el patrón de `MapRoute`). Registrar en `specs/009-pulido-demo/checklists/requirements.md` los tamaños antes y después; ningún fragmento inicial debe pasar de 500 kB.

## Phase 2: Auditoría de la UI (US2, US3)
- [x] T002 [US2] Auditar y corregir los estados de carga, vacío, error y éxito de todas las vistas (doc 09 §4) y el microcopy (§8), incluidos los toasts y los diálogos.
- [x] T003 [US3] Auditar y corregir la accesibilidad (§6): orden de Tab, foco visible, "Saltar al contenido", diálogos con foco atrapado, `aria-live`, contraste AA de los textos sobre los fondos de la marca y severidad con icono y texto.
- [x] T004 [US3] Auditar y corregir el responsive en 900 px (§7): sidebar colapsado, topbar sin desbordes, tablas con scroll interno y detalle en una columna.

## Phase 3: Recorrido y documentación (US1)
- [x] T005 [US1] Crear el `README.md` raíz (requisitos: Python 3.12 vía uv y Bun; arranque; preparación de la demo; perfiles; guion resumido; solución de problemas; enlaces a `docs/README.md` y a la constitución).
- [x] T006 [US1] Ejecutar el guion del doc 11 §2 y el checklist §3 con el agente `demo-runner` y capturas automatizadas; corregir los fallos y repetir.
- [x] T007 [US1] Actualizar el doc 11 (sección "Limitaciones conocidas": datos cerca de la medianoche, WebGL por software, comprobaciones que debe hacer una persona) y marcar el checklist.

## Phase 4: Cierre
- [x] T008 Linters y build sin errores.
- [x] T009 Revisión final del agente `layer-guardian` sobre todo el repositorio.
- [x] T010 **Verificación manual** final; anotar el resultado en `checklists/requirements.md`.
