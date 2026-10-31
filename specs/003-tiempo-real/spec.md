# Feature Specification: Tiempo real, simulador y escenarios

**Feature Branch**: `003-tiempo-real`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Feature 003-tiempo-real de AeroSecure AI: bus de eventos, canal de eventos en vivo, simulador con umbrales, escenarios predefinidos (endpoint), suscripción del frontend con invalidación de datos, avisos, contador de pendientes, campana de notificaciones e indicador En vivo. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/04-flujos-de-negocio.md` (F3 y escenarios de F5), `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§4.2 umbrales y elevación por zona restringida, §5 score), `docs/arquitectura-y-diseño/06-arquitectura.md` (§2 puertos, bus en memoria), `08-especificacion-api.md` (§3.6 escenarios, §3.7 tiempo real), `09-ui-ux.md` (§2 Topbar y Sidebar, §3.3 llegada en vivo, §4 estado "Desconectado"), `10-datos-simulados-y-simulador.md` (§7 simulador y §8 escenarios). Historias HU-05 y HU-27 (doc 02); RF-C2, RF-A4 (contador) y RF-G2 (doc 03); RNF-03 (≤ 2 s).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recibir las alertas nuevas sin recargar (Priority: P1)

Mientras el operador trabaja en cualquier vista, el sistema genera de forma periódica alertas simuladas. Cada alerta nueva aparece en ≤ 2 segundos, sin recargar la página: un aviso (persistente y con "Ver alerta" si es crítica), la lista de Alertas actualizada con la fila resaltada, el contador de pendientes del menú y la campana de notificaciones (HU-05, RF-C2).

**Why this priority**: es lo que hace que la demo se sienta "en vivo"; sin esto, la priorización en tiempo real no se percibe.

**Independent Test**: con dos pestañas abiertas en vistas distintas, esperar a una alerta del simulador (o dispararla con un escenario) y comprobar en ambas el aviso, el contador, la lista y la campana.

**Acceptance Scenarios**:

1. **Given** el operador en cualquier vista, **When** el simulador genera una alerta, **Then** en ≤ 2 s aparece un aviso con el tipo, la zona y la severidad, y aumenta el contador de alertas pendientes del menú lateral.
2. **Given** una alerta crítica nueva, **When** llega, **Then** el aviso permanece hasta que el usuario lo cierra, incluye la acción "Ver alerta" que lleva al detalle sin recargar y se anuncia de forma prioritaria a los lectores de pantalla.
3. **Given** el operador en la lista de Alertas, **When** llega una alerta que cumple los filtros activos, **Then** la lista se actualiza y la nueva fila se resalta brevemente. Si el foco del teclado está dentro de la tabla, en lugar de reordenarla aparece la píldora "N alertas nuevas · Mostrar".
4. **Given** el detalle de una alerta abierto en dos pestañas, **When** en una se confirma, **Then** en la otra el estado y las acciones disponibles se actualizan solos en ≤ 2 s.
5. **Given** la campana de notificaciones, **When** el usuario la abre, **Then** ve las últimas 10 notificaciones de la sesión con el tipo, la zona, la severidad y la hora relativa, y puede abrir cada alerta.

---

### User Story 2 - Simulador de eventos con umbrales (Priority: P1)

El sistema genera eventos simulados a intervalos variables (por defecto alrededor de 60 s, entre 0,75× y 1,5× el intervalo configurado). Cada evento elige el tipo según su peso, una zona compatible, una fuente de esa zona y una confianza aleatoria. Solo los eventos con confianza igual o superior al umbral del tipo se convierten en alerta; los demás se cuentan como "bajo umbral".

**Why this priority**: es la fuente de la actividad en vivo y aplica la regla de priorización del producto.

**Independent Test**: con un intervalo corto (configurado por la persona responsable de la demo), observar durante unos minutos que llegan alertas con tipos y zonas coherentes, que ninguna tiene confianza bajo el umbral de su tipo y que aumenta el contador "bajo umbral".

**Acceptance Scenarios**:

1. **Given** el simulador activo, **When** transcurre su intervalo, **Then** se genera un evento cuyo tipo respeta los pesos (más eventos de baja severidad que críticos a lo largo del tiempo).
2. **Given** un evento de acceso restringido, **When** se elige la zona, **Then** solo puede ser la Puerta de servicio o la Plataforma; los de equipaje abandonado solo en Sala de equipajes, Hall, Check-in o Sala de embarque A.
3. **Given** un evento en una zona restringida, **When** se calcula la severidad, **Then** sube un nivel respecto a la severidad por defecto del tipo (máximo crítica).
4. **Given** un evento con confianza inferior al umbral de su tipo, **When** se evalúa, **Then** no se crea alerta y el contador "bajo umbral" aumenta en 1.
5. **Given** el simulador desactivado en la configuración, **When** pasa el tiempo, **Then** no se generan eventos y el estado de salud indica que no está en ejecución.
6. **Given** el servidor se detiene, **When** se apaga, **Then** el simulador termina limpiamente, sin errores.

---

### User Story 3 - Disparar escenarios predefinidos para la presentación (Priority: P2)

Quien presenta la demo (perfil supervisor) puede consultar los 4 escenarios predefinidos (E-1 a E-4) y dispararlos para que la alerta correspondiente llegue en el momento exacto del guion, sin depender del azar del simulador (HU-27, RF-G2). La interfaz de Configuración se construye en la feature 008; en esta feature el disparo está disponible para la persona responsable de la demo mediante el servicio y el comando operativo del proyecto.

**Why this priority**: es imprescindible para el guion de la demo, pero su pantalla llega más adelante.

**Independent Test**: como supervisor, disparar E-1 y comprobar que en ≤ 2 s llega a la interfaz una alerta crítica de equipaje abandonado en la Sala de equipajes con confianza 94 %; como operador, intentar dispararlo y ver que se rechaza.

**Acceptance Scenarios**:

1. **Given** el supervisor, **When** consulta los escenarios, **Then** recibe los 4 del doc 10 §8 con su nombre, tipo, severidad, zona y confianza.
2. **Given** el supervisor, **When** dispara E-2, **Then** se crea una alerta de acceso restringido crítica (elevada por zona restringida) en la Plataforma con confianza 0,88, aunque el umbral no lo exigiera, y se registra en la historia que fue originada por un escenario.
3. **Given** un operador, **When** intenta disparar un escenario, **Then** se rechaza con el mensaje "Esta acción es solo para supervisores.".
4. **Given** un escenario inexistente, **When** se intenta disparar, **Then** se rechaza con "El escenario no existe.".

---

### User Story 4 - Saber si la conexión en vivo está activa (Priority: P3)

El usuario ve en la barra superior el indicador "En vivo" (verde) mientras la conexión con el sistema está activa, y "Reconectando…" (ámbar) más un aviso visible si se pierde. Al reconectar, los datos se refrescan solos.

**Why this priority**: da confianza en lo que se ve en pantalla, pero no bloquea el flujo principal.

**Independent Test**: detener el servicio de datos con la interfaz abierta y comprobar el indicador ámbar y el aviso; reanudarlo y comprobar que vuelve a verde y los datos se refrescan.

**Acceptance Scenarios**:

1. **Given** la conexión activa, **When** se observa la barra superior, **Then** el indicador muestra un punto verde con el texto "En vivo".
2. **Given** la conexión perdida, **When** pasan más de 3 segundos sin reconectar, **Then** el indicador cambia a "Reconectando…" (ámbar) y aparece el aviso "Conexión en vivo perdida. Reintentando…".
3. **Given** la conexión recuperada, **When** se restablece, **Then** el indicador vuelve a "En vivo", el aviso desaparece y las vistas visibles refrescan sus datos.

### Edge Cases

- Varios eventos en pocos segundos: se agrupan las actualizaciones y los avisos no críticos no tapan la pantalla (máximo 3 visibles a la vez).
- Una pestaña en segundo plano durante mucho tiempo: al volver, los datos son consistentes (refresco al reconectar o recuperar la visibilidad).
- Un cliente se desconecta sin cerrar la conexión: el sistema libera sus recursos sin afectar al resto.
- El mismo usuario en dos pestañas: ambas reciben los eventos, sin duplicar acciones.
- El intervalo configurado cambia mientras el simulador espera: la siguiente ejecución usa el nuevo valor sin reiniciar (el cambio desde la UI llega en la feature 008).
- Una acción propia (p. ej., confirmar) también genera el evento: la interfaz no muestra un aviso duplicado para la acción que el propio usuario acaba de hacer.

## Requirements *(mandatory)*

### Functional Requirements

**Difusión de eventos**

- **FR-001**: El sistema MUST mantener un canal de eventos en vivo al que se suscribe cada cliente abierto, y enviar a todos los suscriptores los eventos `alert.created`, `alert.updated`, `incident.created` y un `heartbeat` cada 15 s (doc 08 §3.7).
- **FR-002**: Toda creación o cambio de estado de alertas (incluidos los reportes manuales y las acciones de la feature 002) MUST publicarse **después** de guardarse con éxito, con los datos del doc 08 §3.7.
- **FR-003**: El canal MUST liberar los recursos de un cliente al desconectarse, sin afectar al resto.

**Simulador**

- **FR-004**: El sistema MUST ejecutar un simulador en segundo plano mientras el servidor esté activo y `simulator.enabled` sea verdadero, con un intervalo aleatorio entre 0,75× y 1,5× `simulator.interval_seconds`, leyendo la configuración en cada ciclo.
- **FR-005**: Cada evento simulado MUST seguir las reglas del doc 10 §7: tipo por peso (excluye `reporte_operador`), zona compatible, fuente de esa zona, confianza uniforme entre 0,50 y 0,98, y severidad por defecto del tipo +1 nivel en zonas restringidas.
- **FR-006**: El evento MUST convertirse en alerta (origen "simulador", actor Sistema) solo si su confianza es mayor o igual al umbral vigente del tipo; si no, se incrementa el contador persistente "bajo umbral" y no se crea alerta.
- **FR-007**: El estado de salud MUST indicar si el simulador está en ejecución.
- **FR-008**: El simulador MUST detenerse limpiamente al apagar el servidor.

**Escenarios**

- **FR-009**: El sistema MUST exponer los 4 escenarios del doc 10 §8 y permitir dispararlos solo al rol supervisor; el escenario crea su alerta ignorando el umbral, con origen "escenario", y registra en la historia el evento `scenario_triggered` con el supervisor como actor.

**Frontend en vivo**

- **FR-010**: La interfaz MUST suscribirse al canal una sola vez por pestaña con un perfil activo, y traducir cada evento en la actualización de los datos afectados (lista y detalle de alertas, zonas) sin recargar.
- **FR-011**: Ante `alert.created`, la interfaz MUST mostrar un aviso. Si es crítica, el aviso es persistente, tiene la acción "Ver alerta" y se anuncia de forma prioritaria. Los avisos no se duplican para las acciones del propio usuario y como máximo hay 3 no críticos visibles.
- **FR-012**: El menú lateral MUST mostrar el contador de alertas pendientes (nuevas + en revisión) junto a "Alertas", actualizado en vivo y con texto accesible (p. ej., "12 alertas pendientes").
- **FR-013**: La campana de la barra superior MUST habilitarse y mostrar las últimas 10 notificaciones de la sesión, un indicador de no leídas y enlaces a cada alerta.
- **FR-014**: El indicador de conexión MUST reflejar los estados "En vivo" y "Reconectando…", y mostrar el aviso "Conexión en vivo perdida. Reintentando…" cuando la desconexión supere 3 s. Al reconectar, refresca los datos visibles.
- **FR-015**: En la lista de Alertas, las filas nuevas MUST resaltarse brevemente (respetando la reducción de movimiento). Si el foco está dentro de la tabla, se muestra la píldora "N alertas nuevas · Mostrar" en lugar de reordenar.

**Restricciones**

- **FR-016**: La feature MUST respetar las capas de la constitución: el servicio publica a través de un puerto abstracto y la implementación del canal vive en infraestructura. No incluye pruebas automatizadas ni dependencias nuevas.

### Key Entities *(include if feature involves data)*

- **Evento en vivo**: notificación con tipo (`alert.created`, `alert.updated`, `incident.created`, `heartbeat`) y datos; no se persiste.
- **Escenario**: definición fija (id E-1..E-4, nombre, tipo, severidad base, zona, fuente, confianza) del doc 10 §8.
- **Contador bajo umbral**: número acumulado de eventos simulados descartados por el umbral (configuración persistente).
- **Notificación de sesión**: aviso recibido por el usuario en su pestaña (en memoria; máx. 10).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 95 % de las alertas nuevas son visibles en todas las pestañas abiertas en ≤ 2 segundos desde su creación.
- **SC-002**: Un escenario disparado produce su alerta visible en ≤ 2 segundos en el 100 % de los intentos.
- **SC-003**: En una sesión de 10 minutos con el simulador activo, el 0 % de las alertas creadas por el simulador tiene una confianza menor que el umbral de su tipo.
- **SC-004**: Tras una desconexión de hasta 1 minuto, la interfaz se recupera sola y muestra datos consistentes, sin recargar manualmente.
- **SC-005**: El contador de pendientes del menú coincide con el número de alertas activas en el 100 % de las comprobaciones.
- **SC-006**: Ningún aviso aparece duplicado por una acción del propio usuario.

## Assumptions

- Las features 001 y 002 están completas; el servicio de alertas ya tiene puntos marcados para publicar eventos.
- La pantalla de Configuración (encender o apagar el simulador, intervalo, escenarios, umbrales, reinicio) se implementa en la feature 008; aquí se usan los valores sembrados (`simulator.enabled = true`, 60 s) y el disparo de escenarios se verifica con el comando operativo `/demo-scenario`.
- Los eventos `incident.updated`, `settings.updated` y `demo.reset` se publicarán en las features 004 y 008. El frontend ya los reconoce desde ahora (invalidación genérica) para no volver a tocar el suscriptor.
- La identificación del usuario para no duplicar avisos se hace comparando el actor del evento con el perfil activo.
- Las notificaciones de la campana viven en memoria de la pestaña (se pierden al recargar), como indica el doc 09 §2 ("de la sesión").
- El botón "Críticas (N)" sigue deshabilitado hasta la feature 005.
- Validación manual con quickstart.md y los ítems HU-05 y HU-27 del checklist del doc 11 §3.
