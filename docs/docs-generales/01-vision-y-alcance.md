# 01 · Visión y alcance — AeroSecure AI (demo MVP)

| Campo | Valor |
|---|---|
| Producto | **AeroSecure AI**: seguridad aeroportuaria inteligente |
| Entregable | Demo MVP navegable que se ejecuta en local |
| Versión del documento | 1.0, borrador para aprobación |
| Fecha | 2026-10-30 |
| Fuentes | `airsecure-context.md`, `flow-proposal-airsecure.png`, `mockup-airsecure-webapp.png` y las decisiones del equipo |

## 1. Problema

En los centros de monitoreo aeroportuario se reciben a la vez señales de cámaras, sensores de acceso y reportes del personal. El operador debe decidir rápido qué atender primero, con información dispersa y sin trazabilidad uniforme de lo que se hizo. Por eso:

- Las situaciones de riesgo se detectan tarde.
- Las alertas no se priorizan con un criterio común.
- Las acciones tomadas y quién las tomó quedan poco registradas.
- Faltan datos históricos para que supervisores y administradores tomen decisiones preventivas.

## 2. Visión

> **"De los datos a las decisiones, para un aeropuerto más seguro."**

AeroSecure AI centraliza eventos de seguridad, los **prioriza con un criterio explicable** y los presenta como alertas accionables. **La IA prioriza; la decisión siempre es humana.** La herramienta apoya al personal de seguridad y no reemplaza sus protocolos ni su criterio.

## 3. Objetivo de la demo

Demostrar de punta a punta, con datos simulados pero realistas, la experiencia de un operador que:

1. Ve el estado general de la seguridad.
2. Identifica de inmediato las alertas activas y las críticas.
3. Revisa la evidencia, la ubicación y el porqué de una alerta.
4. Confirma la alerta (se crea un incidente) o la descarta como falso positivo.
5. Asigna, escala y resuelve el incidente con trazabilidad completa.
6. Consulta el historial, las tendencias y las anomalías.

La demo debe ser un **MVP aceptable**: funcional, coherente y visualmente profesional, **sin gastos innecesarios** (sin servicios en la nube, licencias ni infraestructura).

## 4. Funcionamiento conceptual

📊 Diagrama: [Flujo conceptual de la solución](../diagramas/01-flujo-conceptual/flujo-conceptual.html)

| Etapa | En la solución final | En la demo |
|---|---|---|
| 1. Recolección | Cámaras CCTV, sensores, reportes y registros | **Simulador** del backend que genera eventos, más un formulario de reporte manual |
| 2. Análisis | Modelos de IA y analítica | **Reglas** de patrones y anomalías (por ejemplo, conteo de la última hora frente a la media de 7 días) |
| 3. Priorización | Criterios definidos por seguridad | **Score explicable**: severidad base × confianza × criticidad de la zona |
| 4. Alertas | Notificaciones multicanal | Alertas en la web en **tiempo real (SSE)**, con aviso, contador y mapa |
| 5. Decisión | Personal de seguridad | El operador confirma o descarta; el incidente se asigna, se escala y se resuelve |

## 5. Usuarios de la demo

| Perfil | Rol en la demo |
|---|---|
| **Operador** (principal) | Monitorea, revisa, confirma o descarta, asigna, escala y resuelve |
| **Supervisor** | Gestiona incidentes y consulta el historial, la analítica y los reportes; configura y reinicia la demo |

El acceso es un **login simulado** con selector de perfil, sin contraseñas ni permisos reales. Los perfiles usan alias ficticios ("Operador 01", "Supervisor A").

## 6. Alcance

### 6.1 Incluido

- Resumen (dashboard) con KPIs, alertas recientes priorizadas, mini-mapa 2D, distribución por categoría y tendencia.
- Lista de alertas en tiempo real con búsqueda y filtros.
- Detalle de alerta: evidencia simulada, confianza, desglose del score, recomendación, protocolo y timeline.
- Acciones sobre la alerta (revisar, confirmar, descartar, comentar) y sobre el incidente (asignar, atender, escalar, comentar, resolver).
- Registro de incidentes con filtros, orden, paginación y detalle.
- **Mapa 3D** de la terminal ficticia (Three.js) con zonas coloreadas por riesgo y marcadores.
- Análisis: por zona, por tipo, evolución temporal, tiempos medios, % confirmadas frente a falsos positivos y anomalías.
- Reportes: exportación CSV.
- Configuración: umbrales, simulador y reinicio de la demo.
- Reporte manual de eventos.
- Estados de carga, vacío, error y éxito; banner permanente de "Modo demostración".

### 6.2 Fuera de alcance

- Integración real con CCTV, sensores o sistemas del aeropuerto.
- Modelos de machine learning reales, visión artificial real, reconocimiento facial o biometría.
- Notificaciones reales (SMS, correo, WhatsApp).
- Autenticación real y gestión avanzada de roles y permisos.
- Datos personales reales y aplicación para pasajeros.
- Automatización de decisiones críticas sin validación humana.
- Despliegue en la nube, alta disponibilidad y escalabilidad.
- **Pruebas unitarias, de integración o E2E automatizadas**: basta con que la demo funcione; se valida con el guion manual.

## 7. Decisiones aprobadas

| # | Decisión |
|---|---|
| D1 | Nombre final: **AeroSecure AI** |
| D2 | Backend: **Python + FastAPI + uv + SQLite** |
| D3 | Frontend: **React + Vite + TypeScript + Tailwind + Recharts + Three.js** |
| D4 | Arquitectura **por capas** en backend y frontend (ver doc 06) |
| D5 | Alerta e incidente son entidades separadas; **confirmar una alerta crea un incidente** (ver doc 05) |
| D6 | Perfiles: **Operador y Supervisor** |
| D7 | Aeropuerto **ficticio**: "Aeropuerto Internacional Demo", Terminal 1 |
| D8 | Three.js solo en la vista Mapa (maqueta 3D generada por código); mini-mapa del Resumen en SVG 2D |
| D9 | Documentación en Markdown con diagramas de Archify; después se especifica con **GitHub Spec Kit** |
| D10 | Sin pruebas automatizadas; ejecución solo en local |

## 8. Principios de IA responsable (no negociables)

1. Toda alerta requiere **revisión humana**; ninguna acción irreversible es automática.
2. La interfaz distingue **predicción** (score y confianza), **alerta** (por revisar) e **incidente** (confirmado por una persona).
3. Ninguna alerta se presenta como prueba definitiva de una amenaza.
4. Sin reconocimiento facial, biometría ni datos personales; la evidencia usa imágenes sin rostros identificables.
5. Cada acción registra **quién** la hizo y **cuándo**.
6. Se indica de forma visible que las detecciones son **demostrativas**.

## 9. Criterios de éxito de la demo

- En pocos segundos se entiende el estado de la seguridad.
- Las alertas críticas destacan sin saturar la interfaz.
- En una alerta se entiende qué pasó, dónde, cuándo y por qué se detectó.
- Se completan los dos flujos (alerta crítica hasta su resolución, y falso positivo) sin errores.
- Las acciones cambian el estado visible y quedan en el historial.
- Funciona en escritorio y tablet, y se levanta en local con un solo comando.

## 10. Supuestos y restricciones

- Zona horaria **America/Bogota (UTC-5)**; idioma **español**.
- Los datos de prueba se generan **relativos a la fecha y hora actuales** para que la demo siempre parezca en vivo.
- Equipo de desarrollo: una persona asistida por Claude Code y Spec Kit.
- Requisitos del equipo local: Python 3.12+, uv, Node.js 20 LTS o superior y un navegador moderno.
