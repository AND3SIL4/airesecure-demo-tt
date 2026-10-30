# Feature Specification: Fundación de la demo (estructura, catálogos, shell y acceso simulado)

**Feature Branch**: `001-fundacion`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Especifica la feature 001-fundacion de AeroSecure AI: monorepo por capas (backend y frontend), arranque con un solo comando, base de datos sembrada con catálogos, endpoints de catálogos y salud, actor simulado y formato de error común, shell de la interfaz (banner de demostración, menú lateral por rol, barra superior), login simulado, protección de rutas de supervisor, tokens de diseño y componentes base. Fuera de alcance: alertas, incidentes, tiempo real, simulador, mapa 3D, análisis y configuración (features 002-008). Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/arquitectura-y-diseño/06-arquitectura.md` (§2-§4), `07-modelo-de-datos.md` (§1, §3), `08-especificacion-api.md` (§1, §3.1, §3.7), `09-ui-ux.md` (§1-§2, §3.1, §4-§7); `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§4); HU-01 y HU-02 (doc 02); RF-A1 a RF-A5, RNF-01, 02, 04, 06-09 y 12-15 (doc 03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Levantar la demo con un solo comando (Priority: P1)

Quien presenta la demo ejecuta un único comando en su equipo y, en menos de un minuto, tiene disponibles la interfaz web y el servicio de datos, con la información de catálogo del aeropuerto ficticio ya cargada y sin pasos manuales adicionales.

**Why this priority**: Sin un arranque fiable y sin datos de catálogo no existe ninguna demo. Es la base de todas las features siguientes (RNF-01, RNF-02, RNF-14).

**Independent Test**: En un equipo con las herramientas instaladas, borrar la base de datos local, ejecutar el comando de arranque y comprobar que la interfaz abre en el navegador y que el endpoint de salud informa que todo está operativo.

**Acceptance Scenarios**:

1. **Given** un equipo con las dependencias instaladas y sin base de datos previa, **When** se ejecuta el comando de arranque, **Then** se crea la base de datos con los catálogos (10 zonas, 22 fuentes, 7 tipos de alerta, 6 equipos, 3 usuarios y la configuración por defecto) y ambos servicios quedan disponibles.
2. **Given** una base de datos ya existente, **When** se vuelve a ejecutar el comando de arranque, **Then** los catálogos no se duplican y los servicios arrancan normalmente.
3. **Given** los servicios en marcha, **When** se consulta la salud del sistema, **Then** la respuesta indica estado correcto y base de datos operativa.

---

### User Story 2 - Elegir un perfil simulado y entrar a la aplicación (Priority: P1)

Un operador o supervisor abre la demo, elige su perfil (Operador 01, Operador 02 o Supervisor A) sin contraseña y entra al shell de la aplicación. Su perfil queda visible y se conserva si recarga la página, para que todas sus acciones futuras queden registradas a su nombre (HU-01).

**Why this priority**: La trazabilidad del actor es un principio no negociable (humano en el bucle). Todas las features posteriores necesitan un actor identificado.

**Independent Test**: Abrir la aplicación sin sesión, comprobar la redirección al selector de perfil, elegir un perfil, recargar y verificar que se mantiene; cambiar de perfil desde el menú.

**Acceptance Scenarios**:

1. **Given** que no hay perfil activo, **When** el usuario intenta abrir cualquier vista, **Then** es redirigido al selector de perfil.
2. **Given** el selector de perfil, **When** el usuario elige "Operador 01", **Then** entra al Resumen y ve su alias y rol en el menú lateral.
3. **Given** un perfil activo, **When** el usuario recarga el navegador, **Then** sigue dentro con el mismo perfil.
4. **Given** un perfil activo, **When** el usuario pulsa "Cambiar perfil", **Then** vuelve al selector y el perfil anterior deja de estar activo.
5. **Given** el selector de perfil, **When** se muestra, **Then** incluye el texto "Acceso simulado para la demo. No requiere contraseña."

---

### User Story 3 - Navegar por el shell con identidad visual y aviso de demostración (Priority: P2)

El usuario ve una interfaz profesional de centro de operaciones: un banner permanente que aclara que las detecciones son simuladas (HU-02), un menú lateral con las secciones que le corresponden según su rol, y una barra superior con el aeropuerto ficticio, la terminal y la hora en vivo. Las secciones aún no construidas muestran un aviso claro de que llegarán en una próxima versión.

**Why this priority**: Establece la experiencia y la transparencia de la demo desde el primer momento, pero depende de US1 y US2.

**Independent Test**: Entrar como operador y como supervisor y comparar el menú, comprobar el banner en todas las vistas, verificar el reloj y que cada sección futura muestra su aviso.

**Acceptance Scenarios**:

1. **Given** cualquier vista de la aplicación, **When** se muestra, **Then** aparece arriba el banner "Modo demostración: detecciones simuladas, requieren validación humana", que no se puede cerrar.
2. **Given** un perfil de operador, **When** ve el menú lateral, **Then** aparecen Resumen, Alertas, Incidentes, Mapa y Análisis, pero no Reportes ni Configuración.
3. **Given** un perfil de supervisor, **When** ve el menú lateral, **Then** aparecen también Reportes y Configuración.
4. **Given** un operador, **When** intenta abrir directamente la dirección de Reportes o Configuración, **Then** es redirigido al Resumen con un aviso informativo.
5. **Given** la barra superior, **When** se muestra, **Then** incluye "Aeropuerto Internacional Demo · Terminal 1" y la fecha y hora actuales de Bogotá (UTC-5), actualizadas cada minuto o menos.
6. **Given** una sección aún no implementada (por ejemplo, Alertas), **When** el usuario la abre, **Then** ve el título de la sección y el mensaje "Disponible en una próxima versión".
7. **Given** una pantalla de tablet (768-1023 px), **When** se muestra el shell, **Then** el menú lateral aparece colapsado solo con iconos y sigue siendo utilizable.

---

### User Story 4 - Catálogos disponibles para las siguientes features (Priority: P2)

Las siguientes features (alertas, incidentes, mapa, análisis) necesitan consultar los catálogos de dominio: usuarios, zonas con su geometría y nivel de riesgo, equipos de respuesta, tipos de alerta con su umbral, recomendación y protocolo, y motivos de descarte.

**Why this priority**: Habilita el desarrollo de las features 002-008 sin rehacer la base.

**Independent Test**: Consultar cada catálogo y comparar su contenido con las tablas del doc 07 §3 y del doc 05 §4.

**Acceptance Scenarios**:

1. **Given** el sistema en marcha, **When** se consulta el catálogo de zonas, **Then** devuelve las 10 zonas de la Terminal 1 con nombre, criticidad, si es restringida, geometría y nivel de riesgo "normal" (aún no hay alertas).
2. **Given** el sistema en marcha, **When** se consultan los equipos, **Then** devuelve los 6 equipos e indica cuáles son especializados (EOD, Policía, Médico).
3. **Given** el sistema en marcha, **When** se consultan los tipos de alerta, **Then** devuelve los 7 tipos con severidad por defecto, umbral, recomendación y pasos del protocolo.
4. **Given** el sistema en marcha, **When** se consultan los motivos de descarte, **Then** devuelve los 5 motivos del doc 05 §4.3.
5. **Given** una petición de escritura sin identificador de actor válido, **When** llega al sistema, **Then** se rechaza con el código `ACTOR_REQUERIDO` en el formato de error común.

---

### User Story 5 - Componentes visuales base y estados de interfaz (Priority: P3)

El equipo de desarrollo dispone de un conjunto de componentes con la identidad visual aprobada (botones, insignias de severidad y estado con icono y texto, tarjetas, tarjetas de KPI, diálogos de confirmación, avisos emergentes, tooltips y los estados de carga, vacío y error), para que todas las vistas futuras sean consistentes y accesibles.

**Why this priority**: Acelera y homogeneiza las features siguientes, pero no aporta valor visible por sí sola más allá del shell.

**Independent Test**: Usar los componentes en el shell y en el selector de perfil (y, de forma temporal, en una vista placeholder) y verificar la navegación por teclado, el contraste y que la severidad nunca depende solo del color.

**Acceptance Scenarios**:

1. **Given** una insignia de severidad, **When** se muestra cualquier nivel (crítica, alta, media, baja), **Then** incluye icono, texto y color, y el rojo se reserva solo para crítica.
2. **Given** un diálogo de confirmación abierto, **When** el usuario navega con el teclado, **Then** el foco queda atrapado dentro, Esc lo cierra y el foco vuelve al botón que lo abrió.
3. **Given** el catálogo de usuarios en carga o con error al abrir el selector de perfil, **When** se muestra, **Then** aparece el estado de carga o el estado de error con un botón "Reintentar".

### Edge Cases

- El backend no está disponible al abrir el selector de perfil: se muestra el estado de error con "Reintentar" y un mensaje comprensible.
- `localStorage` contiene un perfil que ya no existe en el catálogo: se descarta y se redirige al selector.
- Uno de los puertos de la demo (8000 o 5173) ya está ocupado: el arranque informa del puerto en conflicto en lugar de fallar en silencio.
- La base de datos existe pero está incompleta o corrupta: el arranque la recrea con los catálogos (los datos de demo son siempre regenerables).
- Petición con un `X-Actor-Id` de un usuario inexistente: se rechaza con 401 `ACTOR_REQUERIDO`.
- Petición a una ruta de API inexistente: responde 404 `NO_ENCONTRADO` en el formato de error común.
- El usuario tiene activada la reducción de movimiento: las animaciones del shell se desactivan.

## Requirements *(mandatory)*

### Functional Requirements

**Arranque y datos**

- **FR-001**: El sistema MUST levantar el servicio de datos y la interfaz web con un único comando de arranque en Windows (RNF-01).
- **FR-002**: El sistema MUST crear la base de datos local la primera vez y sembrar los catálogos del doc 07 §3: 10 zonas con su geometría, 15 cámaras, 5 sensores y 2 fuentes lógicas, 7 tipos de alerta (doc 05 §4.2), 6 equipos, 3 usuarios y la configuración por defecto (simulador activo con un intervalo de 60 s, y umbrales por tipo).
- **FR-003**: La siembra de catálogos MUST ser idempotente: los arranques sucesivos no duplican registros.
- **FR-004**: El sistema MUST funcionar sin servicios externos ni conexión a internet una vez instaladas las dependencias (RNF-02).

**Servicio de datos**

- **FR-005**: El sistema MUST exponer la salud del servicio indicando el estado general y el de la base de datos.
- **FR-006**: El sistema MUST exponer los catálogos de usuarios, zonas (con su geometría y un nivel de riesgo que en esta feature es siempre "normal"), equipos (con la marca de especializado), tipos de alerta (con severidad por defecto, umbral, recomendación y protocolo) y motivos de descarte, según el doc 08 §3.1.
- **FR-007**: Todas las respuestas MUST usar el formato y las convenciones del doc 08 §1 (propiedades camelCase y fechas ISO 8601 en UTC).
- **FR-008**: Todos los errores MUST devolverse en el formato común `{ error: { code, message, details } }` con los códigos del doc 08 §1 (`ACTOR_REQUERIDO`, `SOLO_SUPERVISOR`, `NO_ENCONTRADO`, `VALIDACION`, `ERROR_INTERNO`).
- **FR-009**: El sistema MUST proveer un mecanismo reutilizable que identifique al actor a partir del identificador enviado en cada petición de escritura y rechace las peticiones sin un actor válido (401), además de un mecanismo para restringir operaciones al rol supervisor (403). En esta feature se aplica a la consulta del perfil actual (`/api/me`, añadida al doc 08 §3.1); la restricción por rol queda lista para las features 007 y 008.
- **FR-010**: El servicio de datos MUST publicar su documentación interactiva de la API (RNF-13).

**Acceso simulado**

- **FR-011**: La interfaz MUST mostrar un selector con los perfiles del catálogo de usuarios (alias y rol), sin contraseña (RF-A1).
- **FR-012**: La interfaz MUST conservar el perfil elegido entre recargas del navegador y permitir cambiarlo desde el menú (RF-A1).
- **FR-013**: La interfaz MUST redirigir al selector cualquier vista solicitada sin perfil activo, y descartar perfiles almacenados que no existan en el catálogo.
- **FR-014**: La interfaz MUST adjuntar el identificador del perfil activo a toda petición al servicio de datos (RF-A2).

**Shell y navegación**

- **FR-015**: La interfaz MUST mostrar en todas las vistas el banner fijo de modo demostración, que no se puede cerrar (RF-A3).
- **FR-016**: El menú lateral MUST mostrar Resumen, Alertas, Incidentes, Mapa y Análisis a todos los perfiles, y Reportes y Configuración solo al supervisor (RF-A4). Los contadores de Alertas e Incidentes quedan reservados para la feature que los alimente.
- **FR-017**: La barra superior MUST mostrar el título de la vista, "Aeropuerto Internacional Demo · Terminal 1" y la fecha y hora de America/Bogota en vivo (RF-A5). Los elementos que dependen de features futuras (botón "Críticas (N)", "Reportar evento", campana e indicador "En vivo") se muestran deshabilitados con el tooltip "Disponible en una próxima versión".
- **FR-018**: Las rutas del doc 09 §1 MUST existir; las vistas no implementadas muestran su título y el mensaje "Disponible en una próxima versión".
- **FR-019**: Las rutas de supervisor MUST redirigir a un operador al Resumen con un aviso informativo.

**Sistema visual y accesibilidad**

- **FR-020**: La interfaz MUST aplicar los tokens del doc 09 §5.1 (paleta, severidades, tipografía Inter con números tabulares e iconografía consistente).
- **FR-021**: La interfaz MUST ofrecer los componentes base: Button, SeverityBadge, StatusBadge, Card, KpiCard, Dialog/ConfirmDialog, Toast, Tooltip, Skeleton, EmptyState y ErrorState, con el comportamiento del doc 09 §4 y §6.
- **FR-022**: La severidad y el estado MUST comunicarse siempre con icono, texto y color; el rojo solo para crítica (RNF-07).
- **FR-023**: Los controles MUST poder usarse con teclado, con foco visible y contraste AA; los diálogos atrapan el foco, se cierran con Esc y devuelven el foco al disparador; se respeta la reducción de movimiento.
- **FR-024**: El shell MUST adaptarse a escritorio (≥ 1280 px) y tablet (768-1023 px), con el menú lateral colapsado en tablet (RNF-08).
- **FR-025**: Toda vista con datos remotos de esta feature (selector de perfil) MUST mostrar los estados de carga, vacío, error con reintento y éxito (RNF-09).

**Restricciones de construcción**

- **FR-026**: El código MUST organizarse por capas según el doc 06 §2-§3 en backend y frontend (RNF-04), con verificación de tipos y linters configurados y sin errores (RNF-12).
- **FR-027**: La feature MUST NOT incluir pruebas automatizadas (constitución, principio VIII).

### Key Entities *(include if feature involves data)*

- **Zona**: área de la Terminal 1 ficticia; nombre, terminal, criticidad (1-3), si es restringida y geometría (posición y tamaño en metros) para los mapas.
- **Fuente**: cámara, sensor o fuente lógica (reporte manual, análisis), asociada a una zona.
- **Tipo de alerta**: catálogo de tipos con severidad por defecto, peso en el simulador, umbral de confianza, recomendación y pasos del protocolo.
- **Equipo**: equipo de respuesta; nombre, especialidad y si es especializado (puede recibir escalamientos).
- **Usuario (perfil simulado)**: alias ficticio y rol (operador o supervisor).
- **Configuración**: pares clave-valor (simulador activo, intervalo, umbrales por tipo).
- **Motivo de descarte**: lista fija del dominio (no persistida).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde un equipo preparado, la demo queda utilizable en el navegador en menos de 60 segundos tras ejecutar un único comando.
- **SC-002**: El 100 % de los registros de catálogo de los docs 05 y 07 está disponible y coincide en cantidad y valores con la documentación.
- **SC-003**: Un usuario nuevo elige su perfil y llega al Resumen en 2 clics o menos y en menos de 10 segundos.
- **SC-004**: El banner de demostración está visible en el 100 % de las vistas, incluido el selector de perfil.
- **SC-005**: Un operador no puede ver ni abrir Reportes ni Configuración (0 accesos en la verificación manual), y un supervisor accede a ambos.
- **SC-006**: Todas las vistas del shell cargan en menos de 1 segundo en el equipo local.
- **SC-007**: Todos los controles del shell y del selector de perfil se pueden usar solo con teclado, y ningún texto queda por debajo del contraste AA.
- **SC-008**: La verificación de tipos y los linters de ambos proyectos terminan sin errores.

## Assumptions

- El equipo tiene instalados Python 3.12+, uv y Bun; Node.js no está disponible y no es necesario.
- Las rutas futuras se crean ya en esta feature con un placeholder para que el shell y la protección por rol se puedan verificar completos.
- El nivel de riesgo de las zonas es "normal" hasta que exista la feature 002 (alertas).
- La configuración por defecto se siembra ahora (simulador activo con un intervalo de 60 s, y los umbrales del doc 05 §4.2), aunque el simulador se implementa en la feature 003 y su gestión en la 008.
- El Resumen en esta feature es un placeholder dentro del shell; su contenido llega en la feature 005.
- La validación de la feature es manual, con los ítems "Generales" y HU-01/02 del checklist del doc 11 §3.
- La identificación del actor se verifica con la consulta del perfil actual; la restricción por rol tiene su primer uso real en las features 007 y 008.
