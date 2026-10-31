---
description: "Lista de tareas de la feature 006-mapa-3d"
---

# Tasks: Mapa 3D de la terminal

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Phase 1: Setup
- [x] T001 Instalar `three` y `@types/three` con `bun add three` y `bun add -d @types/three` (dependencias aprobadas).

## Phase 2: Foundational
- [x] T002 [P] Crear `frontend/src/presentation/map3d/webgl.ts` (`isWebGLAvailable()`) y `frontend/src/domain/map3d.ts` (color hex por riskLevel o severidad con los tokens del doc 09 §5.1, `layoutMarkers(zone, count)` en cuadrícula dentro del bloque y los presets de cámara).
- [x] T003 Crear `frontend/src/presentation/map3d/stripes.ts` (textura de rayas generada en un canvas) y `frontend/src/presentation/map3d/TerminalScene.ts` (plan R1-R5: losa, zonas, bordes y rayas de las restringidas, etiquetas CSS2D, marcadores con pulso según reduced-motion, OrbitControls con límites, raycasting para hover y clic que distingue el arrastre, presets, render bajo demanda, ResizeObserver y `dispose` completo).

## Phase 3: US1 + US2 (P1)
- [x] T004 [US1] Crear `frontend/src/presentation/map3d/TerminalMap3D.tsx` (wrapper con las props `zones`, `markers`, `selectedZoneId`, `onSelectZone`, `onOpenAlert` y `preset`; crea y destruye la escena; pasa las props con efectos).
- [x] T005 [US1] Crear `frontend/src/presentation/features/map/CameraControls.tsx` (botones accesibles "Vista superior", "Vista isométrica" y "Reiniciar cámara").
- [x] T006 [US2] Crear `frontend/src/presentation/features/map/ZonePanel.tsx` (lista de 10 zonas como botones con `aria-pressed`, SeverityBadge del riesgo (o "Normal"), "N alertas"; la sección de alertas de la zona seleccionada con enlaces y el vacío "Sin alertas activas en esta zona").
- [x] T007 [US2] Crear `frontend/src/presentation/pages/MapPage.tsx`:
  - Datos con `useZones` y `useAlerts` (activas, pageSize 100) y `?zone=` en la URL.
  - Layout de 9/12 escena y 3/12 panel; en < 1024 px, un cajón con el botón "Zonas".
  - Estados de carga y error con reintento.
  - Fallback 2D con `MiniMap2D` y el aviso cuando no hay WebGL.

  Registrarla en `frontend/src/router.tsx` con `React.lazy` y `Suspense` (skeleton).

## Phase 4: US3 + US4
- [x] T008 [US3] Verificar la sincronización entre la lista y la escena con teclado, el cajón en tablet y el fallback (`isWebGLAvailable` falso) con la misma selección.
- [x] T009 [US4] Verificar las actualizaciones en vivo (las queries invalidadas por `useLiveEvents` reflejan las zonas y los marcadores), el render bajo demanda (sin bucle continuo si no hay pulsos) y la liberación al desmontar; comprobar en `bun run build` que Three.js queda en un chunk separado.

## Phase 5: Polish
- [x] T010 Linters y build sin errores.
- [x] T011 Revisión del agente `layer-guardian`, aplicando los hallazgos bloqueantes e importantes.
- [x] T012 **Verificación manual**: quickstart #1-#12 y HU-08 del doc 11 §3; anotar el resultado en `checklists/requirements.md`.
