// Traducción de los nombres de icono del dominio a componentes de lucide-react.
import {
  Activity,
  BellRing,
  ArrowUpRight,
  ChartLine,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleX,
  Eye,
  FileText,
  FolderOpen,
  FolderPlus,
  Info,
  LayoutDashboard,
  Map,
  MessageSquare,
  OctagonAlert,
  Play,
  RotateCcw,
  Settings,
  Siren,
  Sparkles,
  Timer,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { KpiIcon } from '../../domain/kpis';
import type { NavIcon } from '../../domain/navigation';
import type { SeverityIcon } from '../../domain/severity';
import type { StatusIcon } from '../../domain/status';
import type { TimelineIcon } from '../../domain/timeline';

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

export const TIMELINE_ICONS: Record<TimelineIcon, LucideIcon> = {
  sparkles: Sparkles,
  eye: Eye,
  'check-circle': CircleCheck,
  'x-circle': CircleX,
  'message-square': MessageSquare,
  'folder-plus': FolderPlus,
  users: Users,
  activity: Activity,
  'arrow-up-right': ArrowUpRight,
  'check-check': CheckCheck,
  'rotate-ccw': RotateCcw,
  play: Play,
  settings: Settings,
};

export const KPI_ICONS: Record<KpiIcon, LucideIcon> = {
  'bell-ring': BellRing,
  'octagon-alert': OctagonAlert,
  'folder-open': FolderOpen,
  'check-check': CheckCheck,
  timer: Timer,
};
