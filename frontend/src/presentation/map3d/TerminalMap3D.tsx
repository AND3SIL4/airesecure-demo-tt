import { useEffect, useRef } from 'react';
import type { CameraPreset, MapAlertMarker } from '../../domain/map3d';
import type { Zone } from '../../domain/types';
import { TerminalScene } from './TerminalScene';

/** Petición de preset de cámara; `seq` permite repetir el mismo preset. */
export interface CameraRequest {
  preset: CameraPreset;
  seq: number;
}

export interface TerminalMap3DProps {
  zones: readonly Zone[];
  /** Solo las alertas activas. */
  markers: readonly MapAlertMarker[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onOpenAlert: (alertId: string) => void;
  cameraRequest?: CameraRequest | null;
  /** Se invoca si el contexto WebGL no puede crearse o se pierde (el contenedor recurre al plano 2D). */
  onUnavailable?: () => void;
  /** Resumen textual de la escena para lectores de pantalla. */
  ariaLabel: string;
  className?: string;
}

interface Callbacks {
  onSelectZone: (zoneId: string) => void;
  onOpenAlert: (alertId: string) => void;
  onUnavailable?: () => void;
}

/**
 * Wrapper de React de la escena Three.js (plan R1): la crea una sola vez, le pasa las props
 * con efectos y la destruye al desmontarse. No consulta la API ni conoce el router.
 */
export function TerminalMap3D({
  zones,
  markers,
  selectedZoneId,
  onSelectZone,
  onOpenAlert,
  cameraRequest = null,
  onUnavailable,
  ariaLabel,
  className = '',
}: TerminalMap3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TerminalScene | null>(null);
  const callbacksRef = useRef<Callbacks>({ onSelectZone, onOpenAlert, onUnavailable });

  // Los callbacks más recientes, sin recrear la escena.
  useEffect(() => {
    callbacksRef.current = { onSelectZone, onOpenAlert, onUnavailable };
  }, [onSelectZone, onOpenAlert, onUnavailable]);

  // Ciclo de vida de la escena: se crea al montar y se libera por completo al desmontar.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let scene: TerminalScene;
    try {
      scene = new TerminalScene(host, {
        onZoneClick: (id) => callbacksRef.current.onSelectZone(id),
        onMarkerClick: (id) => callbacksRef.current.onOpenAlert(id),
        // Si el navegador pierde el contexto WebGL (GPU reiniciada, demasiados contextos), se pasa al plano 2D.
        onContextLost: () => callbacksRef.current.onUnavailable?.(),
      });
    } catch {
      host.replaceChildren();
      callbacksRef.current.onUnavailable?.();
      return;
    }
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setZones(zones);
  }, [zones]);

  useEffect(() => {
    sceneRef.current?.setMarkers(markers);
  }, [markers]);

  useEffect(() => {
    sceneRef.current?.setSelected(selectedZoneId);
  }, [selectedZoneId]);

  useEffect(() => {
    if (cameraRequest) sceneRef.current?.setPreset(cameraRequest.preset);
  }, [cameraRequest]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={ariaLabel}
      className={`relative h-full w-full overflow-hidden ${className}`}
    />
  );
}
