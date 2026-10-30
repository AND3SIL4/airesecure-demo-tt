---
description: Recorre el guion y el checklist de aceptación del doc 11 (completo o parcial por feature) con el agente demo-runner
argument-hint: [parcial <NNN-feature>]
---
Alcance: `$ARGUMENTS` (vacío = guion completo).

Lanza el agente `demo-runner` indicándole el alcance. Para un recorrido parcial, debe limitarse a los ítems del checklist de `docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md` §3 que cubre esa feature (ver el doc 12 §3). Muestra al usuario la tabla resultante (✅, ❌ o ⚪) y los pasos que se deben corregir. Recuerda: es una verificación manual asistida; no se crean archivos de tests.
