// Esqueleto de referencia para presentation/map3d/TerminalScene.ts (Three.js puro, render bajo demanda)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface SceneZone { id: string; name: string; x: number; z: number; w: number; d: number; h: number; color: string; restricted: boolean; riskLabel: string }

export class TerminalScene {
  private renderer: THREE.WebGLRenderer;
  private labels: CSS2DRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  private controls: OrbitControls;
  private zoneMeshes = new Map<string, THREE.Mesh>();
  private frame = 0;

  constructor(private container: HTMLElement, private onZoneClick: (id: string) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.labels = new CSS2DRenderer();
    this.labels.domElement.style.position = 'absolute';
    this.labels.domElement.style.inset = '0';
    this.labels.domElement.style.pointerEvents = 'none';
    container.append(this.renderer.domElement, this.labels.domElement);

    this.camera.position.set(60, 70, 60);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { minDistance: 40, maxDistance: 220, maxPolarAngle: Math.PI / 2.2 });
    this.controls.addEventListener('change', this.requestRender);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 30);
    this.scene.add(sun);

    this.renderer.domElement.addEventListener('click', this.handleClick);
    this.resize();
  }

  setZones(zones: SceneZone[]) {
    for (const z of zones) {
      let mesh = this.zoneMeshes.get(z.id);
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(z.w, z.h, z.d), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.85 }));
        mesh.position.set(z.x, z.h / 2, z.z);
        mesh.userData.zoneId = z.id;
        const el = document.createElement('div');
        el.className = 'map-label';
        mesh.add(new CSS2DObject(el));
        this.scene.add(mesh);
        this.zoneMeshes.set(z.id, mesh);
      }
      (mesh.material as THREE.MeshStandardMaterial).color.set(z.color);
      const label = mesh.children[0] as CSS2DObject;
      label.element.textContent = `${z.name} · ${z.riskLabel}`;
    }
    this.requestRender();
  }

  requestRender = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    });
  };

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.requestRender();
  }

  private handleClick = (ev: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects([...this.zoneMeshes.values()])[0];
    if (hit) this.onZoneClick(hit.object.userData.zoneId as string);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.zoneMeshes.forEach((m) => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
    this.renderer.dispose();
    this.container.replaceChildren();
  }
}
