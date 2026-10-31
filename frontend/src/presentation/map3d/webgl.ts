// Detección de WebGL para el Mapa 3D (plan R6). Es detección de plataforma (capa de presentación), no una regla de dominio.

/** True si el navegador puede crear un contexto WebGL2 o WebGL. El contexto de prueba se libera de inmediato. */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
