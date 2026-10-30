---
name: react-layered-ui
description: Receta para implementar el frontend de AeroSecure AI con arquitectura por capas (presentation → application → domain + infrastructure) usando React, Vite, TypeScript, Tailwind, TanStack Query, React Router, Recharts y Bun. Incluye el sistema visual, los estados de UI, la invalidación por SSE y las reglas de accesibilidad. Úsalo al crear páginas, componentes, hooks o clientes de API.
---

# Frontend por capas (React)

Referencias: `docs/arquitectura-y-diseño/09-ui-ux.md` (pantallas, sistema visual, accesibilidad), `06-arquitectura.md` §2.2 y `08-especificacion-api.md`.

## Estructura
```
frontend/src/
  main.tsx  App.tsx  router.tsx
  domain/          types.ts · severity.ts (etiqueta, color, icono, orden) · status.ts (etiquetas y acciones permitidas) · format.ts
  infrastructure/  http.ts (fetch + X-Actor-Id + ApiError) · sse.ts (EventSource con reconexión) · api/alerts.ts, incidents.ts, …
  application/     queryKeys.ts · hooks/useAlerts.ts, useAlertActions.ts, … · useLiveEvents.ts · stores/actor.ts, toasts.ts
  presentation/    layout/ (Shell, Sidebar, Topbar, DemoBanner) · components/ (base) · pages/ (una por ruta) · map3d/
```

## Receta: nueva página con datos
1. **domain**: los tipos del DTO (copiados del doc 08 §2) y los metadatos de UI que hagan falta.
2. **infrastructure/api/<recurso>.ts**: funciones `getX(params)` y `postXAction(id, body)` que usan `http.ts`. Sin estado.
3. **application/queryKeys.ts**: la clave jerárquica (`['alerts', 'list', filters]`).
4. **application/hooks/useX.ts**: `useQuery` o `useMutation`; en `onSuccess`, invalidar las claves y lanzar un toast; en `onError`, un toast con `error.message` del backend.
5. **presentation/pages/XPage.tsx**: lee los filtros de la URL (`useSearchParams`), usa el hook y renderiza **los 4 estados**: `Skeleton`, `EmptyState`, `ErrorState` (con `refetch`) y los datos.
6. Se registra la ruta en `router.tsx` (protegida por perfil; las de supervisor con `RequireSupervisor`) y en el `Sidebar`.
7. `bun run lint ; bunx tsc --noEmit`.

Plantillas: [templates/api-client.ts](templates/api-client.ts), [templates/useResource.ts](templates/useResource.ts), [templates/page.tsx](templates/page.tsx).

## Tiempo real
`application/useLiveEvents.ts` se monta una vez en el Shell, abre `sse.ts` y traduce cada evento (doc 08 §3.7) a `queryClient.invalidateQueries(...)` y toasts. Con `demo.reset`: `queryClient.clear()` y navegación a `/`. Expone el estado de conexión para el indicador "En vivo".

## Sistema visual (doc 09 §5)
- Tokens de Tailwind: `navy-950/900`, `brand-600`, `surface`, `surface-muted`, `sev-critica|alta|media|baja`, `ok` y `demo`. El rojo **solo** se usa para lo crítico.
- Componentes base: Button, SeverityBadge, StatusBadge, Card, KpiCard, Table, FilterBar, Select, Dialog/ConfirmDialog, Toast, Tooltip, Skeleton, EmptyState, ErrorState, Timeline, ConfidenceMeter, ScoreBreakdown, EvidenceViewer y MiniMap2D.
- Tipografía Inter (`@fontsource/inter`), números tabulares; iconos `lucide-react` de 16 y 20 px.

## Accesibilidad (obligatoria)
Severidad y estado con icono, texto y color; foco visible (`ring-2 ring-brand-600`); filas navegables con ↑/↓ y Enter; diálogos con foco atrapado, Esc y devolución del foco; `aria-live` polite para las nuevas y assertive para las críticas; `motion-safe:` en las animaciones.

## Prohibido
`fetch` o `EventSource` en `presentation`; lógica de negocio en componentes; npm o node (usa bun); tests; librerías de UI pesadas (MUI, Antd…) o dependencias fuera de la constitución.
