---
name: threejs-terminal-map
description: Convenciones para la escena Three.js del Mapa 3D de AeroSecure AI (terminal ficticia en metros, zonas extruidas por riesgo, CSS2D labels, marcadores, OrbitControls, raycasting, render bajo demanda, liberación de recursos, fallback 2D). Úsalo al crear o modificar frontend/src/presentation/map3d.
---

# Mapa 3D de la terminal (Three.js)

Referencias: `docs/arquitectura-y-diseño/09-ui-ux.md` §3.7 y §5.1, y `07-modelo-de-datos.md` §3.1.

## Contrato del componente
```ts
<TerminalMap3D
  zones={readonly Zone[]}                 // zone.geometry {x, z, w, d, h}, riskLevel, restricted, activeAlerts
  markers={readonly MapAlertMarker[]}     // solo alertas activas, ya mapeadas con toMapMarkers() (domain/map3d.ts)
  selectedZoneId={string | null}
  onSelectZone={(zoneId) => void}
  onOpenAlert={(alertId) => void}
  cameraRequest={{ preset: CameraPreset, seq: number } | null}  // seq permite repetir el mismo preset
  onUnavailable={() => void}              // WebGL no se pudo crear o se perdió (webglcontextlost) → MiniMap2D
  ariaLabel={string}                      // resumen textual de la escena (el host tiene role="img")
/>
```
La escena **no** consulta la API ni conoce el router. El contenedor (`MapPage`) aporta los datos con los hooks y convierte las alertas en `markers`.
Internamente, `TerminalMap3D.tsx` es un wrapper fino que crea una sola vez la clase imperativa `TerminalScene.ts` y le pasa las props con efectos (`setZones`, `setMarkers`, `setSelected`, `setPreset`).

Archivos: `presentation/map3d/{TerminalMap3D.tsx, TerminalScene.ts, stripes.ts, webgl.ts}`; constantes puras (colores, presets, límites, `layoutMarkers`) en `domain/map3d.ts`; UI auxiliar en `presentation/features/map/{ZonePanel, CameraControls, MapLegend}.tsx`.

## Convenciones de la escena
- **Unidades**: 1 = 1 metro. Origen en el centro de la losa; el eje +Z apunta hacia la plataforma.
- **Cámara**: `PerspectiveCamera(45)`. Los presets (`CAMERA_POSES`: isométrica `(60, 70, 60)`, superior `(0, 120, 0.01)`, reiniciar = isométrica, todos mirando a `(0,0,0)`) aportan solo **dirección y objetivo**: la distancia se calcula (`fitDistance`) para que las 8 esquinas del volumen de la losa (`SLAB_SIZE` + borde, altura de zonas + pin) quepan con un margen del 10 % según el aspect ratio. Mientras el usuario no mueva la cámara (evento `start`), el preset se re-encuadra al redimensionar y al recibir zonas. `applyPose` desactiva el damping temporalmente (update, pose, update, restaurar) para que el preset quede exacto.
- **Luces**: `HemisphereLight` suave y una `DirectionalLight` sin sombras (rendimiento).
- **Zonas**: `BoxGeometry(w, h, d)` en `(x, h/2, z)`, con `MeshStandardMaterial` coloreado por `riskLevel` (critica `#DC2626`, alta `#EA580C`, media `#D97706`, baja `#475569`, normal `#CBD5E1`) y `opacity` de 0.85. Las restringidas llevan `EdgesGeometry` gruesa y una textura de rayas generada en un canvas.
- **Etiquetas**: `CSS2DRenderer` con un `div` visual (nombre + nivel de riesgo en texto, "· Restringida" si aplica). La capa CSS2D es `aria-hidden="true"` y `pointer-events: none`: **la alternativa accesible (lectores de pantalla y teclado) es el `ZonePanel`**, con la lista de zonas como botones y las alertas de la zona seleccionada. El host de la escena lleva `role="img"` + `ariaLabel`.
- **Marcadores**: un pin (cono + esfera) por alerta activa en la zona, distribuidos en una grilla dentro de la zona (`layoutMarkers`). Las críticas llevan un pulso de escala (solo si `!prefersReducedMotion`, escuchando el `change` de la media query); la leyenda lo indica: "las críticas pulsan, salvo con movimiento reducido".
- **Interacción**: `OrbitControls` (`minDistance` 40, `maxDistance` 220 ampliable si el encuadre lo exige, `maxPolarAngle` π/2.2, damping desactivado con movimiento reducido); paneo acotado: en el evento `change` se hace clamp de `controls.target` al área de la losa (desplazando también la cámara) para que la losa no salga de la vista. `Raycaster` sobre las zonas y los marcadores; hover → emisivo; clic (sin arrastre, tolerancia `CLICK_TOLERANCE_PX`) en zona → `onSelectZone`; en marcador → `onOpenAlert`.

## Rendimiento y ciclo de vida
- Render **bajo demanda**: `requestRender()` ante cambios de props, eventos `change` de los controles o hover. El loop continuo solo existe mientras haya pulsos activos.
- `ResizeObserver` sobre el contenedor; `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- En el `unmount`: `dispose()` de geometrías, materiales y texturas, `renderer.dispose()`, eliminar el DOM de CSS2D y quitar los listeners.

## Fallback
`presentation/map3d/webgl.ts::isWebGLAvailable()` (detección de plataforma, no regla de dominio) prueba `webgl2`/`webgl` antes de montar la escena. El contenedor recurre a `MiniMap2D` (SVG) con un aviso en tres casos: sin soporte, si el constructor del `WebGLRenderer` lanza, o si el canvas emite `webglcontextlost` (la escena llama a `onUnavailable`). El listener de `webglcontextlost` se quita en `dispose()` antes de `forceContextLoss()` para que la liberación voluntaria no dispare el fallback.

Esqueleto: [scene-skeleton.ts](scene-skeleton.ts).
