# Contrato de la UI: 003-tiempo-real

## Suscripción
- `useLiveEvents` se monta una vez en `Shell`, es decir, solo con un perfil activo.

## Indicador de conexión (Topbar)
- `open`: punto verde y "En vivo".
- `connecting` o `reconnecting` con más de 3 s: punto ámbar y "Reconectando…", más un banner bajo la Topbar: "Conexión en vivo perdida. Reintentando…" (`role="status"`).
- Al reconectar: refetch general y desaparición del banner.

## Avisos
- `alert.created` de otro actor o del Sistema: toast "Nueva alerta: {tipo} · {zona}" con SeverityBadge.
  - Si es crítica: persistente, con la acción "Ver alerta" (Link a `/alertas/{id}`) y anunciado en `aria-live="assertive"`.
  - Si no es crítica: autocierre a los 5 s, con un máximo de 3 visibles.
  - Como máximo 5 avisos críticos persistentes a la vez; los más antiguos se descartan (siguen en la campana).
- `alert.updated` e `incident.created`: no muestran toast (solo invalidan datos), salvo que el usuario esté viendo esa alerta en el detalle y el actor sea otro: toast info "La alerta ALT-xxxx fue {estado} por otro usuario".

## Sidebar
- Badge junto a "Alertas" con el total de pendientes (`aria-label="N alertas pendientes"`); oculto si es 0. En modo colapsado, un mini-badge sobre el icono.

## Campana (Topbar)
- Botón habilitado con un contador de no leídas (máx. "9+").
- Popover con las últimas 10 notificaciones de la sesión (SeverityBadge, tipo, zona y hora relativa), con enlace a cada alerta, y "Marcar como leídas" al abrir.
- Si no hay notificaciones: "Sin notificaciones en esta sesión".
- Accesible: botón `aria-expanded`, foco al primer elemento y cierre con Esc.

## Lista /alertas
- Las alertas nuevas que cumplen los filtros entran resaltadas durante 2 s (`motion-safe`).
- Si el foco está dentro de la tabla, la lista se congela y aparece la píldora "N alertas nuevas · Mostrar" (`aria-live="polite"`); al pulsarla, se descongela y se resaltan.

## Detalle /alertas/:id
- Si llega `alert.updated` de esa alerta, se refresca el detalle (estado, acciones y timeline).
