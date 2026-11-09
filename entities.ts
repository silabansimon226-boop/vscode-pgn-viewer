import { ShipConfig } from './types';
import { ParticleSystem } from './particles';
import { sound } from './audio';

export interface DroneInstance {
  angle: number;
  distance: number;
  fireCooldown: number;
}

export class Player {
  public x: number;
  public y: number;
  public vx = 0;
  public vy = 0;
  public angle = 0; // facing direction

  public config: ShipConfig;
  public hp: number;
  public maxHp: number;
  public shield: number;
  public maxShield: number;
  public shieldRechargeRate = 0.15; // per frame
  public shieldDelayTimer = 0;

  public isDashing = false;
  public dashTimer = 0;
  public dashCooldown = 0;
  public dashCooldownMax = 90;

  // Level & XP
  public level = 1;
  public xp = 0;
  public xpNext = 20;

  // Upgrades
  public damageMultiplier = 1;
  public fireRateMultiplier = 1;
  public speedMultiplier = 1;
  public projectileCount = 1;
  public piercingCount = 0;
  public magnetRadius = 140;
  public droneCount = 0;
  public drones: DroneInstance[] = [];
  public chainLightning = false;
  public chainTargets = 0;
  public cryoEnabled = false;
  public empEnabled = false;
  public empTimer = 0;

  public fireTimer = 0;
  public autoFire = true;

  constructor(x: number, y: number, config: ShipConfig) {
    this.x = x;
    this.y = y;
    this.config = config;
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.shield = config.maxShield;
    this.maxShield = config.maxShield;
    this.dashCooldownMax = config.dashCooldown;

    // Special starting perks for certain ships
    if (config.id === 'titan_aegis') {
      this.droneCount = 1;
    }
  }

  public update(
    input: { dx: number; dy: number; aimX: number; aimY: number; dash: boolean; shooting: boolean },
    canvasW: number,
    canvasH: number,
    particles: ParticleSystem,
    bullets: Bullet[],
    enemies: Enemy[]
  ) {
    // Aim angle
    const targetAngle = Math.atan2(input.aimY - this.y, input.aimX - this.x);
    // Smooth angle interpolation
    const diff = targetAngle - this.angle;
    const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.angle += normalizedDiff * 0.22;

    // Dash logic
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (input.dash && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = 14;
      this.dashCooldown = this.dashCooldownMax;
      sound.playDash();

      // Dash burst
      const moveAngle = input.dx !== 0 || input.dy !== 0 
        ? Math.atan2(input.dy, input.dx) 
        : this.angle;
      this.vx = Math.cos(moveAngle) * (this.config.speed * 2.8 * this.speedMultiplier);
      this.vy = Math.sin(moveAngle) * (this.config.speed * 2.8 * this.speedMultiplier);

      particles.emitExplosion(this.x, this.y, this.config.color, 12, 0.7);
    }

    if (this.dashTimer > 0) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Movement physics
    if (!this.isDashing) {
      const baseSpeed = this.config.speed * this.speedMultiplier;
      const targetVx = input.dx * baseSpeed;
      const targetVy = input.dy * baseSpeed;
      this.vx += (targetVx - this.vx) * 0.16;
      this.vy += (targetVy - this.vy) * 0.16;
    } else {
      this.vx *= 0.94;
      this.vy *= 0.94;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundaries with padding
    const pad = 24;
    this.x = Math.max(pad, Math.min(canvasW - pad, this.x));
    this.y = Math.max(pad, Math.min(canvasH - pad, this.y));

    // Thruster particles if moving
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 0.4) {
      particles.emitThruster(this.x, this.y, this.angle, this.config.engineColor);
    }

    // Shield regeneration
    if (this.shieldDelayTimer > 0) {
      this.shieldDelayTimer--;
    } else if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRechargeRate);
    }

    // Update Drones
    while (this.drones.length < this.droneCount) {
      this.drones.push({
        angle: (this.drones.length * Math.PI * 2) / (this.droneCount || 1),
        distance: 42,
        fireCooldown: 0,
      });
    }

    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      d.angle += 0.04;
      const droneX = this.x + Math.cos(d.angle) * d.distance;
      const droneY = this.y + Math.sin(d.angle) * d.distance;

      d.fireCooldown--;
      if (d.fireCooldown <= 0 && enemies.length > 0) {
        // Find closest enemy
        let closest: Enemy | null = null;
        let minDist = 380;
        for (const e of enemies) {
          const dist = Math.hypot(e.x - droneX, e.y - droneY);
          if (dist < minDist) {
            minDist = dist;
            closest = e;
          }
        }
        if (closest) {
          const shootAngle = Math.atan2(closest.y - droneY, closest.x - droneX);
          bullets.push(
            new Bullet(
              droneX,
              droneY,
              Math.cos(shootAngle) * 11,
              Math.sin(shootAngle) * 11,
              this.config.baseDamage * 0.75 * this.damageMultiplier,
              '#38bdf8',
              true,
              false,
              0
            )
          );
          sound.playLaser('plasma');
          d.fireCooldown = 32; // every ~0.5s
        }
      }
    }

    // EMP automatic pulse
    if (this.empEnabled) {
      this.empTimer++;
      if (this.empTimer >= 720) {
        // ~12 seconds
        this.empTimer = 0;
        particles.emitExplosion(this.x, this.y, '#38bdf8', 40, 3.5);
        sound.playBossAlarm();
        for (const e of enemies) {
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d < 350) {
            e.takeDamage(120 * this.damageMultiplier, particles, this);
            e.slowTimer = 180; // stunned/slowed
          }
        }
      }
    }

    // Shooting
    this.fireTimer--;
    const shouldFire = (this.autoFire || input.shooting) && this.fireTimer <= 0;

    if (shouldFire) {
      this.fireWeapon(bullets);
      const interval = Math.round(60 / (this.config.fireRate * this.fireRateMultiplier));
      this.fireTimer = Math.max(5, interval);
    }
  }

  private fireWeapon(bullets: Bullet[]) {
    sound.playLaser(this.config.weaponType);
    const count = this.projectileCount;
    const spreadAngle = count > 1 ? 0.35 : 0;
    const baseDmg = this.config.baseDamage * this.damageMultiplier;

    if (this.config.weaponType === 'scatter') {
      const pellets = 4 + (count - 1) * 2;
      for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * 0.55;
        const shotAngle = this.angle + spread;
        const spd = Math.random() * 3 + 12;
        bullets.push(
          new Bullet(
            this.x + Math.cos(this.angle) * 18,
            this.y + Math.sin(this.angle) * 18,
            Math.cos(shotAngle) * spd,
            Math.sin(shotAngle) * spd,
            baseDmg * 0.65,
            this.config.color,
            true,
            false,
            this.piercingCount,
            this.cryoEnabled,
            this.chainLightning,
            this.chainTargets
          )
        );
      }
    } else if (this.config.weaponType === 'beam') {
      // High velocity piercing beam blast
      const step = count > 1 ? spreadAngle / (count - 1) : 0;
      const startAngle = count > 1 ? this.angle - spreadAngle / 2 : this.angle;

      for (let i = 0; i < count; i++) {
        const currentAngle = startAngle + step * i;
        bullets.push(
          new Bullet(
            this.x + Math.cos(this.angle) * 20,
            this.y + Math.sin(this.angle) * 20,
            Math.cos(currentAngle) * 16,
            Math.sin(currentAngle) * 16,
            baseDmg * 1.2,
            this.config.color,
            true,
            true, // isBeam
            this.piercingCount + 2,
            this.cryoEnabled,
            this.chainLightning,
            this.chainTargets
          )
        );
      }
    } else {
      // Standard plasma
      const step = count > 1 ? spreadAngle / (count - 1) : 0;
      const startAngle = count > 1 ? this.angle - spreadAngle / 2 : this.angle;

      for (let i = 0; i < count; i++) {
        const currentAngle = startAngle + step * i;
        bullets.push(
          new Bullet(
            this.x + Math.cos(this.angle) * 18,
            this.y + Math.sin(this.angle) * 18,
            Math.cos(currentAngle) * 13,
            Math.sin(currentAngle) * 13,
            baseDmg,
            this.config.color,
            true,
            false,
            this.piercingCount,
            this.cryoEnabled,
            this.chainLightning,
            this.chainTargets
          )
        );
      }
    }
  }

  public takeDamage(amount: number, particles: ParticleSystem): boolean {
    if (this.isDashing) return false; // invulnerable during dash

    this.shieldDelayTimer = 120; // 2 seconds before recharge
    let remaining = amount;

    if (this.shield > 0) {
      if (this.shield >= remaining) {
        this.shield -= remaining;
        remaining = 0;
        particles.emitSpark(this.x, this.y, '#38bdf8', 8);
      } else {
        remaining -= this.shield;
        this.shield = 0;
        particles.emitExplosion(this.x, this.y, '#38bdf8', 12, 1.2); // shield break
      }
    }

    if (remaining > 0) {
      this.hp -= remaining;
      sound.playHit();
      particles.emitExplosion(this.x, this.y, '#ef4444', 10, 0.8);
      particles.emitFloatingText(this.x, this.y, `-${Math.round(remaining)}`, '#ef4444', 1.2);
    }

    return this.hp <= 0;
  }

  public addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.round(this.xpNext * 1.45 + 10);
      sound.playLevelUp();
      return true; // leveled up!
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Render shield aura if shield active
    if (this.shield > 0) {
      const shieldRatio = this.shield / this.maxShield;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.35 + 0.3 * shieldRatio;
      ctx.stroke();
      ctx.fillStyle = '#0284c7';
      ctx.globalAlpha = 0.08 * shieldRatio;
      ctx.fill();
    }

    // Render dash blur / trail
    if (this.isDashing) {
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = this.config.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(-22, -22, 44, 44);
    }

    // Rotate to ship angle
    ctx.rotate(this.angle);
    ctx.globalAlpha = 1;

    // Ship body
    ctx.fillStyle = this.config.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(18, 0); // nose
    ctx.lineTo(-14, -13); // left wing
    ctx.lineTo(-8, 0); // rear indent
    ctx.lineTo(-14, 13); // right wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit canopy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render orbiting drones
    for (const d of this.drones) {
      const dx = this.x + Math.cos(d.angle) * d.distance;
      const dy = this.y + Math.sin(d.angle) * d.distance;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Drone mini light
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -1.5, 3, 3);
      ctx.restore();
    }
  }
}

export class Bullet {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public damage: number;
  public color: string;
  public isPlayer: boolean;
  public isBeam: boolean;
  public pierceLeft: number;
  public cryo: boolean;
  public chain: boolean;
  public chainTargets: number;
  public life = 120; // 2 seconds

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color: string,
    isPlayer = true,
    isBeam = false,
    pierceLeft = 0,
    cryo = false,
    chain = false,
    chainTargets = 0
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.color = color;
    this.isPlayer = isPlayer;
    this.isBeam = isBeam;
    this.pierceLeft = pierceLeft;
    this.cryo = cryo;
    this.chain = chain;
    this.chainTargets = chainTargets;
  }

  public update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    return this.life <= 0;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    if (this.isBeam) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      const radius = this.isPlayer ? 4 : 5;
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export type EnemyType = 'scout' | 'gunship' | 'assassin' | 'heavy';

export class Enemy {
  public x: number;
  public y: number;
  public vx = 0;
  public vy = 0;
  public angle = 0;
  public type: EnemyType;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public size: number;
  public color: string;
  public scoreValue: number;
  public xpValue: number;
  public shootCooldown = 0;
  public slowTimer = 0;

  constructor(x: number, y: number, type: EnemyType, wave = 1) {
    this.x = x;
    this.y = y;
    this.type = type;

    const waveHpScale = 1 + (wave - 1) * 0.18;
    switch (type) {
      case 'scout':
        this.hp = Math.round(25 * waveHpScale);
        this.maxHp = this.hp;
        this.speed = 3.6;
        this.size = 13;
        this.color = '#ef4444'; // red
        this.scoreValue = 80;
        this.xpValue = 5;
        break;
      case 'gunship':
        this.hp = Math.round(55 * waveHpScale);
        this.maxHp = this.hp;
        this.speed = 2.2;
        this.size = 18;
        this.color = '#a855f7'; // purple
        this.scoreValue = 150;
        this.xpValue = 12;
        this.shootCooldown = 90;
        break;
      case 'assassin':
        this.hp = Math.round(40 * waveHpScale);
        this.maxHp = this.hp;
        this.speed = 4.4;
        this.size = 15;
        this.color = '#06b6d4'; // cyan
        this.scoreValue = 180;
        this.xpValue = 15;
        break;
      case 'heavy':
        this.hp = Math.round(140 * waveHpScale);
        this.maxHp = this.hp;
        this.speed = 1.4;
        this.size = 26;
        this.color = '#f97316'; // orange
        this.scoreValue = 350;
        this.xpValue = 28;
        this.shootCooldown = 120;
        break;
    }
  }

  public update(player: Player, bullets: Bullet[], particles: ParticleSystem) {
    if (this.slowTimer > 0) this.slowTimer--;
    const currentSpeed = this.slowTimer > 0 ? this.speed * 0.55 : this.speed;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    if (this.type === 'scout') {
      // Swarm straight towards player
      this.vx = Math.cos(this.angle) * currentSpeed;
      this.vy = Math.sin(this.angle) * currentSpeed;
    } else if (this.type === 'gunship') {
      // Standoff distance ~220px
      if (dist > 220) {
        this.vx = Math.cos(this.angle) * currentSpeed;
        this.vy = Math.sin(this.angle) * currentSpeed;
      } else if (dist < 160) {
        this.vx = -Math.cos(this.angle) * currentSpeed * 0.8;
        this.vy = -Math.sin(this.angle) * currentSpeed * 0.8;
      } else {
        // strafe circle
        this.vx = Math.cos(this.angle + Math.PI / 2) * currentSpeed;
        this.vy = Math.sin(this.angle + Math.PI / 2) * currentSpeed;
      }

      this.shootCooldown--;
      if (this.shootCooldown <= 0) {
        bullets.push(
          new Bullet(
            this.x,
            this.y,
            Math.cos(this.angle) * 6,
            Math.sin(this.angle) * 6,
            14,
            '#a855f7',
            false
          )
        );
        this.shootCooldown = 110 + Math.floor(Math.random() * 40);
      }
    } else if (this.type === 'assassin') {
      // Dash towards player periodically
      this.vx = Math.cos(this.angle) * currentSpeed;
      this.vy = Math.sin(this.angle) * currentSpeed;
      if (Math.random() < 0.08) {
        particles.emitThruster(this.x, this.y, this.angle, '#06b6d4');
      }
    } else if (this.type === 'heavy') {
      this.vx = Math.cos(this.angle) * currentSpeed;
      this.vy = Math.sin(this.angle) * currentSpeed;

      this.shootCooldown--;
      if (this.shootCooldown <= 0) {
        // 3-way burst
        for (let i = -1; i <= 1; i++) {
          const spread = this.angle + i * 0.25;
          bullets.push(
            new Bullet(
              this.x,
              this.y,
              Math.cos(spread) * 5,
              Math.sin(spread) * 5,
              18,
              '#f97316',
              false
            )
          );
        }
        this.shootCooldown = 140;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  public takeDamage(dmg: number, particles: ParticleSystem, player: Player): boolean {
    this.hp -= dmg;
    particles.emitSpark(this.x, this.y, this.color, 4);
    particles.emitFloatingText(this.x, this.y, `${Math.round(dmg)}`, '#f8fafc', 0.9);

    if (this.hp <= 0) {
      sound.playExplosion(this.size > 20 ? 'large' : 'small');
      particles.emitExplosion(this.x, this.y, this.color, this.size > 20 ? 30 : 16);
      return true; // destroyed
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    if (this.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.lineTo(-this.size, -this.size * 0.8);
      ctx.lineTo(-this.size * 0.4, 0);
      ctx.lineTo(-this.size, this.size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'gunship') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        const px = Math.cos(rad) * this.size;
        const py = Math.sin(rad) * this.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gunship core
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'assassin') {
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.7, 0);
      ctx.lineTo(-this.size, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Heavy Cruiser
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        const px = Math.cos(rad) * this.size;
        const py = Math.sin(rad) * this.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Health bar above enemy if damaged
    if (this.hp < this.maxHp) {
      ctx.rotate(-this.angle); // orient horizontal
      const barW = this.size * 2;
      const barH = 3;
      const yOff = -this.size - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, yOff, barW, barH);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-barW / 2, yOff, barW * (this.hp / this.maxHp), barH);
    }

    ctx.restore();
  }
}

export class Boss {
  public x: number;
  public y: number;
  public vx = 0;
  public vy = 0;
  public angle = 0;
  public hp: number;
  public maxHp: number;
  public size = 48;
  public name = 'SECTOR OVERLORD MK-IV';
  public shieldAngle = 0;
  public attackTimer = 0;
  public phase = 1;
  public scoreValue = 2500;
  public xpValue = 120;

  constructor(x: number, y: number, wave = 5) {
    this.x = x;
    this.y = y;
    this.hp = 1200 + (wave - 5) * 500;
    this.maxHp = this.hp;
  }

  public update(player: Player, bullets: Bullet[], enemies: Enemy[], particles: ParticleSystem, canvasW: number, canvasH: number) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.angle = Math.atan2(dy, dx);
    this.shieldAngle += 0.03;

    // Movement: slowly drift towards player or keep center
    const targetX = canvasW / 2;
    const targetY = canvasH * 0.35;
    this.vx += (targetX - this.x) * 0.005;
    this.vy += (targetY - this.y) * 0.005;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.x += this.vx;
    this.y += this.vy;

    // Attack patterns based on HP percentage
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio < 0.35 ? 3 : hpRatio < 0.7 ? 2 : 1;

    this.attackTimer++;

    // Primary Barrage
    if (this.attackTimer % 70 === 0) {
      sound.playLaser('plasma');
      // 5-way spread
      for (let i = -2; i <= 2; i++) {
        const spread = this.angle + i * 0.22;
        bullets.push(
          new Bullet(
            this.x,
            this.y,
            Math.cos(spread) * 6.5,
            Math.sin(spread) * 6.5,
            16,
            '#ef4444',
            false
          )
        );
      }
    }

    // Phase 2+: Ring spiral shots
    if (this.phase >= 2 && this.attackTimer % 90 === 0) {
      sound.playLaser('scatter');
      for (let i = 0; i < 8; i++) {
        const rad = this.shieldAngle + (i * Math.PI) / 4;
        bullets.push(
          new Bullet(
            this.x,
            this.y,
            Math.cos(rad) * 4.5,
            Math.sin(rad) * 4.5,
            14,
            '#f59e0b',
            false
          )
        );
      }
    }

    // Phase 3: Summon swarmer adds
    if (this.phase >= 3 && this.attackTimer % 300 === 0) {
      sound.playBossAlarm();
      particles.emitExplosion(this.x, this.y, '#ef4444', 25, 2);
      for (let i = 0; i < 3; i++) {
        enemies.push(new Enemy(this.x + (i - 1) * 40, this.y + 40, 'scout', 5));
      }
    }
  }

  public takeDamage(dmg: number, particles: ParticleSystem): boolean {
    this.hp -= dmg;
    particles.emitSpark(this.x, this.y, '#f59e0b', 6);
    particles.emitFloatingText(this.x, this.y, `${Math.round(dmg)}`, '#fbbf24', 1.2);

    if (this.hp <= 0) {
      sound.playExplosion('large');
      particles.emitExplosion(this.x, this.y, '#f59e0b', 60, 4);
      return true;
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Rotating boss energy ring
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 1.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -this.shieldAngle * 40;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.rotate(this.angle);

    // Boss main body: formidable alien dreadnought
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(this.size * 1.1, 0);
    ctx.lineTo(this.size * 0.4, -this.size * 0.9);
    ctx.lineTo(-this.size * 0.8, -this.size * 0.7);
    ctx.lineTo(-this.size * 0.5, 0);
    ctx.lineTo(-this.size * 0.8, this.size * 0.7);
    ctx.lineTo(this.size * 0.4, this.size * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core glow
    ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Collectible {
  public x: number;
  public y: number;
  public type: 'xp' | 'health' | 'emp';
  public value: number;
  public size = 7;
  public life = 900; // 15 seconds
  public floatPhase = Math.random() * Math.PI * 2;

  constructor(x: number, y: number, type: 'xp' | 'health' | 'emp', value = 5) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
  }

  public update(player: Player, particles: ParticleSystem): boolean {
    this.life--;
    this.floatPhase += 0.08;

    // Magnet check
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < player.magnetRadius) {
      const speed = 11 * (1 - dist / player.magnetRadius) + 3;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }

    // Collection collision
    if (dist < 22) {
      if (this.type === 'xp') {
        player.addXp(this.value);
        sound.playPickup();
      } else if (this.type === 'health') {
        player.hp = Math.min(player.maxHp, player.hp + this.value);
        sound.playPickup();
        particles.emitFloatingText(player.x, player.y, `+${this.value} HP`, '#22c55e', 1.2);
      } else if (this.type === 'emp') {
        sound.playBossAlarm();
        particles.emitExplosion(player.x, player.y, '#38bdf8', 40, 3);
      }
      return true; // collected!
    }

    return this.life <= 0;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const bob = Math.sin(this.floatPhase) * 2;
    ctx.translate(this.x, this.y + bob);

    if (this.type === 'xp') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // diamond shape
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'health') {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      // Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -4, 3, 8);
      ctx.fillRect(-4, -1.5, 8, 3);
    } else {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, this.size + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
