# Contrato de la UI: 004-incidentes

Fuente: doc 09 §3.5, §3.6, §4 y §6.

## /incidentes
- Título "Incidentes" y el subtítulo "Casos confirmados por una persona".
- **Filtros**:
  - Búsqueda ("Buscar por INC, ALT o descripción").
  - `DateRangePresets`: Hoy / 7 días / 30 días (por defecto) / Personalizado (dos inputs de fecha).
  - MultiSelect de Estado (con "En curso"), Severidad, Zona y Tipo.
  - Chips de los filtros activos y "Limpiar filtros".
  - Todo sincronizado con la URL.
- **Tabla**:
  - Columnas: ID, Alerta de origen (ID), Tipo, Severidad (SeverityBadge), Zona, Estado (StatusBadge), Equipo, Abierto (relativa, con la absoluta en un tooltip), T. respuesta y T. resolución (o "—").
  - Se ordenan por Abierto, Severidad y T. respuesta (`aria-sort`).
  - Filas navegables con ↑/↓ y Enter.
- **Paginación**: 20 por página.
- **Estados**: skeleton, vacío "Sin incidentes que coincidan" con "Limpiar filtros", y error con "Reintentar".
- Se actualiza en vivo con `incident.created` e `incident.updated`.

## /incidentes/:id
- **Encabezado**: StatusBadge, SeverityBadge (de la alerta), ID, tipo y zona, "Abierto {fecha}" y los tiempos (respuesta y resolución).
- **Columna principal**:
  - Panel "Alerta de origen": ID, tipo, severidad, zona, descripción, confianza y el enlace "Ver alerta".
  - Historia combinada (componente `Timeline`).
- **Columna lateral, "Gestión"**:
  - Equipo actual, con el selector "Asignar equipo" (todos los equipos y el especializado marcado) y "Asignar" (un comentario opcional en un diálogo pequeño).
  - "Atender" (primario). Si no hay equipo, está deshabilitado con el tooltip "Asigna un equipo antes de iniciar la atención".
  - "Escalar": un diálogo con radios solo de equipos especializados, un motivo de 10 o más caracteres y la confirmación final.
  - "Resolver": un ConfirmDialog con la nota de cierre obligatoria (10 o más caracteres).
  - "Comentar".
  - En `resuelto`: el resumen "Resuelto por {actor} · {hora} · {duración}", la nota y solo "Comentar".
  - Tras escalar o resolver, el foco pasa al bloque de estado resultante.
- **Avisos**:
  - "Incidente INC-xxxx asignado a {equipo}."
  - "Atención iniciada."
  - "Incidente escalado a {equipo}."
  - "Incidente INC-xxxx resuelto."
  - Los errores muestran el mensaje del backend.
- **Estados**: skeleton y un 404 con un enlace al registro.

## Sidebar
- Badge de los incidentes en curso junto a "Incidentes" (`sr-only` "N incidentes en curso"), con la misma pauta que el de alertas.
