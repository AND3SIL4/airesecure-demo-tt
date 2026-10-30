# AirSecure AI — Contexto para prototipo web

## 1. Propósito de este documento

Este documento proporciona a Claude Code el contexto funcional y visual necesario para generar un prototipo web navegable de **AirSecure AI**, una solución de seguridad aeroportuaria inteligente.

El prototipo debe demostrar la experiencia principal del producto y no pretende implementar todavía un sistema real de inteligencia artificial, integración con cámaras, reconocimiento facial, conexión con sensores ni infraestructura de producción.

> Nota de contexto: el proyecto aparece en Microsoft Loop como **“Proyecto AeroSecure AI”**. En este documento se utiliza **AirSecure AI** como nombre de trabajo.

## 2. Resumen del proyecto

AirSecure AI es una plataforma para apoyar la seguridad aeroportuaria mediante inteligencia artificial, automatización y análisis de incidentes.

La plataforma recibe información de incidentes y señales provenientes del entorno aeroportuario, identifica patrones de riesgo, detecta situaciones anómalas y genera alertas tempranas para que el personal responsable pueda revisar y escalar cada caso.

La propuesta incluye el uso futuro de visión artificial para identificar objetos inusuales y apoyar la prevención de riesgos en aeropuertos.

### Propuesta de valor

AirSecure AI convierte datos operativos y eventos de seguridad en información accionable:

- Detecta señales de riesgo antes de que se conviertan en incidentes mayores.
- Centraliza alertas, incidentes y evidencia en una sola interfaz.
- Ayuda a los operadores a priorizar qué atender primero.
- Facilita la trazabilidad de las acciones tomadas.
- Apoya decisiones preventivas de supervisores y administradores.

## 3. Objetivo del producto

Diseñar una experiencia web para que un operador de seguridad aeroportuaria pueda:

1. Ver el estado general de la seguridad.
2. Identificar rápidamente las alertas activas y críticas.
3. Revisar los detalles y la evidencia de una alerta.
4. Clasificar o confirmar el incidente.
5. Asignar o escalar el caso a un equipo responsable.
6. Consultar incidentes anteriores y patrones de riesgo.
7. Registrar las acciones tomadas y cerrar el incidente.

## 4. Usuarios objetivo

### Usuario principal: operador del centro de monitoreo

Es la persona que observa las alertas y actúa en primera instancia.

Necesita:

- Saber qué está ocurriendo ahora.
- Distinguir una alerta crítica de una alerta informativa.
- Ver ubicación, hora, tipo de evento y nivel de confianza.
- Revisar evidencia visual o simulada.
- Confirmar, descartar o escalar una alerta.
- Mantener un registro de la respuesta.

### Usuarios secundarios

#### Personal de seguridad aeroportuaria

Recibe alertas, atiende incidentes y ejecuta protocolos de respuesta.

#### Supervisores de seguridad

Revisan la operación completa, redistribuyen recursos y analizan tendencias.

#### Administradores del aeropuerto

Consultan indicadores, reportes y patrones históricos para mejorar protocolos y asignar presupuesto o personal.

#### Equipos de emergencia y respuesta

Reciben casos escalados que requieren intervención especializada.

### Beneficiarios indirectos

- Pasajeros.
- Personal de aerolíneas.
- Empleados del aeropuerto.
- Visitantes y proveedores.

Estos grupos no deben ser el foco de la interfaz del MVP. Se benefician indirectamente de una respuesta más rápida y de la prevención de riesgos.

## 5. Alcance del prototipo MVP

El MVP debe ser una aplicación web tipo dashboard, responsive para escritorio y tablet, con datos simulados pero con una experiencia realista.

### Incluido

- Dashboard de seguridad en tiempo real simulado.
- Lista de alertas activas.
- Indicadores de estado.
- Mapa o plano esquemático del aeropuerto.
- Vista detallada de una alerta.
- Evidencia visual simulada mediante imagen, placeholder o tarjeta de cámara.
- Flujo para confirmar, descartar o escalar una alerta.
- Registro de incidentes.
- Filtros por estado, severidad, zona y tipo.
- Historial básico de incidentes.
- Perfil o menú del operador.
- Estados de carga, vacío, error y éxito.

### Fuera del alcance del MVP

- Integración real con cámaras CCTV.
- Reconocimiento facial o identificación biométrica.
- Detección real mediante modelos de machine learning.
- Integración con sistemas aeroportuarios existentes.
- Notificaciones SMS, correo o WhatsApp reales.
- Gestión avanzada de roles y permisos.
- Datos personales reales.
- Automatización de decisiones críticas sin validación humana.
- Funciones de pasajeros o una aplicación pública.

## 6. Funcionalidades principales

### 6.1 Dashboard

La pantalla inicial debe mostrar:

- Total de alertas activas.
- Alertas críticas.
- Incidentes en investigación.
- Incidentes resueltos durante el día.
- Tiempo promedio de respuesta.
- Estado general de las zonas monitoreadas.
- Lista de alertas recientes.
- Mapa o plano con zonas activas.
- Tendencia de incidentes de las últimas horas o días.

El dashboard debe priorizar la acción, no solo la visualización de métricas.

### 6.2 Alertas

Cada alerta debe incluir como mínimo:

- Identificador.
- Tipo de alerta.
- Nivel de severidad: crítica, alta, media o baja.
- Estado: nueva, en revisión, escalada, confirmada, descartada o resuelta.
- Zona del aeropuerto.
- Fecha y hora.
- Fuente: cámara, sensor, reporte manual o análisis de incidentes.
- Nivel de confianza de la IA.
- Descripción breve.
- Equipo asignado.

Ejemplos de tipos de alerta:

- Objeto inusual.
- Comportamiento anómalo.
- Acceso a zona restringida.
- Permanencia inusual.
- Equipaje abandonado.
- Concentración inusual de personas.
- Incidente reportado por un operador.

### 6.3 Detalle de alerta

Al seleccionar una alerta, mostrar:

- Encabezado con severidad, estado y hora.
- Descripción del evento.
- Ubicación en el plano.
- Evidencia visual simulada.
- Nivel de confianza.
- Línea de tiempo de eventos.
- Recomendación de la IA.
- Historial de acciones.
- Equipo asignado.
- Botones de acción:
  - Confirmar incidente.
  - Marcar como falso positivo.
  - Escalar.
  - Asignar responsable.
  - Añadir comentario.
  - Resolver.

Las acciones destructivas o irreversibles deben pedir confirmación.

### 6.4 Incidentes

La sección de incidentes debe permitir:

- Consultar todos los incidentes.
- Buscar por texto.
- Filtrar por rango de fechas.
- Filtrar por severidad, zona, tipo y estado.
- Ordenar por fecha, severidad o tiempo de respuesta.
- Abrir el detalle de un incidente.

### 6.5 Análisis y tendencias

El prototipo puede incluir una sección sencilla con:

- Incidentes por zona.
- Incidentes por tipo.
- Evolución temporal.
- Tiempo promedio de resolución.
- Porcentaje de alertas confirmadas frente a falsos positivos.

Los gráficos deben ser comprensibles y servir para tomar decisiones. Evitar llenar la pantalla con métricas sin utilidad operativa.

## 7. Flujo principal del usuario

### Flujo: atender una alerta crítica

1. El operador entra al dashboard.
2. Observa una alerta crítica en la lista y en el mapa.
3. Selecciona la alerta.
4. Revisa tipo, zona, hora, evidencia y recomendación de la IA.
5. Confirma que el evento requiere atención.
6. Asigna el caso al equipo correspondiente.
7. Añade una nota o instrucción.
8. Cambia el estado a “En atención” o “Escalada”.
9. El sistema registra la acción en la línea de tiempo.
10. Cuando el caso termina, el operador lo marca como “Resuelto”.

### Flujo: descartar un falso positivo

1. El operador abre una alerta.
2. Revisa la evidencia.
3. Selecciona “Marcar como falso positivo”.
4. Indica un motivo breve.
5. Confirma la acción.
6. El sistema cambia el estado y registra el motivo.

## 8. Arquitectura de información sugerida

Utilizar una navegación lateral o superior con estas secciones:

1. **Resumen**
2. **Alertas**
3. **Incidentes**
4. **Mapa**
5. **Análisis**
6. **Configuración**

La navegación debe mostrar un contador visible de alertas pendientes. El acceso a las alertas críticas debe ser rápido desde cualquier sección.

## 9. Dirección visual

### Personalidad de marca

La interfaz debe transmitir:

- Confianza.
- Control.
- Precisión.
- Rapidez.
- Tecnología responsable.
- Profesionalismo institucional.

Evitar una estética militarista, alarmista o excesivamente futurista. AirSecure AI debe parecer una herramienta seria de operaciones y prevención.

### Estilo recomendado

- Diseño tipo centro de operaciones moderno.
- Fondo claro o azul muy oscuro, con alto contraste.
- Tarjetas limpias y jerarquía visual clara.
- Azul como color principal de confianza.
- Rojo únicamente para eventos críticos.
- Ámbar para advertencias.
- Verde para estados resueltos o normales.
- Tipografía sans-serif legible.
- Iconografía simple y consistente.
- Tablas y listas fáciles de escanear.
- Animaciones sutiles solo para cambios de estado o llegada de alertas.

### Accesibilidad

- No depender únicamente del color para comunicar severidad.
- Usar etiquetas textuales e iconos.
- Mantener contraste suficiente.
- Permitir navegación por teclado en controles principales.
- Mostrar estados claros para cada acción.

## 10. Datos simulados

Crear un conjunto de datos coherente para alimentar el prototipo.

### Ejemplo de alerta

```json
{
  "id": "ALT-2048",
  "type": "Objeto inusual",
  "severity": "critical",
  "status": "new",
  "zone": "Terminal 1 - Sala de equipajes",
  "timestamp": "2026-10-29T15:42:00-05:00",
  "source": "Cámara CAM-T1-034",
  "confidence": 0.94,
  "description": "Objeto abandonado detectado durante un periodo superior al umbral configurado.",
  "assignedTeam": null,
  "recommendation": "Verificar visualmente y activar protocolo de revisión."
}
```

### Otros registros sugeridos

Incluir entre 8 y 15 alertas con diferentes:

- Severidades.
- Estados.
- Zonas.
- Tipos de evento.
- Horarios.
- Niveles de confianza.

No usar nombres, documentos, rostros ni información personal real.

## 11. Requisitos técnicos para Claude Code

Claude Code puede elegir la implementación concreta, pero debe priorizar:

- Componentes reutilizables.
- Datos mock separados de los componentes visuales.
- Tipos o interfaces para alertas, incidentes y usuarios.
- Estado local suficiente para demostrar el flujo.
- Diseño responsive.
- Rutas o vistas claramente separadas.
- Validación de formularios.
- Mensajes de éxito y error visibles.
- Código fácil de extender hacia una API real.

Si el proyecto ya tiene un stack definido, respetarlo. Si se inicia desde cero, usar una solución web moderna y ligera, evitando dependencias innecesarias.

## 12. Criterios de aceptación

El prototipo se considera correcto cuando:

- El usuario puede abrir el dashboard y entender el estado de seguridad en menos de unos segundos.
- Las alertas críticas destacan visualmente, pero sin saturar toda la interfaz.
- El usuario puede abrir una alerta y entender qué pasó, dónde, cuándo y por qué fue detectada.
- El usuario puede confirmar, descartar, escalar y resolver una alerta.
- Las acciones modifican el estado visible de la interfaz.
- El historial registra las acciones principales.
- El usuario puede filtrar alertas e incidentes.
- Existe una vista de mapa o zonas monitoreadas.
- Existen datos de demostración suficientes para probar todos los estados.
- La interfaz funciona en escritorio y tablet.
- No se presentan funciones simuladas como si fueran integraciones reales.
- Se aclara visualmente que la detección de IA es demostrativa.

## 13. Consideraciones de seguridad y responsabilidad

AirSecure AI es una herramienta de apoyo a la decisión, no un sustituto del criterio humano.

El prototipo debe:

- Mostrar que las alertas de IA requieren revisión humana.
- Evitar reconocimiento facial y datos biométricos.
- No mostrar información personal real.
- No recomendar acciones irreversibles de forma automática.
- Registrar quién realizó cada acción.
- Diferenciar claramente entre una predicción, una alerta y un incidente confirmado.
- Evitar presentar una alerta como prueba definitiva de una amenaza.

## 14. Prompt operativo para Claude Code

Construye un prototipo web navegable de **AirSecure AI**, una plataforma de seguridad aeroportuaria inteligente.

El usuario principal es un operador de seguridad aeroportuaria que necesita monitorear alertas, revisar evidencia, priorizar riesgos y escalar incidentes. La aplicación debe sentirse como un centro de operaciones profesional, confiable y claro.

Implementa primero el MVP descrito en este documento:

1. Dashboard con KPIs, alertas recientes, estado de zonas y mapa.
2. Vista de alertas con búsqueda y filtros.
3. Vista de detalle de alerta con evidencia simulada, nivel de confianza, recomendación y timeline.
4. Acciones para confirmar, descartar, escalar, asignar y resolver.
5. Vista de incidentes e historial.
6. Vista de análisis con gráficos sencillos.
7. Datos mock realistas y estados de carga, vacío, error y éxito.

No implementes integraciones reales con cámaras, sensores, modelos de IA, reconocimiento facial, servicios de notificación ni datos personales. Simula esas capacidades con datos locales y deja una estructura preparada para sustituir los mocks por una API en el futuro.

La interfaz debe priorizar la acción operativa, tener diseño responsive, alto contraste y estados de severidad comprensibles sin depender solo del color. Mantén separada la lógica de datos, el estado de la aplicación y los componentes visuales.

Antes de terminar, verifica el flujo completo de atención de una alerta crítica desde el dashboard hasta su resolución.

## 15. Referencia de origen

El contexto se elaboró a partir del espacio de Microsoft Loop **“Proyecto AeroSecure AI”**. Los fragmentos disponibles describen:

- Seguridad aeroportuaria inteligente.
- Uso de IA y automatización.
- Análisis de incidentes.
- Detección de patrones de riesgo.
- Generación de alertas tempranas.
- Uso potencial de visión artificial.
- Identificación de objetos inusuales.
- Prevención de riesgos en aeropuertos.

