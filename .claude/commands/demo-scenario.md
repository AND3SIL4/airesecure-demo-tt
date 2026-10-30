---
description: Dispara un escenario predefinido de la demo (E-1, E-2, E-3 o E-4)
argument-hint: <E-1|E-2|E-3|E-4>
allowed-tools: Bash, PowerShell
---
Escenario solicitado: `$ARGUMENTS` (si está vacío, usa E-1).
Escenarios (doc 10 §8): E-1 equipaje abandonado crítico en la Sala de equipajes · E-2 intrusión en la Plataforma · E-3 aglomeración en la Sala de embarque A · E-4 permanencia en la Zona comercial.
Ejecuta `powershell -File .claude/skills/demo-ops/scripts/scenario.ps1 -Id <escenario>` y reporta el ID de la alerta creada.
