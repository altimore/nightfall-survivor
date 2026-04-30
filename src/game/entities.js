import Phaser from 'phaser';
import { ETYPES, ITEMS } from './data.js';

// All entities are plain objects holding a Phaser.GameObjects.Graphics (`gfx`)
// + game state. Scene iterates the arrays each frame, calls tick() & redraw(),
// and destroys gfx when alive=false.

// ────────────────────────────────────────
// Player
// ────────────────────────────────────────
export class Player {
  constructor(scene, x, y) {
    this.gfx = scene.add.graphics().setDepth(20);
    this.x = x; this.y = y;
    this.hp = 100; this.maxHp = 100;
    this.xp = 0; this.level = 1;
    this.skills = { dagger: 1 };
    this.speed = 165; this.dmgM = 1; this.xpM = 1;
    this.magnet = 60; this.regen = 0;
    this.canDash = false; this.dashCD = 0; this.dashDur = 0;
    this.dashDir = { x: 0, y: 1 };
    this.ls = 0; this.kh = false;
    this.iframes = 0;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    const flash = this.iframes > 0 && Math.floor(this.iframes * 12) % 2 === 0;
    if (flash) return;
    // outer ring (purple glow approximated with alpha)
    g.fillStyle(0x1e0a3c, 1); g.fillCircle(0, 0, 15);
    g.fillStyle(0x3b1078, 1); g.fillCircle(0, 0, 13);
    // face
    g.fillStyle(0xe0b896, 1); g.fillCircle(0, -3, 8);
    // eyes
    g.fillStyle(0xff0040, 1);
    g.fillCircle(-3, -4, 2);
    g.fillCircle(3, -4, 2);
    // dash ready ring
    if (this.canDash && this.dashCD <= 0) {
      g.lineStyle(1, 0x80ffdb, 0.35);
      g.strokeCircle(0, 0, 22);
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Enemy
// ────────────────────────────────────────
export class Enemy {
  constructor(scene, x, y, type, hpMul = 1, speedMul = 1, dmgMul = 1) {
    const et = ETYPES[type];
    this.gfx = scene.add.graphics().setDepth(10);
    this.x = x; this.y = y;
    this.type = type;
    this.maxHp = et.baseHp * hpMul;
    this.hp = this.maxHp;
    this.speed = et.baseSpd * speedMul;
    this.size = et.size;
    this.dmg = et.dmg * dmgMul;
    this.xpVal = et.xpVal;
    this.behavior = et.behavior;
    this.col = et.col;
    this.eyeCol = et.eyeCol;
    this.vx = 0; this.vy = 0;
    this.iframes = 0;
    this.angle = 0;
    this.chargeTimer = 3 + Math.random() * 2;
    this.charging = false;
    this.chargeDx = 0; this.chargeDy = 0; this.chargeDur = 0;
    this.shootTimer = 1.5 + Math.random();
    this.kiteDist = 180 + Math.random() * 60;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    const hpRatio = this.hp / this.maxHp;
    const alpha = this.type === 'ghost' ? 0.5 + hpRatio * 0.4 : 1;
    g.fillStyle(this.col, alpha);
    g.fillCircle(0, 0, this.size);
    // charge indicator
    if (this.type === 'knight' && !this.charging && this.chargeTimer < 1) {
      g.lineStyle(2, 0xff4400, 1 - this.chargeTimer);
      g.strokeCircle(0, 0, this.size + 6);
    }
    // eyes
    g.fillStyle(this.eyeCol, 1);
    g.fillCircle(-this.size * 0.3, -this.size * 0.2, this.size * 0.18);
    g.fillCircle(this.size * 0.3, -this.size * 0.2, this.size * 0.18);
    // HP bar
    if (this.size > 12) {
      g.fillStyle(0x330000, 1);
      g.fillRect(-22, -this.size - 8, 44, 4);
      g.fillStyle(this.type === 'boss' ? 0xff4400 : 0xff0000, 1);
      g.fillRect(-22, -this.size - 8, 44 * hpRatio, 4);
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Player projectile (dagger)
// ────────────────────────────────────────
export class Projectile {
  constructor(scene, x, y, dx, dy, dmg, pierce) {
    this.gfx = scene.add.graphics().setDepth(15);
    this.x = x; this.y = y;
    this.dx = dx; this.dy = dy;
    this.dmg = dmg;
    this.pierce = pierce;
    this.hits = new Set();
    this.life = 1.4;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    g.rotation = Math.atan2(this.dy, this.dx);
    g.fillStyle(0xa0c4ff, 1);
    g.fillRect(-12, -2, 24, 4);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Enemy projectile
// ────────────────────────────────────────
export class EnemyProjectile {
  constructor(scene, x, y, dx, dy, dmg, col, r = 5) {
    this.gfx = scene.add.graphics().setDepth(8);
    this.x = x; this.y = y;
    this.dx = dx; this.dy = dy;
    this.dmg = dmg;
    this.col = col;
    this.r = r;
    this.life = 2;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    g.fillStyle(this.col, 0.9);
    g.fillCircle(0, 0, this.r);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Ground item pickup
// ────────────────────────────────────────
export class Item {
  constructor(scene, x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.life = 14; this.maxLife = 14;
    this.bob = Math.random() * Math.PI * 2;
    const it = ITEMS[type];
    this.gfx = scene.add.graphics().setDepth(5);
    this.text = scene.add.text(x, y, it.icon, { fontSize: '16px', fontFamily: 'serif' })
      .setOrigin(0.5).setDepth(6);
    this.alive = true;
    this.col = it.colNum;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    const fade = Math.min(1, this.life / 2);
    const bobY = Math.sin(this.bob) * 5;
    g.x = this.x; g.y = this.y + bobY;
    g.lineStyle(2, this.col, fade);
    g.strokeCircle(0, 0, 16);
    g.fillStyle(this.col, fade * 0.15);
    g.fillCircle(0, 0, 16);
    // life bar
    g.fillStyle(this.col, fade * 0.7);
    g.fillRect(-14, 20, 28 * (this.life / this.maxLife), 3);
    this.text.x = this.x;
    this.text.y = this.y + bobY;
    this.text.alpha = fade;
  }
  destroy() { this.gfx.destroy(); this.text.destroy(); }
}

// ────────────────────────────────────────
// XP orb
// ────────────────────────────────────────
export class XpOrb {
  constructor(scene, x, y, value) {
    this.gfx = scene.add.graphics().setDepth(4);
    this.x = x; this.y = y;
    this.value = value;
    this.life = 8;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    g.fillStyle(0x00ff88, 1);
    g.fillCircle(0, 0, 4);
  }
  destroy() { this.gfx.destroy(); }
}
