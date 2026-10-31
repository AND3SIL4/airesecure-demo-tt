# Implementation Plan: Mapa 3D de la terminal

**Branch**: `006-mapa-3d` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

`MapPage`, con carga diferida (`React.lazy` + `Suspense`, en un chunk aparte), compone `TerminalMap3D`, una escena de Three.js aislada en `presentation/map3d/`, junto con el panel `ZonePanel` (la lista accesible de zonas y las alertas de la zona seleccionada). Usa los datos existentes (`useZones` y `useAlerts` con el filtro de activas). Si no hay WebGL, recurre a `MiniMap2D`. La escena sigue el skill `threejs-terminal-map`.

## Technical Context

**Dependencias**: + `three` y `@types/three` (aprobadas en la constitución; justificación: la maqueta 3D del doc 09 §3.7). **Backend**: sin cambios. **Testing**: ninguno; [quickstart.md](quickstart.md). **Performance**: ≥ 30 fps, render bajo demanda, chunk separado.

## Decisions

- **R1. Aislamiento.**
  - `presentation/map3d/TerminalScene.ts` es una clase imperativa: `setZones`, `setMarkers`, `setSelected`, `setHovered`, `setPreset`, `resize` y `dispose`, más los callbacks `onZoneClick`, `onMarkerClick` y `onHover`.
  - `presentation/map3d/TerminalMap3D.tsx` es un wrapper de React que crea la escena una sola vez, le pasa las props con efectos y la destruye al desmontarse.
  - Ninguno de los dos consulta la API.
- **R2. Geometría y colores.**
  - Losa de 120 × 80 m.
  - Bloques `BoxGeometry(w, h, d)` en `(x, h/2, z)`.
  - Colores por `riskLevel` con los tokens del doc 09 §5.1, más el gris `#CBD5E1` para normal.
  - Las zonas restringidas usan `EdgesGeometry` gruesas y una textura de rayas generada en un canvas.
  - Las etiquetas son `CSS2DObject`: un div con el nombre y "Riesgo: X" (con `aria-hidden`, porque la alternativa accesible es el panel).
- **R3. Marcadores.** Un pin (cono + esfera) por alerta, distribuido en una cuadrícula dentro del bloque y elevado sobre la altura de la zona. Las críticas pulsan en escala solo si `matchMedia('(prefers-reduced-motion: reduce)')` es falso; el bucle continuo solo corre mientras haya pulsos.
- **R4. Interacción.**
  - `OrbitControls` con `minDistance` 40, `maxDistance` 220, `maxPolarAngle` π/2.2 y damping.
  - `Raycaster` en `pointermove` (hover, limitado con requestAnimationFrame) y en `click`, que distingue un clic de un arrastre (desplazamiento < 4 px).
  - Presets: isométrica (60, 70, 60), superior (0, 120, 0.01) y reiniciar.
- **R5. Render bajo demanda y ciclo de vida.**
  - `requestRender()` ante cambios de props, eventos `change` de los controles y hover.
  - `ResizeObserver` sobre el contenedor.
  - `dispose` libera geometrías, materiales y texturas, el renderer, el DOM de CSS2D y los listeners.
- **R6. Fallback.** `presentation/map3d/webgl.ts::isWebGLAvailable()` (detección de plataforma con el DOM, no es regla de dominio). Sin WebGL, `MapPage` renderiza `MiniMap2D` con marcadores y `onZoneClick`, más el aviso.
- **R7. Panel y URL.**
  - `?zone=` mediante `useSearchParams`.
  - `ZonePanel` muestra la lista de zonas (botones con SeverityBadge del riesgo, nombre, "N alertas" y `aria-pressed`) y, si hay una zona seleccionada, sus alertas activas (fila con enlace) o el mensaje "Sin alertas activas en esta zona".
  - En tablet (< 1024 px), el panel es un cajón (Dialog lateral) que se abre con el botón "Zonas".
- **R8. Code-splitting.** `router.tsx` importa `MapPage` con `lazy()`. Three.js solo llega en ese chunk; se verifica en el build.

## Constitution Check

| Principio | Estado |
|---|---|
| II. Capas | ✅ La escena está en `presentation/map3d` y recibe datos por props; los datos llegan por los hooks de application |
| VI. Accesibilidad | ✅ La lista de zonas es la alternativa accesible; el riesgo se indica con texto; reduced-motion; teclado |
| VII. Simplicidad | ✅ Three.js puro, sin modelos externos (dependencia aprobada) |
| VIII. Sin pruebas | ✅ |

## Project Structure

```text
frontend/src/domain/{map3d.ts (colores por riesgo, distribución de marcadores en cuadrícula, presets)}
frontend/src/presentation/map3d/{TerminalScene.ts, TerminalMap3D.tsx, stripes.ts, webgl.ts}
frontend/src/presentation/features/map/{ZonePanel.tsx, CameraControls.tsx, MapLegend.tsx}
frontend/src/presentation/pages/MapPage.tsx  (lazy en router.tsx)
```
