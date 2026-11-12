/**
 * ЦАРЬ-ОГУРЕЦ · 3D Interactive WebGL Pickle Engine
 * Procedural raymarched 3D cucumber with organic bumps, longitudinal ribs,
 * wet brine clearcoat specular reflections, scroll-driven spin, and touch/drag physics.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('pickleCanvas');
  const container = document.getElementById('pickleViewport') || canvas.parentElement;
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
             canvas.getContext('experimental-webgl', { alpha: true });

  if (!gl) {
    console.warn('WebGL not supported, falling back to 2D canvas pickle.');
    setupFallback2D();
    return;
  }

  // --- Shaders ---
  const vsSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform vec2 u_rot;        // (x_rot, y_rot)
    uniform float u_time;
    uniform float u_scroll;
    uniform float u_scale;

    // Rotation around X and Y
    mat3 rotX(float a) {
      float c = cos(a), s = sin(a);
      return mat3(1.0, 0.0, 0.0,  0.0, c, -s,  0.0, s, c);
    }
    mat3 rotY(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c, 0.0, s,  0.0, 1.0, 0.0,  -s, 0.0, c);
    }
    mat3 rotZ(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c, -s, 0.0,  s, c, 0.0,  0.0, 0.0, 1.0);
    }

    // Hash for bumps
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    // Signed distance to the artisanal curved pickle
    // Returns vec2(distance, material_id)
    vec2 map(vec3 p) {
      // Apply overall 3D rotation
      mat3 r = rotX(u_rot.x) * rotY(u_rot.y) * rotZ(sin(u_time * 0.4) * 0.08);
      p = r * p;

      // Natural curved arch of cucumber
      float curve = 0.13 * (p.y * p.y - 1.2);
      p.x += curve;
      p.z += curve * 0.25;

      // Stem at top
      vec3 stemPos = p - vec3(-0.06, 1.62, 0.0);
      float stem = length(vec2(length(stemPos.xz) - (0.075 - stemPos.y * 0.03), max(0.0, abs(stemPos.y) - 0.18))) - 0.015;
      
      // Cucumber body taper
      float taper = 1.0 - 0.22 * smoothstep(0.4, 2.1, abs(p.y));

      // Longitudinal ribs (ridges)
      float angle = atan(p.z, p.x);
      float ribs = cos(angle * 7.0 + p.y * 0.35) * 0.032;

      // Organic tubercles (the crunchy bumps/pimples)
      float bumps = sin(p.x * 13.0) * sin(p.y * 14.0) * sin(p.z * 13.0) * 0.036;
      bumps += sin(p.x * 26.0 + 1.2) * sin(p.y * 28.0) * sin(p.z * 26.0) * 0.014;

      // Pickle body capsule
      float dBody = length(vec2(length(p.xz) - (0.58 * taper + ribs + bumps), max(0.0, abs(p.y) - 1.42))) - 0.045;

      if (stem < dBody) {
        return vec2(stem, 2.0); // Stem material
      }
      return vec2(dBody, 1.0);  // Pickle body material
    }

    // Normal calculation
    vec3 calcNormal(vec3 p) {
      vec2 e = vec2(0.003, 0.0);
      return normalize(vec3(
        map(p + e.xyy).x - map(p - e.xyy).x,
        map(p + e.yxy).x - map(p - e.yxy).x,
        map(p + e.yyx).x - map(p - e.yyx).x
      ));
    }

    void main() {
      // Normalized coordinates
      vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
      p *= 2.2 / u_scale; // Zoom scale

      // Ray origin & direction
      vec3 ro = vec3(0.0, 0.0, 4.4);
      vec3 rd = normalize(vec3(p, -1.8));

      // Raymarching loop
      float t = 0.5;
      float mat = 0.0;
      float hit = 0.0;
      for (int i = 0; i < 70; i++) {
        vec3 pos = ro + rd * t;
        vec2 res = map(pos);
        if (res.x < 0.002) {
          hit = 1.0;
          mat = res.y;
          break;
        }
        t += res.x * 0.85;
        if (t > 7.0) break;
      }

      if (hit > 0.5) {
        vec3 pos = ro + rd * t;
        vec3 N = calcNormal(pos);
        vec3 V = -rd;

        // Lights
        vec3 L1 = normalize(vec3(1.4, 2.2, 1.8));   // Main key light
        vec3 L2 = normalize(vec3(-1.8, -1.2, 0.8)); // Rim/fill light
        vec3 L3 = normalize(vec3(0.0, -2.0, -1.0)); // Cold cellar bounce

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);

        // Specular (wet clearcoat brine reflection)
        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 38.0);
        float specSharp = pow(max(dot(N, H1), 0.0), 120.0); // Wet glistening droplets

        // Fresnel (glowing brine rim)
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

        vec3 col = vec3(0.0);

        if (mat > 1.5) {
          // Stem material (brownish herbal cap)
          vec3 stemCol = vec3(0.24, 0.22, 0.11);
          col = stemCol * (diff1 * 0.9 + 0.25) + spec1 * 0.15;
        } else {
          // Pickle Body Material:
          // Gradient from deep pickled olive to fresh spring crunchy green
          float yNorm = clamp(pos.y * 0.35 + 0.5, 0.0, 1.0);
          vec3 baseGreen = mix(vec3(0.07, 0.24, 0.09), vec3(0.16, 0.44, 0.15), yNorm);

          // Pimple tip highlights (yellowish/golden dill hue)
          float pimpleGlow = max(0.0, dot(N, L1)) * 0.2;
          float tubercle = smoothstep(0.015, 0.04, abs(N.x * N.y * N.z) * 10.0);
          vec3 pimpleColor = vec3(0.75, 0.82, 0.22);
          col = mix(baseGreen, pimpleColor, tubercle * 0.25);

          // Diffuse + Ambient
          col = col * (diff1 * 0.85 + diff2 * 0.25 + 0.18);

          // Subsurface scattering translucency (crunchy brine flesh)
          float sss = max(0.0, dot(V, -L1)) * 0.35;
          col += vec3(0.2, 0.5, 0.18) * sss;

          // Wet brine highlights
          col += vec3(0.95, 1.0, 0.9) * (spec1 * 0.65 + specSharp * 0.85);

          // Fresnel emerald edge
          col += vec3(0.22, 0.92, 0.45) * fresnel * 0.55;
        }

        // Slight depth fog
        gl_FragColor = vec4(col, 1.0);
      } else {
        // Transparent background so the big text behind is visible!
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    }
  `;

  // --- Compile WebGL ---
  function createShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    setupFallback2D();
    return;
  }

  gl.useProgram(program);

  // Quad geometry
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations
  const uRes = gl.getUniformLocation(program, 'u_res');
  const uRot = gl.getUniformLocation(program, 'u_rot');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uScroll = gl.getUniformLocation(program, 'u_scroll');
  const uScale = gl.getUniformLocation(program, 'u_scale');

  // --- State & Interaction ---
  let rotX = 0.25;
  let rotY = 0.0;
  let velX = 0.0;
  let velY = 0.02;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let targetScale = 1.0;
  let currentScale = 1.0;

  // Resize handler
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // Mouse / Touch drag to spin pickle
  function onPointerDown(e) {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastMouseX = clientX;
    lastMouseY = clientY;
    velX = 0;
    velY = 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastMouseX;
    const dy = clientY - lastMouseY;

    velY = dx * 0.008;
    velX = dy * 0.008;
    rotY += velY;
    rotX += velX;

    lastMouseX = clientX;
    lastMouseY = clientY;
  }

  function onPointerUp() {
    isDragging = false;
  }

  container.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  container.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Wheel zoom / scale hint
  container.addEventListener('wheel', (e) => {
    // subtle scale reaction
    targetScale = Math.max(0.85, Math.min(1.25, targetScale - e.deltaY * 0.0005));
  }, { passive: true });

  // Expose spin trigger for product card buttons
  window.spinPickle = function (extraImpulse = 1.8) {
    velY += extraImpulse;
    targetScale = 1.15;
    setTimeout(() => { targetScale = 1.0; }, 400);
  };

  // --- Scroll-Driven Info Text Behind the Pickle ---
  const giantWords = [
    { title: 'Х Р У С Т', sub: '100% КРИСП · БЕЗ ХИМИИ' },
    { title: 'Р А С С О Л', sub: 'ЗОЛОТОЙ РЕЦЕПТ · ДУБОВЫЙ ЛИСТ' },
    { title: 'С Т Е К Л О', sub: 'ЗВОНКАЯ БАНКА · ХОЛОДНЫЙ ПОГРЕБ' },
    { title: 'К Р А Ф Т', sub: 'РУЧНОЙ СБОР · МАЛЫЕ ПАРТИИ' }
  ];

  const wordGiantEl = document.getElementById('wordGiant');
  const wordSubEl = document.getElementById('wordSub');

  let lastIndex = -1;
  function updateTextBehind() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, scrollY / (docHeight || 1)));

    // Scroll drives extra continuous rotation
    if (!isDragging) {
      rotY += 0.012; // Base spin
    }

    // Determine current text slide
    const idx = Math.min(giantWords.length - 1, Math.floor(progress * giantWords.length));
    if (idx !== lastIndex && wordGiantEl && wordSubEl) {
      lastIndex = idx;
      wordGiantEl.style.opacity = '0';
      wordGiantEl.style.transform = 'scale(0.92)';
      wordSubEl.style.opacity = '0';

      setTimeout(() => {
        wordGiantEl.textContent = giantWords[idx].title;
        wordSubEl.textContent = giantWords[idx].sub;
        wordGiantEl.style.opacity = '1';
        wordGiantEl.style.transform = 'scale(1)';
        wordSubEl.style.opacity = '1';
      }, 160);
    }
  }

  window.addEventListener('scroll', updateTextBehind, { passive: true });

  // --- Main Animation Loop ---
  let startTime = performance.now();
  let lastScrollY = window.scrollY;

  function render(now) {
    requestAnimationFrame(render);

    const time = (now - startTime) * 0.001;

    // React to scroll velocity
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (!isDragging) {
      // Add scroll velocity to pickle spin!
      rotY += scrollDelta * 0.005;
      // Damping on drag inertia
      velX *= 0.94;
      velY *= 0.94;
      rotX += velX;
      rotY += velY;

      // Natural idle floating motion
      rotX = 0.2 + Math.sin(time * 0.8) * 0.08;
    }

    // Smooth scale lerp
    currentScale += (targetScale - currentScale) * 0.08;

    // Send uniforms
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uRot, rotX, rotY);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uScroll, currentScrollY);
    gl.uniform1f(uScale, currentScale);

    // Render quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  requestAnimationFrame(render);

  // --- Fallback 2D Renderer (In case WebGL is disabled) ---
  function setupFallback2D() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let angle = 0;
    function draw2DFallback() {
      requestAnimationFrame(draw2DFallback);
      const w = canvas.width = container.clientWidth;
      const h = canvas.height = container.clientHeight;
      ctx.clearRect(0, 0, w, h);

      angle += 0.02 + (window.scrollY * 0.0001);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.sin(angle * 0.5) * 0.15);
      ctx.scale(Math.cos(angle) * 0.8 + 0.2, 1);

      // Pickle gradient body
      const grad = ctx.createLinearGradient(-80, -180, 80, 180);
      grad.addColorStop(0, '#2e7d46');
      grad.addColorStop(0.5, '#4aa844');
      grad.addColorStop(1, '#1b5e20');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-50, -140, 100, 280, 50) : ctx.rect(-50, -140, 100, 280);
      ctx.fill();

      // Bumps
      ctx.fillStyle = '#f2b632';
      ctx.beginPath();
      ctx.arc(-20, -60, 6, 0, Math.PI * 2);
      ctx.arc(15, 30, 7, 0, Math.PI * 2);
      ctx.arc(-10, 80, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    requestAnimationFrame(draw2DFallback);
  }
})();
