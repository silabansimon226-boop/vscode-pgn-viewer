export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public shockwaves: Shockwave[] = [];

  public emitExplosion(x: number, y: number, color: string, count = 25, sizeMultiplier = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 1.5) * sizeMultiplier;
      const life = Math.random() * 25 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: (Math.random() * 3.5 + 1.5) * sizeMultiplier,
        color,
        glow: true,
      });
    }

    // Add a shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 40 * sizeMultiplier,
      color,
      lineWidth: 3 * sizeMultiplier,
      life: 20,
      maxLife: 20,
    });
  }

  public emitSpark(x: number, y: number, color = '#38bdf8', count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const life = Math.random() * 12 + 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.random() * 2 + 1,
        color,
      });
    }
  }

  public emitThruster(x: number, y: number, angle: number, color = '#38bdf8') {
    const spread = (Math.random() - 0.5) * 0.45;
    const speed = Math.random() * 3 + 2;
    const thrustAngle = angle + Math.PI + spread;
    const life = Math.random() * 12 + 6;
    this.particles.push({
      x,
      y,
      vx: Math.cos(thrustAngle) * speed,
      vy: Math.sin(thrustAngle) * speed,
      life,
      maxLife: life,
      size: Math.random() * 3 + 2,
      color,
      glow: true,
    });
  }

  public emitFloatingText(x: number, y: number, text: string, color = '#f8fafc', scale = 1) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text,
      color,
      life: 35,
      maxLife: 35,
      vy: -1.2,
      scale,
    });
  }

  public update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94; // friction
      p.vy *= 0.94;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life--;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life--;
      const progress = 1 - s.life / s.maxLife;
      s.radius = 5 + (s.maxRadius - 5) * progress;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Render shockwaves
    for (const s of this.shockwaves) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = s.lineWidth * (s.life / s.maxLife);
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Render floating texts
    for (const t of this.floatingTexts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${Math.round(14 * t.scale)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }
}
