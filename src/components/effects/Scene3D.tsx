/**
 * Capability gate + lazy loader for the 3D drone layer (item 4). Rendered as a
 * `client:visible` island. On mount it checks WebGL2 + reduced-motion (+ a very
 * conservative low-power guard, kept loose so mobile still gets the 3D per the
 * RWD design). Only if it passes does it dynamically import DroneScene — so the
 * heavy three/R3F bundle is never downloaded on gated-out devices (incl.
 * ad-blockers that null getContext('webgl2')). Add ?tune to the URL for the
 * live slider overlay.
 */
import { useEffect, useState, type ComponentType } from 'react';

function canRun3D(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) return false;
    // Only bail on the very weakest devices; mobile is supported (RWD keyframes).
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    if (typeof mem === 'number' && mem > 0 && mem < 2) return false;
  } catch {
    return false;
  }
  return true;
}

export default function Scene3D() {
  const [Comp, setComp] = useState<ComponentType<{ tune?: boolean }> | null>(null);
  const [tune] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tune')
  );

  useEffect(() => {
    if (!canRun3D()) return;
    let alive = true;
    import('./DroneScene').then((m) => {
      if (alive) setComp(() => m.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Comp) return null;
  return <Comp tune={tune} />;
}
