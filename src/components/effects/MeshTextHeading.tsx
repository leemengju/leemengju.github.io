import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * MeshTextHeading (item 8) — the hero name rendered as a draggable mesh of
 * text: the glyphs are drawn to a texture and a 96×40 vertex grid is pulled
 * along the cursor's motion (spring + damping), so hovering "smears" the
 * letters and they spring back. Ported from the Originkit "Mesh Text Hover"
 * WebGL2 component (raw GL, no three.js) with these adaptations for a heading:
 *
 *   • SSR / first paint renders the real, plain <span> text (inherits the
 *     <h1>'s font-size/color), so the name is in the initial HTML — good LCP,
 *     no flash — and is the accessible, selectable heading. We upgrade to the
 *     canvas only after mount, and only when WebGL2 + a fine pointer are
 *     present and reduced-motion is off. Otherwise the plain text stays.
 *   • Font size and color are read from the live computed style of a hidden
 *     probe span, so the canvas text matches the heading at rest (the site
 *     uses system fonts, so canvas 2D and CSS render the same glyphs).
 *   • Text is drawn left-aligned to line up with the hero body; the canvas is
 *     over-sized vertically to give the drag room before it clips.
 *   • Chromatic split defaults off for a clean heading; pass colorSplit to
 *     enable the RGB-fringe flourish.
 */

const GRID_W = 96;
const GRID_H = 40;
const DRAG = 1.8;
const SPRING_K = 0.08;
const DAMPING = 0.9;
const DT = 0.1;
const CHROMA = 0.005;

const VERT_SRC = `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec2 aDisp;
out vec2 vUv;
out float vMag;
void main() {
    gl_Position = vec4(aPos + aDisp, 0.0, 1.0);
    vUv = aUv;
    vMag = length(aDisp);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
in float vMag;
out vec4 outColor;
uniform sampler2D uTex;
uniform float uChroma;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
    vec4 base = texture(uTex, vUv);
    if (uChroma > 0.0) {
        float o = uChroma * ${CHROMA.toFixed(5)} * clamp(vMag * 8.0, 0.0, 1.0);
        float aOff = texture(uTex, vUv + vec2(o, 0.0)).a;
        float bOff = texture(uTex, vUv - vec2(o, 0.0)).a;
        vec3 col = base.rgb * base.a;
        col += uColorA * max(0.0, aOff - base.a);
        col += uColorB * max(0.0, bOff - base.a);
        float aMax = max(base.a, max(aOff, bOff));
        outColor = vec4(col, aMax);
    } else {
        outColor = base;
    }
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function parseColor(v: string): [number, number, number] {
  const m = v.match(/rgba?\s*\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
  return [0.5, 0.5, 0.5];
}

export default function MeshTextHeading({
  text,
  colorSplit = false,
  force = 18,
}: {
  text: string;
  colorSplit?: boolean;
  force?: number;
}) {
  const [animated, setAnimated] = useState(false);
  const probeRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Decide, after mount, whether to upgrade the plain text to the mesh canvas.
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ok = false;
    try {
      const test = document.createElement('canvas');
      ok = !!test.getContext('webgl2');
    } catch {
      ok = false;
    }
    setAnimated(fine && !reduced && ok);
  }, []);

  useEffect(() => {
    if (!animated) return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const probe = probeRef.current;
    if (!canvas || !wrapper || !probe) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) return;

    // Read the heading's resolved look from the (hidden) probe span so the
    // canvas text matches the CSS heading at rest.
    const cs = getComputedStyle(probe);
    const cssFontSize = parseFloat(cs.fontSize) || 40;
    const fontWeight = cs.fontWeight || '700';
    const fontFamily = cs.fontFamily || 'system-ui, sans-serif';
    const color = cs.color || 'rgb(26,28,34)';

    // ── Grid geometry ──────────────────────────────────────────────────
    const vertCount = (GRID_W + 1) * (GRID_H + 1);
    const positions = new Float32Array(vertCount * 2);
    const uvs = new Float32Array(vertCount * 2);
    for (let y = 0; y <= GRID_H; y++) {
      for (let x = 0; x <= GRID_W; x++) {
        const i = y * (GRID_W + 1) + x;
        const u = x / GRID_W;
        const v = y / GRID_H;
        positions[i * 2] = u * 2 - 1;
        positions[i * 2 + 1] = 1 - v * 2;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
    }
    const indexCount = GRID_W * GRID_H * 6;
    const indices = new Uint32Array(indexCount);
    let idx = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const a = y * (GRID_W + 1) + x;
        const b = a + 1;
        const c = a + (GRID_W + 1);
        const d = c + 1;
        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;
        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }
    const disp = new Float32Array(vertCount * 2);
    const vel = new Float32Array(vertCount * 2);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const program = linkProgram(gl, vs, fs);
    if (!program) return;

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aUv = gl.getAttribLocation(program, 'aUv');
    const aDisp = gl.getAttribLocation(program, 'aDisp');
    const uTex = gl.getUniformLocation(program, 'uTex');
    const uChroma = gl.getUniformLocation(program, 'uChroma');
    const uColorA = gl.getUniformLocation(program, 'uColorA');
    const uColorB = gl.getUniformLocation(program, 'uColorB');

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    const dispBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
    gl.bufferData(gl.ARRAY_BUFFER, disp, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aDisp);
    gl.vertexAttribPointer(aDisp, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Draw the text left-aligned, vertically centered, into the current
    // canvas pixel buffer.
    const drawTex = () => {
      const w = Math.max(2, canvas.width);
      const h = Math.max(2, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const ctx = c2.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${fontWeight} ${cssFontSize * dpr}px ${fontFamily}`;
      ctx.fillText(String(text ?? ''), 2 * dpr, h / 2);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(2, Math.round(rect.width * dpr));
      const h = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      drawTex();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    const cursor = { x: 99, y: 99, px: 99, py: 99, vx: 0, vy: 0, inside: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const x = nx * 2 - 1;
      const y = 1 - ny * 2;
      if (!cursor.inside) {
        cursor.px = x;
        cursor.py = y;
        cursor.inside = true;
      }
      cursor.x = x;
      cursor.y = y;
    };
    const onLeave = () => {
      cursor.inside = false;
      cursor.x = 99;
      cursor.y = 99;
      cursor.vx = 0;
      cursor.vy = 0;
    };
    wrapper.addEventListener('pointermove', onMove);
    wrapper.addEventListener('pointerleave', onLeave);

    const fpull = typeof force === 'number' ? force / 10 : DRAG;
    let rafId = 0;
    const tick = () => {
      cursor.vx = cursor.x - cursor.px;
      cursor.vy = cursor.y - cursor.py;
      const vmag = Math.hypot(cursor.vx, cursor.vy);
      if (vmag > 0.3) {
        cursor.vx = 0;
        cursor.vy = 0;
      }
      cursor.px = cursor.x;
      cursor.py = cursor.y;

      for (let i = 0; i < vertCount; i++) {
        const i2 = i * 2;
        const px = positions[i2];
        const py = positions[i2 + 1];
        const dx = disp[i2];
        const dy = disp[i2 + 1];
        const cx = cursor.x - (px + dx);
        const cy = cursor.y - (py + dy);
        const cd = Math.hypot(cx, cy);
        const proximity = Math.max(0, 1 / (1 + cd / 0.05) - 0.1);

        let vx = vel[i2];
        let vy = vel[i2 + 1];
        vx += cursor.vx * fpull * proximity;
        vy += cursor.vy * fpull * proximity;
        vx -= dx * SPRING_K;
        vy -= dy * SPRING_K;
        vx *= DAMPING;
        vy *= DAMPING;
        vel[i2] = vx;
        vel[i2 + 1] = vy;

        let ndx = dx + vx * DT;
        let ndy = dy + vy * DT;
        if (ndx > 1) ndx = 1;
        else if (ndx < -1) ndx = -1;
        if (ndy > 1) ndy = 1;
        else if (ndy < -1) ndy = -1;
        disp[i2] = ndx;
        disp[i2 + 1] = ndy;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, disp);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTex, 0);
      gl.uniform1f(uChroma, colorSplit ? 1.0 : 0.0);
      const cA = parseColor(color);
      gl.uniform3f(uColorA, cA[0], cA[1], cA[2]);
      gl.uniform3f(uColorB, cA[0], cA[1], cA[2]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      wrapper.removeEventListener('pointermove', onMove);
      wrapper.removeEventListener('pointerleave', onLeave);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(dispBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteTexture(tex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [animated, text, colorSplit, force]);

  const srOnly: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  };

  return (
    <>
      {/* Accessible/selectable heading text — also the sizing probe. When the
          canvas is off it is fully visible; when on it is visually hidden but
          still read by assistive tech and used to resolve font/color. */}
      <span
        ref={probeRef}
        style={
          animated
            ? srOnly
            : { display: 'inline-block' }
        }
      >
        {text}
      </span>
      {animated && (
        <span
          ref={wrapperRef}
          aria-hidden="true"
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            // over-size vertically so drags have room before clipping; the
            // negative margins keep the heading's visual box the same height
            height: '2.1em',
            marginTop: '-0.55em',
            marginBottom: '-0.55em',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </span>
      )}
    </>
  );
}
