import { ETYPES, ITEMS, STATUS_TEMPLATES } from './data.js';

// ────────────────────────────────────────
// Controller configurations.
// In solo, player 1 grabs both WASD and arrows. In duo, player 1 keeps WASD
// and player 2 takes the arrows (so each player has their own keys).
// ────────────────────────────────────────
export const CONTROLLER_SOLO = {
  keys: { left: ['A', 'Q', 'LEFT'], right: ['D', 'RIGHT'], up: ['W', 'Z', 'UP'], down: ['S', 'DOWN'], dash: ['SPACE'] },
  gamepadIndex: 0,
  joystick: true,
  color: 0xff4d6d,
};
export const CONTROLLER_P1 = {
  keys: { left: ['A', 'Q'], right: ['D'], up: ['W', 'Z'], down: ['S'], dash: ['SPACE'] },
  gamepadIndex: 0,
  joystick: true,
  color: 0xff4d6d,
};
export const CONTROLLER_P2 = {
  keys: { left: ['LEFT'], right: ['RIGHT'], up: ['UP'], down: ['DOWN'], dash: ['ENTER', 'NUMPAD_ZERO', 'SHIFT'] },
  gamepadIndex: 1,
  joystick: false,
  color: 0x88ddff,
};
export const DEFAULT_CONTROLLER = CONTROLLER_SOLO;

export const PLAYER_TINTS = [0xff4d6d, 0x88ddff, 0x80ffdb, 0xffe066];

// ────────────────────────────────────────
// Player
// ────────────────────────────────────────
export class Player {
  constructor(scene, x, y, id = 0, controller = DEFAULT_CONTROLLER) {
    this.gfx = scene.add.graphics().setDepth(20);
    this.x = x; this.y = y;
    this.id = id;
    this.controller = controller;
    this.hp = 100; this.maxHp = 100;
    this.xp = 0; this.level = 1;
    this.skills = { dagger: 1 };
    this.speed = 165; this.dmgM = 1; this.xpM = 1;
    this.magnet = 60; this.regen = 0;
    this.canDash = false; this.dashCD = 0; this.dashDur = 0;
    this.dashDir = { x: 0, y: 1 };
    this.ls = 0; this.kh = false;
    this.iframes = 0;
    this.kills = 0;
    this.dead = false;
    this.reviveT = 0;
    this.tint = controller?.color ?? PLAYER_TINTS[id % PLAYER_TINTS.length];
    // Per-player weapon state
    this.weaponT = { dagger: 0, sword: 0, nova: 0, lightning: 0, whip: 0, charm: 0, missile: 0, grenade: 0 };
    this.orbitAngle = 0;
    this.orbitHits = new Map();
    this.lastTrailX = x;
    this.lastTrailY = y;
    this.trailHits = new Map();
    this.trapT = 0;
    this.minionT = 0;
    this.gathererT = 0;
    this.turretT = 0;
    this.floatingT = 0;
    this.gpPrev = {};
    this.joystick = controller?.joystick
      ? { active: false, id: null, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0, dx: 0, dy: 0 }
      : null;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    if (this.dead) {
      // Tombe au sol avec barre de résurrection
      g.fillStyle(0x000000, 0.5);
      g.fillEllipse(0, 12, 32, 9);
      g.fillStyle(0x2a2a35, 1);
      g.fillRoundedRect(-13, -13, 26, 26, 11);
      g.fillStyle(0x3a3a48, 0.85);
      g.fillRoundedRect(-11, -11, 22, 22, 9);
      g.fillStyle(0x0a0a14, 0.85);
      g.fillRect(-1.5, -8, 3, 14);
      g.fillRect(-6, -3, 12, 3);
      if (this.reviveT > 0) {
        g.fillStyle(0x220006, 0.85);
        g.fillRect(-16, -22, 32, 3);
        g.fillStyle(0xc77dff, 1);
        g.fillRect(-16, -22, 32 * Math.min(1, this.reviveT / 3), 3);
      }
      return;
    }
    const flash = this.iframes > 0 && Math.floor(this.iframes * 12) % 2 === 0;
    if (flash) return;
    const tint = this.tint;
    // Coloured platform under the feet (player ID identifier)
    g.fillStyle(tint, 0.32);
    g.fillEllipse(0, 18, 30, 8);
    g.lineStyle(1.5, tint, 0.85);
    g.strokeEllipse(0, 18, 30, 8);
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
    // Glowing eyes — tinted to player color
    g.fillStyle(tint, 1);
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
    if (type === 'physical' && scene?.elementOverride) type = scene.elementOverride;
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

    // Charmed (friendly minion) — pink halo + floating heart
    if (this.charmed) {
      const flick = (Math.sin(this.bob * 1.4) + 1) * 0.5;
      g.fillStyle(0xff7da8, 0.28);
      g.fillCircle(0, 0, this.size + 6);
      g.lineStyle(1.5, 0xff99cc, 0.8);
      g.strokeCircle(0, 0, this.size + 6);
      // tiny heart above
      g.fillStyle(0xff66aa, 0.7 + flick * 0.3);
      const hy = -this.size - 10;
      g.fillCircle(-3, hy, 2.6);
      g.fillCircle(3, hy, 2.6);
      g.fillTriangle(-5, hy + 1, 5, hy + 1, 0, hy + 7);
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

    // HP bar — visible whenever the enemy has taken damage. Bigger enemies get
    // a wider bar; small ones get a slim one above their head.
    if (this.hp < this.maxHp || this.type === 'boss') {
      const big = this.size > 12 || this.type === 'boss';
      const w = big ? 44 : 22;
      const h = big ? 4 : 3;
      const yOff = -this.size - (big ? 14 : 8);
      g.fillStyle(0x220006, 0.85);
      g.fillRect(-w / 2, yOff, w, h);
      g.fillStyle(this.type === 'boss' ? 0xff4400 : 0xff0000, 1);
      g.fillRect(-w / 2, yOff, w * Math.max(0, hpRatio), h);
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
  switch (e.kind) {
    case 'frost':   drawBossFrost(g, e); break;
    case 'inferno': drawBossInferno(g, e); break;
    case 'void':    drawBossVoid(g, e); break;
    case 'shadow':
    default:        drawBossShadow(g, e); break;
  }
}

function drawBossShadow(g, e) {
  const s = e.size;
  const pulse = 1 + Math.sin(e.bob * 0.3) * 0.04;
  g.fillStyle(0x4a0020, 0.35);
  g.fillCircle(0, 0, s * 1.4 * pulse);
  g.fillStyle(e.col, 1);
  g.fillCircle(0, 0, s);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = Math.cos(a) * s, y1 = Math.sin(a) * s;
    const x2 = Math.cos(a) * s * 1.35, y2 = Math.sin(a) * s * 1.35;
    const ax = -Math.sin(a) * s * 0.2, ay = Math.cos(a) * s * 0.2;
    g.fillTriangle(x1 - ax, y1 - ay, x2, y2, x1 + ax, y1 + ay);
  }
  g.fillStyle(0x2a0010, 1);
  g.fillTriangle(-s * 0.7, -s * 0.5, -s * 1.1, -s * 1.4, -s * 0.3, -s * 0.7);
  g.fillTriangle(s * 0.7, -s * 0.5, s * 1.1, -s * 1.4, s * 0.3, -s * 0.7);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(0, s * 0.4, s * 0.85, s * 0.45);
  g.fillStyle(0xffffff, 1);
  for (let i = -3; i <= 3; i++) g.fillTriangle(i * s * 0.13, s * 0.25, i * s * 0.13 + s * 0.07, s * 0.55, i * s * 0.13 - s * 0.07, s * 0.55);
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

function drawBossFrost(g, e) {
  const s = e.size;
  const pulse = 1 + Math.sin(e.bob * 0.3) * 0.05;
  // icy aura
  g.fillStyle(0x88ccff, 0.25);
  g.fillCircle(0, 0, s * 1.6 * pulse);
  // body — diamond shape
  g.fillStyle(e.col, 1);
  g.fillTriangle(0, -s * 1.1, -s * 1.05, 0, 0, s * 1.05);
  g.fillTriangle(0, -s * 1.1, s * 1.05, 0, 0, s * 1.05);
  // ice shards radiating
  g.fillStyle(0xc0e0ff, 0.85);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + e.bob * 0.05;
    const x1 = Math.cos(a) * s * 0.85, y1 = Math.sin(a) * s * 0.85;
    const x2 = Math.cos(a) * s * 1.55, y2 = Math.sin(a) * s * 1.55;
    const ax = -Math.sin(a) * s * 0.18, ay = Math.cos(a) * s * 0.18;
    g.fillTriangle(x1 - ax, y1 - ay, x2, y2, x1 + ax, y1 + ay);
  }
  // central frosted highlight
  g.fillStyle(0xe0f5ff, 0.7);
  g.fillCircle(-s * 0.3, -s * 0.3, s * 0.3);
  // single glowing eye
  g.fillStyle(0x0a1828, 1);
  g.fillCircle(0, -s * 0.1, s * 0.32);
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(0, -s * 0.1, s * 0.22);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, -s * 0.1, s * 0.08);
  // jagged teeth at bottom
  g.fillStyle(0xe0f5ff, 1);
  for (let i = -2; i <= 2; i++) g.fillTriangle(i * s * 0.18, s * 0.3, i * s * 0.18 + s * 0.08, s * 0.65, i * s * 0.18 - s * 0.08, s * 0.65);
}

function drawBossInferno(g, e) {
  const s = e.size;
  const flick = 0.85 + Math.sin(e.bob * 4) * 0.15;
  // fiery aura — dancing flames
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + e.bob * 0.3;
    const r1 = s * 1.05, r2 = s * (1.4 + Math.sin(e.bob * 3 + i) * 0.15);
    g.fillStyle(0xff5511, 0.55);
    g.fillTriangle(Math.cos(a) * r1, Math.sin(a) * r1, Math.cos(a) * r2, Math.sin(a) * r2, Math.cos(a + 0.45) * r1, Math.sin(a + 0.45) * r1);
  }
  // core body — molten
  g.fillStyle(0x6a1808, 1);
  g.fillCircle(0, 0, s);
  g.fillStyle(e.col, 1);
  g.fillCircle(0, 0, s * 0.85);
  g.fillStyle(0xffaa44, flick);
  g.fillCircle(-s * 0.2, -s * 0.2, s * 0.4);
  g.fillStyle(0xffe066, 0.85);
  g.fillCircle(-s * 0.3, -s * 0.3, s * 0.18);
  // single cyclops eye
  g.fillStyle(0x000000, 1);
  g.fillCircle(0, -s * 0.05, s * 0.34);
  g.fillStyle(e.eyeCol, 1);
  g.fillCircle(0, -s * 0.05, s * 0.24);
  g.fillStyle(0xff0000, 1);
  g.fillRect(-s * 0.1, -s * 0.12, s * 0.2, s * 0.14);
  // gnashing maw
  g.fillStyle(0x000000, 1);
  g.fillEllipse(0, s * 0.5, s * 0.9, s * 0.4);
  g.fillStyle(0xffaa44, 0.9);
  for (let i = -3; i <= 3; i++) g.fillTriangle(i * s * 0.13, s * 0.32, i * s * 0.13 + s * 0.07, s * 0.62, i * s * 0.13 - s * 0.07, s * 0.62);
}

function drawBossVoid(g, e) {
  const s = e.size;
  const pulse = 1 + Math.sin(e.bob * 0.4) * 0.06;
  // void portal aura
  g.fillStyle(0x2a0a55, 0.35);
  g.fillCircle(0, 0, s * 1.7 * pulse);
  g.fillStyle(0x4a1a8a, 0.45);
  g.fillCircle(0, 0, s * 1.3);
  // body — translucent blob
  g.fillStyle(e.col, 0.78);
  g.fillCircle(0, 0, s);
  // rotating tendrils
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + e.bob * 0.2;
    g.lineStyle(2.5, 0xb088ff, 0.7);
    g.beginPath();
    g.moveTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4);
    const mx = Math.cos(a + 0.4) * s * 0.85, my = Math.sin(a + 0.4) * s * 0.85;
    const ex = Math.cos(a + 0.7) * s * 1.3, ey = Math.sin(a + 0.7) * s * 1.3;
    g.lineTo(mx, my);
    g.lineTo(ex, ey);
    g.strokePath();
  }
  // multiple eyes (5 — chaotic placement)
  const eyes = [[-s * 0.4, -s * 0.3], [s * 0.4, -s * 0.3], [0, -s * 0.6], [-s * 0.25, s * 0.05], [s * 0.25, s * 0.05]];
  for (const [ex, ey] of eyes) {
    g.fillStyle(0x000000, 1);
    g.fillCircle(ex, ey, s * 0.13);
    g.fillStyle(e.eyeCol, 1);
    g.fillCircle(ex, ey, s * 0.085);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex - s * 0.02, ey - s * 0.02, s * 0.03);
  }
  // sliver mouth
  g.fillStyle(0x000000, 1);
  g.fillRect(-s * 0.5, s * 0.45, s, s * 0.08);
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
// Destructible obstacle — blocks projectiles. Cracks accumulate as HP drops.
// ────────────────────────────────────────
export class Obstacle {
  constructor(scene, x, y) {
    this.gfx = scene.add.graphics().setDepth(5);
    this.x = x; this.y = y;
    this.maxHp = 80;
    this.hp = this.maxHp;
    this.size = 22;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    // ground shadow
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(0, 8, 40, 10);
    // rough rock cluster
    g.fillStyle(0x2a2a35, 1);
    g.fillCircle(-10, -2, 12);
    g.fillCircle(9, -3, 13);
    g.fillCircle(0, 5, 12);
    g.fillStyle(0x4a4a55, 0.9);
    g.fillCircle(-12, -5, 6);
    g.fillCircle(7, -7, 5);
    g.fillCircle(2, 2, 4);
    // cracks deepen as HP drops
    const cracks = Math.floor((1 - this.hp / this.maxHp) * 4);
    g.lineStyle(1.5, 0x0a0a14, 0.85);
    if (cracks >= 1) { g.beginPath(); g.moveTo(-9, -8); g.lineTo(-4, 4); g.strokePath(); }
    if (cracks >= 2) { g.beginPath(); g.moveTo(8, -10); g.lineTo(4, 6); g.strokePath(); }
    if (cracks >= 3) { g.beginPath(); g.moveTo(0, -12); g.lineTo(2, 8); g.strokePath(); }
    if (cracks >= 4) { g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 1); g.strokePath(); }
    // hp bar when damaged
    if (this.hp < this.maxHp) {
      g.fillStyle(0x220006, 0.75);
      g.fillRect(-18, -this.size - 8, 36, 3);
      g.fillStyle(0xffaa66, 1);
      g.fillRect(-18, -this.size - 8, 36 * Math.max(0, this.hp / this.maxHp), 3);
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Nest — stationary spawner with HP. Cave → bats, Cemetery → skeletons.
// ────────────────────────────────────────
export class Nest {
  constructor(scene, x, y, type) {
    this.gfx = scene.add.graphics().setDepth(4);
    this.x = x; this.y = y;
    this.type = type; // 'cave' | 'cemetery'
    this.maxHp = type === 'cave' ? 100 : 150;
    this.hp = this.maxHp;
    this.size = 24;
    this.spawnT = 5;
    this.spawnInterval = type === 'cave' ? 4 : 6;
    this.bob = 0;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.04;
    if (this.type === 'cave') {
      g.fillStyle(0x000000, 0.6);
      g.fillEllipse(0, 6, 56, 18);
      g.fillStyle(0x1a0e08, 1);
      g.fillEllipse(0, -2, 50, 36);
      g.fillStyle(0x000000, 1);
      g.fillEllipse(0, 0, 38, 26);
      g.fillStyle(0x3a2a20, 1);
      g.fillCircle(-19, 10, 7);
      g.fillCircle(18, 11, 6);
      g.fillCircle(-2, 16, 5);
      g.fillCircle(8, -10, 4);
      g.fillCircle(-10, -12, 4);
      // glowing eyes inside the cave
      const flick = 0.6 + Math.sin(this.bob * 4) * 0.3;
      g.fillStyle(0xff4400, flick);
      g.fillCircle(-5, 2, 1.6);
      g.fillCircle(5, 2, 1.6);
    } else {
      // cemetery crypt — large tombstone with cracks and skull
      g.fillStyle(0x000000, 0.55);
      g.fillEllipse(0, 22, 56, 12);
      g.fillStyle(0x1a1a25, 1);
      g.fillRoundedRect(-22, -28, 44, 50, 20);
      g.fillStyle(0x2e2e3c, 0.9);
      g.fillRoundedRect(-19, -25, 38, 44, 18);
      g.lineStyle(1.5, 0x0a0a14, 0.75);
      g.beginPath(); g.moveTo(-9, -12); g.lineTo(-11, 6); g.strokePath();
      g.beginPath(); g.moveTo(9, -6); g.lineTo(13, 10); g.strokePath();
      // engraved skull
      g.fillStyle(0x000000, 1);
      g.fillCircle(0, -9, 6.5);
      g.fillRect(-3, -3, 6, 4);
      g.fillStyle(0x6a6a7a, 1);
      g.fillCircle(-2.4, -10, 1.4);
      g.fillCircle(2.4, -10, 1.4);
    }
    // hp bar
    g.fillStyle(0x220006, 0.85);
    g.fillRect(-24, -this.size - 16, 48, 5);
    g.fillStyle(this.type === 'cave' ? 0xff4400 : 0xff0000, 1);
    g.fillRect(-24, -this.size - 16, 48 * Math.max(0, this.hp / this.maxHp), 5);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Storm cloud — drifts above the player, periodically strikes a random enemy.
// ────────────────────────────────────────
export class StormCloud {
  constructor(scene, dmg) {
    this.gfx = scene.add.graphics().setDepth(13);
    this.x = 0; this.y = 0;
    this.dmg = dmg;
    this.driftAngle = Math.random() * Math.PI * 2;
    this.driftSpeed = 18 + Math.random() * 10;
    this.bob = Math.random() * Math.PI * 2;
    this.fireT = 0.5 + Math.random();
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.06;
    const f = Math.sin(this.bob) * 1.5;
    // shadow on ground
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(0, 16, 28, 8);
    // cloud body — 4 overlapping circles
    g.fillStyle(0x3a3a4a, 0.85);
    g.fillCircle(-9, f, 8);
    g.fillCircle(0, f - 3, 10);
    g.fillCircle(9, f, 8);
    g.fillCircle(0, f + 3, 9);
    g.fillStyle(0x5a5a6a, 0.9);
    g.fillCircle(-6, f - 2, 6);
    g.fillCircle(5, f - 2, 6);
    // tiny lightning flicker hint
    g.fillStyle(0xffe066, 0.45);
    g.fillCircle(0, f + 6, 2);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Spectral grenade — short-fuse projectile with friction, AoE on impact.
// ────────────────────────────────────────
export class Grenade {
  constructor(scene, x, y, vx, vy, dmg, aoe, fuse, lvl) {
    this.gfx = scene.add.graphics().setDepth(15);
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.dmg = dmg;
    this.aoe = aoe;
    this.fuse = fuse;
    this.lvl = lvl;
    this.life = 2.5;
    this.bob = 0;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.45;
    const fuseT = Math.max(0, this.fuse);
    const blink = (Math.sin(this.bob * (4 + (1 - fuseT) * 8)) + 1) * 0.5;
    // body
    g.fillStyle(0x3a3a3a, 1);
    g.fillCircle(0, 0, 7);
    g.fillStyle(0x222222, 1);
    g.fillCircle(-1.5, -1.5, 2);
    // top cap
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(-2, -10, 4, 4);
    // fuse spark
    g.fillStyle(blink > 0.5 ? 0xffffff : 0xffaa00, 1);
    g.fillCircle(0, -12, 1.6 + blink * 1.2);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Floating blade — orbits the player at idle, fires once at the nearest enemy.
// ────────────────────────────────────────
export class FloatingBlade {
  constructor(scene, dmg, angle) {
    this.gfx = scene.add.graphics().setDepth(13);
    this.x = 0; this.y = 0;
    this.dmg = dmg;
    this.state = 'idle'; // 'idle' | 'flying'
    this.angle = angle;
    this.vx = 0; this.vy = 0;
    this.life = 999;
    this.bob = Math.random() * Math.PI * 2;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    g.rotation = this.angle;
    if (this.state === 'idle') {
      // soft halo + dagger silhouette
      g.fillStyle(0xbcd0ff, 0.32);
      g.fillCircle(0, 0, 9);
      g.fillStyle(0xa0c4ff, 1);
      g.fillTriangle(-9, -1.7, 11, 0, -9, 1.7);
      g.fillStyle(0x4a2c8a, 1);
      g.fillRect(-12, -2.5, 4, 5);
    } else {
      // flying dagger with trail
      g.fillStyle(0xc7e0ff, 0.55);
      g.fillTriangle(-22, -1.2, -10, 0, -22, 1.2);
      g.fillStyle(0xa0c4ff, 1);
      g.fillTriangle(-12, -2.5, 14, 0, -12, 2.5);
      g.fillStyle(0x4a2c8a, 1);
      g.fillRect(-15, -3, 4, 6);
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Homing missile — locks on a target and steers toward it, AoE on impact.
// ────────────────────────────────────────
export class HomingMissile {
  constructor(scene, x, y, target, dmg, aoe) {
    this.gfx = scene.add.graphics().setDepth(15);
    this.x = x; this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.aoe = aoe;
    this.life = 4;
    this.angle = 0;
    this.speed = 280;
    this.turnRate = 7;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    g.rotation = this.angle;
    // tail flame
    g.fillStyle(0xff8844, 0.5);
    g.fillCircle(-12, 0, 3);
    g.fillStyle(0xffe066, 0.85);
    g.fillTriangle(-13, -1.7, -6, 0, -13, 1.7);
    // body
    g.fillStyle(0xff4400, 1);
    g.fillTriangle(-7, -2.5, 9, 0, -7, 2.5);
    g.fillStyle(0xffaa66, 1);
    g.fillCircle(0, 0, 2);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Spectral minion — friendly summoned wisp that hunts the closest enemy.
// ────────────────────────────────────────
export class Minion {
  constructor(scene, x, y, hp, dmg, speed, kind = 'hunter') {
    this.gfx = scene.add.graphics().setDepth(11);
    this.x = x; this.y = y;
    this.maxHp = hp; this.hp = hp;
    this.dmg = dmg; this.speed = speed;
    this.kind = kind;
    this.size = 11;
    this.attackCD = 0;
    this.vx = 0; this.vy = 0;
    this.bob = Math.random() * Math.PI * 2;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.18;
    const f = Math.sin(this.bob) * 1.5;
    if (this.kind === 'gatherer') {
      // 4-pointed cyan star
      g.fillStyle(0x88ddff, 0.32);
      g.fillCircle(0, f, this.size + 5);
      g.fillStyle(0xb8eeff, 0.95);
      g.fillTriangle(-this.size, f, 0, f - this.size * 1.3, this.size, f);
      g.fillTriangle(-this.size, f, 0, f + this.size * 1.3, this.size, f);
      g.fillTriangle(0, f - this.size, -this.size * 1.3, f, 0, f + this.size);
      g.fillTriangle(0, f - this.size, this.size * 1.3, f, 0, f + this.size);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, f, this.size * 0.45);
    } else {
      // Hunter ghost — purple aura + body + tail bumps + eyes
      g.fillStyle(0x7b2fbe, 0.28);
      g.fillCircle(0, f, this.size + 5);
      g.fillStyle(0xc77dff, 0.85);
      g.fillEllipse(0, f, this.size * 1.4, this.size * 1.7);
      g.fillCircle(-this.size * 0.4, f + this.size * 0.7, this.size * 0.32);
      g.fillCircle(0, f + this.size * 0.8, this.size * 0.32);
      g.fillCircle(this.size * 0.4, f + this.size * 0.7, this.size * 0.32);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-this.size * 0.25, f - this.size * 0.2, 1.8);
      g.fillCircle(this.size * 0.25, f - this.size * 0.2, 1.8);
      // hp bar (only for hunters that can die)
      if (this.hp < this.maxHp) {
        g.fillStyle(0x000000, 0.6); g.fillRect(-12, -this.size - 8, 24, 3);
        g.fillStyle(0xc77dff, 1); g.fillRect(-12, -this.size - 8, 24 * this.hp / this.maxHp, 3);
      }
    }
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Spectral turret — placed by the player, fires at enemies in range.
// ────────────────────────────────────────
export class Turret {
  constructor(scene, x, y, hp, dmg, range, dmgType, fireRate) {
    this.gfx = scene.add.graphics().setDepth(8);
    this.x = x; this.y = y;
    this.maxHp = hp; this.hp = hp;
    this.dmg = dmg;
    this.range = range;
    this.dmgType = dmgType;
    this.fireRate = fireRate;
    this.fireT = 0;
    this.size = 14;
    this.aimAngle = 0;
    this.coreColor = 0x88aaff;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    // shadow
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 9, 28, 9);
    // base stone
    g.fillStyle(0x2a2a3a, 1);
    g.fillRect(-13, 0, 26, 9);
    g.fillStyle(0x3a3a48, 1);
    g.fillRect(-11, 2, 22, 4);
    // turret dome
    g.fillStyle(0x4a4a60, 1);
    g.fillCircle(0, -2, 8);
    g.fillStyle(0x6a6a80, 0.95);
    g.fillCircle(-1, -3, 5);
    // glowing core
    g.fillStyle(this.coreColor, 0.85);
    g.fillCircle(0, -2, 3);
    // barrel rotated to aim
    const ax = Math.cos(this.aimAngle), ay = Math.sin(this.aimAngle);
    g.lineStyle(3.5, 0x5a5a70, 1);
    g.beginPath();
    g.moveTo(0, -2);
    g.lineTo(ax * 14, -2 + ay * 14);
    g.strokePath();
    // tip glow
    g.fillStyle(this.coreColor, 0.85);
    g.fillCircle(ax * 14, -2 + ay * 14, 3);
    // hp bar always visible
    g.fillStyle(0x000000, 0.6);
    g.fillRect(-15, -16, 30, 3);
    g.fillStyle(this.coreColor, 1);
    g.fillRect(-15, -16, 30 * Math.max(0, this.hp / this.maxHp), 3);
    // range indicator (very subtle)
    g.lineStyle(1, this.coreColor, 0.07);
    g.strokeCircle(0, 0, this.range);
  }
  destroy() { this.gfx.destroy(); }
}

// ────────────────────────────────────────
// Spectral trap mine — armed after a short delay, explodes AoE on contact.
// ────────────────────────────────────────
export class TrapMine {
  constructor(scene, x, y, radius, dmg) {
    this.gfx = scene.add.graphics().setDepth(3);
    this.x = x; this.y = y;
    this.radius = radius;       // explosion AoE
    this.triggerR = 18;         // contact trigger radius
    this.dmg = dmg;
    this.life = 12;             // disappears after 12 s if not triggered
    this.armTime = 0.35;        // arming delay before it can trigger
    this.bob = Math.random() * Math.PI * 2;
    this.alive = true;
  }
  redraw() {
    const g = this.gfx;
    g.clear();
    g.x = this.x; g.y = this.y;
    this.bob += 0.18;
    const armed = this.armTime <= 0;
    const pulse = (Math.sin(this.bob * 2.5) + 1) * 0.5;
    // dark base
    g.fillStyle(0x1a0008, 0.85);
    g.fillCircle(0, 0, this.triggerR);
    // spike teeth around (5)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + this.bob * 0.04;
      g.fillStyle(0x6a0010, 1);
      g.fillTriangle(
        Math.cos(a) * 5, Math.sin(a) * 5,
        Math.cos(a) * (this.triggerR + 5), Math.sin(a) * (this.triggerR + 5),
        Math.cos(a + 0.4) * 5, Math.sin(a + 0.4) * 5
      );
    }
    // pulsing red core (bright when armed)
    const coreCol = armed ? 0xff2233 : 0xaa3344;
    g.fillStyle(coreCol, 0.5 + pulse * 0.5);
    g.fillCircle(0, 0, 5 + pulse * 2);
    // glyph
    g.lineStyle(1, 0xff8888, armed ? 0.7 : 0.3);
    g.strokeCircle(0, 0, this.triggerR - 2);
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
