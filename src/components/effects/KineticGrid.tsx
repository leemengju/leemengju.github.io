import { useRef, useEffect } from 'react';

/**
 * Kinetic Grid (item 7) — a reactive dot/line mesh pulled toward the cursor,
 * used as the HERO BACKGROUND. Ported from the Originkit React component to an
 * Astro island, with three adaptations for background use:
 *   1. Mouse tracked on `window` (not the host) so hero content layered on top
 *      doesn't block reactivity; coords converted to canvas-local.
 *   2. Transparent background + pointer-events:none, so it sits behind the H1
 *      and CTAs without intercepting clicks or text selection.
 *   3. Colors read from the resolved `--accent` token (theme-adaptive); skipped
 *      entirely on coarse pointers and under prefers-reduced-motion.
 */
export default function KineticGrid({
  spacing = 34,
  radius = 320,
  strength = 4
}: {
  spacing?: number;
  radius?: number;
  strength?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Resolve the accent color through a throwaway element so light-dark()
    // gives us a concrete rgb we can alpha-blend on canvas.
    const probe = document.createElement('span');
    probe.style.color = 'var(--accent)';
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const accent = getComputedStyle(probe).color || '#5b7cf5';
    document.body.removeChild(probe);

    const GAP = Math.max(8, spacing);
    const R = Math.max(1, radius);
    const PULL = (Math.max(1, Math.min(10, strength)) / 10) * 4;

    let W = 1;
    let H = 1;
    type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number };
    let cols: Dot[][] = [];
    let dots: Dot[] = [];

    const build = (mw?: number, mh?: number) => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.floor(mw ?? r.width));
      H = Math.max(1, Math.floor(mh ?? r.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = [];
      dots = [];
      const nCols = Math.floor(W / GAP) + 2;
      const nRows = Math.floor(H / GAP) + 2;
      for (let c = 0; c < nCols; c++) {
        const col: Dot[] = [];
        for (let ri = 0; ri < nRows; ri++) {
          const hx = c * GAP;
          const hy = ri * GAP;
          const d = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
          col.push(d);
          dots.push(d);
        }
        cols.push(col);
      }
    };
    build();

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((e) => build(e[0]?.contentRect?.width, e[0]?.contentRect?.height))
        : null;
    ro?.observe(host);

    // Static single frame for reduced-motion / coarse pointer.
    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.6;
      for (let c = 0; c < cols.length; c++)
        for (let ri = 0; ri < cols[c].length; ri++) {
          const d = cols[c][ri];
          const right = cols[c + 1]?.[ri];
          const down = cols[c]?.[ri + 1];
          if (right) { ctx.beginPath(); ctx.moveTo(d.hx, d.hy); ctx.lineTo(right.hx, right.hy); ctx.stroke(); }
          if (down) { ctx.beginPath(); ctx.moveTo(d.hx, d.hy); ctx.lineTo(down.hx, down.hy); ctx.stroke(); }
        }
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = accent;
      for (const d of dots) { ctx.beginPath(); ctx.arc(d.hx, d.hy, 1.1, 0, 2 * Math.PI); ctx.fill(); }
      ctx.globalAlpha = 1;
    };

    if (!fine || reduced) {
      drawStatic();
      return () => ro?.disconnect();
    }

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      // only react while the cursor is over the hero region
      mouse.current.active = mx >= 0 && my >= 0 && mx <= W && my <= H;
      mouse.current.x = mx;
      mouse.current.y = my;
      if (mouse.current.active) {
        trail.current.push({ x: mx, y: my, t: performance.now() });
        if (trail.current.length > 80) trail.current.shift();
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let raf = 0;
    const frame = () => {
      const m = mouse.current;
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        let ax = (d.hx - d.x) * 0.08;
        let ay = (d.hy - d.y) * 0.08;
        if (m.active) {
          const dx = m.x - d.x;
          const dy = m.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < R && dist > 0.001) {
            const f = (1 - dist / R) * PULL;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }
        d.vx = (d.vx + ax) * 0.82;
        d.vy = (d.vy + ay) * 0.82;
        d.x += d.vx;
        d.y += d.vy;
      }
      for (let c = 0; c < cols.length; c++)
        for (let ri = 0; ri < cols[c].length; ri++) {
          const d = cols[c][ri];
          const right = cols[c + 1]?.[ri];
          const down = cols[c]?.[ri + 1];
          const prox = m.active ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R) : 0;
          ctx.strokeStyle = accent;
          if (right) {
            ctx.globalAlpha = 0.05 + prox * 0.6;
            ctx.lineWidth = 0.5 + prox * 1.4;
            ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(right.x, right.y); ctx.stroke();
          }
          if (down) {
            ctx.globalAlpha = 0.05 + prox * 0.6;
            ctx.lineWidth = 0.5 + prox * 1.4;
            ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(down.x, down.y); ctx.stroke();
          }
        }
      ctx.fillStyle = accent;
      for (const d of dots) {
        const prox = m.active ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R) : 0;
        ctx.globalAlpha = 0.18 + prox * 0.7;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.8 + prox * 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      const now = performance.now();
      const tr = trail.current;
      ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1];
        const b = tr[i];
        const age = now - b.t;
        if (age > 260) continue;
        ctx.globalAlpha = Math.max(0, 1 - age / 260) * 0.7;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, [spacing, radius, strength]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
