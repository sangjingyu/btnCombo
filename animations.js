// =============================================
// Canvas Animations — Level 1~10
// =============================================

export class HopeAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = 1;
    this.intensity = 0; // 0~1 within current level
    this.t = 0;
    this.W = canvas.offsetWidth || 300;
    this.H = canvas.offsetHeight || 400;

    // Level 1 — seed state
    this._shockwaves = [];      // ground shockwaves on click
    this._soilParticles = [];   // soil dust particles
    this._seedPulse = 0;        // 0..1, spikes on click, decays
    this._seedGlow = 0;         // accumulated glow 0..1
    this._rootLines = [];       // tiny roots that grow over time
    this._clickCount = 0;       // raw click count for level1

    // Level 2 — rain state
    this._rainDrops = [];        // active front-layer drops
    this._rainDropsBack = [];    // back-layer (dimmer, slower)
    this._rainSplats = [];       // splash rings at floor
    this._rainIntensity = 0;     // 0..1, grows with clicks, decays slowly
    this._rainClickBoost = 0;    // immediate spike per click

    // Other levels
    this.particles = [];
    this.trees = [];
    this.butterflies = [];
    this.hearts = [];
    this.stars = [];
    this._initParticles();
    this._raf = null;
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth * devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.W = this.canvas.offsetWidth;
    this.H = this.canvas.offsetHeight;
  }

  setLevel(level, intensity) {
    this.level = level;
    this.intensity = intensity;
    if (level >= 6 && this.trees.length === 0) this._initTrees();
    if (level >= 7) this._initButterflies();
    if (level >= 9) this._initHearts();
    if (level >= 10) this._initStars();
  }

  // Called by main.js on every button click
  triggerClick() {
    this._clickCount++;

    if (this.level === 1) {
      const { W, H } = this;
      const groundY = H * 0.62;
      const seedX = W / 2;
      const seedY = groundY + H * 0.12;

      // Shockwave ring from seed position
      this._shockwaves.push({
        x: seedX, y: seedY,
        r: 0,
        maxR: 30 + Math.random() * 40,
        alpha: 0.8,
        speed: 1.2 + Math.random() * 0.8,
      });

      // Also a surface shockwave along the ground
      this._shockwaves.push({
        x: seedX, y: groundY,
        r: 0,
        maxR: 60 + Math.random() * 60,
        alpha: 0.5,
        speed: 2.5 + Math.random(),
        surface: true,
      });

      // Burst soil particles upward from ground surface
      const burstCount = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < burstCount; i++) {
        const angle = -Math.PI + Math.random() * Math.PI; // upward half
        const speed = 0.5 + Math.random() * 2.5;
        this._soilParticles.push({
          x: seedX + (Math.random() - 0.5) * 20,
          y: groundY - 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          r: 1.5 + Math.random() * 2.5,
          alpha: 0.9,
          gravity: 0.08,
          hue: 20 + Math.random() * 20,
          sat: 40 + Math.random() * 30,
          lit: 25 + Math.random() * 20,
        });
      }

      // Spike seed pulse
      this._seedPulse = 1.0;

      // Accumulate glow
      this._seedGlow = Math.min(1, this._seedGlow + 0.04);

      // Grow a tiny root segment occasionally
      if (this._clickCount % 3 === 0) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const len = 4 + Math.random() * 8;
        const last = this._rootLines[this._rootLines.length - 1];
        const startX = last ? last.ex : seedX;
        const startY = last ? last.ey : seedY;
        this._rootLines.push({
          sx: startX,
          sy: startY,
          ex: startX + Math.cos(angle) * len,
          ey: startY + Math.sin(angle) * len,
          alpha: 0,
          side: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    if (this.level === 2) {
      // Boost rain intensity on click
      this._rainClickBoost = Math.min(1, this._rainClickBoost + 0.18);
      this._rainIntensity = Math.min(1, this._rainIntensity + 0.05);
      // Spawn a burst of drops from click
      const burstCount = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < burstCount; i++) {
        this._spawnRainDrop(Math.random() > 0.4);
      }
    }
  }

  start() {
    const loop = () => {
      this.t += 0.016;
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  // =============================================
  _initParticles() {
    this.particles = Array.from({ length: 80 }, () => this._newParticle());
  }

  _newParticle(fromBottom = false) {
    return {
      x: Math.random() * 400,
      y: fromBottom ? 420 + Math.random() * 50 : Math.random() * 400,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.8 + 0.3),
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      hue: Math.random() * 40 + 30,
    };
  }

  _initTrees() { this.trees = [{ x: 0.5, size: 0 }]; }

  _initButterflies() {
    if (this.butterflies.length < 5) {
      this.butterflies = Array.from({ length: 6 }, (_, i) => ({
        x: Math.random(), y: Math.random() * 0.6 + 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.003,
        size: 8 + Math.random() * 6,
        color: ['#f4c97a','#ff9eb5','#b8f0a0','#a0d8ef'][Math.floor(Math.random()*4)],
      }));
    }
  }

  _initHearts() {
    this.hearts = Array.from({ length: 20 }, () => ({
      x: Math.random(), y: 1 + Math.random() * 0.5,
      vy: -(0.001 + Math.random() * 0.002),
      size: 6 + Math.random() * 10,
      alpha: Math.random() * 0.7 + 0.3,
      color: ['#ff6b9d','#ff4757','#ffa502','#ff6348'][Math.floor(Math.random()*4)],
    }));
  }

  _initStars() {
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  // =============================================
  _draw() {
    const { ctx, W, H, t, level, intensity } = this;
    ctx.clearRect(0, 0, W, H);
    this._drawBackground();

    if (level === 1)      this._drawLevel1();
    else if (level === 2) this._drawLevel2();
    else if (level === 3) this._drawLevel3();
    else if (level === 4) this._drawLevel4();
    else if (level === 5) this._drawLevel5();
    else if (level === 6) this._drawLevel6();
    else if (level === 7) this._drawLevel7();
    else if (level >= 8)  this._drawLevel8to10();
  }

  // =============================================
  _drawBackground() {
    const { ctx, W, H, level, intensity, t } = this;
    let c1, c2;

    if (level === 1) {
      // Deep underground dark soil — subtly warms as intensity rises
      c1 = `hsl(25,${30 + intensity * 20}%,${4 + intensity * 6}%)`;
      c2 = `hsl(20,${20 + intensity * 15}%,${6 + intensity * 8}%)`;
    } else if (level === 2) {
      // Storm sky: darker & more saturated as rain intensifies with clicks
      const storm = Math.min(1, intensity + this._rainClickBoost * 0.6);
      c1 = `hsl(215,${40 + storm * 20}%,${5 + storm * 8}%)`;
      c2 = `hsl(220,${35 + storm * 25}%,${8 + storm * 10}%)`;
    } else if (level === 3) {
      const dawn = intensity * 0.5;
      c1 = `hsl(${30 + dawn * 20},${60 + dawn * 20}%,${15 + intensity * 20}%)`;
      c2 = `hsl(200,40%,${10 + intensity * 15}%)`;
    } else if (level === 4) {
      c1 = `hsl(25,50%,${15 + intensity * 15}%)`;
      c2 = `hsl(15,40%,${8 + intensity * 10}%)`;
    } else if (level >= 5 && level <= 6) {
      c1 = `hsl(${120 + intensity * 20},${40 + intensity * 20}%,${10 + intensity * 20}%)`;
      c2 = `hsl(90,30%,${5 + intensity * 10}%)`;
    } else if (level === 7) {
      c1 = `hsl(130,50%,${20 + intensity * 15}%)`;
      c2 = `hsl(60,40%,${10 + intensity * 10}%)`;
    } else if (level === 8) {
      c1 = `hsl(${200 + intensity * 30},${50 + intensity * 20}%,${15 + intensity * 30}%)`;
      c2 = `hsl(240,40%,${8 + intensity * 15}%)`;
    } else if (level === 9) {
      c1 = `hsl(${t * 20 % 360},60%,${40 + intensity * 20}%)`;
      c2 = `hsl(${(t * 20 + 120) % 360},50%,${20 + intensity * 15}%)`;
    } else {
      c1 = `hsl(${t * 15 % 360},70%,${30 + Math.sin(t) * 10}%)`;
      c2 = `hsl(${(t * 15 + 180) % 360},60%,${10 + Math.sin(t * 0.5) * 5}%)`;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // =============================================
  // LEVEL 1 — Seed underground, trembles on click
  // =============================================
  _drawLevel1() {
    const { ctx, W, H, t, intensity } = this;

    const groundY  = H * 0.62;
    const seedX    = W / 2;
    const seedY    = groundY + H * 0.12;
    const seedR    = 7 + intensity * 5; // seed grows slightly with intensity

    // ── 1. Underground soil layers ──
    this._drawSoilLayers(groundY);

    // ── 2. Faint warmth aura deep in soil (seed's life energy) ──
    const glowR = 18 + this._seedGlow * 55 + Math.sin(t * 1.8) * 4;
    const glowAlpha = 0.06 + this._seedGlow * 0.22 + Math.sin(t * 1.8) * 0.04;
    const grd = ctx.createRadialGradient(seedX, seedY, 0, seedX, seedY, glowR);
    grd.addColorStop(0, `rgba(255,210,80,${glowAlpha})`);
    grd.addColorStop(0.5, `rgba(200,140,40,${glowAlpha * 0.5})`);
    grd.addColorStop(1, 'rgba(180,100,20,0)');
    ctx.beginPath();
    ctx.arc(seedX, seedY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // ── 3. Underground shockwaves ──
    this._shockwaves = this._shockwaves.filter(sw => sw.alpha > 0.01);
    for (const sw of this._shockwaves) {
      sw.r += sw.speed;
      sw.alpha *= 0.88;
      ctx.beginPath();
      if (sw.surface) {
        ctx.ellipse(sw.x, sw.y, sw.r, sw.r * 0.22, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      }
      ctx.strokeStyle = `rgba(180,120,40,${sw.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // ── 4. Root tendrils ──
    for (const root of this._rootLines) {
      root.alpha = Math.min(1, root.alpha + 0.04);
      ctx.beginPath();
      ctx.moveTo(root.sx, root.sy);
      // slight curve
      const mx = (root.sx + root.ex) / 2 + root.side * 4;
      const my = (root.sy + root.ey) / 2;
      ctx.quadraticCurveTo(mx, my, root.ex, root.ey);
      ctx.strokeStyle = `rgba(100,70,30,${root.alpha * 0.6})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // ── 5. Soil particles (burst on click) ──
    this._soilParticles = this._soilParticles.filter(p => p.alpha > 0.02);
    for (const p of this._soilParticles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity;
      p.alpha *= 0.93;
      p.vx  *= 0.97;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${p.alpha})`;
      ctx.fill();
    }

    // ── 6. The seed itself ──
    const pulse = this._seedPulse;
    this._seedPulse = Math.max(0, this._seedPulse - 0.045); // decay

    const scalePop = 1 + pulse * 0.35;
    const extraGlow = pulse * 18;

    ctx.save();
    ctx.translate(seedX, seedY);
    ctx.scale(scalePop, scalePop);

    // outer soft halo
    const haloR = seedR + 8 + extraGlow;
    const hg = ctx.createRadialGradient(0, 0, seedR * 0.5, 0, 0, haloR);
    hg.addColorStop(0, `rgba(255,210,80,${0.15 + pulse * 0.3})`);
    hg.addColorStop(1, 'rgba(255,180,40,0)');
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();

    // seed body — oval, dark brown with warm highlight
    ctx.beginPath();
    ctx.ellipse(0, 0, seedR * 0.65, seedR, 0.15, 0, Math.PI * 2);
    const sg = ctx.createRadialGradient(-seedR * 0.2, -seedR * 0.3, 0, 0, 0, seedR);
    sg.addColorStop(0, `rgba(200,150,70,${0.85 + pulse * 0.15})`);
    sg.addColorStop(0.5, `rgba(120,75,30,0.9)`);
    sg.addColorStop(1, `rgba(60,35,10,0.95)`);
    ctx.fillStyle = sg;
    ctx.fill();

    // seed highlight ridge
    ctx.beginPath();
    ctx.ellipse(-seedR * 0.05, -seedR * 0.25, seedR * 0.12, seedR * 0.45, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,200,120,${0.3 + pulse * 0.2})`;
    ctx.fill();

    ctx.restore();

    // ── 7. Ground surface line + faint grass horizon ──
    this._drawGroundSurface(groundY);

    // ── 8. Tiny soil grain ambient particles above ground ──
    this._drawSoilDust(groundY, intensity);
  }

  _drawSoilLayers(groundY) {
    const { ctx, W, H, intensity } = this;

    // Sky / above-ground area: very dark, barely lit
    const skyG = ctx.createLinearGradient(0, 0, 0, groundY);
    skyG.addColorStop(0, `rgba(5,5,8,0.95)`);
    skyG.addColorStop(1, `rgba(15,10,5,0.5)`);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, groundY);

    // Underground layers — rich soil strata
    const layers = [
      { y: groundY,           h: H * 0.10, c: [35, 45, 15] },
      { y: groundY + H*0.10,  h: H * 0.10, c: [28, 40, 12] },
      { y: groundY + H*0.20,  h: H * 0.15, c: [22, 35, 10] },
      { y: groundY + H*0.35,  h: H * 0.20, c: [18, 28,  8] },
    ];

    for (const l of layers) {
      const wm = 0.85 + intensity * 0.15;
      ctx.fillStyle = `hsl(${l.c[0]},${l.c[1]}%,${l.c[2] * wm}%)`;
      ctx.fillRect(0, l.y, W, l.h);
    }

    // Fine soil texture dots
    ctx.save();
    ctx.globalAlpha = 0.12 + intensity * 0.08;
    for (let i = 0; i < 60; i++) {
      const tx = (i * 97.3 + 17) % W;
      const ty = groundY + ((i * 61.7) % (H - groundY));
      ctx.beginPath();
      ctx.arc(tx, ty, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? '#6b4a28' : '#3a2810';
      ctx.fill();
    }
    ctx.restore();
  }

  _drawGroundSurface(groundY) {
    const { ctx, W, H, t, intensity } = this;

    // Slightly uneven ground line
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 4) {
      const y = groundY + Math.sin(x * 0.04 + t * 0.3) * 2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    // this just redraws top soil
    ctx.fillStyle = `hsl(30,38%,${13 + intensity * 4}%)`;
    ctx.fill();

    // Thin top-soil highlight line
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 4) {
      ctx.lineTo(x, groundY + Math.sin(x * 0.04 + t * 0.3) * 2);
    }
    ctx.strokeStyle = `rgba(100,75,40,${0.5 + intensity * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawSoilDust(groundY, intensity) {
    const { ctx, W, t } = this;
    // Tiny floating dust motes just above surface
    ctx.save();
    ctx.globalAlpha = 0.25 + intensity * 0.2;
    for (let i = 0; i < 18; i++) {
      const x = (i * 113.7 + t * 6) % W;
      const y = groundY - 5 - ((t * 8 + i * 31) % 25);
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(28,35%,40%)`;
      ctx.fill();
    }
    ctx.restore();
  }

  // =============================================
  // LEVEL 2 — Rain (stem + splat, front/back layers)
  // Inspired by: codepen.io/arickle/pen/XKjMZY
  // Click-reactive: more clicks = heavier rain
  // =============================================
  _spawnRainDrop(isBack = false) {
    const { W, H } = this;
    const ri = this._rainIntensity;
    // thickness grows with intensity (like "굵어짐")
    const baseThick = isBack ? 0.5 : 1.0;
    const thick = baseThick + ri * (isBack ? 1.0 : 2.5);
    const speed = (isBack ? 4 : 7) + ri * (isBack ? 4 : 8) + Math.random() * 3;
    const len   = (isBack ? 10 : 18) + ri * (isBack ? 20 : 35) + Math.random() * 10;
    const drop = {
      x:     Math.random() * (W + 40) - 20,
      y:     -len - Math.random() * H * 0.5,
      vy:    speed,
      len,
      thick,
      alpha: isBack ? 0.15 + ri * 0.25 : 0.35 + ri * 0.45,
      isBack,
      splat: false,
    };
    if (isBack) this._rainDropsBack.push(drop);
    else        this._rainDrops.push(drop);
  }

  _drawLevel2() {
    const { ctx, W, H, t, intensity } = this;

    // ── Decay / auto-spawn ──
    // intensity passively follows click accumulation
    this._rainIntensity = Math.max(intensity * 0.3, Math.min(1, this._rainIntensity));
    this._rainClickBoost = Math.max(0, this._rainClickBoost - 0.025);

    const ri = this._rainIntensity + this._rainClickBoost * 0.5;
    const targetFront = Math.floor(15 + ri * 120);
    const targetBack  = Math.floor(8  + ri * 60);

    // Spawn to reach target counts
    while (this._rainDrops.length < targetFront)     this._spawnRainDrop(false);
    while (this._rainDropsBack.length < targetBack)  this._spawnRainDrop(true);

    // ── Draw back layer (dimmer, behind) ──
    this._updateAndDrawDrops(this._rainDropsBack, true);

    // ── Fog / rain atmosphere ──
    this._drawRainAtmosphere(ri);

    // ── Draw front layer ──
    this._updateAndDrawDrops(this._rainDrops, false);

    // ── Splat rings ──
    this._drawRainSplats();
  }

  _updateAndDrawDrops(drops, isBack) {
    const { ctx, H } = this;
    const floorY = H - 8;

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.vy;

      if (d.y + d.len >= floorY) {
        // Hit the floor — spawn splat then remove
        if (!d.splat) {
          d.splat = true;
          if (!isBack) {
            this._rainSplats.push({
              x: d.x,
              y: floorY,
              r: 0,
              maxR: 4 + d.thick * 3 + Math.random() * 6,
              alpha: d.alpha * 0.8,
              speed: 0.6 + Math.random() * 0.4,
            });
          }
        }
        drops.splice(i, 1);
        continue;
      }

      // Draw stem — gradient fade top→bottom (like the pen's .stem)
      const x1 = d.x;
      const y1 = d.y;
      const x2 = d.x - d.vy * 0.15; // slight angle
      const y2 = d.y + d.len;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0,   `rgba(174,214,255,0)`);
      grad.addColorStop(0.5, `rgba(174,214,255,${d.alpha * 0.5})`);
      grad.addColorStop(1,   `rgba(200,230,255,${d.alpha})`);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.thick;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  _drawRainSplats() {
    const { ctx } = this;
    for (let i = this._rainSplats.length - 1; i >= 0; i--) {
      const s = this._rainSplats[i];
      s.r += s.speed;
      s.alpha -= 0.04;
      if (s.alpha <= 0) { this._rainSplats.splice(i, 1); continue; }

      // Dotted ellipse arc (like the pen's .splat border-top dotted)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.35, 0, Math.PI, 0); // top half only
      ctx.strokeStyle = `rgba(200,230,255,${s.alpha})`;
      ctx.lineWidth = 1;
      // Dashed effect
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  _drawRainAtmosphere(ri) {
    const { ctx, W, H } = this;
    // Subtle blue-grey mist at bottom
    const mistH = 60 + ri * 80;
    const mg = ctx.createLinearGradient(0, H - mistH, 0, H);
    mg.addColorStop(0, 'rgba(120,150,180,0)');
    mg.addColorStop(1, `rgba(100,130,160,${0.06 + ri * 0.12})`);
    ctx.fillStyle = mg;
    ctx.fillRect(0, H - mistH, W, mistH);

    // Rain streaks overlay — gives "sheet of rain" feel at high intensity
    if (ri > 0.5) {
      ctx.save();
      ctx.globalAlpha = (ri - 0.5) * 0.15;
      const sg = ctx.createLinearGradient(0, 0, 0, H);
      sg.addColorStop(0, 'rgba(174,214,255,0)');
      sg.addColorStop(0.5, 'rgba(174,214,255,0.3)');
      sg.addColorStop(1, 'rgba(174,214,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // =============================================
  // LEVEL 3 — Sun
  // =============================================
  _drawLevel3() {
    const { ctx, W, H, t, intensity } = this;
    const cx = W / 2, cy = H * 0.3;
    const sunR = 25 + intensity * 25;
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + t * 0.3;
      const inner = sunR + 8;
      const outer = sunR + 20 + intensity * 30 + Math.sin(t * 2 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = `rgba(255,220,100,${0.3 + intensity * 0.5})`;
      ctx.lineWidth = 2 + intensity * 2; ctx.stroke();
    }
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
    sg.addColorStop(0, '#fff9c0'); sg.addColorStop(0.5, '#ffd030'); sg.addColorStop(1, 'rgba(255,160,0,0.5)');
    ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.25;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * W, cy + Math.sin(angle) * H * 1.5);
      const shaftGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * W * 0.5, cy + Math.sin(angle) * H);
      shaftGrad.addColorStop(0, `rgba(255,220,100,${0.15 * intensity})`); shaftGrad.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.strokeStyle = shaftGrad; ctx.lineWidth = 40 - Math.abs(i - 2) * 8; ctx.stroke();
    }
    this._drawParticles();
  }

  // =============================================
  // LEVEL 4 — Cracking ground
  // =============================================
  _drawLevel4() {
    const { ctx, W, H, t, intensity } = this;
    const groundY = H * 0.65;
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, `rgba(80,50,20,${0.6 + intensity * 0.3})`);
    gg.addColorStop(1, 'rgba(40,25,10,0.9)');
    ctx.fillStyle = gg; ctx.fillRect(0, groundY, W, H - groundY);
    const crackCount = Math.floor(2 + intensity * 6);
    const crackSeeds = [[0.2,0.7],[0.5,0.8],[0.8,0.72],[0.35,0.9],[0.65,0.85],[0.1,0.95],[0.9,0.78]];
    for (let c = 0; c < Math.min(crackCount, crackSeeds.length); c++) {
      const [sx, sy] = crackSeeds[c];
      ctx.beginPath(); ctx.moveTo(W * sx, H * sy);
      let cx2 = W * sx, cy2 = H * sy;
      for (let s = 0; s < 4 + c; s++) {
        cx2 += (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 15);
        cy2 += Math.random() * 12 + 5; ctx.lineTo(cx2, cy2);
      }
      ctx.strokeStyle = `rgba(255,${100 + intensity * 80},0,${0.4 + intensity * 0.5})`;
      ctx.lineWidth = 1.5 + intensity; ctx.stroke();
      ctx.strokeStyle = `rgba(255,${150 + intensity * 50},50,${0.2 * intensity})`;
      ctx.lineWidth = 4; ctx.stroke();
    }
    this._drawParticles();
    this._drawSun(intensity * 0.5);
  }

  // =============================================
  // LEVEL 5 — Leaves
  // =============================================
  _drawLevel5() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(0.5 + intensity * 0.3);
    this._drawGround(intensity);
    const leafCount = Math.floor(3 + intensity * 15);
    for (let i = 0; i < leafCount; i++) {
      const baseX = W * 0.5 + (i - leafCount / 2) * 25;
      const baseY = H * 0.6 - intensity * 80 - i * 8;
      const sway = Math.sin(t * 3 + i) * (5 + intensity * 15);
      const size = (4 + intensity * 12) * (1 + Math.sin(t + i) * 0.2);
      this._drawLeaf(ctx, baseX + sway, baseY, size, Math.sin(t + i) * 0.5, intensity);
    }
    this._drawParticles();
  }

  // =============================================
  // LEVEL 6 — Tree
  // =============================================
  _drawLevel6() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(0.8); this._drawGround(1);
    const treeH = intensity * H * 0.45;
    this._drawTree(ctx, W / 2, H * 0.65, treeH, intensity, t, 0);
    this._drawParticles();
  }

  // =============================================
  // LEVEL 7 — Forest + butterflies
  // =============================================
  _drawLevel7() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(1); this._drawGround(1);
    const treeCount = Math.floor(1 + intensity * 6);
    const positions = [0.5, 0.25, 0.75, 0.12, 0.88, 0.38, 0.62];
    for (let i = 0; i < Math.min(treeCount, positions.length); i++) {
      const scale = 0.7 + (i === 0 ? 0.3 : 0);
      this._drawTree(ctx, W * positions[i], H * 0.65, H * 0.35 * scale, 1, t, i);
    }
    this._drawButterflies(); this._drawParticles();
  }

  // =============================================
  // LEVEL 8-10 — Earth / cosmos
  // =============================================
  _drawLevel8to10() {
    const { ctx, W, H, t, level, intensity } = this;
    const cx = W / 2, cy = H / 2;
    const earthR = Math.min(W, H) * 0.32;
    if (level === 10 && this.stars.length) {
      this.stars.forEach(s => {
        s.twinkle += 0.02;
        const a = (Math.sin(s.twinkle) * 0.5 + 0.5) * 0.8 + 0.1;
        ctx.beginPath(); ctx.arc(W * s.x, H * s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      });
    }
    const glowR = earthR * (1.2 + Math.sin(t) * 0.05);
    const glowAlpha = 0.1 + (level === 8 ? intensity * 0.4 : 0.5);
    const glowG = ctx.createRadialGradient(cx, cy, earthR * 0.8, cx, cy, glowR * 1.5);
    glowG.addColorStop(0, `rgba(100,200,255,${glowAlpha})`); glowG.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, glowR * 1.5, 0, Math.PI * 2); ctx.fillStyle = glowG; ctx.fill();
    const earthBright = level === 8 ? intensity * 0.6 : 0.7;
    const earthG = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, 0, cx, cy, earthR);
    earthG.addColorStop(0, `hsl(200,${60 + earthBright * 30}%,${30 + earthBright * 40}%)`);
    earthG.addColorStop(0.5, `hsl(220,${50 + earthBright * 20}%,${20 + earthBright * 30}%)`);
    earthG.addColorStop(1, `hsl(240,40%,${10 + earthBright * 20}%)`);
    ctx.beginPath(); ctx.arc(cx, cy, earthR, 0, Math.PI * 2); ctx.fillStyle = earthG; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, earthR, 0, Math.PI * 2); ctx.clip();
    const contAlpha = 0.3 + earthBright * 0.5;
    ctx.fillStyle = `rgba(50,160,70,${contAlpha})`;
    [[0.35,0.4,0.22,0.18],[0.6,0.55,0.15,0.12],[0.45,0.65,0.12,0.1],[0.2,0.6,0.1,0.08],[0.75,0.35,0.1,0.09]].forEach(([rx,ry,rw,rh]) => {
      ctx.beginPath(); ctx.ellipse(cx + earthR*(rx-0.5)*2, cy + earthR*(ry-0.5)*2, earthR*rw, earthR*rh, Math.random()*0.5, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
    if (level >= 9) {
      this.hearts.forEach(h => {
        h.y += h.vy;
        if (h.y < -0.1) { h.y = 1.1; h.x = Math.random(); }
        this._drawHeart(ctx, W * h.x, H * h.y, h.size, h.color, h.alpha);
      });
    }
    if (level === 10) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.3;
        const orbitR = earthR * 1.5 + Math.sin(t + i) * 10;
        this._drawHeart(ctx, cx + Math.cos(angle)*orbitR, cy + Math.sin(angle)*orbitR, 10 + Math.sin(t*2+i)*3, '#ff6b9d', 0.8);
      }
    }
    this._drawParticles();
  }

  // =============================================
  // Shared helpers
  // =============================================
  _drawParticles() {
    const { ctx, W, H, level, intensity } = this;
    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10 || p.x < -10 || p.x > W + 10) {
        this.particles[i] = this._newParticle(true);
        this.particles[i].x = Math.random() * W;
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha * (0.3 + intensity * 0.5)})`;
      ctx.fill();
    });
  }

  _drawGround(intensity) {
    const { ctx, W, H } = this;
    const gy = H * 0.65;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, `rgba(30,${80 + intensity * 60},20,${0.7 + intensity * 0.2})`);
    gg.addColorStop(1, 'rgba(15,40,10,0.9)');
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
  }

  _drawSun(alpha) {
    const { ctx, W, H, t } = this;
    const cx = W * 0.5, cy = H * 0.15, r = 20 + alpha * 15;
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    sg.addColorStop(0, `rgba(255,250,180,${alpha})`);
    sg.addColorStop(0.4, `rgba(255,200,50,${alpha * 0.7})`);
    sg.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 2, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
  }

  _drawLeaf(ctx, x, y, size, angle, intensity) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, -size / 2, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
    const green = Math.floor(120 + intensity * 80);
    ctx.fillStyle = `rgba(40,${green},30,0.85)`; ctx.fill();
    ctx.strokeStyle = `rgba(60,${green + 20},40,0.5)`; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
  }

  _drawTree(ctx, x, baseY, height, maturity, t, seed) {
    if (height <= 0) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(80,50,20,0.9)';
    ctx.lineWidth = Math.max(1, height * 0.04); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - height * 0.45); ctx.stroke();
    this._drawBranch(ctx, x, baseY - height * 0.45, height * 0.4, -Math.PI / 2, maturity, t, 0, seed);
    ctx.restore();
  }

  _drawBranch(ctx, x, y, len, angle, maturity, t, depth, seed) {
    if (len < 6 || depth > 3) return;
    const sway = Math.sin(t * 1.2 + depth * 0.8 + seed) * 0.08;
    const ex = x + Math.cos(angle + sway) * len;
    const ey = y + Math.sin(angle + sway) * len;
    ctx.lineWidth = Math.max(0.5, len * 0.05);
    ctx.strokeStyle = `rgba(${60 + depth*10},${35 + depth*5},15,0.8)`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    if (depth < 3) {
      const spread = 0.5 + maturity * 0.3;
      this._drawBranch(ctx, ex, ey, len * 0.65, angle - spread, maturity, t, depth + 1, seed);
      this._drawBranch(ctx, ex, ey, len * 0.65, angle + spread, maturity, t, depth + 1, seed);
      if (depth < 2) this._drawBranch(ctx, ex, ey, len * 0.5, angle, maturity, t, depth + 1, seed);
    } else {
      const leafCount = Math.floor(3 + maturity * 4);
      for (let i = 0; i < leafCount; i++) {
        const la = angle + (Math.random() - 0.5) * Math.PI;
        ctx.beginPath();
        ctx.arc(ex + Math.cos(la)*(Math.random()*12+4), ey + Math.sin(la)*(Math.random()*8+4), 3 + Math.random()*3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${30+Math.random()*20},${120+Math.random()*60},30,0.7)`; ctx.fill();
      }
    }
  }

  _drawButterflies() {
    const { ctx, W, H, t } = this;
    this.butterflies.forEach(b => {
      b.x += Math.sin(t * b.speed * 200 + b.phase) * 0.002;
      b.y += Math.cos(t * b.speed * 150 + b.phase) * 0.001;
      b.x = ((b.x % 1) + 1) % 1;
      b.y = Math.max(0.05, Math.min(0.7, b.y));
      const bx = b.x * W, by = b.y * H;
      const wingFlap = Math.abs(Math.sin(t * 6 + b.phase));
      ctx.save(); ctx.translate(bx, by);
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(side * b.size * wingFlap, 0, b.size * wingFlap, b.size * 0.6, side * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = b.color + 'bb'; ctx.fill();
        ctx.strokeStyle = b.color + '44'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 2, b.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,10,5,0.8)'; ctx.fill();
      ctx.restore();
    });
  }

  _drawHeart(ctx, x, y, size, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.35);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.1, -size, size * 0.35, 0, size);
    ctx.bezierCurveTo(size, size * 0.35, size * 0.5, -size * 0.1, 0, size * 0.35);
    ctx.fill(); ctx.restore();
  }
}
