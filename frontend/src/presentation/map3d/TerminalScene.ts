// Escena Three.js de la Terminal 1 (plan R1-R5, skill threejs-terminal-map).
// Clase imperativa y aislada: recibe los datos por métodos, avisa por callbacks y no consulta la API.
import {
  BoxGeometry,
  ConeGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type CanvasTexture,
  type Object3D,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  CAMERA_LIMITS,
  CAMERA_POSES,
  CLICK_TOLERANCE_PX,
  RISK_COLORS,
  SCENE_COLORS,
  SEVERITY_COLORS,
  SLAB_SIZE,
  layoutMarkers,
  riskLabel,
  severityLabel,
  type CameraPreset,
  type MapAlertMarker,
} from '../../domain/map3d';
import type { Severity, Zone } from '../../domain/types';
import { createStripeTexture } from './stripes';

export type SceneHover = { kind: 'zone' | 'marker'; id: string } | null;

export interface TerminalSceneCallbacks {
  onZoneClick: (zoneId: string) => void;
  onMarkerClick: (alertId: string) => void;
  onHover?: (hover: SceneHover) => void;
  /** El navegador perdió el contexto WebGL (el contenedor recurre al plano 2D). */
  onContextLost?: () => void;
}

interface ZoneEntry {
  zone: Zone;
  geometryKey: string;
  mesh: Mesh<BoxGeometry, MeshStandardMaterial>;
  outline: LineSegments2;
  outlineMaterial: LineMaterial;
  label: CSS2DObject;
  stripes: CanvasTexture | null;
}

interface MarkerEntry {
  marker: MapAlertMarker;
  group: Group;
  head: Mesh;
  baseScale: number;
}

const ZONE_OPACITY = 0.85;
const PIN_HEIGHT = 2.4;
const PIN_HEAD_RADIUS = 1;
const MARKER_LIFT = 0.3;
const HOVER_SCALE = 1.3;
/** Periodo del pulso de los marcadores críticos (ms) y amplitud de la escala. */
const PULSE_PERIOD_MS = 1600;
const PULSE_AMPLITUDE = 0.35;
/** Margen del encuadre: fracción del semiancho/semialto de la vista que queda libre alrededor de la losa. */
const FIT_MARGIN = 0.1;
/** Borde de la losa (m) añadido a SLAB_SIZE, y altura mínima del contenido para el encuadre. */
const SLAB_BORDER = 2;
const MIN_CONTENT_HEIGHT = 8;
const WORLD_UP = new Vector3(0, 1, 0);

const LABEL_CLASS =
  'pointer-events-none flex flex-col items-center rounded-md border border-slate-300 bg-white/90 px-1.5 py-0.5 text-center text-[11px] leading-tight text-slate-900 shadow-sm whitespace-nowrap';
const LABEL_SELECTED_CLASSES = ['ring-2', 'ring-brand-600', 'border-brand-600'];
const TOOLTIP_CLASS =
  'pointer-events-none rounded-md bg-navy-950 px-2 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap -translate-y-6';

function geometryKey(zone: Zone): string {
  const { x, z, w, d, h } = zone.geometry;
  return `${x}|${z}|${w}|${d}|${h}`;
}

function prefersReducedMotionQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
}

export class TerminalScene {
  private readonly container: HTMLElement;
  private readonly callbacks: TerminalSceneCallbacks;
  private readonly renderer: WebGLRenderer;
  private readonly labels: CSS2DRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.5, 1000);
  private readonly controls: OrbitControls;
  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly motionQuery: MediaQueryList | null;

  // Recursos compartidos (se liberan una sola vez en dispose).
  private readonly slab: Mesh<BoxGeometry, MeshStandardMaterial>;
  private readonly pinGeometry: ConeGeometry;
  private readonly headGeometry: SphereGeometry;
  private readonly markerMaterials: Record<Severity, MeshStandardMaterial>;
  private readonly tooltip: CSS2DObject;

  private zones = new Map<string, ZoneEntry>();
  private markers: MarkerEntry[] = [];
  private markerData: readonly MapAlertMarker[] = [];
  private pickables: Object3D[] = [];
  private selectedId: string | null = null;
  private hover: SceneHover = null;
  private reducedMotion: boolean;
  private size = { w: 1, h: 1 };
  /** Último preset aplicado y si el usuario movió la cámara después (si no, el encuadre se recalcula al redimensionar). */
  private preset: CameraPreset = 'isometrica';
  private userMoved = false;
  /** Altura del contenido (zonas + marcadores) usada para el encuadre. */
  private contentHeight = MIN_CONTENT_HEIGHT;

  private frame = 0;
  private hoverFrame = 0;
  private pendingPointer: { x: number; y: number } | null = null;
  private downAt: { x: number; y: number } | null = null;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: TerminalSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Puede lanzar si el contexto WebGL no se crea: el wrapper lo captura y recurre al plano 2D.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.display = 'block';

    this.labels = new CSS2DRenderer();
    const labelsStyle = this.labels.domElement.style;
    labelsStyle.position = 'absolute';
    labelsStyle.inset = '0';
    labelsStyle.pointerEvents = 'none';
    this.labels.domElement.setAttribute('aria-hidden', 'true');
    container.append(this.renderer.domElement, this.labels.domElement);

    this.motionQuery = prefersReducedMotionQuery();
    this.reducedMotion = this.motionQuery?.matches ?? false;

    // Cámara y controles con límites (no atraviesa el suelo).
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = CAMERA_LIMITS.minDistance;
    this.controls.maxDistance = CAMERA_LIMITS.maxDistance;
    this.controls.maxPolarAngle = CAMERA_LIMITS.maxPolarAngle;
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = 0.12;
    this.controls.screenSpacePanning = false;
    // La pose inicial se encuadra en `resize()`, cuando ya se conoce el aspect ratio del contenedor.

    // Luces suaves, sin sombras (rendimiento).
    this.scene.add(new HemisphereLight(0xffffff, 0x334155, 2.4));
    const sun = new DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 100, 30);
    this.scene.add(sun);

    // Losa de la terminal.
    this.slab = new Mesh(
      new BoxGeometry(SLAB_SIZE.w + 4, 0.4, SLAB_SIZE.d + 4),
      new MeshStandardMaterial({ color: SCENE_COLORS.slab, roughness: 1, metalness: 0 }),
    );
    this.slab.position.set(0, -0.22, 0);
    this.scene.add(this.slab);

    // Pines de los marcadores: cono con la punta hacia abajo + esfera. Geometrías y materiales compartidos.
    this.pinGeometry = new ConeGeometry(0.5, PIN_HEIGHT, 12);
    this.pinGeometry.rotateX(Math.PI);
    this.pinGeometry.translate(0, PIN_HEIGHT / 2, 0);
    this.headGeometry = new SphereGeometry(PIN_HEAD_RADIUS, 16, 12);
    this.markerMaterials = {
      critica: this.createMarkerMaterial('critica'),
      alta: this.createMarkerMaterial('alta'),
      media: this.createMarkerMaterial('media'),
      baja: this.createMarkerMaterial('baja'),
    };

    // Ayuda emergente del marcador bajo el cursor.
    const tooltipEl = document.createElement('div');
    tooltipEl.className = TOOLTIP_CLASS;
    this.tooltip = new CSS2DObject(tooltipEl);
    this.tooltip.visible = false;
    this.scene.add(this.tooltip);

    // Eventos.
    this.controls.addEventListener('change', this.handleControlsChange);
    this.controls.addEventListener('start', this.handleControlsStart);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('click', this.handleClick);
    this.motionQuery?.addEventListener('change', this.handleMotionChange);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------

  setZones(zones: readonly Zone[]): void {
    if (this.disposed) return;
    const seen = new Set<string>();
    for (const zone of zones) {
      seen.add(zone.id);
      let entry = this.zones.get(zone.id);
      if (entry && entry.geometryKey !== geometryKey(zone)) {
        this.destroyZone(entry);
        entry = undefined;
      }
      if (!entry) {
        entry = this.createZone(zone);
        this.zones.set(zone.id, entry);
      }
      entry.zone = zone;
      this.updateZoneRestriction(entry);
      this.updateZoneLabel(entry);
      this.styleZone(entry);
    }
    for (const [id, entry] of this.zones) {
      if (!seen.has(id)) {
        this.destroyZone(entry);
        this.zones.delete(id);
      }
    }
    // La posición de los marcadores depende de la geometría de las zonas.
    this.rebuildMarkers();
    // El encuadre considera la altura real de los bloques (más el pin de los marcadores).
    let maxHeight = 0;
    for (const entry of this.zones.values()) maxHeight = Math.max(maxHeight, entry.zone.geometry.h);
    const height = Math.max(MIN_CONTENT_HEIGHT, maxHeight + PIN_HEIGHT + PIN_HEAD_RADIUS * 2 + MARKER_LIFT);
    if (height !== this.contentHeight) {
      this.contentHeight = height;
      if (!this.userMoved) this.applyPose(this.preset);
    }
  }

  setMarkers(markers: readonly MapAlertMarker[]): void {
    if (this.disposed) return;
    this.markerData = markers;
    this.rebuildMarkers();
  }

  setSelected(zoneId: string | null): void {
    if (this.disposed || this.selectedId === zoneId) return;
    const previous = this.selectedId ? this.zones.get(this.selectedId) : undefined;
    this.selectedId = zoneId;
    if (previous) this.styleZone(previous);
    const current = zoneId ? this.zones.get(zoneId) : undefined;
    if (current) this.styleZone(current);
    this.requestRender();
  }

  setHovered(hover: SceneHover): void {
    if (this.disposed) return;
    const prev = this.hover;
    if (prev?.kind === hover?.kind && prev?.id === hover?.id) return;
    this.hover = hover;

    if (prev?.kind === 'zone') {
      const entry = this.zones.get(prev.id);
      if (entry) this.styleZone(entry);
    }
    if (hover?.kind === 'zone') {
      const entry = this.zones.get(hover.id);
      if (entry) this.styleZone(entry);
    }
    this.updateMarkerHover();
    this.renderer.domElement.style.cursor = hover ? 'pointer' : '';
    this.callbacks.onHover?.(hover);
    this.requestRender();
  }

  setPreset(preset: CameraPreset): void {
    if (this.disposed) return;
    this.preset = preset;
    this.userMoved = false;
    this.applyPose(preset);
    this.requestRender();
  }

  resize(): void {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.size = { w, h };
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    for (const entry of this.zones.values()) entry.outlineMaterial.resolution.set(w, h);
    // Mientras el usuario no mueva la cámara, el preset se re-encuadra al nuevo aspect ratio.
    if (!this.userMoved) this.applyPose(this.preset);
    this.requestRender();
  }

  /** Programa un único fotograma (render bajo demanda). */
  requestRender = (): void => {
    if (this.disposed || this.frame !== 0) return;
    this.frame = requestAnimationFrame(this.renderFrame);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.hoverFrame);
    this.frame = 0;
    this.hoverFrame = 0;

    this.resizeObserver.disconnect();
    this.motionQuery?.removeEventListener('change', this.handleMotionChange);
    const canvas = this.renderer.domElement;
    // Se quita antes de `forceContextLoss()` para que la liberación voluntaria no dispare el fallback.
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('click', this.handleClick);
    this.controls.removeEventListener('change', this.handleControlsChange);
    this.controls.removeEventListener('start', this.handleControlsStart);
    this.controls.dispose();

    this.clearMarkers();
    for (const entry of this.zones.values()) this.destroyZone(entry);
    this.zones.clear();
    this.scene.remove(this.tooltip);

    this.slab.geometry.dispose();
    this.slab.material.dispose();
    this.pinGeometry.dispose();
    this.headGeometry.dispose();
    for (const material of Object.values(this.markerMaterials)) material.dispose();
    this.scene.clear();

    this.renderer.dispose();
    try {
      // Libera el contexto de inmediato (evita acumular contextos al entrar y salir del Mapa).
      this.renderer.forceContextLoss();
    } catch {
      // Sin la extensión WEBGL_lose_context el navegador lo liberará al recolectar el canvas.
    }
    canvas.remove();
    this.labels.domElement.remove();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  private renderFrame = (time: number): void => {
    this.frame = 0;
    if (this.disposed) return;
    // Con amortiguación, `update` emite `change` mientras la cámara se mueve y pide otro fotograma.
    this.controls.update();
    const pulsing = this.isPulsing();
    if (pulsing) this.updatePulse(time);
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
    // El bucle continuo solo existe mientras haya marcadores críticos pulsando.
    if (pulsing) this.requestRender();
  };

  private isPulsing(): boolean {
    return !this.reducedMotion && this.markers.some((m) => m.marker.severity === 'critica');
  }

  private updatePulse(time: number): void {
    const phase = (Math.sin((time / PULSE_PERIOD_MS) * Math.PI * 2) + 1) / 2;
    const factor = 1 + PULSE_AMPLITUDE * phase;
    for (const entry of this.markers) {
      if (entry.marker.severity === 'critica') entry.head.scale.setScalar(factor);
    }
  }

  /**
   * Aplica un preset: la pose aporta la dirección y el objetivo; la distancia se calcula para que la losa
   * completa (y la altura de los bloques) quepa con margen según el aspect ratio actual.
   * La amortiguación se desactiva durante la operación para que la inercia residual no desvíe la pose.
   */
  private applyPose(preset: CameraPreset): void {
    const pose = CAMERA_POSES[preset];
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    // Un primer update sin amortiguación consume (y anula) cualquier delta pendiente de la órbita.
    this.controls.update();

    const target = new Vector3(...pose.target);
    const direction = new Vector3(...pose.position).sub(target).normalize();
    const distance = this.fitDistance(target, direction);
    // Nunca se impide ver la losa completa: el límite de alejamiento se amplía si hace falta.
    this.controls.maxDistance = Math.max(CAMERA_LIMITS.maxDistance, distance * 1.25);
    this.camera.position.copy(target).addScaledVector(direction, distance);
    this.controls.target.copy(target);
    this.controls.update();
    this.controls.enableDamping = damping;
  }

  /** Distancia mínima a lo largo de `direction` para que las 8 esquinas del volumen de la losa entren en el encuadre. */
  private fitDistance(target: Vector3, direction: Vector3): number {
    const forward = direction.clone().negate();
    const right = new Vector3().crossVectors(forward, WORLD_UP);
    if (right.lengthSq() < 1e-10) right.set(1, 0, 0);
    right.normalize();
    const up = new Vector3().crossVectors(right, forward).normalize();

    const tanV = Math.tan((this.camera.fov * Math.PI) / 360) * (1 - FIT_MARGIN);
    const tanH = tanV * this.camera.aspect;
    const halfW = SLAB_SIZE.w / 2 + SLAB_BORDER;
    const halfD = SLAB_SIZE.d / 2 + SLAB_BORDER;
    const corner = new Vector3();
    let distance: number = CAMERA_LIMITS.minDistance;
    for (const x of [-halfW, halfW]) {
      for (const y of [0, this.contentHeight]) {
        for (const z of [-halfD, halfD]) {
          corner.set(x, y, z).sub(target);
          // Profundidad del punto = distancia - proyección sobre la dirección; debe cubrir |x|/tanH y |y|/tanV.
          const along = corner.dot(direction);
          const needH = along + Math.abs(corner.dot(right)) / tanH;
          const needV = along + Math.abs(corner.dot(up)) / tanV;
          distance = Math.max(distance, needH, needV);
        }
      }
    }
    return distance;
  }

  /** Mantiene el objetivo de la órbita sobre la losa: el paneo no puede sacarla de la vista. */
  private clampTarget(): void {
    const target = this.controls.target;
    const halfW = SLAB_SIZE.w / 2;
    const halfD = SLAB_SIZE.d / 2;
    const x = Math.min(Math.max(target.x, -halfW), halfW);
    const z = Math.min(Math.max(target.z, -halfD), halfD);
    const y = Math.min(Math.max(target.y, 0), this.contentHeight);
    if (x === target.x && y === target.y && z === target.z) return;
    // Se desplaza también la cámara para conservar el ángulo y la distancia de la órbita.
    const delta = new Vector3(x - target.x, y - target.y, z - target.z);
    target.add(delta);
    this.camera.position.add(delta);
  }

  private handleControlsChange = (): void => {
    this.clampTarget();
    this.requestRender();
  };

  private handleControlsStart = (): void => {
    this.userMoved = true;
  };

  private handleContextLost = (event: Event): void => {
    if (this.disposed) return;
    event.preventDefault();
    this.callbacks.onContextLost?.();
  };

  // ---------------------------------------------------------------------------
  // Zonas
  // ---------------------------------------------------------------------------

  private createZone(zone: Zone): ZoneEntry {
    const { x, z, w, d, h } = zone.geometry;
    const box = new BoxGeometry(w, h, d);
    const material = new MeshStandardMaterial({
      color: RISK_COLORS[zone.riskLevel],
      transparent: true,
      opacity: ZONE_OPACITY,
      roughness: 0.85,
      metalness: 0,
    });
    const mesh = new Mesh(box, material);
    mesh.position.set(x, h / 2, z);
    mesh.userData = { kind: 'zone', id: zone.id };
    this.scene.add(mesh);

    const edges = new EdgesGeometry(box);
    const outlineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);
    edges.dispose();
    const outlineMaterial = new LineMaterial({ color: SCENE_COLORS.edge, linewidth: 1 });
    outlineMaterial.resolution.set(this.size.w, this.size.h);
    const outline = new LineSegments2(outlineGeometry, outlineMaterial);
    outline.position.copy(mesh.position);
    outline.raycast = () => {};
    this.scene.add(outline);

    const labelEl = document.createElement('div');
    labelEl.className = LABEL_CLASS;
    const label = new CSS2DObject(labelEl);
    label.position.set(x, h + 1.5, z);
    this.scene.add(label);

    return { zone, geometryKey: geometryKey(zone), mesh, outline, outlineMaterial, label, stripes: null };
  }

  private destroyZone(entry: ZoneEntry): void {
    // Quitar el CSS2DObject de la escena elimina también su elemento del DOM.
    this.scene.remove(entry.mesh, entry.outline, entry.label);
    entry.mesh.geometry.dispose();
    entry.mesh.material.dispose();
    entry.stripes?.dispose();
    entry.outline.geometry.dispose();
    entry.outlineMaterial.dispose();
    if (this.hover?.kind === 'zone' && this.hover.id === entry.zone.id) this.hover = null;
  }

  private updateZoneRestriction(entry: ZoneEntry): void {
    const restricted = entry.zone.restricted;
    if (restricted && !entry.stripes) {
      entry.stripes = createStripeTexture(entry.zone.geometry.w, entry.zone.geometry.d);
      entry.mesh.material.map = entry.stripes;
      entry.mesh.material.needsUpdate = true;
    } else if (!restricted && entry.stripes) {
      entry.mesh.material.map = null;
      entry.mesh.material.needsUpdate = true;
      entry.stripes.dispose();
      entry.stripes = null;
    }
  }

  private updateZoneLabel(entry: ZoneEntry): void {
    const el = entry.label.element;
    const name = document.createElement('span');
    name.className = 'font-semibold';
    name.textContent = entry.zone.name;
    const risk = document.createElement('span');
    risk.className = 'text-slate-700';
    risk.textContent = entry.zone.restricted ? `${riskLabel(entry.zone.riskLevel)} · Restringida` : riskLabel(entry.zone.riskLevel);
    el.replaceChildren(name, risk);
  }

  private styleZone(entry: ZoneEntry): void {
    const id = entry.zone.id;
    const selected = this.selectedId === id;
    const hovered = this.hover?.kind === 'zone' && this.hover.id === id;
    const material = entry.mesh.material;
    material.color.set(RISK_COLORS[entry.zone.riskLevel]);
    if (selected) {
      material.emissive.set(SCENE_COLORS.selected);
      material.emissiveIntensity = hovered ? 0.4 : 0.3;
    } else if (hovered) {
      material.emissive.set(0xffffff);
      material.emissiveIntensity = 0.22;
    } else {
      material.emissive.set(0x000000);
      material.emissiveIntensity = 0;
    }

    const outline = entry.outlineMaterial;
    if (selected) {
      outline.color.set(SCENE_COLORS.selected);
      outline.linewidth = 4;
    } else if (entry.zone.restricted) {
      outline.color.set(SCENE_COLORS.restrictedEdge);
      outline.linewidth = 3;
    } else {
      outline.color.set(hovered ? SCENE_COLORS.selected : SCENE_COLORS.edge);
      outline.linewidth = hovered ? 2 : 1;
    }

    const classes = entry.label.element.classList;
    for (const cls of LABEL_SELECTED_CLASSES) classes.toggle(cls, selected);
    this.requestRender();
  }

  // ---------------------------------------------------------------------------
  // Marcadores
  // ---------------------------------------------------------------------------

  private createMarkerMaterial(severity: Severity): MeshStandardMaterial {
    return new MeshStandardMaterial({
      color: SEVERITY_COLORS[severity],
      emissive: SEVERITY_COLORS[severity],
      emissiveIntensity: 0.35,
      roughness: 0.5,
      metalness: 0,
    });
  }

  private clearMarkers(): void {
    for (const entry of this.markers) this.scene.remove(entry.group);
    this.markers = [];
    this.pickables = [...this.zones.values()].map((z) => z.mesh);
  }

  private rebuildMarkers(): void {
    this.clearMarkers();
    const byZone = new Map<string, MapAlertMarker[]>();
    for (const marker of this.markerData) {
      const list = byZone.get(marker.zoneId);
      if (list) list.push(marker);
      else byZone.set(marker.zoneId, [marker]);
    }
    for (const [zoneId, list] of byZone) {
      const zoneEntry = this.zones.get(zoneId);
      if (!zoneEntry) continue;
      const slots = layoutMarkers(zoneEntry.zone.geometry, list.length);
      list.forEach((marker, i) => {
        const slot = slots[i];
        if (!slot) return;
        const material = this.markerMaterials[marker.severity];
        const group = new Group();
        const pin = new Mesh(this.pinGeometry, material);
        const head = new Mesh(this.headGeometry, material);
        head.position.y = PIN_HEIGHT + PIN_HEAD_RADIUS * 0.6;
        pin.userData = { kind: 'marker', id: marker.id };
        head.userData = { kind: 'marker', id: marker.id };
        group.add(pin, head);
        group.position.set(slot.x, zoneEntry.zone.geometry.h + MARKER_LIFT, slot.z);
        group.scale.setScalar(slot.scale);
        this.scene.add(group);
        this.markers.push({ marker, group, head, baseScale: slot.scale });
        this.pickables.push(pin, head);
      });
    }
    if (this.hover?.kind === 'marker' && !this.markers.some((m) => m.marker.id === this.hover?.id)) {
      this.hover = null;
      this.renderer.domElement.style.cursor = '';
    }
    this.updateMarkerHover();
    this.requestRender();
  }

  private updateMarkerHover(): void {
    const hoveredId = this.hover?.kind === 'marker' ? this.hover.id : null;
    let hoveredEntry: MarkerEntry | undefined;
    for (const entry of this.markers) {
      const isHovered = entry.marker.id === hoveredId;
      entry.group.scale.setScalar(entry.baseScale * (isHovered ? HOVER_SCALE : 1));
      if (isHovered) hoveredEntry = entry;
    }
    if (hoveredEntry) {
      const { marker, group } = hoveredEntry;
      this.tooltip.element.textContent = `${marker.id} · ${marker.typeName} · ${severityLabel(marker.severity)}`;
      this.tooltip.position.set(group.position.x, group.position.y + (PIN_HEIGHT + PIN_HEAD_RADIUS * 2) * hoveredEntry.baseScale, group.position.z);
      this.tooltip.visible = true;
    } else {
      this.tooltip.visible = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Interacción (raycasting)
  // ---------------------------------------------------------------------------

  private pick(clientX: number, clientY: number): SceneHover {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    if (!hit) return null;
    const data = hit.object.userData as { kind?: 'zone' | 'marker'; id?: string };
    return data.kind && data.id ? { kind: data.kind, id: data.id } : null;
  }

  private handlePointerMove = (event: PointerEvent): void => {
    // Durante un arrastre (órbita) no se calcula el hover.
    if (event.buttons !== 0) return;
    this.pendingPointer = { x: event.clientX, y: event.clientY };
    if (this.hoverFrame === 0) this.hoverFrame = requestAnimationFrame(this.processHover);
  };

  private processHover = (): void => {
    this.hoverFrame = 0;
    const pointer = this.pendingPointer;
    if (!pointer || this.disposed) return;
    this.setHovered(this.pick(pointer.x, pointer.y));
  };

  private handlePointerLeave = (): void => {
    this.pendingPointer = null;
    this.setHovered(null);
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.downAt = { x: event.clientX, y: event.clientY };
  };

  private handleClick = (event: MouseEvent): void => {
    const start = this.downAt;
    this.downAt = null;
    // Distingue un clic de un arrastre: si el puntero se desplazó, era una órbita.
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_TOLERANCE_PX) return;
    const hit = this.pick(event.clientX, event.clientY);
    if (!hit) return; // Clic en la losa o fuera de las zonas: no cambia la selección.
    if (hit.kind === 'marker') this.callbacks.onMarkerClick(hit.id);
    else this.callbacks.onZoneClick(hit.id);
  };

  private handleMotionChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    this.controls.enableDamping = !event.matches;
    if (event.matches) for (const entry of this.markers) entry.head.scale.setScalar(1);
    this.requestRender();
  };
}
