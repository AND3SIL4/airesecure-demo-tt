# Feature Specification: Configuración y control de la demo

**Feature Branch**: `008-configuracion-demo`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Feature 008-configuracion-demo de AeroSecure AI: vista Configuración (supervisor) para encender/apagar el simulador y ajustar su intervalo en caliente, disparar escenarios E-1..E-4, ajustar umbrales por tipo y reiniciar la demo con confirmación reforzada; eventos settings.updated y demo.reset; los avisos de escenarios no se duplican para quien los dispara. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/04-flujos-de-negocio.md` (F5), `05-estados-y-reglas-de-dominio.md` (§4.2 umbrales), `docs/arquitectura-y-diseño/08-especificacion-api.md` (§3.6, §3.7), `09-ui-ux.md` (§3.10), `10-datos-simulados-y-simulador.md` (§1, §7, §8), `11-guion-demo-y-aceptacion.md` (§1 preparación). Historias HU-26 a HU-29 (doc 02); RF-G1 a RF-G4 (doc 03). Deuda de 003: aviso propio al disparar escenarios.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar una presentación controlada (Priority: P1)

Antes de presentar, el supervisor reinicia la demo (datos frescos relativos a "ahora") escribiendo `REINICIAR` en un diálogo, y apaga el simulador para que nada inesperado ocurra durante el guion. Todas las pestañas abiertas vuelven al Resumen con los datos nuevos (HU-26, HU-28; doc 11 §1).

**Why this priority**: es el paso 3 del guion de preparación; sin él la demo no es repetible.

**Independent Test**: con dos pestañas abiertas, reiniciar desde una y comprobar que ambas vuelven al Resumen con 12 alertas activas y el histórico regenerado; apagar el simulador y verificar que no llegan alertas nuevas.

**Acceptance Scenarios**:

1. **Given** el supervisor en Configuración, **When** pulsa "Reiniciar demo", **Then** se abre un diálogo que solo habilita la confirmación al escribir exactamente `REINICIAR`.
2. **Given** la confirmación, **When** se reinicia, **Then** los datos se regeneran relativos a la hora actual (12 activas, histórico de 30 días, incidentes de hoy), se informa con un aviso los conteos sembrados, y todas las pestañas abiertas vuelven al Resumen sin recargar manualmente.
3. **Given** el simulador encendido, **When** el supervisor lo apaga, **Then** deja de generar alertas y el estado lo indica ("Simulador detenido"); al encenderlo, se muestra "Próximo evento en ~N s".
4. **Given** un cambio de intervalo (15-300 s), **When** se guarda, **Then** se aplica sin reiniciar el servidor; valores fuera de rango se rechazan con mensaje.
5. **Given** el reinicio con el simulador encendido, **When** termina, **Then** el simulador sigue encendido; si estaba apagado, sigue apagado.

---

### User Story 2 - Disparar escenarios en el momento exacto del guion (Priority: P1)

Desde Configuración, el supervisor ve las 4 tarjetas de escenarios (E-1 a E-4) con su tipo, severidad, zona y confianza, y pulsa "Disparar" para que la alerta llegue en vivo. Quien dispara recibe una confirmación ("Escenario E-1 disparado: ALT-xxxx") pero no el aviso duplicado de "Nueva alerta"; las demás personas sí reciben el aviso (HU-27).

**Why this priority**: es el corazón del guion de la demo (paso 3 del doc 11 §2).

**Independent Test**: disparar E-1 desde Configuración con otra pestaña de operador abierta; la pestaña del supervisor muestra solo la confirmación; la del operador, el aviso crítico.

**Acceptance Scenarios**:

1. **Given** Configuración, **When** se muestran los escenarios, **Then** cada tarjeta indica nombre, tipo, severidad (con icono y texto), zona y confianza.
2. **Given** una tarjeta, **When** se pulsa "Disparar", **Then** el botón se deshabilita mientras procesa y se confirma con el ID de la alerta creada y un enlace "Ver alerta".
3. **Given** otra pestaña de operador, **When** se dispara, **Then** recibe el aviso de nueva alerta en ≤ 2 s; la del supervisor que disparó no recibe ese aviso duplicado.

---

### User Story 3 - Ajustar umbrales de confianza (Priority: P3)

El supervisor ajusta el umbral de confianza de cada tipo de alerta (0,50-0,99) para mostrar cómo cambia la sensibilidad del sistema; el cambio afecta solo a eventos nuevos del simulador (HU-29).

**Independent Test**: subir el umbral de un tipo a 0,99 con intervalo corto y comprobar que ese tipo deja de generar alertas y aumenta el contador "bajo umbral".

**Acceptance Scenarios**:

1. **Given** la tabla de umbrales, **When** se edita un valor válido y se guarda, **Then** se confirma y el catálogo de tipos refleja el nuevo umbral.
2. **Given** un valor fuera de rango, **When** se intenta guardar, **Then** se muestra el error en línea y no se envía.
3. **Given** un cambio de configuración, **When** se guarda, **Then** las demás pestañas en Configuración ven el valor actualizado.

### Edge Cases

- Un operador intenta abrir Configuración o llamar a sus servicios: se rechaza (redirección en la interfaz y "Esta acción es solo para supervisores." en el servicio).
- Reinicio mientras otra persona ejecuta una acción: la acción puede fallar con un mensaje; tras el reinicio todo es consistente.
- Doble clic en "Reiniciar": se ejecuta una sola vez.
- Cambios de configuración simultáneos desde dos pestañas: gana el último y ambas se sincronizan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al supervisor consultar y actualizar (parcialmente) la configuración: simulador encendido/apagado, intervalo (15-300 s) y umbral por tipo (0,50-0,99), aplicando los cambios en caliente y notificando `settings.updated`; cada cambio queda registrado en la historia como `settings_updated` con el supervisor.
- **FR-002**: El sistema MUST exponer el estado del simulador (en ejecución y momento estimado del próximo evento).
- **FR-003**: El sistema MUST permitir al supervisor reiniciar la demo: pausar el simulador, vaciar y regenerar los datos relativos a "ahora", restaurar la configuración del simulador previa al reinicio, reanudar el simulador si estaba encendido, registrar `demo_reset` y notificar `demo.reset` a todas las pestañas.
- **FR-004**: Los avisos de alertas creadas por escenarios MUST identificar a quien los dispara para no mostrarle el aviso duplicado.
- **FR-005**: La vista Configuración MUST seguir el doc 09 §3.10: tarjeta Simulador (interruptor, intervalo, estado), Escenarios (4 tarjetas), Umbrales (tabla + guardar) y Zona de peligro (reinicio con confirmación escrita `REINICIAR`), con estados de carga, error y éxito.
- **FR-006**: Capas de la constitución; sin pruebas automatizadas ni dependencias nuevas.

### Key Entities

- **Configuración**: simulador (encendido, intervalo), umbrales por tipo; persistida en clave-valor.
- **Escenario** (existente, 003).
- **Reinicio**: operación que regenera los datos y devuelve conteos sembrados.

## Success Criteria *(mandatory)*

- **SC-001**: El reinicio completo (datos regenerados y pestañas de vuelta al Resumen) termina en menos de 5 segundos.
- **SC-002**: Un cambio de intervalo o encendido/apagado se refleja en el comportamiento del simulador en menos de 10 segundos sin reiniciar el servidor.
- **SC-003**: Tras disparar un escenario, el 100 % de las demás pestañas recibe el aviso y la del supervisor no lo recibe duplicado.
- **SC-004**: Ningún operador puede modificar la configuración ni reiniciar (0 en la verificación).

## Assumptions

- Features 001-007 completas; escenarios y simulador ya existen (003).
- El reinicio conserva la configuración del simulador vigente (encendido e intervalo) y restablece los umbrales a sus valores por defecto junto con los datos (se documenta en doc 10 §1).
- El aviso de "Reportar evento" manual ya filtra por actor (002/003).
- Validación manual con quickstart.md y HU-26 a HU-29 del doc 11 §3.
