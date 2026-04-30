import Phaser from 'phaser';
import { GOAL_TIME } from '../config.js';
import { Player, Enemy, Projectile } from '../entities.js';
import { initAudio, playSfx, startMusic, stopMusic, setMuted } from '../audio.js';
import { bus } from '../bus.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  get W() { return this.scale.width; }
  get H() { return this.scale.height; }

  create() {
    this.cameras.main.setBackgroundColor('#060011');

    this.bgGfx = this.add.graphics().setDepth(-10);
    this.joyGfx = this.add.graphics().setDepth(50);

    this.player = new Player(this, this.W / 2, this.H / 2);
    this.enemies = [];
    this.projectiles = [];
    this.elapsed = 0;
    this.kills = 0;
    this.spawnT = 1;
    this.daggerT = 0;
    this.over = false;
    this.hudT = 0;

    this.keys = this.input.keyboard.addKeys('W,A,S,D,Z,Q,UP,DOWN,LEFT,RIGHT');

    this.joystick = { active: false, id: null, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0, dx: 0, dy: 0 };
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.offRestart = bus.on('game:restart', () => this.scene.restart());
    this.offMute    = bus.on('game:mute', m => { setMuted(m); if (!m) startMusic(); });

    initAudio();
    startMusic();

    this.events.on('shutdown', () => {
      this.offRestart?.();
      this.offMute?.();
      stopMusic();
    });

    this.emitHud();
  }

  onPointerDown(p) {
    if (this.over) return;
    const j = this.joystick;
    if (!j.active) {
      j.active = true; j.id = p.id;
      j.baseX = p.x; j.baseY = p.y;
      j.thumbX = p.x; j.thumbY = p.y;
      j.dx = 0; j.dy = 0;
    }
  }
  onPointerMove(p) {
    const j = this.joystick;
    if (!j.active || p.id !== j.id) return;
    const R = 55;
    const dx = p.x - j.baseX, dy = p.y - j.baseY;
    const dist = Math.hypot(dx, dy);
    const clamp = Math.min(dist, R);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    j.thumbX = j.baseX + nx * clamp;
    j.thumbY = j.baseY + ny * clamp;
    j.dx = nx * Math.min(dist / R, 1);
    j.dy = ny * Math.min(dist / R, 1);
  }
  onPointerUp(p) {
    const j = this.joystick;
    if (p.id === j.id) { j.active = false; j.id = null; j.dx = 0; j.dy = 0; }
  }

  spawnEnemy(typeName) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(this.W, this.H) * 0.58;
    const x = this.W / 2 + Math.cos(angle) * dist;
    const y = this.H / 2 + Math.sin(angle) * dist;
    const tier = Math.floor(this.elapsed / 60);
    const hpMul = 1 + tier * 0.3;
    const dmgMul = 1 + tier * 0.1;
    this.enemies.push(new Enemy(this, x, y, typeName, hpMul, 1, dmgMul));
  }

  emitHud() {
    bus.emit('hud:update', {
      hp: Math.floor(this.player.hp),
      maxHp: this.player.maxHp,
      t: Math.floor(this.elapsed),
      kills: this.kills,
      goal: GOAL_TIME,
      over: this.over,
    });
  }

  update(_time, delta) {
    if (this.over) return;
    const dt = Math.min(delta / 1000, 0.05);
    const p = this.player;
    this.elapsed += dt;

    // ── Movement (joystick + keyboard)
    let mx = this.joystick.dx || 0;
    let my = this.joystick.dy || 0;
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown || k.Q.isDown) mx -= 1;
    if (k.RIGHT.isDown || k.D.isDown) mx += 1;
    if (k.UP.isDown || k.W.isDown || k.Z.isDown) my -= 1;
    if (k.DOWN.isDown || k.S.isDown) my += 1;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    p.x += mx * p.speed * dt;
    p.y += my * p.speed * dt;
    p.x = Math.max(15, Math.min(this.W - 15, p.x));
    p.y = Math.max(15, Math.min(this.H - 15, p.y));
    p.iframes = Math.max(0, p.iframes - dt);

    // ── Spawn
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.4, 1.6 / (0.5 + this.elapsed / 90));
      const types = ['bat'];
      if (this.elapsed >= 30) types.push('zombie');
      if (this.elapsed >= 60) types.push('skeleton');
      if (this.elapsed >= 120) types.push('knight');
      this.spawnEnemy(types[Math.floor(Math.random() * types.length)]);
    }

    // ── Enemies
    for (const e of this.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      const ndx = d > 0 ? dx / d : 0, ndy = d > 0 ? dy / d : 0;
      e.vx = e.vx * (1 - dt * 4) + ndx * e.speed * dt;
      e.vy = e.vy * (1 - dt * 4) + ndy * e.speed * dt;
      e.x += e.vx; e.y += e.vy;
      if (p.iframes <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.size + 14) {
        p.hp -= e.dmg;
        p.iframes = 0.9;
        playSfx('hit');
      }
    }

    // ── Dagger auto-fire
    this.daggerT -= dt;
    if (this.daggerT <= 0 && this.enemies.length > 0) {
      this.daggerT = 0.8;
      let near = null, nd = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < nd) { nd = d; near = e; }
      }
      if (near) {
        const a = Math.atan2(near.y - p.y, near.x - p.x);
        this.projectiles.push(new Projectile(this, p.x, p.y, Math.cos(a) * 390, Math.sin(a) * 390, 16, false));
        playSfx('dagger');
      }
    }

    // ── Projectiles
    for (const proj of this.projectiles) {
      proj.x += proj.dx * dt;
      proj.y += proj.dy * dt;
      proj.life -= dt;
      if (proj.life <= 0 || proj.x < -60 || proj.x > this.W + 60 || proj.y < -60 || proj.y > this.H + 60) {
        proj.alive = false;
        continue;
      }
      for (const e of this.enemies) {
        if (Math.hypot(proj.x - e.x, proj.y - e.y) < e.size + 5) {
          e.hp -= proj.dmg;
          proj.alive = false;
          break;
        }
      }
    }

    // ── Cleanup
    this.projectiles = this.projectiles.filter(pr => {
      if (!pr.alive) pr.destroy();
      return pr.alive;
    });
    this.enemies = this.enemies.filter(e => {
      if (e.hp <= 0) {
        this.kills++;
        playSfx('death');
        e.destroy();
        return false;
      }
      return true;
    });

    // ── End conditions
    if (p.hp <= 0) {
      p.hp = 0; this.over = true;
      stopMusic(); playSfx('gameover');
      bus.emit('phase', 'dead');
      this.emitHud();
    } else if (this.elapsed >= GOAL_TIME) {
      this.over = true;
      stopMusic(); playSfx('victory');
      bus.emit('phase', 'victory');
      this.emitHud();
    }

    // ── Render
    this.drawBg();
    p.redraw();
    for (const e of this.enemies) e.redraw();
    for (const proj of this.projectiles) proj.redraw();
    this.drawJoystick();

    // ── HUD throttle
    this.hudT += dt;
    if (this.hudT > 0.12) { this.hudT = 0; this.emitHud(); }
  }

  drawBg() {
    const g = this.bgGfx;
    g.clear();
    const p = this.player;
    const ox = (p.x * 0.55 % 80 + 80) % 80;
    const oy = (p.y * 0.55 % 70 + 70) % 70;
    g.lineStyle(1, 0x3c005f, 0.18);
    for (let x = -ox - 80; x < this.W + 80; x += 80) {
      for (let y = -oy - 70; y < this.H + 70; y += 70) {
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i - Math.PI / 6;
          const px = x + 28 * Math.cos(a), py = y + 28 * Math.sin(a);
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.closePath();
        g.strokePath();
      }
    }
  }

  drawJoystick() {
    const g = this.joyGfx;
    g.clear();
    const j = this.joystick;
    if (!j.active) {
      g.lineStyle(1.5, 0x9d4edd, 0.07);
      g.strokeCircle(90, this.H - 90, 55);
      g.strokeCircle(90, this.H - 90, 28);
      return;
    }
    g.lineStyle(2, 0xc77dff, 0.28);
    g.strokeCircle(j.baseX, j.baseY, 55);
    g.fillStyle(0x7b2fbe, 0.08);
    g.fillCircle(j.baseX, j.baseY, 55);
    g.fillStyle(0x9d4edd, 0.5);
    g.fillCircle(j.thumbX, j.thumbY, 28);
    g.fillStyle(0xe0aaff, 0.8);
    g.fillCircle(j.thumbX, j.thumbY, 10);
  }
}
