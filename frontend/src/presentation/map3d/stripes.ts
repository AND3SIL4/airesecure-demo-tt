// Textura de rayas diagonales generada en un canvas (zonas restringidas, plan R2). Sin imágenes externas.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const TILE_PX = 32;
/** Metros que ocupa cada repetición del patrón sobre el bloque. */
const TILE_METERS = 5;

/**
 * Crea una textura de rayas que se multiplica con el color del material: el fondo es blanco
 * (respeta el color del riesgo) y las rayas lo oscurecen. Quien la crea la libera con `dispose()`.
 */
export function createStripeTexture(widthMeters: number, depthMeters: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_PX;
  canvas.height = TILE_PX;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TILE_PX, TILE_PX);
    ctx.strokeStyle = '#5b6474';
    ctx.lineWidth = TILE_PX / 5;
    // Tres diagonales para que el patrón empalme sin cortes al repetirse.
    for (const offset of [-TILE_PX, 0, TILE_PX]) {
      ctx.beginPath();
      ctx.moveTo(offset, TILE_PX);
      ctx.lineTo(offset + TILE_PX, 0);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(Math.max(1, widthMeters / TILE_METERS), Math.max(1, depthMeters / TILE_METERS));
  return texture;
}
