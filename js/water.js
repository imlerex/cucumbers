/**
 * ЦАРЬ-ОГУРЕЦ · Water Vibe & Audio Synthesizer Engine
 * Interactive fluid water ripples, rising fermentation bubbles, glass condensation droplets,
 * floating herbal spices in brine, and Web Audio API crisp crunch & splash synthesis.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('waterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let isVibeActive = true;
  let isSoundEnabled = false;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // =====================================================================
  // 1. RISING FERMENTATION / BRINE BUBBLES
  // =====================================================================
  const BUBBLE_COUNT = 38;
  const bubbles = [];

  class Bubble {
    constructor(initial = false) {
      this.reset(initial);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10 + Math.random() * 40;
      this.radius = 1.5 + Math.random() * 5.5;
      this.speed = 0.6 + Math.random() * 1.8;
      this.wobbleSpeed = 0.02 + Math.random() * 0.04;
      this.wobbleAmp = 0.8 + Math.random() * 2.2;
      this.wobbleAngle = Math.random() * Math.PI * 2;
      this.alpha = 0.15 + Math.random() * 0.45;
    }
    update(scrollBoost = 0) {
      this.wobbleAngle += this.wobbleSpeed;
      this.x += Math.sin(this.wobbleAngle) * (this.wobbleAmp * 0.4);
      this.y -= (this.speed + scrollBoost);

      if (this.y < -20) {
        this.reset(false);
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      // Bubble rim with brine tint
      ctx.strokeStyle = `rgba(163, 247, 190, ${this.alpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Translucent bubble body
      ctx.fillStyle = `rgba(200, 255, 230, ${this.alpha * 0.15})`;
      ctx.fill();

      // Specular shine on upper left
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.85})`;
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    bubbles.push(new Bubble(true));
  }

  // =====================================================================
  // 2. CHILLED GLASS CONDENSATION & WATER DROPLETS
  // =====================================================================
  const DROPLET_COUNT = 32;
  const droplets = [];

  class Droplet {
    constructor() {
      this.reset();
    }
    reset() {
      // Cling to sides and corners of viewport like on cold glass jar
      const onSide = Math.random() > 0.3;
      if (onSide) {
        this.x = Math.random() > 0.5 ? Math.random() * 70 : width - Math.random() * 70;
        this.y = Math.random() * height;
      } else {
        this.x = Math.random() * width;
        this.y = Math.random() * 80;
      }
      this.rx = 2.5 + Math.random() * 4.5;
      this.ry = this.rx * (1.1 + Math.random() * 0.6); // slight drip elongation
      this.alpha = 0.25 + Math.random() * 0.4;
      this.dripSpeed = Math.random() > 0.8 ? 0.05 + Math.random() * 0.15 : 0;
    }
    update() {
      if (this.dripSpeed > 0) {
        this.y += this.dripSpeed;
        if (this.y > height + 20) this.reset();
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.rx, this.ry, 0, 0, Math.PI * 2);

      // Droplet shadow
      ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha * 0.35})`;
      ctx.fill();

      // Glass drop highlight
      ctx.beginPath();
      ctx.ellipse(this.x - 0.8, this.y - 1.0, this.rx * 0.6, this.ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.75})`;
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < DROPLET_COUNT; i++) {
    droplets.push(new Droplet());
  }

  // =====================================================================
  // 3. INTERACTIVE WATER RIPPLES ON CURSOR & CLICK
  // =====================================================================
  const ripples = [];

  class Ripple {
    constructor(x, y, maxRadius = 130, strength = 0.65) {
      this.x = x;
      this.y = y;
      this.radius = 2;
      this.maxRadius = maxRadius;
      this.strength = strength;
      this.speed = 3.2;
    }
    update() {
      this.radius += this.speed;
      this.strength *= 0.96;
    }
    draw(ctx) {
      if (this.strength <= 0.01) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 232, 114, ${this.strength * 0.35})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38e872';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Secondary inner ring
      if (this.radius > 15) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(44, 229, 190, ${this.strength * 0.25})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function addRipple(x, y, maxRadius = 120, strength = 0.6) {
    if (!isVibeActive) return;
    if (ripples.length > 25) ripples.shift();
    ripples.push(new Ripple(x, y, maxRadius, strength));
  }

  // Mouse move creates subtle wake ripples
  let lastMoveTime = 0;
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastMoveTime > 65) {
      lastMoveTime = now;
      addRipple(e.clientX, e.clientY, 55, 0.28);
    }
  }, { passive: true });

  // Click creates dynamic splash ripples + sound
  window.addEventListener('click', (e) => {
    // Avoid ripples over buttons if preferred, or trigger everywhere for vibe
    addRipple(e.clientX, e.clientY, 150, 0.7);

    // Burst of micro-bubbles on click
    for (let i = 0; i < 4; i++) {
      const b = new Bubble();
      b.x = e.clientX + (Math.random() - 0.5) * 40;
      b.y = e.clientY + (Math.random() - 0.5) * 40;
      b.speed = 2.5 + Math.random() * 2.0;
      bubbles.push(b);
      if (bubbles.length > BUBBLE_COUNT + 15) bubbles.shift();
    }

    if (isSoundEnabled) {
      playSplash();
    }
  }, { passive: true });

  // Touch support for ripples
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      addRipple(e.touches[0].clientX, e.touches[0].clientY, 120, 0.6);
    }
  }, { passive: true });

  // =====================================================================
  // 4. PROCEDURAL WEB AUDIO SYNTHESIZER (NO EXTERNAL AUDIO FILES)
  // =====================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Realistic Pickle Crunch Sound Synthesis
  window.playCrunch = function () {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const t = audioCtx.currentTime;

      // Noise burst for crunchy texture
      const bufferSize = audioCtx.sampleRate * 0.14;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter for distinct crispy snap
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.Q.setValueAtTime(3.5, t);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start(t);

      // Low frequency pop (bite)
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      oscGain.gain.setValueAtTime(0.35, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {
      console.warn('Audio crunch error:', e);
    }
  };

  // Water Splash / Droplet Plop Sound Synthesis
  window.playSplash = function () {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // Pitch envelope: quick rise and drop
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  };

  // =====================================================================
  // 5. VIBE & SOUND TOGGLE CONTROLS
  // =====================================================================
  const soundBtn = document.getElementById('soundToggle');
  const vibeBtn = document.getElementById('vibeToggle');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      isSoundEnabled = !isSoundEnabled;
      soundBtn.textContent = isSoundEnabled ? '🔊' : '🔇';
      soundBtn.title = isSoundEnabled ? 'Звук: ВКЛ (Хруст и капли)' : 'Звук: ВЫКЛ';
      if (isSoundEnabled) {
        window.playCrunch();
      }
    });
  }

  if (vibeBtn) {
    vibeBtn.addEventListener('click', () => {
      isVibeActive = !isVibeActive;
      canvas.style.opacity = isVibeActive ? '1' : '0';
      vibeBtn.textContent = isVibeActive ? '💧' : '🫧';
      vibeBtn.title = isVibeActive ? 'Водный вайб: ВКЛ' : 'Водный вайб: ВЫКЛ';
      if (isSoundEnabled) window.playSplash();
    });
  }

  // =====================================================================
  // 6. ANIMATION LOOP
  // =====================================================================
  let lastScrollY = window.scrollY;

  function loop() {
    requestAnimationFrame(loop);

    ctx.clearRect(0, 0, width, height);

    if (!isVibeActive) return;

    // Detect scroll speed to boost bubbles
    const currentScrollY = window.scrollY;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;
    const scrollBoost = Math.min(scrollDelta * 0.12, 6.0);

    // 1. Draw Glass Condensation Droplets
    for (let i = 0; i < droplets.length; i++) {
      droplets[i].update();
      droplets[i].draw(ctx);
    }

    // 2. Draw Rising Brine Bubbles
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].update(scrollBoost);
      bubbles[i].draw(ctx);
    }

    // 3. Draw Water Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.update();
      r.draw(ctx);
      if (r.strength <= 0.01 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
      }
    }
  }

  requestAnimationFrame(loop);
})();
