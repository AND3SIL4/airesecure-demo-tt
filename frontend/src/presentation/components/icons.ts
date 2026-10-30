// Traducción de los nombres de icono del dominio a componentes de lucide-react.
import {
  Activity,
  ArrowUpRight,
  ChartLine,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleX,
  Eye,
  FileText,
  FolderOpen,
  Info,
  LayoutDashboard,
  Map,
  OctagonAlert,
  Settings,
  Siren,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { NavIcon } from '../../domain/navigation';
import type { SeverityIcon } from '../../domain/severity';
import type { StatusIcon } from '../../domain/status';

export const SEVERITY_ICONS: Record<SeverityIcon, LucideIcon> = {
  'octagon-alert': OctagonAlert,
  'triangle-alert': TriangleAlert,
  'circle-alert': CircleAlert,
  info: Info,
  'circle-check': CircleCheck,
};

export const STATUS_ICONS: Record<StatusIcon, LucideIcon> = {
  sparkles: Sparkles,
  eye: Eye,
  'check-circle': CircleCheck,
  'x-circle': CircleX,
  'folder-open': FolderOpen,
  activity: Activity,
  'arrow-up-right': ArrowUpRight,
  'check-check': CheckCheck,
};

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  siren: Siren,
  'folder-open': FolderOpen,
  map: Map,
  'chart-line': ChartLine,
  'file-text': FileText,
  settings: Settings,
};
