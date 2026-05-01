import Phaser from 'phaser';
import { GOAL_TIME } from '../config.js';
import { Player, Enemy, Projectile, EnemyProjectile, XpOrb, Item, TrailTile, TrapMine, Minion, Turret, HomingMissile, FloatingBlade, Grenade, StormCloud, Nest, Obstacle } from '../entities.js';
import { slv, xpFor, getChoices, refreshStats, WAVES, ITEMS, ITEM_DURATIONS, ITEM_KEYS, ETYPES } from '../data.js';
import { initAudio, playSfx, startMusic, stopMusic, setMuted, playBossWarning } from '../audio.js';
import { bus } from '../bus.js';
import { getOptions } from '../PhaserGame.js';

const BOSS_NAMES = [
  "L'Émissaire des Ténèbres",
  "Maître de la Nuit Éternelle",
  "Seigneur Funeste",
  "L'Ombre du Néant",
  "Aberration Mortuaire",
  "Hérésiarque Maudit",
  "Régent des Sépultures",
  "Carcassemort, le Premier",
  "Le Calice de Sang",
  "Veuve aux Mille Yeux",
];

// ────────────────────────────────────────
// Background decoration drawers — cemetery / haunted ruins style.
// Each takes the bg Graphics and draws once around (cx, cy).
// ────────────────────────────────────────
function drawDecor(g, cx, cy, type, hash) {
  const variant = (hash >>> 16) & 0xff;
  switch (type) {
    case 0: drawCross(g, cx, cy, variant); break;
    case 1: drawTombstone(g, cx, cy, variant); break;
    case 2: drawDeadTree(g, cx, cy, variant); break;
    default: drawStones(g, cx, cy, variant);
  }
}

function drawCross(g, cx, cy, v) {
  const tilt = ((v & 0x1f) - 16) * 0.012;
  const h = 28 + (v & 0x07);
  // ground shadow
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + h * 0.7, h * 0.9, h * 0.25);
  // post
  g.fillStyle(0x2a1810, 0.55);
  g.save?.();
  // simple tilt approximated by drawing slightly skewed rect
  g.fillRect(cx - 2, cy - h, 4, h);
  // crossbar
  g.fillRect(cx - 12, cy - h * 0.65, 24, 4);
  // small decoration knot
  g.fillStyle(0x3a2418, 0.5);
  g.fillCircle(cx, cy - h * 0.65 + 2, 2);
}

function drawTombstone(g, cx, cy, v) {
  const w = 26 + (v & 0x07);
  const h = 32 + ((v >> 3) & 0x07);
  // shadow
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 6, w * 1.1, w * 0.3);
  // back panel (darker)
  g.fillStyle(0x1a1a25, 0.7);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, w * 0.45);
  // front panel (mid grey, slight offset)
  g.fillStyle(0x3a3a48, 0.55);
  g.fillRoundedRect(cx - w / 2 + 2, cy - h + 2, w - 4, h - 6, (w - 4) * 0.45);
  // engraved cross
  g.fillStyle(0x12121c, 0.55);
  g.fillRect(cx - 1.5, cy - h * 0.75, 3, h * 0.35);
  g.fillRect(cx - 6, cy - h * 0.6, 12, 3);
}

function drawDeadTree(g, cx, cy, v) {
  const trunkH = 38 + (v & 0x0f);
  // shadow
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 4, 18, 5);
  // trunk
  g.fillStyle(0x1f1208, 0.7);
  g.fillRect(cx - 2.5, cy - trunkH, 5, trunkH);
  // branches
  g.lineStyle(2, 0x2a1810, 0.7);
  g.beginPath();
  g.moveTo(cx, cy - trunkH * 0.5);
  g.lineTo(cx - 14, cy - trunkH * 0.85);
  g.lineTo(cx - 18, cy - trunkH * 0.7);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx, cy - trunkH * 0.65);
  g.lineTo(cx + 16, cy - trunkH * 0.95);
  g.lineTo(cx + 22, cy - trunkH * 0.75);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx, cy - trunkH * 0.85);
  g.lineTo(cx - 8, cy - trunkH * 1.1);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx, cy - trunkH * 0.95);
  g.lineTo(cx + 10, cy - trunkH * 1.15);
  g.strokePath();
}

function drawStones(g, cx, cy, v) {
  const n = 2 + (v & 0x03);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (v & 0x07) * 0.3;
    const r = 8 + ((v >> i) & 0x07);
    const sx = cx + Math.cos(a) * 14;
    const sy = cy + Math.sin(a) * 7;
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(sx, sy + 2, r + 2, r * 0.4);
    g.fillStyle(0x2a2a35, 0.6);
    g.fillEllipse(sx, sy, r, r * 0.55);
    g.fillStyle(0x4a4a5a, 0.5);
    g.fillEllipse(sx - r * 0.15, sy - r * 0.1, r * 0.55, r * 0.3);
  }
}

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  get W() { return this.scale.width; }
  get H() { return this.scale.height; }

  create() {
    this.cameras.main.setBackgroundColor('#060011');

    this.bgGfx = this.add.graphics().setDepth(-10);
    this.orbitGfx = this.add.graphics().setDepth(14);
    this.joyGfx = this.add.graphics().setDepth(50);

    this.decorations = this.generateDecor();
    this.scale.on('resize', () => { this.decorations = this.generateDecor(); });

    this.player = new Player(this, this.W / 2, this.H / 2);
    const startW = getOptions().startWeapon || 'dagger';
    this.player.skills = { [startW]: 1 };
    this.mode = getOptions().mode || 'normal';
    if (this.mode === 'oneShot') {
      this.player.maxHp = 1;
      this.player.hp = 1;
      this.player.dmgM = 100;
    }
    this.enemies = [];
    this.projectiles = [];
    this.eprojectiles = [];
    this.orbs = [];
    this.items = [];
    this.buffs = {};
    this.itemTimer = 8;
    this.elapsed = 0;
    this.kills = 0;
    this.spawnT = 1;
    this.weaponT = { dagger: 0, sword: 0, nova: 0, lightning: 0, whip: 0, charm: 0, missile: 0, grenade: 0 };
    this.missiles = [];
    this.floating = [];
    this.floatingT = 0;
    this.grenades = [];
    this.clouds = [];
    this.cloudT = 0;
    this.nests = [];
    this.nestSpawnT = 25;
    this.obstacles = [];
    this.orbitAngle = 0;
    this.orbitHits = new Map();
    this.trail = [];
    this.lastTrailX = this.W / 2;
    this.lastTrailY = this.H / 2;
    this.trailHits = new Map();
    this.traps = [];
    this.trapT = 0;
    this.minions = [];
    this.minionT = 0;
    this.gatherers = [];
    this.gathererT = 0;
    this.turrets = [];
    this.turretT = 0;
    this.waveIdx = 0;
    this.bossWarningSent = new Set();
    this.bossMusicOn = false;
    this.bossSeen = new Set(); // enemy refs already announced
    this.over = false;
    this.paused = false;
    this.hitstop = 0;
    this.hudT = 0;

    this.keys = this.input.keyboard.addKeys('W,A,S,D,Z,Q,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.addKey('SPACE').on('down', () => this.tryDash());

    this.joystick = { active: false, id: null, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0, dx: 0, dy: 0 };
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.offRestart = bus.on('game:restart', () => this.scene.restart());
    this.offMute    = bus.on('game:mute', m => { setMuted(m); if (!m) startMusic(); });
    this.offPick    = bus.on('skill:pick', id => this.onSkillPick(id));
    this.offPause   = bus.on('pause:set', v => {
      this.paused = !!v;
      if (this.paused) stopMusic();
      else if (!this.over) startMusic(this.bossMusicOn ? 'boss' : 'normal');
    });

    // Initial obstacles scattered on the map
    for (let i = 0; i < 7; i++) this.spawnObstacle();

    initAudio();
    startMusic();

    this.events.on('shutdown', () => {
      this.offRestart?.();
      this.offMute?.();
      this.offPick?.();
      this.offPause?.();
      stopMusic();
    });

    this.emitHud();
  }

  onPointerDown(p) {
    if (this.over || this.paused) return;
    const j = this.joystick;
    if (!j.active) {
      j.active = true; j.id = p.id;
      j.baseX = p.x; j.baseY = p.y;
      j.thumbX = p.x; j.thumbY = p.y;
      j.dx = 0; j.dy = 0;
    } else if (p.id !== j.id) {
      this.tryDash();
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
    let hpMul = 1 + tier * 0.3;
    let dmgMul = 1 + tier * 0.1;
    if (this.mode === 'horde') hpMul *= 0.6;
    const e = new Enemy(this, x, y, typeName, hpMul, 1, dmgMul);
    if (typeName === 'boss') {
      const kinds = {
        shadow:  { col: 0x8b0000, eyeCol: 0xffff00, projCol: 0xff4400, move: 'standard', label: "Carcassemort" },
        frost:   { col: 0x4a78a8, eyeCol: 0xc0e0ff, projCol: 0x88ccff, move: 'orbiter',  label: "L'Hiver Maudit" },
        inferno: { col: 0xa83018, eyeCol: 0xffaa00, projCol: 0xff8800, move: 'charger',  label: "Brasier Éternel" },
        void:    { col: 0x4a1a8a, eyeCol: 0xff00ff, projCol: 0xb088ff, move: 'phasing',  label: "L'Abime Sans Fond" },
      };
      const kindIds = Object.keys(kinds);
      const kindId = kindIds[Math.floor(Math.random() * kindIds.length)];
      const k = kinds[kindId];
      e.kind = kindId;
      e.col = k.col;
      e.eyeCol = k.eyeCol;
      e.projCol = k.projCol;
      e.kindMove = k.move;
      e.kindLabel = k.label;
      e.phaseT = 5;
    }
    this.enemies.push(e);
  }

  spawnObstacle() {
    let x, y, tries = 0;
    do {
      x = 80 + Math.random() * (this.W - 160);
      y = 80 + Math.random() * (this.H - 160);
      tries++;
    } while (Math.hypot(x - this.player.x, y - this.player.y) < 140 && tries < 12);
    this.obstacles.push(new Obstacle(this, x, y));
  }

  spawnItem() {
    const type = ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)];
    let x, y, tries = 0;
    do {
      x = 60 + Math.random() * (this.W - 120);
      y = 60 + Math.random() * (this.H - 120);
      tries++;
    } while (Math.hypot(x - this.player.x, y - this.player.y) < 120 && tries < 10);
    this.items.push(new Item(this, x, y, type));
  }

  emitHud() {
    const p = this.player;
    const bosses = [];
    for (const e of this.enemies) {
      if (e.type === 'boss') bosses.push({ name: e.name || 'BOSS', hp: Math.floor(e.hp), maxHp: e.maxHp });
    }
    const cooldowns = {};
    const r01 = (t, max) => Math.max(0, Math.min(1, 1 - t / max));
    if (slv(p, 'dagger') > 0) cooldowns.dagger = r01(this.weaponT.dagger, slv(p, 'dagger') >= 3 ? 0.45 : 0.8);
    if (slv(p, 'sword') > 0) {
      const lv = slv(p, 'sword');
      cooldowns.sword = r01(this.weaponT.sword, lv >= 5 ? 0.5 : lv >= 2 ? 0.85 : 1.1);
    }
    if (slv(p, 'whip') > 0) {
      const lv = slv(p, 'whip');
      cooldowns.whip = r01(this.weaponT.whip, lv >= 5 ? 0.6 : lv >= 3 ? 0.85 : 1.0);
    }
    if (slv(p, 'nova') > 0) {
      const lv = slv(p, 'nova');
      cooldowns.nova = r01(this.weaponT.nova, lv >= 4 ? 1.2 : 2);
    }
    if (slv(p, 'lightning') > 0) {
      const lv = slv(p, 'lightning');
      cooldowns.lightning = r01(this.weaponT.lightning, lv >= 5 ? 0.4 : lv >= 3 ? 0.8 : 1.5);
    }
    if (slv(p, 'charm') > 0) {
      const lv = slv(p, 'charm');
      cooldowns.charm = r01(this.weaponT.charm, lv >= 5 ? 5 : 8);
    }
    if (slv(p, 'missile') > 0) {
      const lv = slv(p, 'missile');
      cooldowns.missile = r01(this.weaponT.missile, lv >= 5 ? 0.8 : 1.2);
    }
    if (slv(p, 'grenade') > 0) cooldowns.grenade = r01(this.weaponT.grenade, 2);
    if (slv(p, 'traps') > 0) {
      const lv = slv(p, 'traps');
      cooldowns.traps = r01(this.trapT, lv >= 5 ? 1.5 : lv >= 4 ? 2 : 3);
    }
    if (slv(p, 'summon') > 0) {
      const lv = slv(p, 'summon');
      cooldowns.summon = r01(this.minionT, lv >= 5 ? 4 : 6);
    }
    bus.emit('hud:update', {
      hp: Math.floor(p.hp),
      maxHp: p.maxHp,
      xp: p.xp,
      xpN: xpFor(p.level),
      lv: p.level,
      t: Math.floor(this.elapsed),
      kills: this.kills,
      goal: GOAL_TIME,
      skills: { ...p.skills },
      buffs: { ...this.buffs },
      bosses,
      cooldowns,
      stats: {
        speed: p.speed,
        dmgM: p.dmgM,
        xpM: p.xpM,
        magnet: p.magnet,
        regen: p.regen,
        lifesteal: p.ls,
        killHeal: p.kh,
        canDash: p.canDash,
        dashReady: p.canDash && p.dashCD <= 0,
      },
      over: this.over,
    });
  }

  update(_time, delta) {
    if (this.over || this.paused) return;
    if (this.hitstop > 0) {
      this.hitstop -= delta / 1000;
      return;
    }
    const dt = Math.min(delta / 1000, 0.05);
    const p = this.player;
    this.elapsed += dt;

    // ── Buff multipliers
    const speedBoost = this.buffs.speed > 0 ? 2 : 1;
    const dmgBoost = (this.buffs.rage > 0 ? 2 : 1) * (this.buffs.damageBuff > 0 ? 1.5 : 1);
    const freezeMult = this.buffs.freeze > 0 ? 0.25 : 1;
    const shielded = this.buffs.shield > 0;
    const regenBuff = this.buffs.regen > 0 ? 8 : 0;

    // ── Buffs tick down
    for (const k in this.buffs) {
      if (this.buffs[k] > 0) this.buffs[k] -= dt;
      if (this.buffs[k] <= 0) this.buffs[k] = 0;
    }

    // ── Movement
    let mx = this.joystick.dx || 0;
    let my = this.joystick.dy || 0;
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown || k.Q.isDown) mx -= 1;
    if (k.RIGHT.isDown || k.D.isDown) mx += 1;
    if (k.UP.isDown || k.W.isDown || k.Z.isDown) my -= 1;
    if (k.DOWN.isDown || k.S.isDown) my += 1;
    // Gamepad: left stick movement + A/cross for dash (edge-detected).
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!this.gpPrev) this.gpPrev = {};
    for (const pad of pads) {
      if (!pad) continue;
      const id = pad.index;
      const ax = pad.axes[0] || 0;
      const ay = pad.axes[1] || 0;
      if (Math.abs(ax) > 0.2) mx += ax;
      if (Math.abs(ay) > 0.2) my += ay;
      // dpad fallback
      if (pad.buttons[14]?.pressed) mx -= 1;
      if (pad.buttons[15]?.pressed) mx += 1;
      if (pad.buttons[12]?.pressed) my -= 1;
      if (pad.buttons[13]?.pressed) my += 1;
      const a = pad.buttons[0]?.pressed;
      const prev = this.gpPrev[id] || {};
      if (a && !prev.a) this.tryDash();
      this.gpPrev[id] = { a };
    }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (p.dashDur > 0) {
      p.dashDur -= dt;
      p.x += p.dashDir.x * 520 * dt;
      p.y += p.dashDir.y * 520 * dt;
    } else {
      p.x += mx * p.speed * speedBoost * dt;
      p.y += my * p.speed * speedBoost * dt;
    }
    if (p.dashCD > 0) p.dashCD -= dt;
    p.x = Math.max(15, Math.min(this.W - 15, p.x));
    p.y = Math.max(15, Math.min(this.H - 15, p.y));
    p.iframes = Math.max(0, p.iframes - dt);
    const totalRegen = (p.regen || 0) + regenBuff;
    if (totalRegen > 0) p.hp = Math.min(p.maxHp, p.hp + totalRegen * dt);

    // ── Wave schedule (skipped in boss-rush mode — handled separately below)
    if (this.mode !== 'bossRush') {
      while (this.waveIdx < WAVES.length && this.elapsed >= WAVES[this.waveIdx].t) {
        const w = WAVES[this.waveIdx];
        for (let i = 0; i < w.count; i++) this.spawnEnemy(w.type);
        if (w.boss) this.spawnEnemy('boss');
        this.waveIdx++;
      }
    }

    // ── Boss imminent: ominous warning ~3s before scheduled boss wave
    for (let i = 0; i < WAVES.length; i++) {
      const w = WAVES[i];
      if (!w.boss || this.bossWarningSent.has(i)) continue;
      const dueIn = w.t - this.elapsed;
      if (dueIn > 0 && dueIn <= 3) {
        playBossWarning();
        this.bossWarningSent.add(i);
      }
    }

    // ── Boss appearance: cinematic title + music switch
    let hasBoss = false;
    for (const e of this.enemies) {
      if (e.type !== 'boss') continue;
      hasBoss = true;
      if (!this.bossSeen.has(e)) {
        this.bossSeen.add(e);
        const name = e.kindLabel || BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
        e.name = name;
        bus.emit('boss:appear', { name });
      }
    }
    if (hasBoss && !this.bossMusicOn) {
      this.bossMusicOn = true;
      startMusic('boss');
    } else if (!hasBoss && this.bossMusicOn) {
      this.bossMusicOn = false;
      startMusic('normal');
    }

    // ── Continuous spawn (mode-specific)
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      if (this.mode === 'bossRush') {
        this.spawnT = 15;
        this.spawnEnemy('boss');
      } else {
        const baseInterval = this.mode === 'horde' ? 0.7 : 1.6;
        this.spawnT = Math.max(0.3, baseInterval / (0.5 + this.elapsed / 90));
        const types = ['bat'];
        if (this.elapsed >= 30) types.push('zombie');
        if (this.elapsed >= 60) types.push('skeleton');
        if (this.elapsed >= 90) types.push('ghost');
        if (this.elapsed >= 120) types.push('knight');
        if (this.elapsed >= 150) types.push('witch');
        this.spawnEnemy(types[Math.floor(Math.random() * types.length)]);
      }
    }

    // ── Item spawner
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = 9 + Math.random() * 7;
      this.spawnItem();
    }

    // ── Items pickup
    this.items = this.items.filter(it => {
      it.life -= dt;
      it.bob += dt * 3;
      if (it.life <= 0) { it.destroy(); return false; }
      if (Math.hypot(it.x - p.x, it.y - p.y) < 22) {
        this.applyItem(it.type);
        playSfx('itempickup');
        it.destroy();
        return false;
      }
      return true;
    });

    // ── Enemy AI + collision (vs. player, minions, charmed allies)
    for (const e of this.enemies) {
      this.updateEnemyAi(dt, e, p, freezeMult);
      if (e.charmed) continue;
      // player hit
      if (!shielded && p.iframes <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.size + 14) {
        p.hp -= e.dmg;
        p.iframes = 0.9;
        playSfx('hit');
        this.shake(0.007, 130);
      }
      // melee against minions & charmed (cooldown-gated to avoid 1-frame chunks)
      e.atkCD = Math.max(0, (e.atkCD || 0) - dt);
      if (e.atkCD <= 0) {
        let hit = false;
        for (const m of this.minions) {
          if (Math.hypot(e.x - m.x, e.y - m.y) < e.size + m.size) {
            m.hp -= e.dmg;
            hit = true;
            break;
          }
        }
        if (!hit) {
          for (const o of this.enemies) {
            if (!o.charmed || o === e) continue;
            if (Math.hypot(e.x - o.x, e.y - o.y) < e.size + o.size) {
              o.hp -= e.dmg;
              hit = true;
              break;
            }
          }
        }
        if (hit) e.atkCD = 0.6;
      }
    }

    // ── Player weapons
    this.firePlayerWeapons(dt, p, dmgBoost);
    this.updateTrail(dt, p, dmgBoost);
    this.updateTraps(dt, p, dmgBoost);
    this.updateMinions(dt, p);
    this.updateGatherers(dt, p);
    this.updateTurrets(dt, p, dmgBoost);
    this.updateMissiles(dt, p);
    this.updateFloating(dt, p, dmgBoost);
    this.updateGrenades(dt, p);
    this.updateClouds(dt, p, dmgBoost);
    this.updateNests(dt, p);

    // ── Player projectiles
    for (const proj of this.projectiles) {
      proj.x += proj.dx * dt;
      proj.y += proj.dy * dt;
      proj.life -= dt;
      if (proj.life <= 0 || proj.x < -60 || proj.x > this.W + 60 || proj.y < -60 || proj.y > this.H + 60) {
        proj.alive = false;
        continue;
      }
      for (const e of this.enemies) {
        if (proj.pierce && proj.hits.has(e)) continue;
        if (Math.hypot(proj.x - e.x, proj.y - e.y) < e.size + 5) {
          const dealt = e.takeDamage(proj.dmg, proj.type || 'physical', this);
          if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
          if (e.type === 'boss') { this.shake(0.005, 80); this.hitstop = 0.04; }
          if (proj.pierce) proj.hits.add(e);
          else { proj.alive = false; break; }
        }
      }
      // also hit nests
      if (proj.alive) {
        for (const n of this.nests) {
          if (Math.hypot(proj.x - n.x, proj.y - n.y) < n.size + 5) {
            n.hp -= proj.dmg;
            this.fxDamage(n.x, n.y, proj.dmg, false);
            if (!proj.pierce) { proj.alive = false; break; }
          }
        }
      }
      // and obstacles (always blocked, even pierce)
      if (proj.alive) {
        for (const o of this.obstacles) {
          if (Math.hypot(proj.x - o.x, proj.y - o.y) < o.size + 5) {
            o.hp -= proj.dmg;
            proj.alive = false;
            break;
          }
        }
      }
    }

    // ── Enemy projectiles
    for (const ep of this.eprojectiles) {
      ep.x += ep.dx * dt;
      ep.y += ep.dy * dt;
      ep.life -= dt;
      if (ep.life <= 0 || ep.x < -50 || ep.x > this.W + 50 || ep.y < -50 || ep.y > this.H + 50) {
        ep.alive = false;
        continue;
      }
      if (!shielded && p.iframes <= 0 && Math.hypot(ep.x - p.x, ep.y - p.y) < 15) {
        p.hp -= ep.dmg;
        p.iframes = 0.7;
        playSfx('hit');
        ep.alive = false;
      }
      // obstacles block enemy projectiles too
      if (ep.alive) {
        for (const o of this.obstacles) {
          if (Math.hypot(ep.x - o.x, ep.y - o.y) < o.size + 5) {
            o.hp -= ep.dmg * 0.6;
            ep.alive = false;
            break;
          }
        }
      }
    }

    // ── XP orbs
    this.updateOrbs(dt, p);

    // ── Cleanup
    this.projectiles = this.projectiles.filter(pr => {
      if (!pr.alive) pr.destroy();
      return pr.alive;
    });
    this.eprojectiles = this.eprojectiles.filter(ep => {
      if (!ep.alive) ep.destroy();
      return ep.alive;
    });
    this.obstacles = this.obstacles.filter(o => {
      if (o.hp <= 0) {
        this.fxNova(o.x, o.y, 22);
        playSfx('death');
        o.destroy();
        return false;
      }
      return true;
    });
    this.enemies = this.enemies.filter(e => {
      if (e.hp <= 0) {
        this.kills++;
        playSfx(e.type === 'boss' ? 'boss' : 'death');
        const value = Math.ceil((e.xpVal + this.elapsed / 10) * p.xpM);
        this.orbs.push(new XpOrb(this, e.x, e.y, value));
        if (p.kh) p.hp = Math.min(p.maxHp, p.hp + 8);
        this.fxDeath(e.x, e.y, ETYPES[e.type]?.col ?? 0xffffff);
        if (e.type === 'boss') {
          this.shake(0.012, 280);
          this.hitstop = 0.08;
          this.bossSeen.delete(e);
        }
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
    for (const t of this.trail) t.redraw();
    for (const tr of this.traps) tr.redraw();
    for (const n of this.nests) n.redraw();
    for (const o of this.obstacles) o.redraw();
    for (const tu of this.turrets) tu.redraw();
    p.redraw();
    for (const it of this.items) it.redraw();
    for (const e of this.enemies) e.redraw();
    for (const m of this.minions) m.redraw();
    for (const g of this.gatherers) g.redraw();
    for (const proj of this.projectiles) proj.redraw();
    for (const m of this.missiles) m.redraw();
    for (const b of this.floating) b.redraw();
    for (const gr of this.grenades) gr.redraw();
    for (const c of this.clouds) c.redraw();
    for (const ep of this.eprojectiles) ep.redraw();
    for (const o of this.orbs) o.redraw();
    this.drawOrbits(p);
    this.drawJoystick();

    // ── HUD throttle
    this.hudT += dt;
    if (this.hudT > 0.12) { this.hudT = 0; this.emitHud(); }
  }

  applyItem(type) {
    const p = this.player;
    if (type === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + 40);
    } else if (type === 'megaheal') {
      p.hp = Math.min(p.maxHp, p.hp + 80);
    } else if (type === 'magnet') {
      for (const o of this.orbs) { o.x = p.x; o.y = p.y; }
    } else if (type === 'nuke') {
      // Wipe all on-screen enemies (excluding bosses → reduce them by 40 % HP).
      for (const e of this.enemies) {
        if (e.charmed) continue;
        if (e.type === 'boss') {
          e.takeDamage(e.maxHp * 0.4, 'holy', this);
        } else {
          e.takeDamage(99999, 'holy', this);
        }
      }
      this.fxNova(p.x, p.y, Math.max(this.W, this.H));
      this.shake(0.012, 320);
      playSfx('boss');
    } else if (type === 'vacuum') {
      // Collect every XP orb instantly.
      for (const o of this.orbs) {
        p.xp += o.value;
        o.life = -1;
      }
      playSfx('xp');
      while (p.xp >= xpFor(p.level)) {
        p.xp -= xpFor(p.level);
        p.level++;
        p.hp = Math.min(p.maxHp, p.hp + 15);
        playSfx('levelup');
        this.onLevelUp(p);
      }
    } else {
      const dur = ITEM_DURATIONS[type];
      this.buffs[type] = (this.buffs[type] || 0) + dur;
    }
  }

  tryDash() {
    if (this.over || this.paused) return;
    const p = this.player;
    if (!p.canDash || p.dashCD > 0 || p.dashDur > 0) return;
    let dx = this.joystick.dx || 0;
    let dy = this.joystick.dy || 0;
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown || k.Q.isDown) dx -= 1;
    if (k.RIGHT.isDown || k.D.isDown) dx += 1;
    if (k.UP.isDown || k.W.isDown || k.Z.isDown) dy -= 1;
    if (k.DOWN.isDown || k.S.isDown) dy += 1;
    const l = Math.hypot(dx, dy);
    if (l < 0.05) return;
    p.dashDir = { x: dx / l, y: dy / l };
    p.dashDur = 0.15;
    p.dashCD = 2;
    if (slv(p, 'boots') >= 3) p.iframes = Math.max(p.iframes, 0.18);
  }

  fxDeath(x, y, col) {
    const g = this.add.graphics().setDepth(11);
    g.x = x; g.y = y;
    g.fillStyle(col, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillCircle(Math.cos(a) * 4, Math.sin(a) * 4, 3);
    }
    this.tweens.add({
      targets: g, scale: 2.5, alpha: 0,
      duration: 420,
      onComplete: () => g.destroy(),
    });
  }

  updateEnemyAi(dt, e, player, freezeMult) {
    e.tickStatuses(dt, this);
    if (e.charmed) {
      e.charmedDur -= dt;
      if (e.charmedDur <= 0) {
        e.hp = 0;
        return;
      }
      this.updateCharmedAi(dt, e);
      return;
    }
    // Pick aggressive target: prefer a closer ally (turret / minion / charmed enemy)
    // over the player when noticeably nearer.
    let p = player;
    let bestD = Math.hypot(player.x - e.x, player.y - e.y);
    for (const tu of this.turrets) {
      const d = Math.hypot(tu.x - e.x, tu.y - e.y);
      if (d < bestD * 0.85 && d < 320) { bestD = d; p = tu; }
    }
    for (const m of this.minions) {
      const d = Math.hypot(m.x - e.x, m.y - e.y);
      if (d < bestD * 0.85 && d < 280) { bestD = d; p = m; }
    }
    for (const o of this.enemies) {
      if (!o.charmed || o === e) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bestD * 0.85 && d < 280) { bestD = d; p = o; }
    }
    const dx = p.x - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx, dy);
    const ndx = dist > 0 ? dx / dist : 0;
    const ndy = dist > 0 ? dy / dist : 0;
    const frozenMod = e.statuses.frozen ? 0.4 : 1;
    const sf = freezeMult * frozenMod;
    // Velocity is now in px/s directly. We exponentially smooth toward a target
    // velocity (`tvx`/`tvy`), then integrate position with `e.x += e.vx * dt`.
    let tvx = ndx * e.speed * sf;
    let tvy = ndy * e.speed * sf;
    let smooth = 4;
    let directMove = false;

    switch (e.behavior) {
      case 'wavy': {
        e.angle = (e.angle || 0) + dt * 3;
        const w = Math.sin(e.angle) * 0.7;
        tvx = (ndx + (-ndy) * w) * e.speed * sf;
        tvy = (ndy + ndx * w) * e.speed * sf;
        smooth = 3;
        break;
      }
      case 'phase': {
        smooth = 2;
        break;
      }
      case 'charge': {
        if (e.charging) {
          e.chargeDur -= dt;
          // direct displacement during charge burst
          e.x += e.chargeDx * e.speed * 3 * sf * dt;
          e.y += e.chargeDy * e.speed * 3 * sf * dt;
          directMove = true;
          if (e.chargeDur <= 0) { e.charging = false; e.chargeTimer = 3 + Math.random() * 2; }
        } else {
          e.chargeTimer -= dt;
          tvx = ndx * e.speed * 0.5 * sf;
          tvy = ndy * e.speed * 0.5 * sf;
          if (e.chargeTimer <= 0) {
            e.charging = true;
            e.chargeDx = ndx; e.chargeDy = ndy;
            e.chargeDur = 0.35;
          }
        }
        break;
      }
      case 'ranged': {
        tvx = ndx * e.speed * 0.6 * sf;
        tvy = ndy * e.speed * 0.6 * sf;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && dist < 260) {
          e.shootTimer = 2.5 + Math.random() * 1.5;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, ndx * 140, ndy * 140, e.dmg, 0xc8c8b0, 5));
          playSfx('eprojshoot');
        }
        break;
      }
      case 'kite': {
        const ideal = e.kiteDist;
        if (dist < ideal - 20) {
          tvx = -ndx * e.speed * sf;
          tvy = -ndy * e.speed * sf;
        } else if (dist > ideal + 20) {
          tvx = ndx * e.speed * 0.5 * sf;
          tvy = ndy * e.speed * 0.5 * sf;
        } else {
          tvx = 0; tvy = 0; smooth = 6;
        }
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && dist < 300) {
          e.shootTimer = 2 + Math.random();
          const col = e.type === 'witch' ? 0xcc44ff : 0xff8800;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, ndx * 160, ndy * 160, e.dmg * 1.5, col, 6));
          playSfx('eprojshoot');
        }
        break;
      }
      case 'boss': {
        smooth = 3;
        if (e.kindMove === 'orbiter') {
          // Maintain ~280 px orbit, glide tangentially when in range
          const orbitR = 280;
          if (dist > orbitR + 40) {
            tvx = ndx * e.speed;
            tvy = ndy * e.speed;
          } else if (dist < orbitR - 40) {
            tvx = -ndx * e.speed * 0.8;
            tvy = -ndy * e.speed * 0.8;
          } else {
            tvx = -ndy * e.speed * 1.1;
            tvy = ndx * e.speed * 1.1;
          }
        } else if (e.kindMove === 'charger') {
          if (e.charging) {
            e.chargeDur -= dt;
            e.x += e.chargeDx * e.speed * 4 * dt;
            e.y += e.chargeDy * e.speed * 4 * dt;
            directMove = true;
            if (e.chargeDur <= 0) { e.charging = false; e.chargeTimer = 3.5 + Math.random() * 1.5; }
          } else {
            e.chargeTimer = (e.chargeTimer ?? 4) - dt;
            tvx = ndx * e.speed * 0.4;
            tvy = ndy * e.speed * 0.4;
            if (e.chargeTimer <= 0 && dist > 100) {
              e.charging = true;
              e.chargeDx = ndx; e.chargeDy = ndy;
              e.chargeDur = 0.5;
            }
          }
        } else if (e.kindMove === 'phasing') {
          e.phaseT -= dt;
          if (e.phaseT <= 0) {
            e.phaseT = 6;
            const a = Math.random() * Math.PI * 2;
            const r = 200 + Math.random() * 80;
            this.fxNova(e.x, e.y, 35);
            e.x = p.x + Math.cos(a) * r;
            e.y = p.y + Math.sin(a) * r;
            this.fxNova(e.x, e.y, 35);
          }
          tvx = ndx * e.speed * 0.4;
          tvy = ndy * e.speed * 0.4;
        }
        if (dist > 600 && e.kindMove !== 'orbiter') {
          e.x = p.x + (Math.random() - 0.5) * 300;
          e.y = p.y + (Math.random() - 0.5) * 300;
        }
        e.shootTimer = (e.shootTimer ?? 2) - dt;
        if (e.shootTimer <= 0) {
          e.shootCount = (e.shootCount || 0) + 1;
          const pattern = e.shootCount % 6;
          e.shootTimer = pattern === 1 || pattern === 4 ? 2.8 : pattern === 2 || pattern === 5 ? 1.7 : 2.5;
          this.fireBossPattern(e, p, pattern);
          playSfx('eprojshoot');
        }
        break;
      }
      case 'direct':
      default:
        break;
    }

    if (!directMove) {
      const k = 1 - Math.exp(-smooth * dt);
      e.vx += (tvx - e.vx) * k;
      e.vy += (tvy - e.vy) * k;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  }

  firePlayerWeapons(dt, p, dmgBoost) {
    const dlv = slv(p, 'dagger');
    if (dlv > 0) {
      this.weaponT.dagger -= dt;
      if (this.weaponT.dagger <= 0 && this.enemies.length > 0) {
        this.weaponT.dagger = dlv >= 3 ? 0.45 : 0.8;
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        if (near) {
          const count = dlv >= 4 ? 3 : dlv >= 2 ? 2 : 1;
          const base = Math.atan2(near.y - p.y, near.x - p.x);
          const dmg = (12 + dlv * 4) * p.dmgM * dmgBoost;
          for (let i = 0; i < count; i++) {
            const ang = base + (i - (count - 1) / 2) * 0.3;
            this.projectiles.push(new Projectile(this, p.x, p.y, Math.cos(ang) * 390, Math.sin(ang) * 390, dmg, dlv >= 5));
          }
          playSfx('dagger');
        }
      }
    }

    const olv = slv(p, 'orbit');
    if (olv > 0) {
      const radius = olv >= 4 ? 90 : 70;
      const speed = olv >= 5 ? 3.0 : 2.0;
      const dmg = (10 + olv * 4) * p.dmgM * dmgBoost * (olv >= 5 ? 1.5 : olv >= 3 ? 1.2 : 1);
      const orbR = 12;
      this.orbitAngle += speed * dt;
      // tick down per-enemy hit cooldowns
      for (const [k, v] of this.orbitHits) {
        const nv = v - dt;
        if (nv <= 0) this.orbitHits.delete(k);
        else this.orbitHits.set(k, nv);
      }
      for (let i = 0; i < olv; i++) {
        const a = this.orbitAngle + (i / olv) * Math.PI * 2;
        const ox = p.x + Math.cos(a) * radius;
        const oy = p.y + Math.sin(a) * radius;
        for (const e of this.enemies) {
          if (this.orbitHits.has(e)) continue;
          if (Math.hypot(e.x - ox, e.y - oy) < e.size + orbR) {
            const dealt = e.takeDamage(dmg, 'dark', this);
            if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
            this.orbitHits.set(e, 0.5);
          }
        }
      }
    }

    const swlv = slv(p, 'sword');
    if (swlv > 0) {
      this.weaponT.sword -= dt;
      if (this.weaponT.sword <= 0) {
        this.weaponT.sword = swlv >= 5 ? 0.5 : swlv >= 2 ? 0.85 : 1.1;
        const radius = 70 + swlv * 8;
        const dmg = (22 + swlv * 7) * p.dmgM * dmgBoost * (swlv >= 4 ? 1.5 : 1);
        const arcDeg = swlv >= 4 ? 360 : swlv >= 3 ? 180 : swlv >= 2 ? 120 : 90;
        const arc = arcDeg * Math.PI / 180;
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        const baseAngle = near ? Math.atan2(near.y - p.y, near.x - p.x) : 0;
        this.applySwordSlash(p, baseAngle, arc, arcDeg, radius, dmg);
        this.fxSwordSlash(p.x, p.y, baseAngle, arc, radius, false);
        playSfx('dagger');
        if (swlv >= 5) {
          this.time.delayedCall(140, () => {
            if (this.over || this.paused) return;
            const a2 = baseAngle + Math.PI / 5;
            this.applySwordSlash(p, a2, arc, arcDeg, radius, dmg * 0.7);
            this.fxSwordSlash(p.x, p.y, a2, arc, radius, true);
            playSfx('dagger');
          });
        }
      }
    }

    const cmlv = slv(p, 'charm');
    if (cmlv > 0) {
      this.weaponT.charm -= dt;
      if (this.weaponT.charm <= 0) {
        this.weaponT.charm = cmlv >= 5 ? 5 : 8;
        const count = cmlv >= 5 ? 3 : cmlv >= 3 ? 2 : 1;
        const duration = cmlv >= 4 ? 10 : cmlv >= 2 ? 8 : 5;
        const dmgMul = cmlv >= 4 ? 1.5 : 1;
        const candidates = this.enemies
          .filter(e => !e.charmed && e.type !== 'boss')
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
        for (let i = 0; i < count && i < candidates.length; i++) {
          const e = candidates[i];
          e.charmed = true;
          e.charmedDur = duration;
          e.charmedDmgMul = dmgMul;
          this.fxCharm(e.x, e.y);
        }
        if (candidates.length > 0) playSfx('itempickup');
      }
    }

    const fllv = slv(p, 'flamethrower');
    if (fllv > 0) {
      const burstDur = fllv >= 5 ? 3.0 : 2.5;
      const cd = fllv >= 5 ? 3.5 : fllv >= 3 ? 4 : 5;
      this.flameCD = (this.flameCD || 0) - dt;
      if (this.flameActive) {
        this.flameDur -= dt;
        if (this.flameDur <= 0) {
          this.flameActive = false;
          this.flameCD = cd;
        } else {
          this.weaponT.flamethrower = (this.weaponT.flamethrower || 0) - dt;
          if (this.weaponT.flamethrower <= 0) {
            this.weaponT.flamethrower = 0.1;
            const range = fllv >= 3 ? 180 : 150;
            const arcDeg = fllv >= 4 ? 100 : fllv >= 2 ? 80 : 60;
            const arc = arcDeg * Math.PI / 180;
            const dmg = (7 + (fllv >= 3 ? 3 : 0)) * p.dmgM * dmgBoost * (fllv >= 4 ? 1.3 : 1);
            let near = null, nd = Infinity;
            for (const e of this.enemies) {
              if (e.charmed) continue;
              const d = Math.hypot(e.x - p.x, e.y - p.y);
              if (d < nd) { nd = d; near = e; }
            }
            const baseAngle = near ? Math.atan2(near.y - p.y, near.x - p.x) : (this._lastFlameAngle ?? 0);
            this._lastFlameAngle = baseAngle;
            const angles = fllv >= 5 ? [baseAngle, baseAngle + Math.PI] : [baseAngle];
            for (const a of angles) {
              this.applyFlamethrower(p, a, arc, range, dmg);
              this.fxFlame(p.x, p.y, a, arc, range);
            }
          }
        }
      } else if (this.flameCD <= 0 && this.enemies.length > 0) {
        this.flameActive = true;
        this.flameDur = burstDur;
        playSfx('nova');
      }
    }

    const cllv = slv(p, 'cloud');
    if (cllv > 0) {
      const max = cllv >= 5 ? 4 : cllv >= 4 ? 3 : cllv >= 2 ? 2 : 1;
      this.cloudT -= dt;
      if (this.cloudT <= 0 && this.clouds.length < max) {
        this.cloudT = 4;
        const c = new StormCloud(this, 0);
        c.x = p.x + (Math.random() - 0.5) * 200;
        c.y = p.y - 100 + (Math.random() - 0.5) * 80;
        this.clouds.push(c);
      }
    }

    const grlv = slv(p, 'grenade');
    if (grlv > 0) {
      this.weaponT.grenade -= dt;
      if (this.weaponT.grenade <= 0) {
        this.weaponT.grenade = 2;
        const count = grlv >= 4 ? 3 : grlv >= 3 ? 2 : 1;
        const aoe = (70 + grlv * 5) * (grlv >= 2 ? 1.3 : 1);
        const dmg = (35 + grlv * 8) * p.dmgM * dmgBoost * (grlv >= 4 ? 1.3 : 1);
        const sorted = this.enemies
          .filter(e => !e.charmed)
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
        for (let i = 0; i < count; i++) {
          const target = sorted[i % Math.max(1, sorted.length)];
          const a = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.random() * Math.PI * 2;
          const offa = (i - (count - 1) / 2) * 0.3;
          const speed = 260;
          this.grenades.push(new Grenade(this, p.x, p.y, Math.cos(a + offa) * speed, Math.sin(a + offa) * speed, dmg, aoe, 0.7, grlv));
        }
        playSfx('itempickup');
      }
    }

    const milv = slv(p, 'missile');
    if (milv > 0) {
      this.weaponT.missile -= dt;
      if (this.weaponT.missile <= 0 && this.enemies.length > 0) {
        this.weaponT.missile = milv >= 5 ? 0.8 : 1.2;
        const count = milv;
        const dmg = (25 + milv * 5) * p.dmgM * dmgBoost * (milv >= 4 ? 1.4 : 1);
        const aoe = milv >= 5 ? 80 : milv >= 3 ? 50 : 30;
        const sorted = this.enemies
          .filter(e => !e.charmed)
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
        for (let i = 0; i < count; i++) {
          const target = sorted[i % Math.max(1, sorted.length)];
          if (!target) break;
          const m = new HomingMissile(this, p.x, p.y, target, dmg, aoe);
          const baseAngle = Math.atan2(target.y - p.y, target.x - p.x);
          const offa = (i - (count - 1) / 2) * 0.45;
          m.angle = baseAngle + offa;
          this.missiles.push(m);
        }
        playSfx('dagger');
      }
    }

    const wlv = slv(p, 'whip');
    if (wlv > 0) {
      this.weaponT.whip -= dt;
      if (this.weaponT.whip <= 0) {
        this.weaponT.whip = wlv >= 5 ? 0.6 : wlv >= 3 ? 0.85 : 1.0;
        const length = wlv >= 4 ? 200 : wlv >= 2 ? 165 : 130;
        const width = 38;
        const dmg = (18 + wlv * 5) * p.dmgM * dmgBoost * (wlv >= 4 ? 1.3 : 1);
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        const baseAngle = near ? Math.atan2(near.y - p.y, near.x - p.x) : 0;
        const angles = wlv >= 5 ? [0, Math.PI / 2, Math.PI, -Math.PI / 2]
                     : wlv >= 3 ? [baseAngle, baseAngle + Math.PI]
                                : [baseAngle];
        for (const a of angles) {
          this.applyWhipStrike(p, a, length, width, dmg);
          this.fxWhip(p.x, p.y, a, length, width);
        }
        playSfx('lightning');
      }
    }

    const nlv = slv(p, 'nova');
    if (nlv > 0) {
      this.weaponT.nova -= dt;
      if (this.weaponT.nova <= 0) {
        this.weaponT.nova = nlv >= 4 ? 1.2 : 2;
        const r = (80 + nlv * 25) * (nlv >= 5 ? 1.5 : 1);
        const dmg = (18 + nlv * 10) * p.dmgM * (nlv >= 3 ? 1.5 : 1) * dmgBoost;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < r) {
            const dealt = e.takeDamage(dmg, 'fire', this);
            if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
            if (nlv >= 5) {
              const a = Math.atan2(e.y - p.y, e.x - p.x);
              e.vx += Math.cos(a) * 320;
              e.vy += Math.sin(a) * 320;
            }
          }
        }
        this.fxNova(p.x, p.y, r);
        this.shake(0.005, 100);
        playSfx('nova');
      }
    }

    const llv = slv(p, 'lightning');
    if (llv > 0) {
      this.weaponT.lightning -= dt;
      if (this.weaponT.lightning <= 0 && this.enemies.length > 0) {
        this.weaponT.lightning = llv >= 5 ? 0.4 : llv >= 3 ? 0.8 : 1.5;
        const chains = llv >= 4 ? 4 : llv >= 2 ? 2 : 1;
        const dmg = (20 + llv * 8) * p.dmgM * dmgBoost;
        let prev = { x: p.x, y: p.y };
        let pool = this.enemies.slice();
        for (let c = 0; c < chains && pool.length > 0; c++) {
          let near = null, nd = Infinity;
          for (const e of pool) {
            const d = Math.hypot(e.x - prev.x, e.y - prev.y);
            if (d < nd) { nd = d; near = e; }
          }
          if (!near || nd > 360) break;
          const dealt = near.takeDamage(dmg, 'lightning', this);
          if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
          this.fxBolt(prev.x, prev.y, near.x, near.y);
          prev = { x: near.x, y: near.y };
          pool = pool.filter(e => e !== near);
        }
        playSfx('lightning');
      }
    }
  }

  updateTrail(dt, p, dmgBoost) {
    const tlv = slv(p, 'trail');
    if (tlv > 0) {
      const dropStep = tlv >= 2 ? 22 : 32;
      const radius = tlv >= 5 ? 40 : tlv >= 3 ? 28 : 22;
      const maxLife = tlv >= 5 ? 4 : tlv >= 3 ? 3 : 2.5;
      const dx = p.x - this.lastTrailX;
      const dy = p.y - this.lastTrailY;
      if (Math.hypot(dx, dy) >= dropStep) {
        this.trail.push(new TrailTile(this, p.x - dx * 0.3, p.y - dy * 0.3, radius, maxLife));
        this.lastTrailX = p.x;
        this.lastTrailY = p.y;
      }
    }
    // tick down tiles
    this.trail = this.trail.filter(t => {
      t.life -= dt;
      if (t.life <= 0) { t.destroy(); return false; }
      return true;
    });
    if (tlv > 0 && this.trail.length > 0) {
      const dmg = (5 + tlv * 2.5) * p.dmgM * dmgBoost * (tlv >= 4 ? 1.5 : 1) * (tlv >= 5 ? 1.5 : 1);
      for (const [k, v] of this.trailHits) {
        const nv = v - dt;
        if (nv <= 0) this.trailHits.delete(k);
        else this.trailHits.set(k, nv);
      }
      for (const e of this.enemies) {
        if (this.trailHits.has(e)) continue;
        for (const t of this.trail) {
          if (Math.hypot(e.x - t.x, e.y - t.y) < t.radius + e.size) {
            const dealt = e.takeDamage(dmg, 'poison', this);
            if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
            this.trailHits.set(e, 0.4);
            break;
          }
        }
      }
    }
  }

  updateTraps(dt, p, dmgBoost) {
    const lvl = slv(p, 'traps');
    if (lvl > 0) {
      const interval = lvl >= 5 ? 1.5 : lvl >= 4 ? 2 : 3;
      const radius = (50 + lvl * 8) * (lvl >= 3 ? 1.5 : 1);
      const dmg = (25 + lvl * 8) * p.dmgM * dmgBoost * (lvl >= 4 ? 1.3 : 1);
      const count = lvl >= 2 ? 2 : 1;
      this.trapT -= dt;
      if (this.trapT <= 0) {
        this.trapT = interval;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const dist = i === 0 ? 0 : 25 + Math.random() * 30;
          this.traps.push(new TrapMine(this, p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist, radius, dmg));
        }
      }
    }
    this.traps = this.traps.filter(t => {
      if (t.armTime > 0) t.armTime -= dt;
      t.life -= dt;
      if (t.life <= 0) { t.destroy(); return false; }
      if (t.armTime > 0) return true;
      for (const e of this.enemies) {
        if (Math.hypot(e.x - t.x, e.y - t.y) < t.triggerR + e.size) {
          for (const e2 of this.enemies) {
            if (Math.hypot(e2.x - t.x, e2.y - t.y) < t.radius + e2.size) {
              const dealt = e2.takeDamage(t.dmg, 'fire', this);
              if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
              if (lvl >= 5) e2.statuses.frozen = { duration: 0.5 };
            }
          }
          this.fxNova(t.x, t.y, t.radius);
          this.shake(0.005, 90);
          playSfx('nova');
          t.destroy();
          return false;
        }
      }
      return true;
    });
  }

  updateMinions(dt, p) {
    const lvl = slv(p, 'summon');
    if (lvl <= 0 && this.minions.length === 0) return;
    if (lvl > 0) {
      const maxMinions = lvl >= 4 ? 3 : lvl >= 2 ? 2 : 1;
      const interval = lvl >= 5 ? 4 : 6;
      const hp = Math.round((30 + lvl * 8) * (lvl >= 3 ? 1.5 : 1));
      const dmg = (8 + lvl * 3) * (lvl >= 3 ? 1.3 : 1);
      this.minionT -= dt;
      if (this.minionT <= 0 && this.minions.length < maxMinions) {
        this.minionT = interval;
        const a = Math.random() * Math.PI * 2;
        this.minions.push(new Minion(this, p.x + Math.cos(a) * 35, p.y + Math.sin(a) * 35, hp, dmg, 145));
        playSfx('itempickup');
      }
    }
    this.minions = this.minions.filter(m => {
      if (m.hp <= 0) {
        if (lvl >= 5) {
          for (const e of this.enemies) {
            if (Math.hypot(e.x - m.x, e.y - m.y) < 70 + e.size) {
              e.takeDamage(20 + lvl * 4, 'fire', this);
            }
          }
          this.fxNova(m.x, m.y, 70);
          this.shake(0.004, 70);
          playSfx('nova');
        }
        m.destroy();
        return false;
      }
      let target = null, td = Infinity;
      for (const e of this.enemies) {
        if (e.charmed) continue;
        const d = Math.hypot(e.x - m.x, e.y - m.y);
        if (d < td) { td = d; target = e; }
      }
      if (target) {
        const dx = target.x - m.x, dy = target.y - m.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ndx = dx / dist, ndy = dy / dist;
        const tvx = ndx * m.speed;
        const tvy = ndy * m.speed;
        const k = 1 - Math.exp(-4 * dt);
        m.vx += (tvx - m.vx) * k;
        m.vy += (tvy - m.vy) * k;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.attackCD = Math.max(0, m.attackCD - dt);
        if (m.attackCD <= 0 && Math.hypot(m.x - target.x, m.y - target.y) < m.size + target.size) {
          target.takeDamage(m.dmg, 'physical', this);
          m.attackCD = 0.5;
          // minion takes a bit of damage on contact
          m.hp -= target.dmg * 0.4;
        }
      } else {
        const dx = p.x - m.x, dy = p.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d > 100) {
          m.vx = (dx / d) * 90;
          m.vy = (dy / d) * 90;
        } else {
          m.vx *= 0.92; m.vy *= 0.92;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
      }
      return true;
    });
  }

  updateGatherers(dt, p) {
    const lvl = slv(p, 'gather');
    if (lvl <= 0 && this.gatherers.length === 0) return;
    if (lvl > 0) {
      const max = lvl >= 5 ? 3 : lvl >= 3 ? 2 : 1;
      const speed = lvl >= 5 ? 280 : lvl >= 2 ? 180 : 140;
      this.gathererT -= dt;
      if (this.gathererT <= 0 && this.gatherers.length < max) {
        this.gathererT = 8;
        const m = new Minion(this, p.x, p.y, 999, 0, speed, 'gatherer');
        m.size = 9;
        this.gatherers.push(m);
        playSfx('itempickup');
      }
    }
    const xpBoost = lvl >= 4 ? 1.5 : 1;
    for (const g of this.gatherers) {
      // Sequential pickup: nearest non-collected orb, no cross-gatherer locking.
      let target = null, td = Infinity;
      for (const o of this.orbs) {
        if (o.life <= 0) continue;
        const d = Math.hypot(o.x - g.x, o.y - g.y);
        if (d < td) { td = d; target = o; }
      }
      if (target) {
        const dx = target.x - g.x, dy = target.y - g.y;
        const dist = Math.hypot(dx, dy) || 1;
        g.vx = (dx / dist) * g.speed;
        g.vy = (dy / dist) * g.speed;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        if (Math.hypot(g.x - target.x, g.y - target.y) < g.size + 14) {
          // collect: grant boosted XP and flag orb for removal
          p.xp += Math.ceil(target.value * xpBoost);
          playSfx('xp');
          if (p.xp >= xpFor(p.level)) {
            p.xp -= xpFor(p.level);
            p.level++;
            p.hp = Math.min(p.maxHp, p.hp + 15);
            playSfx('levelup');
            this.onLevelUp(p);
          }
          target.life = -1;
        }
      } else {
        // No orbs around — drift back near the player.
        const dx = p.x - g.x, dy = p.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 70) {
          g.vx = (dx / d) * g.speed * 0.6;
          g.vy = (dy / d) * g.speed * 0.6;
        } else {
          g.vx *= 0.92; g.vy *= 0.92;
        }
        g.x += g.vx * dt;
        g.y += g.vy * dt;
      }
    }
  }

  updateTurrets(dt, p, dmgBoost) {
    const lvl = slv(p, 'turret');
    if (lvl <= 0 && this.turrets.length === 0) return;
    if (lvl > 0) {
      const max = lvl >= 5 ? 4 : lvl >= 4 ? 3 : lvl >= 2 ? 2 : 1;
      const interval = lvl >= 5 ? 3 : 5;
      this.turretT -= dt;
      if (this.turretT <= 0 && this.turrets.length < max) {
        this.turretT = interval;
        const hp = (40 + lvl * 10) * (lvl >= 4 ? 1.5 : 1);
        const dmg = (6 + lvl * 2) * p.dmgM;
        const range = (140 + lvl * 15) * (lvl >= 3 ? 1.3 : 1);
        const dmgType = lvl >= 5 ? 'fire' : lvl >= 3 ? 'lightning' : 'physical';
        const fireRate = lvl >= 5 ? 0.5 : lvl >= 3 ? 0.8 : 1.1;
        const a = Math.random() * Math.PI * 2;
        const t = new Turret(this, p.x + Math.cos(a) * 55, p.y + Math.sin(a) * 55, hp, dmg, range, dmgType, fireRate);
        t.coreColor = dmgType === 'fire' ? 0xff7733 : dmgType === 'lightning' ? 0xffe066 : 0x88aaff;
        this.turrets.push(t);
        playSfx('itempickup');
      }
    }
    this.turrets = this.turrets.filter(t => {
      if (t.hp <= 0) {
        this.fxNova(t.x, t.y, 30);
        t.destroy();
        return false;
      }
      let target = null, td = Infinity;
      for (const e of this.enemies) {
        if (e.charmed) continue;
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d < t.range && d < td) { td = d; target = e; }
      }
      if (target) {
        t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
        t.fireT -= dt;
        if (t.fireT <= 0) {
          t.fireT = t.fireRate;
          target.takeDamage(t.dmg * dmgBoost, t.dmgType, this);
          this.fxTurretShot(t.x, t.y - 2, target.x, target.y, t.coreColor);
        }
      }
      // melee enemies chip the turret
      for (const e of this.enemies) {
        if (e.charmed) continue;
        if (Math.hypot(e.x - t.x, e.y - t.y) < e.size + t.size) {
          t.hp -= e.dmg * dt * 1.5;
        }
      }
      return true;
    });
  }

  fxTurretShot(x1, y1, x2, y2, col) {
    const g = this.add.graphics().setDepth(13);
    g.lineStyle(2, col, 1);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
    this.tweens.add({
      targets: g, alpha: 0,
      duration: 130,
      onComplete: () => g.destroy(),
    });
  }

  updateMissiles(dt, p) {
    this.missiles = this.missiles.filter(m => {
      m.life -= dt;
      if (m.life <= 0) { m.destroy(); return false; }
      if (!m.target || m.target.hp <= 0 || m.target.charmed) {
        m.target = null;
        let best = null, bd = Infinity;
        for (const e of this.enemies) {
          if (e.charmed) continue;
          const d = Math.hypot(e.x - m.x, e.y - m.y);
          if (d < bd) { bd = d; best = e; }
        }
        m.target = best;
      }
      if (m.target) {
        const dx = m.target.x - m.x, dy = m.target.y - m.y;
        const desired = Math.atan2(dy, dx);
        let diff = desired - m.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxTurn = m.turnRate * dt;
        if (Math.abs(diff) < maxTurn) m.angle = desired;
        else m.angle += Math.sign(diff) * maxTurn;
      }
      m.x += Math.cos(m.angle) * m.speed * dt;
      m.y += Math.sin(m.angle) * m.speed * dt;
      for (const e of this.enemies) {
        if (e.charmed) continue;
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.size + 5) {
          for (const e2 of this.enemies) {
            if (e2.charmed) continue;
            if (Math.hypot(e2.x - m.x, e2.y - m.y) < m.aoe + e2.size) {
              const dealt = e2.takeDamage(m.dmg, 'fire', this);
              if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
            }
          }
          this.fxNova(m.x, m.y, m.aoe);
          this.shake(0.005, 90);
          playSfx('nova');
          m.destroy();
          return false;
        }
      }
      return true;
    });
  }

  updateFloating(dt, p, dmgBoost) {
    const lvl = slv(p, 'floating');
    if (lvl <= 0 && this.floating.length === 0) return;
    if (lvl > 0) {
      const max = lvl >= 5 ? 6 : lvl >= 4 ? 5 : lvl >= 3 ? 4 : lvl >= 2 ? 3 : 2;
      const interval = lvl >= 4 ? 2 : 3;
      const idle = this.floating.filter(b => b.state === 'idle').length;
      this.floatingT -= dt;
      if (this.floatingT <= 0 && idle < max) {
        this.floatingT = interval;
        const angle = (idle / Math.max(1, max)) * Math.PI * 2 + Math.random() * 0.4;
        this.floating.push(new FloatingBlade(this, 0, angle));
      }
    }
    const triggerR = 90;
    const radius = 55;
    const angSpeed = 1.2;
    this.floating = this.floating.filter(b => {
      if (b.state === 'idle') {
        b.angle += angSpeed * dt;
        b.x = p.x + Math.cos(b.angle) * radius;
        b.y = p.y + Math.sin(b.angle) * radius;
        let target = null, td = Infinity;
        for (const e of this.enemies) {
          if (e.charmed) continue;
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < triggerR && d < td) { td = d; target = e; }
        }
        if (target) {
          b.state = 'flying';
          const a = Math.atan2(target.y - b.y, target.x - b.x);
          b.angle = a;
          const speed = 480;
          b.vx = Math.cos(a) * speed;
          b.vy = Math.sin(a) * speed;
          b.dmg = (30 + lvl * 6) * p.dmgM * dmgBoost * (lvl >= 3 ? 1.3 : 1) * (lvl >= 5 ? 1.5 : 1);
          b.life = 1.5;
          playSfx('dagger');
        }
        return true;
      }
      // flying
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) { b.destroy(); return false; }
      for (const e of this.enemies) {
        if (e.charmed) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + 5) {
          const dealt = e.takeDamage(b.dmg, 'physical', this);
          if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
          if (lvl >= 5) {
            for (const e2 of this.enemies) {
              if (e2 === e || e2.charmed) continue;
              if (Math.hypot(e2.x - b.x, e2.y - b.y) < 50 + e2.size) {
                e2.takeDamage(b.dmg * 0.5, 'fire', this);
              }
            }
            this.fxNova(b.x, b.y, 50);
            this.shake(0.004, 70);
          }
          b.destroy();
          return false;
        }
      }
      return true;
    });
  }

  updateGrenades(dt, p) {
    this.grenades = this.grenades.filter(g => {
      g.life -= dt;
      g.fuse -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vx *= 0.94;
      g.vy *= 0.94;
      let triggered = g.fuse <= 0;
      if (!triggered) {
        for (const e of this.enemies) {
          if (e.charmed) continue;
          if (Math.hypot(g.x - e.x, g.y - e.y) < e.size + 5) { triggered = true; break; }
        }
      }
      if (triggered) {
        const explode = (cx, cy) => {
          for (const e of this.enemies) {
            if (e.charmed) continue;
            if (Math.hypot(e.x - cx, e.y - cy) < g.aoe + e.size) {
              const dealt = e.takeDamage(g.dmg, 'fire', this);
              if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
            }
          }
          this.fxNova(cx, cy, g.aoe);
        };
        explode(g.x, g.y);
        this.shake(0.005, 100);
        playSfx('nova');
        if (g.lvl >= 5) {
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 30 + Math.random() * 30;
            const cx = g.x + Math.cos(a) * r;
            const cy = g.y + Math.sin(a) * r;
            this.time.delayedCall(140 * (i + 1), () => {
              if (this.over) return;
              explode(cx, cy);
              playSfx('nova');
            });
          }
        }
        g.destroy();
        return false;
      }
      if (g.life <= 0) { g.destroy(); return false; }
      return true;
    });
  }

  updateNests(dt, p) {
    // Spawn a new nest periodically (max 3 simultaneous)
    this.nestSpawnT -= dt;
    if (this.nestSpawnT <= 0 && this.nests.length < 3) {
      this.nestSpawnT = 35 + Math.random() * 20;
      // Find a position away from the player
      let nx = 0, ny = 0, tries = 0;
      do {
        nx = 80 + Math.random() * (this.W - 160);
        ny = 80 + Math.random() * (this.H - 160);
        tries++;
      } while (Math.hypot(nx - p.x, ny - p.y) < 220 && tries < 12);
      const type = Math.random() < 0.5 ? 'cave' : 'cemetery';
      this.nests.push(new Nest(this, nx, ny, type));
    }
    // Tick + spawn children + cleanup
    this.nests = this.nests.filter(n => {
      if (n.hp <= 0) {
        this.fxNova(n.x, n.y, 40);
        this.shake(0.005, 90);
        playSfx('death');
        n.destroy();
        return false;
      }
      n.spawnT -= dt;
      if (n.spawnT <= 0) {
        n.spawnT = n.spawnInterval;
        const t = n.type === 'cave' ? 'bat' : 'skeleton';
        const tier = Math.floor(this.elapsed / 60);
        const hpMul = (1 + tier * 0.3) * (this.mode === 'horde' ? 0.6 : 1);
        const dmgMul = 1 + tier * 0.1;
        const ang = Math.random() * Math.PI * 2;
        const child = new Enemy(this, n.x + Math.cos(ang) * 24, n.y + Math.sin(ang) * 24, t, hpMul, 1, dmgMul);
        this.enemies.push(child);
      }
      return true;
    });
  }

  updateOrbs(dt, p) {
    this.orbs = this.orbs.filter(o => {
      o.life -= dt;
      if (o.life <= 0) { o.destroy(); return false; }
      const dx = p.x - o.x, dy = p.y - o.y;
      const d = Math.hypot(dx, dy);
      if (d < p.magnet) {
        const sp = Math.max(200, 380 * (1 - d / p.magnet));
        const a = Math.atan2(dy, dx);
        o.x += Math.cos(a) * sp * dt;
        o.y += Math.sin(a) * sp * dt;
      }
      if (d < 18) {
        p.xp += o.value;
        playSfx('xp');
        if (p.xp >= xpFor(p.level)) {
          p.xp -= xpFor(p.level);
          p.level++;
          p.hp = Math.min(p.maxHp, p.hp + 15);
          playSfx('levelup');
          this.onLevelUp(p);
        }
        o.destroy();
        return false;
      }
      return true;
    });
  }

  onLevelUp(p) {
    this.paused = true;
    this.shake(0.006, 200);
    stopMusic();
    const choices = getChoices(p);
    bus.emit('levelup', { lv: p.level, choices });
    this.emitHud();
  }

  onSkillPick(id) {
    const p = this.player;
    p.skills[id] = (p.skills[id] || 0) + 1;
    if (id === 'heart') {
      const lv = p.skills.heart;
      p.maxHp += lv <= 2 ? 50 : 80;
      if (lv === 3) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15);
    }
    refreshStats(p);
    this.paused = false;
    if (!this.over) startMusic();
    this.emitHud();
  }

  fxNova(x, y, r) {
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0xff6b35, 0.25);
    g.fillCircle(0, 0, r);
    g.lineStyle(2, 0xff6b35, 0.9);
    g.strokeCircle(0, 0, r);
    g.x = x; g.y = y; g.scale = 0.4;
    this.tweens.add({
      targets: g, scale: 1, alpha: 0,
      duration: 320,
      onComplete: () => g.destroy(),
    });
  }

  applySwordSlash(p, baseAngle, arc, arcDeg, radius, dmg) {
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > radius) continue;
      if (arcDeg < 360) {
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        let diff = ea - baseAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > arc / 2) continue;
      }
      const dealt = e.takeDamage(dmg, 'physical', this);
      if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      e.vx += Math.cos(a) * 80;
      e.vy += Math.sin(a) * 80;
    }
  }

  updateCharmedAi(dt, e) {
    let target = null, td = Infinity;
    for (const o of this.enemies) {
      if (o === e || o.charmed) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < td) { td = d; target = o; }
    }
    if (target) {
      const dx = target.x - e.x, dy = target.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ndx = dx / dist, ndy = dy / dist;
      const tvx = ndx * e.speed * 1.2;
      const tvy = ndy * e.speed * 1.2;
      const k = 1 - Math.exp(-4 * dt);
      e.vx += (tvx - e.vx) * k;
      e.vy += (tvy - e.vy) * k;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (Math.hypot(e.x - target.x, e.y - target.y) < e.size + target.size) {
        const dmg = e.dmg * (e.charmedDmgMul || 1);
        target.takeDamage(dmg, 'physical', this);
        // counter damage so the charmed minion can actually die in fights
        e.hp -= target.dmg * 0.5;
      }
    } else {
      e.vx *= (1 - dt * 2);
      e.vy *= (1 - dt * 2);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  }

  fxCharm(x, y) {
    const g = this.add.graphics().setDepth(13);
    g.x = x; g.y = y;
    g.fillStyle(0xff7da8, 0.55);
    g.fillCircle(0, 0, 24);
    g.lineStyle(2, 0xff66aa, 1);
    g.strokeCircle(0, 0, 24);
    // floating heart
    g.fillStyle(0xff66aa, 0.95);
    g.fillCircle(-3, -5, 4);
    g.fillCircle(3, -5, 4);
    g.fillTriangle(-7, -3, 7, -3, 0, 8);
    this.tweens.add({
      targets: g, alpha: 0, scale: 1.6, y: y - 30,
      duration: 600,
      onComplete: () => g.destroy(),
    });
  }

  fireBossPattern(e, p, pattern) {
    const speed = 130;
    const r = 7;
    const dmg = e.dmg;
    const col = e.projCol ?? 0xff4400;
    switch (pattern) {
      case 0: { // 8-pointed star burst
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, dmg, col, r));
        }
        break;
      }
      case 1: { // double spiral burst
        const offset = (e.shootCount || 0) * 0.5;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + offset;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 0.9, Math.sin(a) * speed * 0.9, dmg, col, r));
        }
        this.time.delayedCall(220, () => {
          if (e.hp <= 0) return;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + offset + Math.PI / 6;
            this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 1.1, Math.sin(a) * speed * 1.1, dmg, col, r));
          }
        });
        break;
      }
      case 2: { // tight cone toward player
        const baseA = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -2; i <= 2; i++) {
          const a = baseA + i * 0.16;
          const sp = speed * 1.25;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, dmg, col, r + 1));
        }
        break;
      }
      case 3: { // double cross — slow + fast layers
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 0.7, Math.sin(a) * speed * 0.7, dmg * 0.85, col, r));
        }
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 1.25, Math.sin(a) * speed * 1.25, dmg * 0.85, col, r));
        }
        break;
      }
      case 4: { // expanding ring — slow then fast wave
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 0.55, Math.sin(a) * speed * 0.55, dmg * 0.7, col, r));
        }
        this.time.delayedCall(650, () => {
          if (e.hp <= 0) return;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
            this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 0.95, Math.sin(a) * speed * 0.95, dmg * 0.7, col, r));
          }
        });
        break;
      }
      case 5: { // strafe burst — 3 fast tight shots toward player
        const baseA = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -1; i <= 1; i++) {
          const a = baseA + i * 0.08;
          const sp = speed * 1.45;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, dmg * 1.1, col, r + 1));
        }
        // follow-up burst
        this.time.delayedCall(180, () => {
          if (e.hp <= 0) return;
          const baseA2 = Math.atan2(p.y - e.y, p.x - e.x);
          for (let i = -1; i <= 1; i++) {
            const a = baseA2 + i * 0.12;
            this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, Math.cos(a) * speed * 1.3, Math.sin(a) * speed * 1.3, dmg * 0.9, col, r));
          }
        });
        break;
      }
    }
  }

  applyFlamethrower(p, angle, arc, range, dmg) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const half = arc / 2;
    for (const e of this.enemies) {
      if (e.charmed) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + e.size) continue;
      if (dist < 1) continue;
      const ea = Math.atan2(dy, dx);
      let diff = ea - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > half) continue;
      const dealt = e.takeDamage(dmg, 'fire', this);
      if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
    }
  }

  fxFlame(x, y, angle, arc, range) {
    // Spawn ~10 flame particles spread along the cone, each one a small blob
    // that drifts outward, scales down and fades out → looks like fire.
    const count = 10;
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * arc;
      const dist0 = 18 + Math.random() * 30;
      const startX = x + Math.cos(a) * dist0;
      const startY = y + Math.sin(a) * dist0;
      const dist1 = dist0 + 60 + Math.random() * (range * 0.7);
      const endX = x + Math.cos(a) * dist1;
      const endY = y + Math.sin(a) * dist1;
      const part = this.add.graphics().setDepth(13);
      // layered flame: bright core + orange middle + dark red outer
      part.fillStyle(0x4a0000, 0.6);
      part.fillCircle(0, 0, 9);
      part.fillStyle(0xff3300, 0.85);
      part.fillCircle(0, 0, 7);
      part.fillStyle(0xff8844, 0.95);
      part.fillCircle(0, 0, 5);
      part.fillStyle(0xffe066, 1);
      part.fillCircle(-1, -1, 3);
      part.x = startX; part.y = startY;
      part.scaleX = 0.6 + Math.random() * 0.5;
      part.scaleY = part.scaleX;
      this.tweens.add({
        targets: part,
        x: endX, y: endY,
        scaleX: 0.2 + Math.random() * 0.2,
        scaleY: 0.2 + Math.random() * 0.2,
        alpha: 0,
        duration: 280 + Math.random() * 120,
        ease: 'Quad.out',
        onComplete: () => part.destroy(),
      });
    }
  }

  updateClouds(dt, p, dmgBoost) {
    const lvl = slv(p, 'cloud');
    const dmg = (25 + (lvl >= 3 ? 8 : 0)) * (lvl >= 3 ? 1.3 : 1) * dmgBoost;
    const interval = lvl >= 3 ? 1.0 : 1.5;
    this.clouds = this.clouds.filter(c => {
      // drift
      c.driftAngle += (Math.random() - 0.5) * 0.4 * dt;
      c.x += Math.cos(c.driftAngle) * c.driftSpeed * dt;
      c.y += Math.sin(c.driftAngle) * c.driftSpeed * dt * 0.4;
      // keep around player
      const dx = p.x - c.x, dy = p.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d > 250) {
        c.x += dx / d * 60 * dt;
        c.y += dy / d * 60 * dt;
      }
      // strike: AoE under the cloud
      c.fireT -= dt;
      if (c.fireT <= 0) {
        c.fireT = interval;
        const radius = lvl >= 5 ? 100 : lvl >= 3 ? 80 : 60;
        let anyHit = false;
        for (const e of this.enemies) {
          if (e.charmed) continue;
          if (Math.hypot(e.x - c.x, e.y - c.y) < radius + e.size) {
            e.takeDamage(dmg, 'lightning', this);
            if (p.ls > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.ls);
            anyHit = true;
          }
        }
        if (anyHit || Math.random() < 0.5) this.fxCloudStrike(c.x, c.y, radius);
      }
      return true;
    });
  }

  fxCloudStrike(x, y, radius) {
    const g = this.add.graphics().setDepth(13);
    // jagged vertical bolt from cloud to ground
    g.lineStyle(3, 0xffffff, 1);
    g.beginPath();
    g.moveTo(x, y);
    let cx = x, cy = y;
    for (let i = 0; i < 5; i++) {
      cy += 6 + Math.random() * 8;
      cx += (Math.random() - 0.5) * 14;
      g.lineTo(cx, cy);
    }
    g.strokePath();
    g.lineStyle(1.5, 0xffe066, 0.9);
    g.beginPath();
    g.moveTo(x, y); g.lineTo(cx, cy);
    g.strokePath();
    // impact ring on the ground
    g.lineStyle(2, 0xffe066, 0.95);
    g.strokeCircle(cx, cy, radius);
    g.fillStyle(0xffe066, 0.16);
    g.fillCircle(cx, cy, radius);
    this.tweens.add({
      targets: g, alpha: 0,
      duration: 220,
      onComplete: () => g.destroy(),
    });
  }

  applyWhipStrike(p, angle, length, width, dmg) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const half = width / 2;
    for (const e of this.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      const fwd = cos * dx + sin * dy;
      const side = -sin * dx + cos * dy;
      if (fwd >= -e.size && fwd <= length + e.size && Math.abs(side) <= half + e.size) {
        const dealt = e.takeDamage(dmg, 'physical', this);
        if (p.ls > 0 && dealt > 0) p.hp = Math.min(p.maxHp, p.hp + dealt * p.ls);
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        e.vx += Math.cos(a) * 110;
        e.vy += Math.sin(a) * 110;
      }
    }
  }

  fxWhip(x, y, angle, length, width) {
    const g = this.add.graphics().setDepth(13);
    g.x = x; g.y = y;
    g.rotation = angle;
    g.fillStyle(0xd4a4ff, 0.32);
    g.fillRect(0, -width / 2, length, width);
    g.fillStyle(0xffeeff, 0.7);
    g.fillRect(0, -2.5, length, 5);
    g.lineStyle(2, 0xc77dff, 0.85);
    g.strokeRect(0, -width / 2, length, width);
    // tip flare
    g.fillStyle(0xffeeff, 0.85);
    g.fillCircle(length, 0, 5);
    this.tweens.add({
      targets: g, alpha: 0,
      duration: 220,
      onComplete: () => g.destroy(),
    });
  }

  fxSwordSlash(x, y, angle, arc, radius, second = false) {
    const g = this.add.graphics().setDepth(13);
    g.x = x; g.y = y;
    const start = angle - arc / 2;
    const end = angle + arc / 2;
    g.fillStyle(second ? 0xffaadd : 0xffd0e0, 0.32);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, radius, start, end, false);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, second ? 0xff6688 : 0xffaacc, 1);
    g.beginPath();
    g.arc(0, 0, radius, start, end, false);
    g.strokePath();
    // inner highlight
    g.lineStyle(1.5, 0xffffff, 0.7);
    g.beginPath();
    g.arc(0, 0, radius * 0.85, start, end, false);
    g.strokePath();
    this.tweens.add({
      targets: g, alpha: 0, scale: 1.15,
      duration: 220,
      onComplete: () => g.destroy(),
    });
  }

  shake(intensity = 0.004, durationMs = 120) {
    this.cameras.main.shake(durationMs, intensity);
  }

  fxDamage(x, y, dmg, isCrit = false) {
    const value = Math.round(dmg);
    if (value <= 0) return;
    const t = this.add.text(x, y - 18, isCrit ? `${value}!` : `${value}`, {
      fontFamily: "'Cinzel', serif",
      fontSize: isCrit ? '22px' : '15px',
      color: isCrit ? '#ffe066' : '#ffffff',
      stroke: '#1a0030',
      strokeThickness: 3,
      fontStyle: isCrit ? 'bold' : 'normal',
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      scale: isCrit ? 1.4 : 1,
      duration: 700,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }

  fxBolt(x1, y1, x2, y2) {
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(2, 0xffe066, 1);
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 28;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 28;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(mx, my);
    g.lineTo(x2, y2);
    g.strokePath();
    this.tweens.add({
      targets: g, alpha: 0,
      duration: 180,
      onComplete: () => g.destroy(),
    });
  }

  generateDecor() {
    const list = [];
    const TILE = 220;
    for (let x = TILE / 2; x < this.W; x += TILE) {
      for (let y = TILE / 2; y < this.H; y += TILE) {
        let h = ((x | 0) * 73856093) ^ ((y | 0) * 19349663);
        h = (h ^ (h >>> 13)) * 1274126177;
        h = h ^ (h >>> 16);
        const r = ((h >>> 0) % 1000) / 1000;
        if (r < 0.55) {
          const type = ((h >>> 8) & 3);
          const ox = (((h >>> 4) & 0x3f) - 32) * 1.8;
          const oy = (((h >>> 12) & 0x3f) - 32) * 1.8;
          list.push({ x: x + ox, y: y + oy, type, hash: h });
        }
      }
    }
    return list;
  }

  drawBg() {
    const g = this.bgGfx;
    g.clear();
    const t = this.elapsed;

    // Hex grid — fixed in world space (no parallax to avoid the floor-glide illusion)
    g.lineStyle(1, 0x3c005f, 0.10);
    for (let x = 0; x < this.W + 80; x += 80) {
      for (let y = 0; y < this.H + 70; y += 70) {
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

    // Decorations (fixed positions, generated once per scene/resize)
    for (const d of this.decorations) drawDecor(g, d.x, d.y, d.type, d.hash);

    // Mist — animated (movement is intentional, slow ambient drift)
    g.fillStyle(0x4a0a80, 0.07);
    for (let i = 0; i < 5; i++) {
      const fx = (this.W * 0.5) + Math.cos(t * 0.05 + i * 1.7) * (this.W * 0.45);
      const fy = (this.H * 0.5) + Math.sin(t * 0.04 + i * 2.3) * (this.H * 0.45);
      g.fillCircle(fx, fy, 130 + Math.sin(t * 0.3 + i) * 30);
    }
    g.fillStyle(0x1a0040, 0.06);
    for (let i = 0; i < 3; i++) {
      const fx = (this.W * 0.5) + Math.cos(t * 0.07 + i * 3.1) * (this.W * 0.5);
      const fy = (this.H * 0.5) + Math.sin(t * 0.08 + i * 1.5) * (this.H * 0.5);
      g.fillCircle(fx, fy, 200);
    }
  }

  drawOrbits(p) {
    const g = this.orbitGfx;
    g.clear();
    const olv = slv(p, 'orbit');
    if (olv <= 0) return;
    const radius = olv >= 4 ? 90 : 70;
    for (let i = 0; i < olv; i++) {
      const a = this.orbitAngle + (i / olv) * Math.PI * 2;
      const x = p.x + Math.cos(a) * radius;
      const y = p.y + Math.sin(a) * radius;
      // halo
      g.fillStyle(0xb894ff, 0.18);
      g.fillCircle(x, y, 18);
      g.fillStyle(0xc77dff, 0.45);
      g.fillCircle(x, y, 12);
      // core
      g.fillStyle(0xe0aaff, 1);
      g.fillCircle(x, y, 8);
      // highlight
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(x - 2, y - 2, 3);
    }
    // faint orbit ring
    g.lineStyle(1, 0xb894ff, 0.12);
    g.strokeCircle(p.x, p.y, radius);
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
