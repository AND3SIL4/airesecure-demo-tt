# AeroSecure AI · Documentación de la demo MVP

> **AeroSecure AI**: seguridad aeroportuaria inteligente. *De los datos a las decisiones, para un aeropuerto más seguro.*
> La IA prioriza; la decisión es humana.

| # | Documento | Contenido |
|---|---|---|
| 01 | [Visión y alcance](docs-generales/01-vision-y-alcance.md) | Problema, objetivo, alcance, decisiones D1-D10, IA responsable |
| 02 | [Actores, casos de uso e historias](docs-generales/02-actores-casos-de-uso-e-historias.md) | 4 actores, UC-01 a UC-21, HU-01 a HU-29, user journey |
| 03 | [Requisitos](docs-generales/03-requisitos.md) | Funcionales (RF-A a RF-H) y no funcionales (RNF-01 a RNF-15) |
| 04 | [Flujos de negocio](docs-generales/04-flujos-de-negocio.md) | Alerta crítica, falso positivo, tiempo real, reporte manual, control de la demo |
| 05 | [Estados y reglas de dominio](docs-generales/05-estados-y-reglas-de-dominio.md) | Máquinas de estado, catálogos, score, métricas, anomalías |
| 06 | [Arquitectura](arquitectura-y-diseño/06-arquitectura.md) | Tecnologías, capas, estructura, ejecución local, decisiones técnicas |
| 07 | [Modelo de datos](arquitectura-y-diseño/07-modelo-de-datos.md) | Tablas, índices, catálogos, integridad |
| 08 | [Especificación de la API](arquitectura-y-diseño/08-especificacion-api.md) | Convenciones, DTOs, endpoints, eventos SSE |
| 09 | [UI/UX](arquitectura-y-diseño/09-ui-ux.md) | Navegación, pantallas, estados, sistema visual, accesibilidad |
| 10 | [Datos simulados y simulador](arquitectura-y-diseño/10-datos-simulados-y-simulador.md) | Semilla relativa a "ahora", alertas activas, escenarios, simulador |
| 11 | [Guion de la demo y aceptación](arquitectura-y-diseño/11-guion-demo-y-aceptacion.md) | Guion de 7 min, checklist, solución de problemas |
| 12 | [Spec Kit y Claude Code](arquitectura-y-diseño/12-spec-kit-y-claude-code.md) | Constitución, features, agentes, skills y comandos |

## Diagramas

Los siguientes diagramas muestran de forma visual cómo funciona AeroSecure AI en su versión de demostración. Recorren el ciclo completo de la solución, desde la llegada de un evento hasta la decisión del operador, y se apoyan en una arquitectura por capas. En todos se mantiene el principio rector: la inteligencia artificial ayuda a priorizar, pero la decisión final siempre la toma una persona.

| Tipo | Diagrama |
|---|---|
| Flujo | [Flujo conceptual de la solución](diagramas/01-flujo-conceptual/flujo-conceptual.html) |
| Casos de uso | [Diagrama de casos de uso](diagramas/02-casos-de-uso/casos-de-uso.html) |
| User journey | [User journey del operador](diagramas/02-user-journey/user-journey.html) |
| Flujo | [Atender una alerta crítica](diagramas/04-flujo-alerta-critica/flujo-alerta-critica.html) |
| Flujo | [Descartar un falso positivo](diagramas/04-flujo-falso-positivo/flujo-falso-positivo.html) |
| Estados | [Ciclo de vida de la alerta](diagramas/05-estados-alerta/estados-alerta.html) |
| Estados | [Ciclo de vida del incidente](diagramas/05-estados-incidente/estados-incidente.html) |
| Arquitectura | [Arquitectura por capas](diagramas/06-arquitectura-capas/arquitectura-capas.html) |
| Estructura | [Estructura del repositorio](diagramas/06-estructura-repositorio/estructura-repositorio.html) |
| Datos | [Modelo de datos (ERD)](diagramas/07-modelo-datos/modelo-datos.html) |
| Secuencia | [Confirmar una alerta](diagramas/08-secuencia-confirmar-alerta/secuencia-confirmar-alerta.html) |
| Secuencia | [Alerta en tiempo real (SSE)](diagramas/08-secuencia-tiempo-real/secuencia-tiempo-real.html) |
| Secuencia | [Reiniciar la demo](diagramas/08-secuencia-reinicio-demo/secuencia-reinicio-demo.html) |

Cada diagrama tiene su fuente editable (`candidate.json`) en su carpeta. Para regenerarlo se usa Archify con Bun.

## Material de origen

- `contexto-inicial/airsecure-context.md`: contexto inicial (usa el nombre de trabajo "AirSecure AI").
- `contexto-inicial/flow-proposal-airsecure.png`: infografía del funcionamiento conceptual.
- `contexto-inicial/mockup-airsecure-webapp.png`: mockup de referencia visual.
- `contexto-inicial/plan-demo.md`: plan inicial; es un documento **histórico**, sustituido por los docs 01-12.
