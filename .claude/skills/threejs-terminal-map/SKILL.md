---
name: threejs-terminal-map
description: Convenciones para la escena Three.js del Mapa 3D de AeroSecure AI (terminal ficticia en metros, zonas extruidas por riesgo, CSS2D labels, marcadores, OrbitControls, raycasting, render bajo demanda, liberación de recursos, fallback 2D). Úsalo al crear o modificar frontend/src/presentation/map3d.
---

# Mapa 3D de la terminal (Three.js)

Referencias: `docs/arquitectura-y-diseño/09-ui-ux.md` §3.7 y §5.1, y `07-modelo-de-datos.md` §3.1.

## Contrato del componente
```ts
<TerminalMap3D
  zones={Zone[]}               // con geomX, geomZ, geomW, geomD, geomH, riskLevel, restricted
  alerts={AlertSummary[]}      // solo las activas
  selectedZoneId={string|null}
  onSelectZone={(id) => void}
  onOpenAlert={(id) => void}
/>
```
La escena **no** consulta la API ni conoce el router. El contenedor (`MapPage`) aporta los datos con los hooks.

## Convenciones de la escena
- **Unidades**: 1 = 1 metro. Origen en el centro de la losa; el eje +Z apunta hacia la plataforma.
- **Cámara**: `PerspectiveCamera(45)`. Presets: isométrica `(60, 70, 60)` mirando a `(0,0,0)` y superior `(0, 120, 0.01)`.
- **Luces**: `HemisphereLight` suave y una `DirectionalLight` sin sombras (rendimiento).
- **Zonas**: `BoxGeometry(w, h, d)` en `(x, h/2, z)`, con `MeshStandardMaterial` coloreado por `riskLevel` (critica `#DC2626`, alta `#EA580C`, media `#D97706`, baja `#475569`, normal `#CBD5E1`) y `opacity` de 0.85. Las restringidas llevan `EdgesGeometry` gruesa y una textura de rayas generada en un canvas.
- **Etiquetas**: `CSS2DRenderer` con un `div` accesible (nombre + "Riesgo: Alto"); también sirven para el foco con teclado.
- **Marcadores**: un pin (cono + esfera) por alerta activa en la zona, distribuidos en una grilla dentro de la zona. Las críticas llevan un pulso de escala (solo si `!prefersReducedMotion`).
- **Interacción**: `OrbitControls` (`minDistance` 40, `maxDistance` 220, `maxPolarAngle` π/2.2); `Raycaster` sobre las zonas y los marcadores; hover → emisivo; clic en zona → `onSelectZone`; clic en marcador → `onOpenAlert`.

## Rendimiento y ciclo de vida
- Render **bajo demanda**: `requestRender()` ante cambios de props, eventos `change` de los controles o hover. El loop continuo solo existe mientras haya pulsos activos.
- `ResizeObserver` sobre el contenedor; `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- En el `unmount`: `dispose()` de geometrías, materiales y texturas, `renderer.dispose()`, eliminar el DOM de CSS2D y quitar los listeners.

## Fallback
Antes de crear el renderer, se detecta WebGL (`canvas.getContext('webgl2') || ...('webgl')`). Si no hay soporte, se renderiza `MiniMap2D` con el aviso "Vista 2D (WebGL no disponible)".

Esqueleto: [scene-skeleton.ts](scene-skeleton.ts).
