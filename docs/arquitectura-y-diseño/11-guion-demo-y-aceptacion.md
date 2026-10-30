# 11 · Guion de la demo y criterios de aceptación

> Por decisión del equipo (D10) **no hay pruebas automatizadas**. La demo se valida con este guion y este checklist, ejecutados a mano antes de cada presentación.

## 1. Preparación (5 min antes)

1. Ejecutar `./start-demo.ps1` y esperar a ver "Uvicorn running on :8000" y "Vite ready on :5173".
2. Abrir `http://localhost:5173` en Chrome o Edge, en pantalla completa (≥ 1280 px).
3. Entrar como **Supervisor A**, ir a Configuración → **Reiniciar demo** y **apagar el simulador**, para una presentación controlada.
4. Cambiar el perfil a **Operador 01**.
5. Opcional: abrir una segunda pestaña en Mapa para mostrar la sincronización en vivo.

## 2. Guion (≈ 7 minutos)

| # | Tiempo | Acción | Qué se muestra o se dice |
|---|---|---|---|
| 1 | 0:00 | Resumen | "De los datos a las decisiones": KPIs, alertas priorizadas por score, mini-mapa, tendencia. Se señala el banner de modo demostración |
| 2 | 0:45 | Señalar la anomalía | "Aumento inusual en la Sala de embarque A, +65 %": detección basada en reglas |
| 3 | 1:15 | (Supervisor en otra pestaña, o atajo) disparar el **escenario E-1** | La alerta crítica llega **en vivo**: toast, el contador sube y aparece en el mapa |
| 4 | 1:45 | Abrir la alerta | Pasa a "En revisión" automáticamente. Evidencia ilustrativa, confianza del 94 %, **por qué se priorizó** (desglose del score), recomendación y protocolo |
| 5 | 2:45 | **Confirmar incidente** con una nota | Diálogo de confirmación; se crea INC-xxxx; mensaje: "La IA prioriza, la persona decide" |
| 6 | 3:15 | **Asignar** a Seguridad T1 y luego **Atender** | La timeline registra actor y hora |
| 7 | 3:45 | **Escalar** a la Unidad EOD con un motivo | Estado "Escalado" |
| 8 | 4:15 | **Resolver** con una nota de cierre | Estado "Resuelto"; los KPIs se actualizan |
| 9 | 4:45 | Flujo alterno: abrir la alerta #3 (Concentración, media) → **Marcar como falso positivo** → motivo "Movimiento normal de pasajeros" | Estado "Descartada" con el motivo auditado; no se crea incidente |
| 10 | 5:30 | **Mapa 3D** | Zonas por riesgo, orbitar, hacer clic en una zona y en un marcador |
| 11 | 6:15 | **Análisis** | Por zona y tipo, evolución, % de confirmadas frente a falsos positivos, tiempos |
| 12 | 6:45 | (Supervisor) **Exportar CSV** | El archivo se abre en Excel |
| 13 | 7:00 | Cierre | "AeroSecure AI no reemplaza al personal de seguridad: lo potencia con información oportuna." Se mencionan los próximos pasos (fuentes reales, modelos de IA) |

## 3. Checklist de criterios de aceptación

### Generales
- [ ] Se levanta con un solo comando y sin errores en consola.
- [ ] Banner de modo demostración visible en todas las vistas.
- [ ] Ninguna pantalla muestra datos personales ni rostros.
- [ ] Funciona en escritorio (1280+) y tablet (768-1023), con el sidebar colapsado.
- [ ] La severidad siempre aparece con icono y texto, además del color.
- [ ] Todas las vistas tienen los estados de carga, vacío y error, y las acciones muestran un toast de éxito o error.

### Por historia de usuario (doc 02)
- [ ] HU-01/02: login simulado, alias en la Topbar, cambio de perfil, banner.
- [ ] HU-03/04: KPIs con su variación; alertas ordenadas por score.
- [ ] HU-05: una alerta nueva llega en ≤ 2 s sin recargar (toast, contador, lista y mapa).
- [ ] HU-06/07: los filtros funcionan y persisten en la URL; el botón "Críticas (N)" funciona.
- [ ] HU-08/09: mapa 3D con orbitar, colores, etiquetas con texto, clic en zona y en marcador; mini-mapa 2D; fallback 2D.
- [ ] HU-10/11: el detalle completo se muestra; abrir la alerta la pasa a "En revisión" una sola vez.
- [ ] HU-12: confirmar crea el incidente vinculado y redirige.
- [ ] HU-13: descartar exige motivo y pide confirmación.
- [ ] HU-14/15: comentario en la timeline; el reporte manual crea una alerta "nueva".
- [ ] HU-16 a HU-19: asignar, atender (bloqueado sin equipo), escalar (solo a especializados) y resolver (con nota); confirmaciones en las acciones irreversibles.
- [ ] HU-20: timeline combinada con actor y hora.
- [ ] HU-21: registro de incidentes con filtros, orden y paginación.
- [ ] HU-22 a HU-24: gráficos con el selector de rango; % de confirmadas frente a falsos positivos; anomalías con su etiqueta.
- [ ] HU-25: el CSV se abre correctamente en Excel (tildes incluidas).
- [ ] HU-26 a HU-29: simulador encendido o apagado e intervalo en caliente; escenarios; reinicio con confirmación; umbrales.

### Reglas de dominio (doc 05)
- [ ] Una acción sobre una alerta o un incidente en estado final muestra el mensaje 409 legible.
- [ ] Dos pestañas: confirmar en una actualiza la otra.
- [ ] El score mostrado coincide con su desglose.

## 4. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| La página carga pero sin datos | El backend no está levantado | Revisar la terminal de uvicorn; abrir `http://localhost:8000/api/health` |
| "Reconectando…" permanente | SSE bloqueado o el backend se reinició | Recargar la página; verificar el proxy `/api` en `vite.config.ts` |
| Los datos se ven "viejos" | La base de datos se sembró hace días | Configuración → Reiniciar demo |
| El mapa aparece en 2D | WebGL deshabilitado | Activar la aceleración por hardware en el navegador |
| El puerto está ocupado | Hay otra instancia corriendo | Cerrar los procesos en `:8000` y `:5173` |
