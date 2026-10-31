# Implementation Plan: Pulido final de la demo

**Branch**: `009-pulido-demo` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

1. **División del código**:
   - Las rutas pesadas se cargan con `React.lazy`: Resumen (Recharts), Análisis, Reportes, Configuración y Mapa (este último ya era diferido).
   - `vite.config.ts` usa `build.rollupOptions.output.manualChunks` para separar `recharts` (con d3), `three`, `react`/`react-dom`/`react-router` y `@tanstack/react-query`.
   - Objetivo: ningún fragmento inicial pasa de 500 kB.
2. **Auditoría transversal de la UI** con el agente `frontend-engineer`, contra el doc 09 §4, §6, §7 y §8: estados, foco, contraste, tablet y microcopy. Se corrige lo que encuentre.
3. **Recorrido completo** del doc 11 con el agente `demo-runner` (API) más capturas automatizadas (CDP), y corrección de los fallos.
4. **README raíz** con requisitos, `./start-demo.ps1`, preparación (reinicio y simulador), perfiles, guion resumido y solución de problemas.

## Technical Context

Sin dependencias nuevas; la división del código se hace con la configuración de Vite y `React.lazy`. Sin pruebas.

## Constitution Check

✅ Todos los principios. El I se cumple porque el README y los documentos quedan alineados. Los principios IV y VI son el objeto de esta auditoría.

## Structure

```text
frontend/vite.config.ts (manualChunks) · frontend/src/router.tsx (lazy) · frontend/src/presentation/pages/*Route.tsx
README.md (raíz) · docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md (limitaciones conocidas)
```
