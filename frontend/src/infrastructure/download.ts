// Descarga de archivos de la API con la cabecera del perfil activo (plan R4).
// El navegador no envía `X-Actor-Id` en un enlace normal: se pide con fetch y se guarda el blob.
import { actorHeaders, API_BASE_URL, errorFromResponse, networkError } from './http';

/** Nombre del archivo en `Content-Disposition` (`filename*=UTF-8''…` o `filename="…"`). */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Se intenta con `filename=`.
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() || null;
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera después del clic para que el navegador alcance a iniciar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Descarga `path` (relativo a `/api`) y lo guarda con el nombre que indique el servidor.
 * Devuelve el nombre usado. Los errores de red o de la API se lanzan como ApiError.
 */
export async function downloadFile(path: string, fallbackName: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: '*/*', ...actorHeaders() } });
  } catch {
    throw networkError();
  }
  if (!response.ok) throw errorFromResponse(response.status, await response.text());

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/html')) {
    // El index.html de Vite cuando el proxy no alcanza la API.
    throw networkError(response.status);
  }

  const filename = filenameFromDisposition(response.headers.get('Content-Disposition')) ?? fallbackName;
  saveBlob(await response.blob(), filename);
  return filename;
}
