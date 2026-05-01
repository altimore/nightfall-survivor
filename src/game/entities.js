import { ETYPES, ITEMS, STATUS_TEMPLATES } from './data.js';

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
    // Cape (triangle behind body)
    g.fillStyle(0x1e0a3c, 0.85);
    g.fillTriangle(-13, -2, 0, 22, 13, -2);
    // Body / robe
    g.fillStyle(0x3b1078, 1);
    g.fillCircle(0, 2, 13);
    // Hood
    g.fillStyle(0x1e0a3c, 1);
    g.fillCircle(0, -4, 11);
    // Face
    g.fillStyle(0xe0b896, 1);
    g.fillCircle(0, -3, 7);
    // Glowing eyes
    g.fillStyle(0xff0040, 1);
    g.fillCircle(-3, -4, 2);
    g.fillCircle(3, -4, 2);
    // Dash ready ring
    if (this.canDash && this.dashCD <= 0) {
      g.lineStyle(1.5, 0x80ffdb, 0.45);
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
    // baseSpd in data.js was balanced for the original Canvas formula (v* ≈ baseSpd × 15
    // with the smoothing integration). We now use a clean px/s formula, so we rescale here
    // so a "bat" stays around ~155 px/s — roughly the player's 165 px/s baseline.
    this.speed = et.baseSpd * speedMul * 2.7;
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
    this.bob = Math.random() * Math.PI * 2;
    this.resists = et.resists || {};
    this.statuses = {};
    this.alive = true;
  }

  takeDamage(amount, type = 'physical', scene) {
    if (this.hp <= 0) return 0;
    const r = this.resists[type] ?? this.resists.all ?? 1;
    const final = amount * r;
    if (final <= 0) return 0;
    this.hp -= final;
    const tplFn = STATUS_TEMPLATES[type];
    if (tplFn && r > 0) {
      const tpl = tplFn();
      if (tpl.kind === 'burning') {
        this.statuses.burning = { dmgPerTick: final * tpl.dmgFrac, ticksLeft: tpl.ticks, interval: tpl.interval, t: tpl.interval };
      } else if (tpl.kind === 'frozen') {
        this.statuses.frozen = { duration: tpl.duration };
      } else if (tpl.kind === 'poisoned') {
        const ticks = Math.max(1, Math.floor(tpl.duration / tpl.interval));
        this.statuses.poisoned = { dmgPerTick: final * tpl.dmgFrac, ticksLeft: ticks, interval: tpl.interval, t: tpl.interval };
      } else if (tpl.kind === 'shocked') {
        this.statuses.shocked = { duration: tpl.duration };
      }
    }
    if (scene) scene.fxDamage(this.x, this.y, final, this.type === 'boss');
    return final;
  }

  tickStatuses(dt, scene) {
    const s = this.statuses;
    if (s.burning) {
      s.burning.t -= dt;
      if (s.burning.t <= 0) {
        this.hp -= s.burning.dmgPerTick;
        scene?.fxDamage?.(this.x, this.y, s.burning.dmgPerTick, false);
        s.burning.ticksLeft--;
        s.burning.t = s.burning.interval;
        if (s.burning.ticksLeft <= 0) delete s.burning;
      }
    }
    if (s.poisoned) {
      s.poisoned.t -= dt;
      if (s.poisoned.t <= 0) {
        this.hp -= s.poisoned.dmgPerTick;
        scene?.fxDamage?.(this.x, this.y, s.poisoned.dmgPerTick, false);
        s.poisoned.ticksLeft--;
        s.poisoned.t = s.poisoned.interval;
        if (s.poisoned.ticksLeft <= 0) delete s.poisoned;
      }
    }
    if (s.frozen) {
      s.frozen.duration -= dt;
      if (s.frozen.duration <= 0) delete s.frozen;
    }
    if (s.shocked) {
      s.shocked.duration -= dt;
      if (s.shocked.duration <= 0) delete s.shocked;
    }
  }

  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.12;
    const hpRatio = this.hp / this.maxHp;

    switch (this.type) {
      case 'bat':      drawBat(g, this); break;
      case 'zombie':   drawZombie(g, this); break;
      case 'skeleton': drawSkeleton(g, this); break;
      case 'ghost':    drawGhost(g, this, hpRatio); break;
      case 'knight':   drawKnight(g, this); break;
      case 'witch':    drawWitch(g, this); break;
      case 'boss':     drawBoss(g, this); break;
      default:
        g.fillStyle(this.col, 1);
        g.fillCircle(0, 0, this.size);
    }

    // Status visuals (frozen tint, burning flames, poison bubbles, shock arcs)
    const s = this.statuses;
    if (s.frozen) {
      g.fillStyle(0x88ccff, 0.4);
      g.fillCircle(0, 0, this.size + 3);
      g.lineStyle(1.5, 0xb0e0ff, 0.9);
      g.strokeCircle(0, 0, this.size + 3);
      // ice crystals
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + this.bob * 0.1;
        g.fillStyle(0xe0f5ff, 0.85);
        g.fillTriangle(
          Math.cos(a) * (this.size + 1) - 1.5, Math.sin(a) * (this.size + 1) - 1.5,
          Math.cos(a) * (this.size + 5), Math.sin(a) * (this.size + 5),
          Math.cos(a) * (this.size + 1) + 1.5, Math.sin(a) * (this.size + 1) + 1.5
        );
      }
    }
    if (s.burning) {
      const flick = (Math.sin(this.bob * 4) + 1) * 0.5;
      // flames above
      for (let i = -1; i <= 1; i++) {
        const fx = i * this.size * 0.45;
        const fy = -this.size - 4;
        g.fillStyle(0xff3300, 0.6 + flick * 0.3);
        g.fillTriangle(fx - 4, fy + 6, fx, fy - 8 - flick * 4, fx + 4, fy + 6);
        g.fillStyle(0xffaa00, 0.85);
        g.fillTriangle(fx - 2.5, fy + 5, fx, fy - 4 - flick * 3, fx + 2.5, fy + 5);
      }
    }
    if (s.poisoned) {
      g.fillStyle(0x88dd33, 0.85);
      g.fillCircle(this.size * 0.6, -this.size * 0.3 + Math.sin(this.bob) * 2, 2.5);
      g.fillCircle(-this.size * 0.5, -this.size * 0.6 + Math.cos(this.bob * 1.3) * 2, 2);
      g.fillCircle(this.size * 0.2, -this.size * 0.9 + Math.sin(this.bob * 0.8) * 2, 1.5);
      g.fillStyle(0xb8ff66, 0.9);
      g.fillCircle(this.size * 0.6, -this.size * 0.3 + Math.sin(this.bob) * 2, 1);
    }
    if (s.shocked) {
      g.lineStyle(1.5, 0xffffff, 0.95);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r1 = this.size * 0.6, r2 = this.size + 3;
        g.beginPath();
        g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        g.lineTo(Math.cos(a + 0.3) * r2, Math.sin(a + 0.3) * r2);
        g.strokePath();
      }
    }

    // HP bar (mid+ enemies)
    if (this.size > 12) {
      g.fillStyle(0x330000, 1);
      g.fillRect(-22, -this.size - 14, 44, 4);
      g.fillStyle(this.type === 'boss' ? 0xff4400 : 0xff0000, 1);
      g.fillRect(-22, -this.size - 14, 44 * hpRatio, 4);
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Per-type sprite drawers (Phaser Graphics primitives)
// ────────────────────────────────────────
function drawBat(g, e) {
  const s = e.size;
  const flap = Math.sin(e.bob) * 0.3;
  // wings (triangles, flapping)
  g.fillStyle(0x3a0a52, 1);
  g.fillTriangle(-s * 2.4, -s * 0.2 + flap * s, -s, -s * 0.8, -s * 0.5, 0);
  g.fillTriangle(s * 2.4, -s * 0.2 + flap * s, s, -s * 0.8, s * 0.5, 0);
  // body
  g.fillStyle(e.col, 1);
  g.fillCircle(0, 0, s);
  // ears
  g.fillTriangle(-s * 0.5, -s * 0.7, -s * 0.2, -s * 1.4, 0, -s * 0.6);
  g.fillTriangle(s * 0.5, -s * 0.7, s * 0.2, -s * 1.4, 0, -s * 0.6);
  // glowing eyes
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.35, -s * 0.1, s * 0.2);
  g.fillCircle(s * 0.35, -s * 0.1, s * 0.2);
  // fangs
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(-s * 0.2, s * 0.2, -s * 0.05, s * 0.6, 0, s * 0.2);
  g.fillTriangle(s * 0.2, s * 0.2, s * 0.05, s * 0.6, 0, s * 0.2);
}

function drawZombie(g, e) {
  const s = e.size;
  const sway = Math.sin(e.bob * 0.5) * s * 0.08;
  // legs
  g.fillStyle(0x2a4815, 1);
  g.fillRect(-s * 0.45, s * 0.3, s * 0.35, s * 0.7);
  g.fillRect(s * 0.1, s * 0.3, s * 0.35, s * 0.7);
  // arms (dangling)
  g.fillStyle(0x55881f, 1);
  g.fillRect(-s * 0.95 + sway, -s * 0.2, s * 0.28, s * 0.95);
  g.fillRect(s * 0.65 - sway, -s * 0.2, s * 0.28, s * 0.95);
  // body (torn shirt)
  g.fillStyle(e.col, 1);
  g.fillRoundedRect(-s * 0.65, -s * 0.4, s * 1.3, s * 0.95, 3);
  // head
  g.fillStyle(0x88a050, 1);
  g.fillCircle(0, -s * 0.75, s * 0.5);
  // eyes (glowing orange)
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.18, -s * 0.78, s * 0.12);
  g.fillCircle(s * 0.18, -s * 0.78, s * 0.12);
  // mouth slash
  g.fillStyle(0x220500, 1);
  g.fillRect(-s * 0.22, -s * 0.55, s * 0.44, s * 0.08);
}

function drawSkeleton(g, e) {
  const s = e.size;
  // ribs
  g.fillStyle(0x8a8870, 1);
  g.fillRect(-s * 0.5, s * 0.05, s * 1.0, s * 0.18);
  g.fillRect(-s * 0.5, s * 0.35, s * 1.0, s * 0.18);
  // spine
  g.fillStyle(e.col, 1);
  g.fillRect(-s * 0.18, -s * 0.1, s * 0.36, s * 0.85);
  // pelvis
  g.fillTriangle(-s * 0.5, s * 0.7, s * 0.5, s * 0.7, 0, s * 1.05);
  // skull
  g.fillStyle(e.col, 1);
  g.fillCircle(0, -s * 0.55, s * 0.7);
  // jaw
  g.fillRect(-s * 0.45, -s * 0.15, s * 0.9, s * 0.32);
  // eye sockets (deep black)
  g.fillStyle(0x000000, 1);
  g.fillCircle(-s * 0.28, -s * 0.55, s * 0.22);
  g.fillCircle(s * 0.28, -s * 0.55, s * 0.22);
  // glowing red pupils
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.28, -s * 0.55, s * 0.08);
  g.fillCircle(s * 0.28, -s * 0.55, s * 0.08);
  // teeth
  g.fillStyle(0xffffff, 1);
  for (let i = -2; i <= 2; i++) g.fillRect(i * s * 0.12 - s * 0.04, -s * 0.05, s * 0.08, s * 0.12);
}

function drawGhost(g, e, hpRatio) {
  const s = e.size;
  const wob = Math.sin(e.bob * 0.7) * s * 0.12;
  const a = 0.45 + hpRatio * 0.4;
  // body (oval) — translucent
  g.fillStyle(e.col, a);
  g.fillEllipse(0, -s * 0.1, s * 1.7, s * 1.9);
  // wavy bottom (3 bumps)
  g.fillCircle(-s * 0.55 + wob, s * 0.65, s * 0.35);
  g.fillCircle(0 - wob, s * 0.75, s * 0.35);
  g.fillCircle(s * 0.55 + wob, s * 0.65, s * 0.35);
  // hollow eyes (dark voids)
  g.fillStyle(0x0a0a2a, 0.9);
  g.fillCircle(-s * 0.3, -s * 0.3, s * 0.18);
  g.fillCircle(s * 0.3, -s * 0.3, s * 0.18);
  // glowing pupils
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.3, -s * 0.3, s * 0.07);
  g.fillCircle(s * 0.3, -s * 0.3, s * 0.07);
  // ghostly mouth (small oval)
  g.fillStyle(0x0a0a2a, 0.7);
  g.fillEllipse(0, s * 0.05, s * 0.35, s * 0.25);
}

function drawKnight(g, e) {
  const s = e.size;
  // legs
  g.fillStyle(0x4a2606, 1);
  g.fillRect(-s * 0.45, s * 0.4, s * 0.35, s * 0.55);
  g.fillRect(s * 0.1, s * 0.4, s * 0.35, s * 0.55);
  // body / breastplate
  g.fillStyle(e.col, 1);
  g.fillRoundedRect(-s * 0.7, -s * 0.3, s * 1.4, s * 0.95, 3);
  // shoulder pauldrons
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(-s * 0.7, -s * 0.15, s * 0.32);
  g.fillCircle(s * 0.7, -s * 0.15, s * 0.32);
  // belt
  g.fillStyle(0x3a1c08, 1);
  g.fillRect(-s * 0.7, s * 0.3, s * 1.4, s * 0.18);
  // helmet (cone)
  g.fillStyle(0x6a3818, 1);
  g.fillTriangle(-s * 0.6, -s * 0.3, 0, -s * 1.2, s * 0.6, -s * 0.3);
  // visor slit
  g.fillStyle(0x000000, 1);
  g.fillRect(-s * 0.42, -s * 0.65, s * 0.85, s * 0.16);
  // glowing red eyes inside slit
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.2, -s * 0.57, s * 0.06);
  g.fillCircle(s * 0.2, -s * 0.57, s * 0.06);
  // charge indicator
  if (!e.charging && e.chargeTimer < 1) {
    g.lineStyle(2.5, 0xff4400, 1 - e.chargeTimer);
    g.strokeCircle(0, 0, s + 8);
  }
}

function drawWitch(g, e) {
  const s = e.size;
  // robe
  g.fillStyle(e.col, 1);
  g.fillTriangle(-s * 0.85, s * 1.0, s * 0.85, s * 1.0, 0, -s * 0.05);
  // hands (small circles)
  g.fillStyle(0xd0a0d0, 1);
  g.fillCircle(-s * 0.55, s * 0.4, s * 0.13);
  g.fillCircle(s * 0.55, s * 0.4, s * 0.13);
  // face (pale)
  g.fillStyle(0xd0a0d0, 1);
  g.fillCircle(0, -s * 0.25, s * 0.45);
  // pointy chin
  g.fillTriangle(-s * 0.18, -s * 0.05, s * 0.18, -s * 0.05, 0, s * 0.2);
  // hat brim
  g.fillStyle(0x1a0626, 1);
  g.fillRect(-s * 0.85, -s * 0.55, s * 1.7, s * 0.16);
  // hat cone
  g.fillStyle(0x2a0a40, 1);
  g.fillTriangle(-s * 0.5, -s * 0.55, 0, -s * 1.7, s * 0.5, -s * 0.55);
  // hat band
  g.fillStyle(0xffd700, 1);
  g.fillRect(-s * 0.36, -s * 0.7, s * 0.72, s * 0.08);
  // glowing eyes
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.18, -s * 0.3, s * 0.09);
  g.fillCircle(s * 0.18, -s * 0.3, s * 0.09);
  // crooked smile
  g.fillStyle(0x220011, 1);
  g.fillRect(-s * 0.18, -s * 0.05, s * 0.36, s * 0.05);
}

function drawBoss(g, e) {
  const s = e.size;
  const pulse = 1 + Math.sin(e.bob * 0.3) * 0.04;
  // dark aura
  g.fillStyle(0x4a0020, 0.35);
  g.fillCircle(0, 0, s * 1.4 * pulse);
  // body (jagged dark mass)
  g.fillStyle(e.col, 1);
  g.fillCircle(0, 0, s);
  // spikes around body
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = Math.cos(a) * s, y1 = Math.sin(a) * s;
    const x2 = Math.cos(a) * s * 1.35, y2 = Math.sin(a) * s * 1.35;
    const ax = -Math.sin(a) * s * 0.2, ay = Math.cos(a) * s * 0.2;
    g.fillTriangle(x1 - ax, y1 - ay, x2, y2, x1 + ax, y1 + ay);
  }
  // horns
  g.fillStyle(0x2a0010, 1);
  g.fillTriangle(-s * 0.7, -s * 0.5, -s * 1.1, -s * 1.4, -s * 0.3, -s * 0.7);
  g.fillTriangle(s * 0.7, -s * 0.5, s * 1.1, -s * 1.4, s * 0.3, -s * 0.7);
  // mouth (jagged)
  g.fillStyle(0x000000, 1);
  g.fillEllipse(0, s * 0.4, s * 0.85, s * 0.45);
  // teeth
  g.fillStyle(0xffffff, 1);
  for (let i = -3; i <= 3; i++) g.fillTriangle(i * s * 0.13, s * 0.25, i * s * 0.13 + s * 0.07, s * 0.55, i * s * 0.13 - s * 0.07, s * 0.55);
  // huge yellow eyes
  g.fillStyle(0x000000, 1);
  g.fillCircle(-s * 0.35, -s * 0.15, s * 0.27);
  g.fillCircle(s * 0.35, -s * 0.15, s * 0.27);
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(-s * 0.35, -s * 0.12, s * 0.18);
  g.fillCircle(s * 0.35, -s * 0.12, s * 0.18);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(-s * 0.35, -s * 0.12, s * 0.07);
  g.fillCircle(s * 0.35, -s * 0.12, s * 0.07);
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
    // blade
    g.fillStyle(0xa0c4ff, 1);
    g.fillTriangle(-12, -2.5, 14, 0, -12, 2.5);
    // hilt
    g.fillStyle(0x4a2c8a, 1);
    g.fillRect(-15, -3, 4, 6);
    // glow trail
    g.fillStyle(0xc7e0ff, 0.45);
    g.fillTriangle(-22, -1.2, -12, 0, -22, 1.2);
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
    // halo
    g.fillStyle(this.col, 0.3);
    g.fillCircle(0, 0, this.r * 1.7);
    // core
    g.fillStyle(this.col, 0.95);
    g.fillCircle(0, 0, this.r);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(-this.r * 0.3, -this.r * 0.3, this.r * 0.35);
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
    this.text = scene.add.text(x, y, it.icon, { fontSize: '20px', fontFamily: 'serif' })
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
    g.strokeCircle(0, 0, 18);
    g.fillStyle(this.col, fade * 0.18);
    g.fillCircle(0, 0, 18);
    // life bar
    g.fillStyle(this.col, fade * 0.7);
    g.fillRect(-14, 22, 28 * (this.life / this.maxLife), 3);
    this.text.x = this.x;
    this.text.y = this.y + bobY;
    this.text.alpha = fade;
  }
  destroy() { this.gfx.destroy(); this.text.destroy(); }
}

// ────────────────────────────────────────
// Toxic trail tile (poison puddle left by Sentier Maudit)
// ────────────────────────────────────────
export class TrailTile {
  constructor(scene, x, y, radius, life) {
    this.gfx = scene.add.graphics().setDepth(3);
    this.x = x; this.y = y;
    this.radius = radius;
    this.life = life;
    this.maxLife = life;
    this.bob = Math.random() * Math.PI * 2;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.18;
    const fade = Math.min(1, this.life / this.maxLife);
    const r = this.radius + Math.sin(this.bob) * 1.5;
    // outer halo
    g.fillStyle(0x55aa00, 0.18 * fade);
    g.fillCircle(0, 0, r * 1.5);
    // pool body
    g.fillStyle(0x88dd33, 0.4 * fade);
    g.fillCircle(0, 0, r);
    // darker spots (bubbles)
    g.fillStyle(0x33aa00, 0.55 * fade);
    g.fillCircle(-r * 0.35, -r * 0.2, r * 0.18);
    g.fillCircle(r * 0.25, r * 0.15, r * 0.14);
    g.fillCircle(r * 0.05, -r * 0.4, r * 0.1);
    // glow rim
    g.lineStyle(1.5, 0xb8ff66, 0.5 * fade);
    g.strokeCircle(0, 0, r);
  }
  destroy() { this.gfx.destroy(); }
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
    // glow halo
    g.fillStyle(0x00ff88, 0.25);
    g.fillCircle(0, 0, 9);
    g.fillStyle(0x00ff88, 1);
    g.fillCircle(0, 0, 4);
    g.fillStyle(0xb6ffd9, 1);
    g.fillCircle(-1.2, -1.2, 1.5);
  }
  destroy() { this.gfx.destroy(); }
}
