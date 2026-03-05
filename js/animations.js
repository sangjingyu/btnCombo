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

  _initTrees() {
    this.trees = [{ x: 0.5, size: 0 }];
  }

  _initButterflies() {
    if (this.butterflies.length < 5) {
      this.butterflies = Array.from({ length: 6 }, (_, i) => ({
        x: Math.random(),
        y: Math.random() * 0.6 + 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.003,
        size: 8 + Math.random() * 6,
        color: ['#f4c97a','#ff9eb5','#b8f0a0','#a0d8ef'][Math.floor(Math.random()*4)],
      }));
    }
  }

  _initHearts() {
    this.hearts = Array.from({ length: 20 }, () => ({
      x: Math.random(),
      y: 1 + Math.random() * 0.5,
      vy: -(0.001 + Math.random() * 0.002),
      size: 6 + Math.random() * 10,
      alpha: Math.random() * 0.7 + 0.3,
      color: ['#ff6b9d','#ff4757','#ffa502','#ff6348'][Math.floor(Math.random()*4)],
    }));
  }

  _initStars() {
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  _draw() {
    const { ctx, W, H, t, level, intensity } = this;
    ctx.clearRect(0, 0, W, H);

    // Background gradient by level
    this._drawBackground();

    // Level-specific scenes
    if (level === 1) this._drawLevel1();
    else if (level === 2) this._drawLevel2();
    else if (level === 3) this._drawLevel3();
    else if (level === 4) this._drawLevel4();
    else if (level === 5) this._drawLevel5();
    else if (level === 6) this._drawLevel6();
    else if (level === 7) this._drawLevel7();
    else if (level >= 8) this._drawLevel8to10();
  }

  _drawBackground() {
    const { ctx, W, H, level, intensity, t } = this;
    let c1, c2;

    if (level === 1) {
      c1 = `hsl(240,40%,${5 + intensity * 10}%)`;
      c2 = `hsl(240,30%,${8 + intensity * 8}%)`;
    } else if (level === 2) {
      c1 = `hsl(210,40%,${8 + intensity * 12}%)`;
      c2 = `hsl(220,50%,${12 + intensity * 8}%)`;
    } else if (level === 3) {
      const dawn = intensity * 0.5;
      c1 = `hsl(${30 + dawn * 20},${60 + dawn * 20}%,${15 + intensity * 20}%)`;
      c2 = `hsl(${200},${40}%,${10 + intensity * 15}%)`;
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
      // Level 10 - cosmic
      c1 = `hsl(${t * 15 % 360},70%,${30 + Math.sin(t) * 10}%)`;
      c2 = `hsl(${(t * 15 + 180) % 360},60%,${10 + Math.sin(t * 0.5) * 5}%)`;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  _drawLevel1() {
    const { ctx, W, H, t, intensity } = this;
    // Glowing orb in center
    const cx = W / 2, cy = H / 2;
    const maxR = 30 + intensity * 80;
    const pulse = Math.sin(t * 2) * 0.1 + 0.9;
    const r = maxR * pulse;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,250,200,${0.4 + intensity * 0.5})`);
    g.addColorStop(0.4, `rgba(244,201,122,${0.3 + intensity * 0.4})`);
    g.addColorStop(1, 'rgba(244,201,122,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Floating particles
    this._drawParticles();
  }

  _drawLevel2() {
    const { ctx, W, H, t, intensity } = this;
    // Rain drops
    const count = Math.floor(20 + intensity * 60);
    ctx.strokeStyle = `rgba(180,210,255,${0.3 + intensity * 0.5})`;
    ctx.lineWidth = 1 + intensity * 1.5;
    for (let i = 0; i < count; i++) {
      const x = ((i * 137.5 + t * 80) % W);
      const y = ((t * 200 + i * 73) % (H + 40)) - 20;
      const len = 8 + intensity * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + len);
      ctx.stroke();
    }

    // Puddle ripples
    for (let i = 0; i < 3; i++) {
      const rx = W * (0.2 + i * 0.3);
      const phase = (t + i * 1.5) % 2;
      const rr = phase * 40 * intensity;
      ctx.beginPath();
      ctx.ellipse(rx, H - 20, rr, rr * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,210,255,${Math.max(0, 0.5 - phase * 0.25)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    this._drawParticles();
  }

  _drawLevel3() {
    const { ctx, W, H, t, intensity } = this;
    const cx = W / 2, cy = H * 0.3;
    const sunR = 25 + intensity * 25;

    // Sun rays
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + t * 0.3;
      const inner = sunR + 8;
      const outer = sunR + 20 + intensity * 30 + Math.sin(t * 2 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = `rgba(255,220,100,${0.3 + intensity * 0.5})`;
      ctx.lineWidth = 2 + intensity * 2;
      ctx.stroke();
    }

    // Sun core
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
    sg.addColorStop(0, '#fff9c0');
    sg.addColorStop(0.5, '#ffd030');
    sg.addColorStop(1, 'rgba(255,160,0,0.5)');
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();

    // Light shafts
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * W, cy + Math.sin(angle) * H * 1.5);
      const shaftGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * W * 0.5, cy + Math.sin(angle) * H);
      shaftGrad.addColorStop(0, `rgba(255,220,100,${0.15 * intensity})`);
      shaftGrad.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.strokeStyle = shaftGrad;
      ctx.lineWidth = 40 - Math.abs(i - 2) * 8;
      ctx.stroke();
    }
    this._drawParticles();
  }

  _drawLevel4() {
    const { ctx, W, H, t, intensity } = this;
    // Ground cracks
    const groundY = H * 0.65;

    // Ground base
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, `rgba(80,50,20,${0.6 + intensity * 0.3})`);
    gg.addColorStop(1, `rgba(40,25,10,0.9)`);
    ctx.fillStyle = gg;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Cracks
    const crackCount = Math.floor(2 + intensity * 6);
    const crackSeeds = [
      [0.2, 0.7], [0.5, 0.8], [0.8, 0.72], [0.35, 0.9],
      [0.65, 0.85], [0.1, 0.95], [0.9, 0.78]
    ];
    for (let c = 0; c < Math.min(crackCount, crackSeeds.length); c++) {
      const [sx, sy] = crackSeeds[c];
      ctx.beginPath();
      ctx.moveTo(W * sx, H * sy);
      let cx2 = W * sx, cy2 = H * sy;
      const segs = 4 + c;
      for (let s = 0; s < segs; s++) {
        cx2 += (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 15);
        cy2 += (Math.random() * 12 + 5);
        ctx.lineTo(cx2, cy2);
      }
      ctx.strokeStyle = `rgba(255,${100 + intensity * 80},0,${0.4 + intensity * 0.5})`;
      ctx.lineWidth = 1.5 + intensity;
      ctx.stroke();

      // Glow in crack
      ctx.strokeStyle = `rgba(255,${150 + intensity * 50},50,${0.2 * intensity})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    this._drawParticles();
    this._drawSun(intensity * 0.5);
  }

  _drawLevel5() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(0.5 + intensity * 0.3);
    this._drawGround(intensity);

    // Leaves
    const leafCount = Math.floor(3 + intensity * 15);
    for (let i = 0; i < leafCount; i++) {
      const phase = (t * (0.5 + i * 0.1) + i * 1.3) % (Math.PI * 2);
      const baseX = W * 0.5 + (i - leafCount / 2) * 25;
      const baseY = H * 0.6 - intensity * 80 - i * 8;
      const sway = Math.sin(t * 3 + i) * (5 + intensity * 15);
      const size = (4 + intensity * 12) * (1 + Math.sin(phase) * 0.2);
      this._drawLeaf(ctx, baseX + sway, baseY, size, Math.sin(t + i) * 0.5, intensity);
    }
    this._drawParticles();
  }

  _drawLevel6() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(0.8);
    this._drawGround(1);

    // Single growing tree
    const treeH = intensity * H * 0.45;
    this._drawTree(ctx, W / 2, H * 0.65, treeH, intensity, t, 0);
    this._drawParticles();
  }

  _drawLevel7() {
    const { ctx, W, H, t, intensity } = this;
    this._drawSun(1);
    this._drawGround(1);

    // Multiple trees
    const treeCount = Math.floor(1 + intensity * 6);
    const positions = [0.5, 0.25, 0.75, 0.12, 0.88, 0.38, 0.62];
    for (let i = 0; i < Math.min(treeCount, positions.length); i++) {
      const scale = 0.7 + (i === 0 ? 0.3 : 0);
      this._drawTree(ctx, W * positions[i], H * 0.65, H * 0.35 * scale, 1, t, i);
    }

    // Butterflies
    this._drawButterflies();
    this._drawParticles();
  }

  _drawLevel8to10() {
    const { ctx, W, H, t, level, intensity } = this;

    // Earth
    const cx = W / 2, cy = H / 2;
    const earthR = Math.min(W, H) * 0.32;

    // Stars for level 10
    if (level === 10 && this.stars.length) {
      this.stars.forEach(s => {
        s.twinkle += 0.02;
        const a = (Math.sin(s.twinkle) * 0.5 + 0.5) * 0.8 + 0.1;
        ctx.beginPath();
        ctx.arc(W * s.x, H * s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });
    }

    // Earth glow
    const glowR = earthR * (1.2 + Math.sin(t) * 0.05);
    const glowG = ctx.createRadialGradient(cx, cy, earthR * 0.8, cx, cy, glowR * 1.5);
    const glowAlpha = 0.1 + (level === 8 ? intensity * 0.4 : 0.5);
    glowG.addColorStop(0, `rgba(100,200,255,${glowAlpha})`);
    glowG.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, glowR * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = glowG;
    ctx.fill();

    // Earth body
    const earthBright = level === 8 ? intensity * 0.6 : 0.7;
    const earthG = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, 0, cx, cy, earthR);
    earthG.addColorStop(0, `hsl(200,${60 + earthBright * 30}%,${30 + earthBright * 40}%)`);
    earthG.addColorStop(0.5, `hsl(220,${50 + earthBright * 20}%,${20 + earthBright * 30}%)`);
    earthG.addColorStop(1, `hsl(240,40%,${10 + earthBright * 20}%)`);
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = earthG;
    ctx.fill();

    // Continents
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.clip();
    const contAlpha = 0.3 + earthBright * 0.5;
    ctx.fillStyle = `rgba(50,160,70,${contAlpha})`;
    // Simple continent blobs
    [[0.35, 0.4, 0.22, 0.18], [0.6, 0.55, 0.15, 0.12], [0.45, 0.65, 0.12, 0.1],
     [0.2, 0.6, 0.1, 0.08], [0.75, 0.35, 0.1, 0.09]].forEach(([rx, ry, rw, rh]) => {
      ctx.beginPath();
      ctx.ellipse(cx + earthR * (rx - 0.5) * 2, cy + earthR * (ry - 0.5) * 2,
        earthR * rw, earthR * rh, Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Level 9+: hearts floating around earth
    if (level >= 9) {
      this.hearts.forEach(h => {
        h.y += h.vy;
        if (h.y < -0.1) { h.y = 1.1; h.x = Math.random(); }
        this._drawHeart(ctx, W * h.x, H * h.y, h.size, h.color, h.alpha);
      });
    }

    // Level 10: Extra cosmic love
    if (level === 10) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.3;
        const orbitR = earthR * 1.5 + Math.sin(t + i) * 10;
        const hx = cx + Math.cos(angle) * orbitR;
        const hy = cy + Math.sin(angle) * orbitR;
        this._drawHeart(ctx, hx, hy, 10 + Math.sin(t * 2 + i) * 3, '#ff6b9d', 0.8);
      }
    }

    this._drawParticles();
  }

  // ===== Helper draw methods =====

  _drawParticles() {
    const { ctx, W, H, level, intensity } = this;
    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10 || p.x < -10 || p.x > W + 10) {
        this.particles[i] = this._newParticle(true);
        this.particles[i].x = Math.random() * W;
      }
      const a = p.alpha * (0.3 + intensity * 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${a})`;
      ctx.fill();
    });
  }

  _drawGround(intensity) {
    const { ctx, W, H } = this;
    const gy = H * 0.65;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, `rgba(30,${80 + intensity * 60},20,${0.7 + intensity * 0.2})`);
    gg.addColorStop(1, `rgba(15,40,10,0.9)`);
    ctx.fillStyle = gg;
    ctx.fillRect(0, gy, W, H - gy);
  }

  _drawSun(alpha) {
    const { ctx, W, H, t } = this;
    const cx = W * 0.5, cy = H * 0.15;
    const r = 20 + alpha * 15;
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    sg.addColorStop(0, `rgba(255,250,180,${alpha})`);
    sg.addColorStop(0.4, `rgba(255,200,50,${alpha * 0.7})`);
    sg.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
  }

  _drawLeaf(ctx, x, y, size, angle, intensity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -size / 2, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
    const green = Math.floor(120 + intensity * 80);
    ctx.fillStyle = `rgba(40,${green},30,0.85)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(60,${green + 20},40,0.5)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawTree(ctx, x, baseY, height, maturity, t, seed) {
    if (height <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(80,50,20,0.9)`;
    ctx.lineWidth = Math.max(1, height * 0.04);
    ctx.lineCap = 'round';

    // Trunk
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY - height * 0.45);
    ctx.stroke();

    // Branches
    this._drawBranch(ctx, x, baseY - height * 0.45, height * 0.4, -Math.PI / 2, maturity, t, 0, seed);
    ctx.restore();
  }

  _drawBranch(ctx, x, y, len, angle, maturity, t, depth, seed) {
    if (len < 6 || depth > 3) return;
    const sway = Math.sin(t * 1.2 + depth * 0.8 + seed) * 0.08;
    const ex = x + Math.cos(angle + sway) * len;
    const ey = y + Math.sin(angle + sway) * len;

    ctx.lineWidth = Math.max(0.5, len * 0.05);
    ctx.strokeStyle = `rgba(${60 + depth * 10},${35 + depth * 5},15,0.8)`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    if (depth < 3) {
      const spread = 0.5 + maturity * 0.3;
      this._drawBranch(ctx, ex, ey, len * 0.65, angle - spread, maturity, t, depth + 1, seed);
      this._drawBranch(ctx, ex, ey, len * 0.65, angle + spread, maturity, t, depth + 1, seed);
      if (depth < 2) {
        this._drawBranch(ctx, ex, ey, len * 0.5, angle, maturity, t, depth + 1, seed);
      }
    } else {
      // Leaves at tips
      const leafCount = Math.floor(3 + maturity * 4);
      for (let i = 0; i < leafCount; i++) {
        const la = angle + (Math.random() - 0.5) * Math.PI;
        const lx = ex + Math.cos(la) * (Math.random() * 12 + 4);
        const ly = ey + Math.sin(la) * (Math.random() * 8 + 4);
        ctx.beginPath();
        ctx.arc(lx, ly, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${30 + Math.random() * 20},${120 + Math.random() * 60},30,0.7)`;
        ctx.fill();
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
      ctx.save();
      ctx.translate(bx, by);

      // Wings
      for (let side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * b.size * wingFlap, 0, b.size * wingFlap, b.size * 0.6, side * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = b.color + 'bb';
        ctx.fill();
        ctx.strokeStyle = b.color + '44';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, b.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,10,5,0.8)';
      ctx.fill();
      ctx.restore();
    });
  }

  _drawHeart(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.35);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.1, -size, size * 0.35, 0, size);
    ctx.bezierCurveTo(size, size * 0.35, size * 0.5, -size * 0.1, 0, size * 0.35);
    ctx.fill();
    ctx.restore();
  }
}
