# AeroSecure AI · Vídeo promocional

Vídeo promocional (1920×1080, 30 fps, ~50 s) hecho con [Remotion](https://remotion.dev). Es independiente de la app: tiene su propio `package.json` y no añade dependencias a `backend/` ni a `frontend/`.

## Uso (con Bun)

```powershell
cd promo-video
bun install
bun run audio      # regenera música y efectos en public/sfx (deterministas)
bun run studio     # vista previa interactiva
bun run render -- --browser-executable="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

El vídeo final queda en `out/aerosecure-promo.mp4`.

## Estructura

- `src/theme.ts`: colores, curvas, springs y tipografía (fuente única).
- `src/timing.ts`: línea de tiempo en pulsos (100 BPM = 18 frames por pulso).
- `src/scenes/*`: Hook, Signals, LogoReveal, Overview, Priority, Human, MapScene, Trio, Privacy, EndCard.
- `public/shots/*`: capturas reales de la demo a 2× (datos simulados, aeropuerto ficticio).
- `public/evidence/*`: ilustraciones de evidencia copiadas de `frontend/public/evidence`.
- `scripts/gen-audio.ts`: sintetiza la banda sonora y los efectos sin descargas.
