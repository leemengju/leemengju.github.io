/**
 * Heavy R3F scene for the hero drone (item 4). Loaded ONLY after Scene3D's
 * capability gate passes (dynamic import), so three/R3F never ship to gated-out
 * devices. Renders one reused drone (theme-swapped, meshopt-decoded) that moves
 * between per-section keyframes as the page scrolls. `?tune` adds a slider
 * overlay to dial in each section's numbers and copy them back into
 * drone-choreography.ts.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useReducer, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  SECTIONS,
  CAMERA,
  deg,
  effectiveKeyframe,
  exitPartial,
  mergeExit,
  type Keyframe,
  type SectionKey,
  type Vec3
} from './drone-choreography';

type LiveMap = Record<SectionKey, Keyframe>;
type Live = { desktop: LiveMap; mobile: LiveMap };

function cloneKf(k: Keyframe): Keyframe {
  return { pos: [...k.pos] as Vec3, rot: [...k.rot] as Vec3, scale: k.scale, opacity: k.opacity };
}
function cloneLive(): Live {
  const desktop = {} as LiveMap;
  const mobile = {} as LiveMap;
  for (const s of SECTIONS) {
    desktop[s.key] = cloneKf(s.desktop);
    mobile[s.key] = cloneKf(s.mobile);
  }
  return { desktop, mobile };
}

function useThemeVariant(): 'bright' | 'dark' {
  const [theme, setTheme] = useState<'bright' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-variant') === 'bright'
      ? 'bright'
      : 'dark'
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setTheme(el.getAttribute('data-variant') === 'bright' ? 'bright' : 'dark');
    });
    obs.observe(el, { attributes: true, attributeFilter: ['data-variant'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

function eachMaterial(root: THREE.Object3D, fn: (m: THREE.Material) => void) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) mesh.material.forEach(fn);
    else fn(mesh.material);
  });
}

interface DroneProps {
  theme: 'bright' | 'dark';
  tune: boolean;
  liveRef: React.MutableRefObject<Live>;
}

function Drone({ theme, tune, liveRef }: DroneProps) {
  const url = `/models/drone.${theme === 'dark' ? 'dark' : 'bright'}.glb`;
  const [model, setModel] = useState<THREE.Group | null>(null);
  const group = useRef<THREE.Group>(null);

  // Load the meshopt-compressed glb with an explicit MeshoptDecoder (NOT Draco),
  // clone materials transparent (so per-frame opacity edits are isolated), and
  // normalize to ~2 world units centered at the origin.
  useEffect(() => {
    let alive = true;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        if (!alive) return;
        const c = gltf.scene;
        c.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.material) return;
          if (Array.isArray(mesh.material))
            mesh.material = mesh.material.map((m) => {
              const cm = m.clone();
              cm.transparent = true;
              return cm;
            });
          else {
            const cm = (mesh.material as THREE.Material).clone();
            cm.transparent = true;
            mesh.material = cm;
          }
        });
        const box = new THREE.Box3().setFromObject(c);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        c.position.sub(center);
        const wrap = new THREE.Group();
        wrap.add(c);
        wrap.scale.setScalar(2 / maxDim);
        setModel(wrap);
      },
      undefined,
      (err) => console.error('[drone] load failed', url, err)
    );
    return () => {
      alive = false;
    };
  }, [url]);
  const spin = useRef(0);
  const centers = useRef<{ key: SectionKey; center: number }[]>([]);
  const mobile = useRef(false);

  useEffect(() => {
    const measure = () => {
      mobile.current = window.matchMedia('(max-width: 768px)').matches;
      // Clamp each section's centre to the reachable scroll range so the FIRST
      // and LAST sections (esp. contact) are actually hit by the viewport centre.
      const half = window.innerHeight / 2;
      const minVC = half;
      const maxVC = Math.max(half, document.documentElement.scrollHeight - half);
      centers.current = SECTIONS.map((s) => {
        const el = document.querySelector(s.selector);
        const r = el?.getBoundingClientRect();
        let center = r ? r.top + window.scrollY + r.height / 2 : 0;
        center = Math.min(Math.max(center, minVC), maxVC);
        return { key: s.key, center };
      });
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    const cs = centers.current;
    if (!g || !model || cs.length < 2) return;

    const mob = mobile.current;
    const live = tune ? liveRef.current[mob ? 'mobile' : 'desktop'] : null;
    const baseKf = (i: number): Keyframe => (live ? live[cs[i].key] : effectiveKeyframe(SECTIONS[i], mob));

    // Ordered stops: each section's keyframe, plus an optional merged "exit" stop
    // placed 65% of the way to the next section (within-section motion, e.g.
    // about fades 0.85 → 0.1, skills slides out to the right).
    type Stop = { anchor: number; kf: Keyframe; sec: number };
    const stops: Stop[] = [];
    for (let i = 0; i < cs.length; i++) {
      const base = baseKf(i);
      stops.push({ anchor: cs[i].center, kf: base, sec: i });
      const ex = exitPartial(SECTIONS[i], mob);
      if (ex && i < cs.length - 1) {
        stops.push({
          anchor: cs[i].center + 0.65 * (cs[i + 1].center - cs[i].center),
          kf: mergeExit(base, ex),
          sec: i
        });
      }
    }
    if (stops.length < 2) return;

    const vc = window.scrollY + window.innerHeight / 2;
    let a = 0;
    while (a < stops.length - 1 && vc > stops[a + 1].anchor) a++;
    const b = Math.min(a + 1, stops.length - 1);
    const sa = stops[a].anchor;
    const sb = stops[b].anchor;
    const t = sb > sa ? THREE.MathUtils.clamp((vc - sa) / (sb - sa), 0, 1) : 0;
    const te = t * t * (3 - 2 * t); // smoothstep

    // Position along a Catmull-Rom spline through ALL the stop points (S-curve).
    const pts = stops.map((st) => new THREE.Vector3(...st.kf.pos));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const u = THREE.MathUtils.clamp((a + te) / (stops.length - 1), 0, 1);
    const p = curve.getPoint(u);

    const kfA = stops[a].kf;
    const kfB = stops[b].kf;
    const rx = THREE.MathUtils.lerp(kfA.rot[0], kfB.rot[0], te);
    const ry = THREE.MathUtils.lerp(kfA.rot[1], kfB.rot[1], te);
    const rz = THREE.MathUtils.lerp(kfA.rot[2], kfB.rot[2], te);
    const scale = THREE.MathUtils.lerp(kfA.scale, kfB.scale, te);
    const opacity = THREE.MathUtils.lerp(kfA.opacity, kfB.opacity, te);

    // Spin only while hero/about are dominant.
    const spinW = (SECTIONS[stops[a].sec].spin ? 1 - te : 0) + (SECTIONS[stops[b].sec].spin ? te : 0);
    const spinning = spinW > 0.05;
    if (spinning) spin.current += delta * 0.5 * spinW;
    else spin.current = 0;

    // frame-rate-independent damping toward the choreography target
    const k = 1 - Math.pow(0.0015, delta);
    g.position.x = THREE.MathUtils.lerp(g.position.x, p.x, k);
    g.position.y = THREE.MathUtils.lerp(g.position.y, p.y, k);
    g.position.z = THREE.MathUtils.lerp(g.position.z, p.z, k);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, rx, k);
    if (spinning) {
      // continuous turntable spin while hero/about are dominant
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ry + spin.current, k);
    } else {
      // settle to the keyframe angle by the SHORTEST path (≤ half turn), so it
      // never unwinds through all the accumulated spin (the "many turns" bug),
      // and every non-spin section (incl. contact) lands on a deterministic angle.
      let dy = ry - g.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.rotation.y = g.rotation.y + dy * k;
    }
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, rz, k);
    const s = THREE.MathUtils.lerp(g.scale.x, scale, k);
    g.scale.setScalar(s);
    g.visible = opacity > 0.015;
    if (g.visible) eachMaterial(model, (m) => (m.opacity = opacity));
  });

  return <group ref={group}>{model && <primitive object={model} />}</group>;
}

function fmt(n: number) {
  return Math.round(n * 100) / 100;
}

/** Live slider overlay (?tune). Edits the keyframe of whichever section the
 *  viewport centre is on, for the CURRENT breakpoint (desktop values on a
 *  desktop viewport, mobile values on a mobile viewport). "Copy all" emits both
 *  the desktop and mobile SECTIONS blocks, ready to paste back. */
function TuneOverlay({ liveRef }: { liveRef: React.MutableRefObject<Live> }) {
  const [active, setActive] = useState<SectionKey>('hero');
  const [mob, setMob] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const [, force] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const onScroll = () => {
      const vc = window.scrollY + window.innerHeight / 2;
      // Clamp centres to the scrollable range (same as the drone) so the LAST
      // section (contact) becomes the nearest one at the bottom and is editable.
      const half = window.innerHeight / 2;
      const minVC = half;
      const maxVC = Math.max(half, document.documentElement.scrollHeight - half);
      let best: SectionKey = 'hero';
      let bd = Infinity;
      for (const s of SECTIONS) {
        const el = document.querySelector(s.selector);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        let c = r.top + window.scrollY + r.height / 2;
        c = Math.min(Math.max(c, minVC), maxVC);
        const d = Math.abs(vc - c);
        if (d < bd) {
          bd = d;
          best = s.key;
        }
      }
      setActive(best);
    };
    const onResize = () => {
      setMob(window.matchMedia('(max-width: 768px)').matches);
      onScroll();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const kf = liveRef.current[mob ? 'mobile' : 'desktop'][active];

  const row = (
    label: string,
    val: number,
    min: number,
    max: number,
    step: number,
    set: (v: number) => void
  ) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ width: 34, opacity: 0.7 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => {
          set(parseFloat(e.target.value));
          force();
        }}
        style={{ flex: 1 }}
      />
      <span style={{ width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(val)}</span>
    </label>
  );

  const copyAll = () => {
    const block = (setName: 'desktop' | 'mobile') => {
      const map = liveRef.current[setName];
      const lines = SECTIONS.map((s) => {
        const k = map[s.key];
        const r = `[deg(${fmt((k.rot[0] * 180) / Math.PI)}), deg(${fmt((k.rot[1] * 180) / Math.PI)}), deg(${fmt(
          (k.rot[2] * 180) / Math.PI
        )})]`;
        return `  ${s.key}: { pos: [${fmt(k.pos[0])}, ${fmt(k.pos[1])}, ${fmt(k.pos[2])}], rot: ${r}, scale: ${fmt(
          k.scale
        )}, opacity: ${fmt(k.opacity)} },`;
      });
      return `// ${setName} keyframes\n${lines.join('\n')}`;
    };
    navigator.clipboard?.writeText(block('desktop') + '\n\n' + block('mobile'));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 9999,
        width: 260,
        padding: 12,
        borderRadius: 10,
        background: 'rgba(15,18,26,0.92)',
        color: '#e6e8ee',
        font: '12px/1.4 ui-monospace, monospace',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        // Kept faint so it doesn't block the (mobile) drone preview while tuning.
        opacity: 0.2
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>drone · {active} · {mob ? 'mobile' : 'desktop'}</strong>
        <button onClick={copyAll} style={{ fontSize: 11, cursor: 'pointer' }}>
          Copy all
        </button>
      </div>
      {row('pos x', kf.pos[0], -8, 8, 0.05, (v) => (kf.pos[0] = v))}
      {row('pos y', kf.pos[1], -8, 8, 0.05, (v) => (kf.pos[1] = v))}
      {row('pos z', kf.pos[2], -6, 6, 0.05, (v) => (kf.pos[2] = v))}
      {row('rot x°', (kf.rot[0] * 180) / Math.PI, -180, 180, 1, (v) => (kf.rot[0] = deg(v)))}
      {row('rot y°', (kf.rot[1] * 180) / Math.PI, -180, 180, 1, (v) => (kf.rot[1] = deg(v)))}
      {row('rot z°', (kf.rot[2] * 180) / Math.PI, -180, 180, 1, (v) => (kf.rot[2] = deg(v)))}
      {row('scale', kf.scale, 0.1, 5, 0.05, (v) => (kf.scale = v))}
      {row('opacity', kf.opacity, 0, 1, 0.05, (v) => (kf.opacity = v))}
      <div style={{ marginTop: 6, opacity: 0.6, fontSize: 10 }}>scroll to a section to edit it</div>
    </div>
  );
}

export default function DroneScene({ tune = false }: { tune?: boolean }) {
  const theme = useThemeVariant();
  const liveRef = useRef<Live>(cloneLive());
  // The bright-theme model reads ~40% brighter (per request) by boosting lights.
  const lb = theme === 'bright' ? 1.4 : 1;

  return (
    <>
      <div
        className="drone3d"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none'
        }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: CAMERA.pos, fov: CAMERA.fov }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.9 * lb} />
          <directionalLight position={[4, 6, 5]} intensity={1.6 * lb} />
          <directionalLight position={[-6, 2, -4]} intensity={0.5 * lb} />
          <Suspense fallback={null}>
            <Drone theme={theme} tune={tune} liveRef={liveRef} />
          </Suspense>
          <ContactShadows position={[0, -2.3, 0]} opacity={0.28} scale={14} blur={2.6} far={5} />
        </Canvas>
      </div>
      {/* Tune overlay is a SIBLING of the z-index:-1 canvas (not a child), so it
          isn't trapped behind the page and its sliders/buttons are clickable. */}
      {tune && <TuneOverlay liveRef={liveRef} />}
    </>
  );
}
