---
description: Crea una página del frontend con su hook y su cliente de API respetando las capas (infrastructure → application → presentation)
argument-hint: <ruta, p. ej. /incidentes>
---
Solicitud: `$ARGUMENTS`

1. Carga los skills `react-layered-ui` y `aerosecure-domain`.
2. Lee la especificación de la pantalla en `docs/arquitectura-y-diseño/09-ui-ux.md` §3 y los endpoints que consume en el doc 08.
3. Delega en el agente `frontend-engineer` (o en `map3d-engineer` si es `/mapa`): tipos (domain) → cliente (infrastructure/api) → queryKeys y hook (application) → página y componentes (presentation) → ruta en `router.tsx` y entrada en el `Sidebar` (con protección de supervisor si aplica).
4. Exige los 4 estados (carga, vacío, error y éxito) y la accesibilidad del doc 09 §6. Valida con `bun run lint ; bunx tsc --noEmit`. Sin tests.
