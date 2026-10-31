import { Box, RotateCcw, SquareDashed, type LucideIcon } from 'lucide-react';
import { CAMERA_PRESET_LABELS, type CameraPreset } from '../../../domain/map3d';
import { Button } from '../../components/Button';

export interface CameraControlsProps {
  onPreset: (preset: CameraPreset) => void;
  className?: string;
}

const PRESETS: readonly { preset: CameraPreset; icon: LucideIcon }[] = [
  { preset: 'superior', icon: SquareDashed },
  { preset: 'isometrica', icon: Box },
  { preset: 'reiniciar', icon: RotateCcw },
];

/** Botones accesibles de los presets de cámara del Mapa 3D (doc 09 §3.7). */
export function CameraControls({ onPreset, className = '' }: CameraControlsProps) {
  return (
    <div role="group" aria-label="Controles de cámara" className={`flex flex-wrap gap-2 ${className}`}>
      {PRESETS.map(({ preset, icon }) => (
        <Button
          key={preset}
          variant="secondary"
          size="sm"
          icon={icon}
          onClick={() => onPreset(preset)}
          className="bg-white/95 shadow-sm"
        >
          {CAMERA_PRESET_LABELS[preset]}
        </Button>
      ))}
    </div>
  );
}
