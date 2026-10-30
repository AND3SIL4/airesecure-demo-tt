---
name: aerosecure-domain
description: Reglas de dominio de AeroSecure AI (estados de alerta e incidente, transiciones, severidades, tipos, score explicable, métricas, anomalías, catálogos). Cárgalo antes de tocar lógica de negocio, DTOs, badges o acciones en backend o frontend.
---

# Dominio de AeroSecure AI

Resumen operativo. La fuente completa es `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (reglas), `docs/arquitectura-y-diseño/07-modelo-de-datos.md` (tablas y catálogos) y `docs/arquitectura-y-diseño/10-datos-simulados-y-simulador.md` (semilla). Si algo de aquí contradice los docs, **ganan los docs**.

Las tablas condensadas (transiciones, catálogos y fórmulas) están en [reference.md](reference.md).

## Conceptos
- **Predicción**: confianza (0-1) y score (0-100); es demostrativa y no es un hecho.
- **Alerta**: requiere revisión humana (`nueva → en_revision → confirmada | descartada`).
- **Incidente**: existe solo si una persona confirmó la alerta (`abierto → en_atencion ⇄ escalado → resuelto`).

## Reglas que siempre aplican
1. Las transiciones se validan en `backend/app/domain/state_machine.py`; las inválidas → `DomainError("TRANSICION_INVALIDA")` → 409.
2. `confirm` o `dismiss` sobre una alerta `nueva` registran antes un `review` implícito.
3. `confirm` crea el incidente en la misma transacción. `start` requiere un equipo (si no, 422 `EQUIPO_REQUERIDO`). `escalate` solo admite equipos `specialized`.
4. Toda escritura inserta su `timeline_events` (actor nulo = Sistema) y después publica el evento SSE.
5. `score = round(100 × w_sev × confianza × f_zona)`; los reportes manuales usan confianza 1,0 y se muestran como "N/A: reporte humano".
6. El simulador descarta los eventos con confianza menor que el umbral del tipo (solo cuentan como "bajo umbral"); los escenarios lo ignoran.
7. En el frontend, `src/domain/status.ts` replica las **acciones permitidas** solo para habilitar o deshabilitar botones. La validación real la hace el backend.
