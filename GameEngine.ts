import { ShipConfig, UpgradeCard, RunStats, ActivePerk } from './types';
import { Player, Bullet, Enemy, Boss, Collectible } from './entities';
import { ParticleSystem } from './particles';
import { sound } from './audio';
import { getRandomUpgrades } from './upgrades';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public player: Player;
  public particles = new ParticleSystem();

  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public boss: Boss | null = null;
  public collectibles: Collectible[] = [];

  private stars: Star[] = [];
  public isRunning = false;
  public isPaused = false;

  // Screen shake
  public shake = 0;

  // Run stats & state
  public score = 0;
  public wave = 1;
  public waveTimer = 0;
  public waveSpawnQueue: { type: 'scout' | 'gunship' | 'assassin' | 'heavy'; delay: number }[] = [];
  public enemiesDefeated = 0;
  public bossesDefeated = 0;
  public damageDealt = 0;
  public maxCombo = 0;
  public currentCombo = 0;
  public comboTimer = 0;
  public crystalsCollected = 0;
  public startTime = 0;

  public activePerks: Map<string, ActivePerk> = new Map();

  // Input state
  public keys: { [key: string]: boolean } = {};
  public mouse = { x: 0, y: 0, isDown: false };
  public virtualStick = { dx: 0, dy: 0, active: false };
  public virtualDash = false;
  public autoFire = true;

  // Callbacks
  public onLevelUp?: (cards: UpgradeCard[]) => void;
  public onGameOver?: (stats: RunStats) => void;
  public onVictory?: (stats: RunStats) => void;
  public onStateSync?: (data: {
    hp: number;
    maxHp: number;
    shield: number;
    maxShield: number;
    level: number;
    xp: number;
    xpNext: number;
    dashRatio: number;
    score: number;
    combo: number;
    wave: number;
    bossHp?: number;
    bossMaxHp?: number;
    bossName?: string;
    perks: ActivePerk[];
  }) => void;

  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, shipConfig: ShipConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.player = new Player(canvas.width / 2, canvas.height * 0.7, shipConfig);

    this.initStars();
    this.bindInputs();
    this.startWave(1);
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
  }

  public resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.initStars();
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Shift') {
        this.virtualDash = true;
      }
      if (e.key.toLowerCase() === 'e') {
        this.autoFire = !this.autoFire;
        this.player.autoFire = this.autoFire;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.key === ' ' || e.key === 'Shift') {
        this.virtualDash = false;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    });
  }

  public start() {
    this.isRunning = true;
    this.startTime = Date.now();
    sound.startAmbientBGM();
    this.loop();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    if (this.isRunning) {
      this.loop();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopAmbientBGM();
  }

  public applyUpgrade(card: UpgradeCard) {
    card.apply(this.player);

    const existing = this.activePerks.get(card.id);
    if (existing) {
      existing.count++;
    } else {
      this.activePerks.set(card.id, {
        id: card.id,
        name: card.name,
        count: 1,
        rarity: card.rarity,
      });
    }

    this.resume();
  }

  private startWave(waveNum: number) {
    this.wave = waveNum;
    this.waveSpawnQueue = [];

    if (waveNum === 5 || waveNum === 10) {
      // Boss wave!
      sound.playBossAlarm();
      this.boss = new Boss(this.canvas.width / 2, -60, waveNum);
      this.shake = 18;
    } else {
      // Normal wave
      const count = 6 + waveNum * 4;
      for (let i = 0; i < count; i++) {
        let type: 'scout' | 'gunship' | 'assassin' | 'heavy' = 'scout';
        const rand = Math.random();
        if (waveNum >= 4 && rand < 0.25) {
          type = 'heavy';
        } else if (waveNum >= 3 && rand < 0.5) {
          type = 'assassin';
        } else if (waveNum >= 2 && rand < 0.75) {
          type = 'gunship';
        }
        this.waveSpawnQueue.push({
          type,
          delay: i * 40 + Math.floor(Math.random() * 20),
        });
      }
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      this.update();
      this.render();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    // Calculate movement inputs (Keyboard + Virtual Joystick)
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (this.virtualStick.active) {
      dx = this.virtualStick.dx;
      dy = this.virtualStick.dy;
    } else {
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
    }

    const isDash = this.virtualDash || this.keys[' '] || this.keys['shift'];

    // Aim position: mouse position, or forward direction if no mouse movement yet
    let aimX = this.mouse.x;
    let aimY = this.mouse.y;
    if (aimX === 0 && aimY === 0) {
      aimX = this.player.x;
      aimY = this.player.y - 100;
    }

    // Update Player
    this.player.update(
      {
        dx,
        dy,
        aimX,
        aimY,
        dash: isDash,
        shooting: this.mouse.isDown || this.autoFire,
      },
      this.canvas.width,
      this.canvas.height,
      this.particles,
      this.bullets,
      this.enemies
    );

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
      }
    }

    // Shake decay
    if (this.shake > 0) {
      this.shake *= 0.88;
      if (this.shake < 0.2) this.shake = 0;
    }

    // Update Stars
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    }

    // Update Particles
    this.particles.update();

    // Spawn wave enemies
    this.waveTimer++;
    for (let i = this.waveSpawnQueue.length - 1; i >= 0; i--) {
      const spawn = this.waveSpawnQueue[i];
      spawn.delay--;
      if (spawn.delay <= 0) {
        const edge = Math.floor(Math.random() * 3); // top, left, right
        let sx = Math.random() * this.canvas.width;
        let sy = -30;
        if (edge === 1) {
          sx = -30;
          sy = Math.random() * (this.canvas.height * 0.6);
        } else if (edge === 2) {
          sx = this.canvas.width + 30;
          sy = Math.random() * (this.canvas.height * 0.6);
        }
        this.enemies.push(new Enemy(sx, sy, spawn.type, this.wave));
        this.waveSpawnQueue.splice(i, 1);
      }
    }

    // Update Boss
    if (this.boss) {
      const activeBoss = this.boss;
      activeBoss.update(
        this.player,
        this.bullets,
        this.enemies,
        this.particles,
        this.canvas.width,
        this.canvas.height
      );

      // Check player bullet collisions on Boss
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (!b.isPlayer) continue;

        const dist = Math.hypot(b.x - activeBoss.x, b.y - activeBoss.y);
        if (dist < activeBoss.size + 10) {
          this.damageDealt += b.damage;
          const killed = activeBoss.takeDamage(b.damage, this.particles);
          if (b.pierceLeft > 0) {
            b.pierceLeft--;
          } else {
            this.bullets.splice(bi, 1);
          }

          if (killed) {
            this.shake = 25;
            this.bossesDefeated++;
            this.addScore(activeBoss.scoreValue);

            // Drop multiple crystals and health
            for (let c = 0; c < 12; c++) {
              this.collectibles.push(
                new Collectible(
                  activeBoss.x + (Math.random() - 0.5) * 80,
                  activeBoss.y + (Math.random() - 0.5) * 80,
                  Math.random() < 0.25 ? 'health' : 'xp',
                  15
                )
              );
            }

            this.boss = null;

            if (this.wave === 10) {
              // VICTORY!
              this.handleVictory();
              return;
            } else {
              // Advance to next wave
              this.startWave(this.wave + 1);
            }
            break;
          }
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.player, this.bullets, this.particles);

      // Enemy ramming Player
      const ramDist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (ramDist < e.size + 14) {
        const dead = this.player.takeDamage(18, this.particles);
        this.shake = 12;
        e.takeDamage(40, this.particles, this.player);

        if (dead) {
          this.handleGameOver();
          return;
        }
      }

      // Bullets vs Enemy
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (!b.isPlayer) continue;

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.size + 6) {
          this.damageDealt += b.damage;
          if (b.cryo) {
            e.slowTimer = 150; // slow effect
          }

          // Chain lightning
          if (b.chain && b.chainTargets > 0) {
            this.triggerChainLightning(e, b.damage * 0.45, b.chainTargets);
          }

          const killed = e.takeDamage(b.damage, this.particles, this.player);

          if (b.pierceLeft > 0) {
            b.pierceLeft--;
          } else {
            this.bullets.splice(bi, 1);
          }

          if (killed) {
            this.enemiesDefeated++;
            this.addCombo();
            this.addScore(e.scoreValue);

            // Spawn drops
            const dropRoll = Math.random();
            if (dropRoll < 0.08) {
              this.collectibles.push(new Collectible(e.x, e.y, 'health', 25));
            } else {
              this.collectibles.push(new Collectible(e.x, e.y, 'xp', e.xpValue));
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }
    }

    // Check if Wave complete
    if (!this.boss && this.waveSpawnQueue.length === 0 && this.enemies.length === 0) {
      this.startWave(this.wave + 1);
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const expired = b.update();

      // Screen boundaries
      if (
        expired ||
        b.x < -30 ||
        b.x > this.canvas.width + 30 ||
        b.y < -30 ||
        b.y > this.canvas.height + 30
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Enemy bullets hitting Player
      if (!b.isPlayer) {
        const pDist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (pDist < 16) {
          const dead = this.player.takeDamage(b.damage, this.particles);
          this.shake = 10;
          this.bullets.splice(i, 1);

          if (dead) {
            this.handleGameOver();
            return;
          }
        }
      }
    }

    // Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const prevLvl = this.player.level;
      const collectedOrDead = c.update(this.player, this.particles);

      if (collectedOrDead) {
        if (c.type === 'xp') this.crystalsCollected++;
        this.collectibles.splice(i, 1);

        // Check if level changed
        if (this.player.level > prevLvl) {
          this.triggerLevelUp();
        }
      }
    }

    // Sync state with UI
    if (this.onStateSync) {
      this.onStateSync({
        hp: Math.max(0, this.player.hp),
        maxHp: this.player.maxHp,
        shield: Math.max(0, this.player.shield),
        maxShield: this.player.maxShield,
        level: this.player.level,
        xp: this.player.xp,
        xpNext: this.player.xpNext,
        dashRatio: 1 - this.player.dashCooldown / this.player.dashCooldownMax,
        score: this.score,
        combo: this.currentCombo,
        wave: this.wave,
        bossHp: this.boss ? this.boss.hp : undefined,
        bossMaxHp: this.boss ? this.boss.maxHp : undefined,
        bossName: this.boss ? this.boss.name : undefined,
        perks: Array.from(this.activePerks.values()),
      });
    }
  }

  private triggerChainLightning(origin: Enemy, dmg: number, maxTargets: number) {
    let targetsFound = 0;
    for (const other of this.enemies) {
      if (other === origin) continue;
      const d = Math.hypot(other.x - origin.x, other.y - origin.y);
      if (d < 180) {
        // Draw lightning spark
        this.particles.emitSpark(other.x, other.y, '#38bdf8', 8);
        other.takeDamage(dmg, this.particles, this.player);
        targetsFound++;
        if (targetsFound >= maxTargets) break;
      }
    }
  }

  private addCombo() {
    this.currentCombo++;
    this.comboTimer = 160; // ~2.6s
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
  }

  private addScore(base: number) {
    const multiplier = 1 + Math.min(10, Math.floor(this.currentCombo / 5)) * 0.25;
    this.score += Math.round(base * multiplier);
  }

  private triggerLevelUp() {
    this.pause();
    const cards = getRandomUpgrades(3);
    if (this.onLevelUp) {
      this.onLevelUp(cards);
    }
  }

  private handleGameOver() {
    this.stop();
    if (this.onGameOver) {
      this.onGameOver(this.getRunStats());
    }
  }

  private handleVictory() {
    this.stop();
    if (this.onVictory) {
      this.onVictory(this.getRunStats());
    }
  }

  public getRunStats(): RunStats {
    const seconds = Math.round((Date.now() - this.startTime) / 1000);
    return {
      score: this.score,
      wave: this.wave,
      enemiesDefeated: this.enemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      damageDealt: Math.round(this.damageDealt),
      maxCombo: this.maxCombo,
      timeSurvivedSeconds: seconds,
      crystalsCollected: this.crystalsCollected,
    };
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen shake
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(sx, sy);
    }

    // Space deep backdrop
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Subtle atmospheric nebula glow
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 60, w * 0.5, h * 0.5, w * 0.75);
    grad.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.3)');
    grad.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Render stars
    for (const star of this.stars) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Render Collectibles
    for (const c of this.collectibles) {
      c.render(ctx);
    }

    // Render Enemies
    for (const e of this.enemies) {
      e.render(ctx);
    }

    // Render Boss
    if (this.boss) {
      this.boss.render(ctx);
    }

    // Render Bullets
    for (const b of this.bullets) {
      b.render(ctx);
    }

    // Render Player
    this.player.render(ctx);

    // Render Particles & Floats
    this.particles.render(ctx);

    ctx.restore();
  }
}
