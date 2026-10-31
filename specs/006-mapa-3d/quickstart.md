# Quickstart y validación manual: 006-mapa-3d

> Base nueva; simulador desactivado para una verificación estable.

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | Abrir /mapa | Escena 3D con 10 zonas en su posición, colores de riesgo y etiquetas con texto; Servicio y Plataforma con borde o rayado | US1, FR-001/002 |
| 2 | Contar los marcadores | 12 (uno por alerta activa) dentro de sus zonas; los críticos pulsan | FR-003 |
| 3 | Orbitar, hacer zoom y usar los presets | Límites respetados; los presets funcionan | FR-004 |
| 4 | Clic en Sala de embarque A | Resaltado, `?zone=T1-EMBARQUE-A`, panel con sus alertas | US2-1 |
| 5 | Clic en un marcador | Abre /alertas/{id} | US2-3 |
| 6 | Recargar con `?zone=T1-COMERCIAL` | Zona preseleccionada | US2-4 |
| 7 | Navegar la lista de zonas con teclado | Selección sincronizada con la escena | US3-1 |
| 8 | Abrir /mapa en un navegador o modo sin WebGL (`--disable-webgl`) | Plano 2D con el aviso "Vista 2D (WebGL no disponible)" | US3-2 |
| 9 | Ventana de 900 px | El panel pasa a cajón con el botón "Zonas" | US3-3 |
| 10 | Disparar E-1 con el mapa abierto | Marcador nuevo y color actualizado en ≤ 2 s | US4-1 |
| 11 | `bun run build` | Three.js va en un chunk separado del principal; el chunk principal no crece | SC-003 |
| 12 | Linters | Sin errores | — |
