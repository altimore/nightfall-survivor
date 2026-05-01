import Phaser from 'phaser';
import { GOAL_TIME } from '../config.js';
import { Player, Enemy, Projectile, EnemyProjectile, ChargedBolt, Boomerang, IceRing, XpOrb, Item, TrailTile, TrapMine, Minion, Turret, HomingMissile, FloatingBlade, Grenade, StormCloud, Nest, Obstacle, CONTROLLER_SOLO, CONTROLLER_P1, CONTROLLER_P2, CONTROLLER_P3, CONTROLLER_P4 } from '../entities.js';
import { slv, xpFor, getChoices, refreshStats, WAVES, ITEMS, ITEM_DURATIONS, ITEM_KEYS, ETYPES, ENEMY_DROPS, BIOMES } from '../data.js';
import { initAudio, playSfx, startMusic, stopMusic, setMuted, playBossWarning } from '../audio.js';
import { bus } from '../bus.js';
import { getOptions } from '../PhaserGame.js';
import { applyMetaToPlayer, addGold, recordRun } from '../meta.js';
import { CHARACTERS } from '../characters.js';
import { checkAchievements, ACHIEVEMENTS } from '../achievements.js';
import { recordDaily } from '../daily.js';

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
function drawDecor(g, cx, cy, type, hash, biomeId) {
  const variant = (hash >>> 16) & 0xff;
  if (biomeId === 'forest') {
    switch (type) {
      case 0: drawDeadTree(g, cx, cy, variant); break;
      case 1: drawDeadTree(g, cx, cy, variant); break;
      case 2: drawMushroom(g, cx, cy, variant); break;
      default: drawStones(g, cx, cy, variant);
    }
    return;
  }
  if (biomeId === 'dungeon') {
    switch (type) {
      case 0: drawBrokenPillar(g, cx, cy, variant); break;
      case 1: drawTorch(g, cx, cy, variant); break;
      case 2: drawStones(g, cx, cy, variant); break;
      default: drawBrokenPillar(g, cx, cy, variant);
    }
    return;
  }
  if (biomeId === 'abyss') {
    switch (type) {
      case 0: drawCrystal(g, cx, cy, variant); break;
      case 1: drawVoidRift(g, cx, cy, variant); break;
      case 2: drawCrystal(g, cx, cy, variant); break;
      default: drawStones(g, cx, cy, variant);
    }
    return;
  }
  // cemetery (default)
  switch (type) {
    case 0: drawCross(g, cx, cy, variant); break;
    case 1: drawTombstone(g, cx, cy, variant); break;
    case 2: drawDeadTree(g, cx, cy, variant); break;
    default: drawStones(g, cx, cy, variant);
  }
}

// Forest mushroom : red cap with white spots
function drawMushroom(g, cx, cy, v) {
  const h = 14 + (v & 0x07);
  g.fillStyle(0x000000, 0.3); g.fillEllipse(cx, cy + 4, 14, 4);
  // stem
  g.fillStyle(0xd8c8a8, 0.85); g.fillRect(cx - 2, cy - h, 4, h);
  // cap
  g.fillStyle(0x8a1a1a, 0.85); g.fillEllipse(cx, cy - h, 18, 9);
  // spots
  g.fillStyle(0xfff0d8, 0.85);
  g.fillCircle(cx - 4, cy - h - 1, 1.5);
  g.fillCircle(cx + 4, cy - h, 1.4);
  g.fillCircle(cx - 1, cy - h + 2, 1);
}

// Dungeon broken pillar : stacked stones + cracked top
function drawBrokenPillar(g, cx, cy, v) {
  const h = 22 + (v & 0x0f);
  g.fillStyle(0x000000, 0.35); g.fillEllipse(cx, cy + 5, 20, 5);
  g.fillStyle(0x4a3a2a, 0.85);
  g.fillRect(cx - 8, cy - 6, 16, 6); // base
  g.fillStyle(0x6a5a3a, 0.7);
  g.fillRect(cx - 7, cy - h * 0.5, 14, 6); // mid
  g.fillStyle(0x4a3a2a, 0.65);
  g.fillRect(cx - 6, cy - h, 12, 6); // top broken
  // crack
  g.lineStyle(1, 0x222218, 0.6);
  g.beginPath(); g.moveTo(cx - 4, cy - h + 2); g.lineTo(cx + 3, cy - h + 6); g.strokePath();
}

// Dungeon torch : pole + flame
function drawTorch(g, cx, cy, v) {
  const h = 26 + (v & 0x0f);
  g.fillStyle(0x000000, 0.35); g.fillEllipse(cx, cy + 4, 10, 3);
  g.fillStyle(0x2a1810, 0.85); g.fillRect(cx - 1.5, cy - h, 3, h);
  // flame
  const flick = (v & 0x07) / 7;
  g.fillStyle(0xff6633, 0.7);
  g.fillTriangle(cx - 4, cy - h + 2, cx, cy - h - 7 - flick * 2, cx + 4, cy - h + 2);
  g.fillStyle(0xffaa44, 0.95);
  g.fillTriangle(cx - 2.5, cy - h + 1, cx, cy - h - 5 - flick, cx + 2.5, cy - h + 1);
}

// Abyss crystal : floating tinted shard
function drawCrystal(g, cx, cy, v) {
  const h = 16 + (v & 0x0f);
  g.fillStyle(0x000000, 0.3); g.fillEllipse(cx, cy + 4, 12, 3);
  g.fillStyle(0x4438aa, 0.85);
  g.fillTriangle(cx - 6, cy - 3, cx + 6, cy - 3, cx, cy - h);
  g.fillStyle(0x8870ff, 0.7);
  g.fillTriangle(cx - 3, cy - 6, cx + 3, cy - 6, cx, cy - h + 2);
  // glow
  g.lineStyle(1, 0xa090ff, 0.55);
  g.strokeCircle(cx, cy - h * 0.55, h * 0.55);
}

// Abyss void rift : dark cloud + purple core
function drawVoidRift(g, cx, cy, v) {
  const r = 14 + (v & 0x07);
  g.fillStyle(0x000000, 0.55);
  g.fillEllipse(cx, cy, r * 1.3, r);
  g.fillStyle(0x180828, 0.9);
  g.fillEllipse(cx, cy, r, r * 0.7);
  // sparkles
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx + Math.sin(v) * r * 0.6, cy + Math.cos(v) * r * 0.5, 0.9);
  g.fillCircle(cx - Math.sin(v * 1.3) * r * 0.5, cy - Math.cos(v * 1.7) * r * 0.4, 0.9);
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
    this.radarGfx = this.add.graphics().setDepth(50);
    this.orbitGfx = this.add.graphics().setDepth(14);
    this.joyGfx = this.add.graphics().setDepth(50);

    this.decorations = this.generateDecor();
    this.scale.on('resize', () => { this.decorations = this.generateDecor(); });

    const opts = getOptions();
    const charId = opts.character || 'vampire';
    const ch = CHARACTERS[charId] || CHARACTERS.vampire;
    const startW = opts.startWeapon || ch.starterWeapon || 'dagger';
    const startW2 = opts.startWeapon2 || startW;
    const num = Math.max(1, Math.min(4, opts.numPlayers || 1));
    this.mode = opts.mode || 'normal';
    this.biomeId = opts.biome && BIOMES[opts.biome] ? opts.biome : 'cemetery';
    this.biome = BIOMES[this.biomeId];

    const initPlayer = (p, weapon) => {
      p.skills = { [weapon]: 1 };
      p.character = charId;
      applyMetaToPlayer(p);
      // Character class bonuses applied AFTER meta to layer on top
      if (ch?.apply) ch.apply(p);
    };

    this.players = [];
    if (num === 1) {
      const p = new Player(this, this.W / 2, this.H / 2, 0, CONTROLLER_SOLO);
      initPlayer(p, startW);
      this.players.push(p);
    } else {
      const controllers = [CONTROLLER_P1, CONTROLLER_P2, CONTROLLER_P3, CONTROLLER_P4];
      const startWeapons = [startW, startW2, startW, startW2];
      // Spread spawns in a small ring around center.
      for (let i = 0; i < num; i++) {
        const ang = (i / num) * Math.PI * 2 - Math.PI / 2;
        const r = 70;
        const px = this.W / 2 + Math.cos(ang) * r;
        const py = this.H / 2 + Math.sin(ang) * r;
        const p = new Player(this, px, py, i, controllers[i]);
        initPlayer(p, startWeapons[i]);
        this.players.push(p);
      }
    }
    if (this.mode === 'oneShot') {
      for (const p of this.players) {
        p.maxHp = 1; p.hp = 1; p.dmgM = 100;
      }
    }
    // Track gold accumulated this run (added to permanent total on game over/victory).
    this.runGold = 0;
    this.bossKills = 0;
    this.dpsHistory = [];
    this.dpsSampleT = 0;
    this.player = this.players[0];
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
    this.missiles = [];
    this.floating = [];
    this.grenades = [];
    this.clouds = [];
    this.chargedBolts = [];
    this.boomerangs = [];
    this.iceRings = [];
    this.nests = [];
    this.nestSpawnT = 25;
    this.treasureT = 30 + Math.random() * 15;
    // Damage tracking per weapon (cumulative output, not perfectly accurate but
    // good enough to compare which build worked best).
    this.damageStats = {};
    this.obstacles = [];
    this.trail = [];
    this.traps = [];
    this.minions = [];
    this.gatherers = [];
    this.turrets = [];
    this.waveIdx = 0;
    // Dynamic difficulty: 1.0 = neutral, >1 spawn more, <1 spawn less. Adjusts based on player state.
    this.tension = 1.0;
    // Combo / killstreak: increments on every kill, decays after a short window without kills.
    this.comboCount = 0;
    this.comboT = 0;
    this.comboPeak = 0;
    this.bossWarningSent = new Set();
    this.bossMusicOn = false;
    this.bossSeen = new Set(); // enemy refs already announced
    this.over = false;
    this.paused = false;
    this.hitstop = 0;
    this.hudT = 0;

    this.keys = this.input.keyboard.addKeys('W,A,S,D,Z,Q,UP,DOWN,LEFT,RIGHT,ENTER,SHIFT,NUMPAD_ZERO');
    this.input.keyboard.addKey('SPACE').on('down', () => this.tryDashFor(this.players[0]));
    this.input.keyboard.addKey('ENTER').on('down', () => { if (this.players[1]) this.tryDashFor(this.players[1]); });
    this.input.keyboard.addKey('NUMPAD_ZERO').on('down', () => { if (this.players[1]) this.tryDashFor(this.players[1]); });

    this.joystick = { active: false, id: null, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0, dx: 0, dy: 0 };
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.offRestart = bus.on('game:restart', () => this.scene.restart());
    this.offMute    = bus.on('game:mute', m => { setMuted(m); if (!m) startMusic(); });
    this.offPick    = bus.on('skill:pick', id => this.onSkillPick(id));
    this.offReroll  = bus.on('skill:reroll', () => this.onSkillReroll());
    this.offBanish  = bus.on('skill:banish', id => this.onSkillBanish(id));
    this.offEndless = bus.on('endless:continue', () => this.onEndlessContinue());
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
      this.offReroll?.();
      this.offBanish?.();
      this.offEndless?.();
      this.offPause?.();
      stopMusic();
    });

    this.emitHud();
  }

  // Get the active player joystick state (player[0] in solo).
  // We also mirror state into this.joystick for the on-screen visual drawer.
  _activeJoystick() {
    const pl = this.players?.[0];
    return pl?.joystick || this.joystick;
  }

  onPointerDown(p) {
    if (this.over || this.paused) return;
    const j = this._activeJoystick();
    if (!j) return;
    if (!j.active) {
      j.active = true; j.id = p.id;
      j.baseX = p.x; j.baseY = p.y;
      j.thumbX = p.x; j.thumbY = p.y;
      j.dx = 0; j.dy = 0;
      // mirror to scene joystick (legacy visual)
      this.joystick.active = true; this.joystick.id = p.id;
      this.joystick.baseX = p.x; this.joystick.baseY = p.y;
      this.joystick.thumbX = p.x; this.joystick.thumbY = p.y;
    } else if (p.id !== j.id) {
      this.tryDashFor(this.players[0]);
    }
  }
  onPointerMove(p) {
    const j = this._activeJoystick();
    if (!j || !j.active || p.id !== j.id) return;
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
    // mirror to scene joystick visual
    this.joystick.thumbX = j.thumbX; this.joystick.thumbY = j.thumbY;
    this.joystick.dx = j.dx; this.joystick.dy = j.dy;
  }
  onPointerUp(p) {
    const j = this._activeJoystick();
    if (j && p.id === j.id) { j.active = false; j.id = null; j.dx = 0; j.dy = 0; }
    if (p.id === this.joystick.id) { this.joystick.active = false; this.joystick.id = null; this.joystick.dx = 0; this.joystick.dy = 0; }
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
    // Endless mode multiplier — each tier of "Continue after victory" stacks on top.
    if (this.endless) {
      const eTier = this.endlessTier || 1;
      hpMul *= 1 + eTier * 0.6;
      dmgMul *= 1 + eTier * 0.3;
    }
    // Elite chance: ~4% on regular enemies after the 30s mark (never boss/treasure)
    const eligibleElite = typeName !== 'boss' && typeName !== 'treasure' && this.elapsed > 30;
    const elite = eligibleElite && Math.random() < 0.04;
    if (elite) { hpMul *= 3; dmgMul *= 1.5; }
    const e = new Enemy(this, x, y, typeName, hpMul, 1, dmgMul);
    if (elite) {
      e.elite = true;
      e.xpVal = (e.xpVal || 1) * 3;
      // Slightly faster too
      if (typeof e.speed === 'number') e.speed *= 1.2;
    }
    if (typeName === 'boss') {
      const kinds = {
        shadow:   { col: 0x8b0000, eyeCol: 0xffff00, projCol: 0xff4400, move: 'standard', label: "Carcassemort" },
        frost:    { col: 0x4a78a8, eyeCol: 0xc0e0ff, projCol: 0x88ccff, move: 'orbiter',  label: "L'Hiver Maudit" },
        inferno:  { col: 0xa83018, eyeCol: 0xffaa00, projCol: 0xff8800, move: 'charger',  label: "Brasier Éternel" },
        void:     { col: 0x4a1a8a, eyeCol: 0xff00ff, projCol: 0xb088ff, move: 'phasing',  label: "L'Abime Sans Fond" },
        summoner: { col: 0x4a8030, eyeCol: 0xc8ff80, projCol: 0x88ff66, move: 'standard', label: "Marionnettiste Maudit" },
        phoenix:  { col: 0xff7700, eyeCol: 0xffe066, projCol: 0xffaa44, move: 'charger',  label: "Phénix Funeste" },
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

  spawnTreasure() {
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    if (side === 0) { x = -30; y = 80 + Math.random() * (this.H - 160); dx = 1; dy = (Math.random() - 0.5) * 0.4; }
    else if (side === 1) { x = this.W + 30; y = 80 + Math.random() * (this.H - 160); dx = -1; dy = (Math.random() - 0.5) * 0.4; }
    else if (side === 2) { x = 80 + Math.random() * (this.W - 160); y = -30; dx = (Math.random() - 0.5) * 0.4; dy = 1; }
    else { x = 80 + Math.random() * (this.W - 160); y = this.H + 30; dx = (Math.random() - 0.5) * 0.4; dy = -1; }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const e = new Enemy(this, x, y, 'treasure', 1, 1, 1);
    e.treasureDx = dx;
    e.treasureDy = dy;
    e.lifetime = 9;
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

  // Roll the per-enemy loot table; each entry rolls independently. Drops are spawned around (x,y).
  // Drop chance and XP burst scale with enemy xpVal (tougher enemies = better loot).
  rollDrops(enemyType, x, y, mul = 1) {
    const table = ENEMY_DROPS[enemyType];
    const et = ETYPES[enemyType];
    // Tier boost based on enemy XP value: bat(1)=0.5, zombie(3)=0.87,
    // skeleton(4)=1, ghost(4)=1, witch(5)=1.12, knight(7)=1.32, boss(60)=3.87
    const tierBoost = et ? Math.max(0.5, Math.sqrt(et.xpVal) / 2) : 1;
    if (table && table.length > 0) {
      for (const entry of table) {
        if (Math.random() < entry.chance * mul * tierBoost) {
          const a = Math.random() * Math.PI * 2;
          const d = 8 + Math.random() * 18;
          this.items.push(new Item(this, x + Math.cos(a) * d, y + Math.sin(a) * d, entry.item));
        }
      }
    }
    // Tough enemies (xpVal >= 5) sometimes burst additional XP orbs.
    if (et && et.xpVal >= 5 && Math.random() < 0.35) {
      const value = Math.max(1, Math.ceil(et.xpVal * 0.4));
      const count = et.xpVal >= 10 ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 12 + Math.random() * 16;
        this.orbs.push(new XpOrb(this, x + Math.cos(a) * d, y + Math.sin(a) * d, value));
      }
    }
  }

  // Boss chest: bursts a circle of guaranteed buff items around the boss kill point.
  dropBossChest(x, y) {
    const goodies = ['megaheal', 'rage', 'shield', 'damageBuff'];
    // Pick 2-3 unique items from the goodie pool
    const pool = [...goodies];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = 2 + (Math.random() < 0.5 ? 1 : 0);
    const picks = pool.slice(0, count);
    // Add a magnet to ensure XP cleanup feel
    picks.push('magnet');
    const r = 36;
    picks.forEach((id, i) => {
      const a = (i / picks.length) * Math.PI * 2;
      this.items.push(new Item(this, x + Math.cos(a) * r, y + Math.sin(a) * r, id));
    });
    this.fxNova(x, y, 70);
  }

  emitRunStats() {
    const playersInfo = this.players.map(pl => ({
      id: pl.id, level: pl.level, kills: pl.kills, dead: pl.dead, tint: pl.tint,
      skills: { ...pl.skills },
    }));
    // Persist this run's gold to the permanent meta total.
    const goldEarned = Math.floor(this.runGold || 0);
    let totalGold = goldEarned;
    if (goldEarned > 0) {
      totalGold = addGold(goldEarned);
    }
    // Record stats for the run (kills, time, gold, combo, evolutions count, victory flag)
    const evolutionsCount = this.players.reduce((acc, pl) => acc + ((pl.evolved instanceof Set) ? pl.evolved.size : 0), 0);
    const victory = !!this.victoryClaimed;
    const runRecord = {
      kills: this.kills,
      time: Math.floor(this.elapsed),
      goldEarned,
      combo: this.comboPeak || 0,
      evolutions: evolutionsCount,
      bossKills: this.bossKills || 0,
      endlessTier: this.endlessTier || 0,
      victory,
    };
    const updatedStats = recordRun(runRecord);
    // Daily challenge tracking
    const opts = getOptions();
    if (opts?.daily) recordDaily(runRecord);
    // Check for newly-unlocked achievements
    const newAchievements = checkAchievements(updatedStats, runRecord);
    for (const aId of newAchievements) {
      const def = ACHIEVEMENTS[aId];
      if (def) bus.emit('achievement', { id: aId, name: def.name, icon: def.icon, desc: def.desc });
    }
    bus.emit('runStats', {
      damageStats: { ...(this.damageStats || {}) },
      kills: this.kills,
      time: Math.floor(this.elapsed),
      goal: GOAL_TIME,
      goldEarned,
      goldTotal: totalGold,
      bestCombo: this.comboPeak || 0,
      dpsHistory: [...(this.dpsHistory || [])],
      players: playersInfo,
    });
  }

  emitHud() {
    const p = this.player;
    const playersInfo = this.players.map(pl => ({
      id: pl.id,
      hp: Math.floor(pl.hp),
      maxHp: pl.maxHp,
      xp: pl.xp,
      xpN: xpFor(pl.level),
      lv: pl.level,
      kills: pl.kills,
      dead: pl.dead,
      tint: pl.tint,
    }));
    const bosses = [];
    for (const e of this.enemies) {
      if (e.type === 'boss') bosses.push({ name: e.name || 'BOSS', hp: Math.floor(e.hp), maxHp: e.maxHp });
    }
    const cooldowns = {};
    const r01 = (t, max) => Math.max(0, Math.min(1, 1 - t / max));
    if (slv(p, 'dagger') > 0) cooldowns.dagger = r01(p.weaponT.dagger, slv(p, 'dagger') >= 3 ? 0.45 : 0.8);
    if (slv(p, 'sword') > 0) {
      const lv = slv(p, 'sword');
      cooldowns.sword = r01(p.weaponT.sword, lv >= 5 ? 0.5 : lv >= 2 ? 0.85 : 1.1);
    }
    if (slv(p, 'whip') > 0) {
      const lv = slv(p, 'whip');
      cooldowns.whip = r01(p.weaponT.whip, lv >= 5 ? 0.6 : lv >= 3 ? 0.85 : 1.0);
    }
    if (slv(p, 'nova') > 0) {
      const lv = slv(p, 'nova');
      cooldowns.nova = r01(p.weaponT.nova, lv >= 4 ? 1.2 : 2);
    }
    if (slv(p, 'lightning') > 0) {
      const lv = slv(p, 'lightning');
      cooldowns.lightning = r01(p.weaponT.lightning, lv >= 5 ? 0.4 : lv >= 3 ? 0.8 : 1.5);
    }
    if (slv(p, 'charm') > 0) {
      const lv = slv(p, 'charm');
      cooldowns.charm = r01(p.weaponT.charm, lv >= 5 ? 5 : 8);
    }
    if (slv(p, 'missile') > 0) {
      const lv = slv(p, 'missile');
      cooldowns.missile = r01(p.weaponT.missile, lv >= 5 ? 0.8 : 1.2);
    }
    if (slv(p, 'grenade') > 0) cooldowns.grenade = r01(p.weaponT.grenade, 2);
    if (slv(p, 'traps') > 0) {
      const lv = slv(p, 'traps');
      cooldowns.traps = r01(p.trapT, lv >= 5 ? 1.5 : lv >= 4 ? 2 : 3);
    }
    if (slv(p, 'summon') > 0) {
      const lv = slv(p, 'summon');
      cooldowns.summon = r01(p.minionT, lv >= 5 ? 4 : 6);
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
      dps: Math.round(this.computeDps ? this.computeDps() : 0),
      combo: this.comboCount || 0,
      comboT: this.comboT || 0,
      reviveLeft: p.metaReviveLeft || 0,
      endless: this.endless ? (this.endlessTier || 1) : 0,
      runGold: this.runGold || 0,
      players: playersInfo,
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
    const speedBoost = (this.buffs.speed > 0 ? 2 : 1) * (this.buffs.curseSlowness > 0 ? 0.5 : 1);
    // Combo bonus: +0.5% damage per kill in the active streak, capped at +50% (= 100 kills).
    const comboBonus = 1 + Math.min(0.5, (this.comboCount || 0) * 0.005);
    const dmgBoost = (this.buffs.rage > 0 ? 2 : 1) * (this.buffs.damageBuff > 0 ? 1.5 : 1) * (this.buffs.curseWeakness > 0 ? 0.5 : 1) * comboBonus;
    const freezeMult = (this.buffs.freeze > 0 ? 0.25 : 1) * (this.buffs.curseHaste > 0 ? 1.5 : 1) * (this.buffs.timeStop > 0 ? 0 : 1);
    const shielded = this.buffs.shield > 0;
    const regenBuff = this.buffs.regen > 0 ? 8 : 0;
    this.confused = this.buffs.curseConfusion > 0;
    this.fragility = this.buffs.curseFragility > 0 ? 2 : 1;

    // ── Buffs tick down
    for (const k in this.buffs) {
      if (this.buffs[k] > 0) this.buffs[k] -= dt;
      if (this.buffs[k] <= 0) this.buffs[k] = 0;
    }
    // Elemental override (one active at a time, priority Fire > Ice > Lightning > Poison)
    if (this.buffs.elementFire > 0) this.elementOverride = 'fire';
    else if (this.buffs.elementIce > 0) this.elementOverride = 'ice';
    else if (this.buffs.elementLightning > 0) this.elementOverride = 'lightning';
    else if (this.buffs.elementPoison > 0) this.elementOverride = 'poison';
    else this.elementOverride = null;

    // ── Movement (per player, with their own controller)
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pl of this.players) {
      if (pl.dead) continue;
      this.updatePlayerMovement(dt, pl, speedBoost, regenBuff, pads);
    }

    // ── Revive: a downed player who has a living teammate within 80 px revives
    // after 3 s with 50 % HP. Outside the range the timer slowly drains.
    if (this.players.length > 1) {
      for (const pl of this.players) {
        if (!pl.dead) continue;
        let nearAlly = false;
        for (const o of this.players) {
          if (o === pl || o.dead) continue;
          if (Math.hypot(o.x - pl.x, o.y - pl.y) < 80) { nearAlly = true; break; }
        }
        if (nearAlly) {
          pl.reviveT = (pl.reviveT || 0) + dt;
          if (pl.reviveT >= 3) {
            pl.dead = false;
            pl.hp = Math.max(1, Math.floor(pl.maxHp * 0.5));
            pl.reviveT = 0;
            pl.iframes = 1.5;
            this.fxNova(pl.x, pl.y, 60);
            this.shake(0.005, 100);
            playSfx('levelup');
          }
        } else {
          pl.reviveT = Math.max(0, (pl.reviveT || 0) - dt * 0.5);
        }
      }
    }

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

    // ── Combo decay
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) { this.comboCount = 0; this.comboT = 0; }
    }

    // ── Sample DPS every ~3 seconds for the end-of-run chart.
    this.dpsSampleT = (this.dpsSampleT || 0) - dt;
    if (this.dpsSampleT <= 0) {
      this.dpsSampleT = 3;
      const dps = Math.round(this.computeDps ? this.computeDps() : 0);
      this.dpsHistory.push({ t: Math.floor(this.elapsed), dps });
      // Cap to avoid unbounded growth on endless
      if (this.dpsHistory.length > 200) this.dpsHistory.shift();
    }

    // ── Dynamic difficulty ─ scale spawn rate based on player state.
    // Increase tension when player is comfortable (high HP, few enemies).
    // Decrease tension when player is struggling (low HP, many enemies).
    {
      const enemyCount = this.enemies.filter(e => !e.charmed && e.type !== 'treasure').length;
      const hpFrac = p.maxHp > 0 ? p.hp / p.maxHp : 1;
      let target = 1.0;
      if (hpFrac > 0.85 && enemyCount < 12) target = 1.6;       // chill → ramp up
      else if (hpFrac > 0.7 && enemyCount < 25) target = 1.2;
      else if (hpFrac < 0.3 || enemyCount > 60) target = 0.55;   // overwhelmed → ease off
      else if (hpFrac < 0.5 || enemyCount > 45) target = 0.8;
      // Smooth toward target (lerp).
      const k = 1 - Math.exp(-0.6 * dt);
      this.tension += (target - this.tension) * k;
    }

    // ── Continuous spawn (mode-specific)
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      if (this.mode === 'bossRush') {
        this.spawnT = 15;
        this.spawnEnemy('boss');
      } else {
        const baseInterval = this.mode === 'horde' ? 0.7 : 1.6;
        const tens = this.tension || 1;
        this.spawnT = Math.max(0.2, (baseInterval / tens) / (0.5 + this.elapsed / 90));
        const types = ['bat'];
        if (this.elapsed >= 30) types.push('zombie');
        if (this.elapsed >= 60) types.push('skeleton');
        if (this.elapsed >= 75) types.push('slime');
        if (this.elapsed >= 90) types.push('ghost');
        if (this.elapsed >= 120) types.push('knight');
        if (this.elapsed >= 130) types.push('wraith');
        if (this.elapsed >= 150) types.push('witch');
        if (this.elapsed >= 165) types.push('vampire');
        // Biome bias : 60% chance to favor unlocked biome enemies
        const favored = (this.biome?.favored || []).filter(t => types.includes(t));
        const pool = (favored.length > 0 && Math.random() < 0.6) ? favored : types;
        this.spawnEnemy(pool[Math.floor(Math.random() * pool.length)]);
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

    // ── Enemy AI + collision (vs. closest alive player, minions, charmed allies)
    for (const e of this.enemies) {
      // Enemy AI targets the closest alive player
      let aiTarget = p;
      let bestPd = Infinity;
      for (const pl of this.players) {
        if (pl.dead) continue;
        const d = Math.hypot(pl.x - e.x, pl.y - e.y);
        if (d < bestPd) { bestPd = d; aiTarget = pl; }
      }
      this.updateEnemyAi(dt, e, aiTarget, freezeMult);
      if (e.charmed) continue;
      // player hit (any alive player can be hit)
      for (const pl of this.players) {
        if (pl.dead) continue;
        if (!shielded && pl.iframes <= 0 && Math.hypot(e.x - pl.x, e.y - pl.y) < e.size + 14) {
          pl.hp -= e.dmg * this.fragility;
          pl.iframes = 0.9;
          playSfx('hit');
          this.shake(0.007, 130);
          this.comboCount = Math.floor((this.comboCount || 0) / 2);
          // Vampire enemy drains HP from the player on contact (heals itself)
          if (e.type === 'vampire') {
            const drain = Math.min(8, pl.hp > 0 ? 8 : 0);
            e.hp = Math.min(e.maxHp, e.hp + drain);
          }
        }
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

    // ── Player weapons (per player)
    for (const pl of this.players) {
      if (pl.dead) continue;
      this.firePlayerWeapons(dt, pl, dmgBoost);
      this.updateTrail(dt, pl, dmgBoost);
      this.updateTraps(dt, pl, dmgBoost);
      this.updateMinions(dt, pl);
      this.updateGatherers(dt, pl);
      this.updateTurrets(dt, pl, dmgBoost);
      this.updateMissiles(dt, pl);
      this.updateFloating(dt, pl, dmgBoost);
      this.updateGrenades(dt, pl);
      this.updateClouds(dt, pl, dmgBoost);
    }
    // Nests: shared (uses any alive player for spawn-distance check)
    this.updateNests(dt, this.players.find(pl => !pl.dead) || this.players[0]);

    // Charged bolts: shared list (each bolt remembers its source player)
    this.updateChargedBolts(dt);
    this.updateBoomerangs(dt);
    this.updateIceRings(dt);

    // Performance caps: drop oldest entities when arrays grow too large to
    // keep GC pressure manageable in endless / horde modes.
    const capArray = (arr, cap) => {
      if (arr.length <= cap) return arr;
      const drop = arr.length - cap;
      for (let i = 0; i < drop; i++) {
        const e = arr[i];
        if (e?.destroy) e.destroy();
      }
      return arr.slice(drop);
    };
    this.eprojectiles = capArray(this.eprojectiles, 180);
    this.orbs = capArray(this.orbs, 240);
    this.projectiles = capArray(this.projectiles, 180);

    // Treasure: occasional fast streak across the screen
    this.treasureT -= dt;
    if (this.treasureT <= 0) {
      this.treasureT = 32 + Math.random() * 20;
      this.spawnTreasure();
    }

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
          const dealt = this.dmgTo(e, proj.dmg, proj.type || 'physical', 'dagger', p);
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
            if (this.damageStats) this.damageStats.dagger = (this.damageStats.dagger || 0) + proj.dmg;
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
      // any alive player can be hit
      if (!shielded) {
        for (const pl of this.players) {
          if (pl.dead || pl.iframes > 0) continue;
          if (Math.hypot(ep.x - pl.x, ep.y - pl.y) < 15) {
            pl.hp -= ep.dmg * this.fragility;
            pl.iframes = 0.7;
            playSfx('hit');
            this.comboCount = Math.floor((this.comboCount || 0) / 2);
            ep.alive = false;
            break;
          }
        }
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
    // Orbs: any alive player can pull / pickup
    for (const pl of this.players) {
      if (pl.dead) continue;
      this.updateOrbs(dt, pl);
    }

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
        // Phénix : revive once at 50% HP with iframes + visual blast
        if (e.type === 'boss' && e.kind === 'phoenix' && !e.phoenixRevived) {
          e.phoenixRevived = true;
          e.hp = Math.floor(e.maxHp * 0.5);
          this.fxNova(e.x, e.y, 130);
          this.shake(0.012, 280);
          playSfx('boss');
          this.fxBanner('🔥 Renaissance ! 🔥', '#ffaa44', 24);
          return true;
        }
        // Summoner : on the first death-tick, summon 4 adds in a ring (one-shot)
        if (e.type === 'boss' && e.kind === 'summoner' && !e.summonedDeath) {
          e.summonedDeath = true;
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const ax = e.x + Math.cos(a) * 36, ay = e.y + Math.sin(a) * 36;
            const t = ['skeleton', 'wraith', 'witch', 'slime'][i % 4];
            this.enemies.push(new Enemy(this, ax, ay, t, 1.4, 1, 1));
          }
        }
        if (e.type === 'treasure') {
          // big bonus on kill: drop a burst of XP orbs
          const baseValue = Math.ceil((e.xpVal + this.elapsed / 10) * p.xpM);
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
            const r = 8 + Math.random() * 22;
            this.orbs.push(new XpOrb(this, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, baseValue));
          }
          this.fxNova(e.x, e.y, 50);
          this.shake(0.006, 120);
          playSfx('victory');
          // Treasure drops one guaranteed item from its loot table
          this.rollDrops(e.type, e.x, e.y, 1.0);
          // (no kill counter increment for the streak — pure loot)
        } else {
          this.kills++;
          if (p && p.id != null) p.kills = (p.kills || 0) + 1;
          playSfx(e.type === 'boss' ? 'boss' : 'death');
          const xpRushMul = (this.buffs?.xpRush || 0) > 0 ? 2 : 1;
          const value = Math.ceil((e.xpVal + this.elapsed / 10) * p.xpM * (p.metaXpMul || 1) * xpRushMul);
          this.orbs.push(new XpOrb(this, e.x, e.y, value));
          // Gold drop scales with enemy difficulty (× goldRush buff if active)
          const goldRushMul = (this.buffs?.goldRush || 0) > 0 ? 2 : 1;
          const goldGain = Math.max(1, Math.ceil((e.xpVal || 1) * 0.6 * (p.metaGoldMul || 1) * goldRushMul));
          this.runGold += goldGain;
          this.fxGoldPop(e.x, e.y, goldGain);
          // Combo / killstreak: bump count and refresh the decay window.
          this.comboCount = (this.comboCount || 0) + 1;
          this.comboT = 4; // 4-second window
          if (this.comboCount > (this.comboPeak || 0)) this.comboPeak = this.comboCount;
          if (p.kh) p.hp = Math.min(p.maxHp, p.hp + 8);
          this.fxDeath(e.x, e.y, ETYPES[e.type]?.col ?? 0xffffff);
          // Slime: split into 2 mini-slimes on death (only the original, not minis)
          if (e.type === 'slime' && !e.miniSplit) {
            for (let i = 0; i < 2; i++) {
              const a = (i === 0 ? -1 : 1) * 0.8;
              const child = new Enemy(this, e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, 'slime', 0.4, 1.3, 0.6);
              child.miniSplit = true;
              child.size = Math.floor(child.size * 0.7);
              child.maxHp = Math.max(8, child.maxHp);
              child.hp = child.maxHp;
              this.enemies.push(child);
            }
          }
          if (e.type === 'boss') {
            this.shake(0.012, 280);
            this.hitstop = 0.08;
            this.bossSeen.delete(e);
            this.bossKills = (this.bossKills || 0) + 1;
            // Boss death drops a "treasure chest" — multiple loot items spread out
            this.dropBossChest(e.x, e.y);
          } else if (e.elite) {
            // Elite enemies always drop a premium item + extra XP burst
            this.rollDrops(e.type, e.x, e.y, 3.0);
            const elitePool = ['megaheal', 'damageBuff', 'rage', 'shield', 'swiftness'];
            const pick = elitePool[Math.floor(Math.random() * elitePool.length)];
            this.items.push(new Item(this, e.x, e.y, pick));
            // Bonus gold for elites
            this.runGold += Math.ceil(8 * (p.metaGoldMul || 1));
            this.fxNova(e.x, e.y, 50);
            this.shake(0.006, 100);
            this.fxBanner('★ ÉLITE VAINCU ★', '#ffd966', 24);
            playSfx('eliteKill');
          } else {
            // Normal enemies roll their loot table
            this.rollDrops(e.type, e.x, e.y, 1.0);
          }
        }
        e.destroy();
        return false;
      }
      return true;
    });

    // ── End conditions: each player may die individually; the run ends only
    // when every player is down. Victory still triggers when the timer expires.
    for (const pl of this.players) {
      if (!pl.dead && pl.hp <= 0) {
        // Meta-progression "Seconde chance" auto-revive (consumes a charge)
        if ((pl.metaReviveLeft || 0) > 0) {
          pl.metaReviveLeft -= 1;
          pl.hp = Math.floor(pl.maxHp * 0.5);
          pl.iframes = 2.5;
          this.fxNova(pl.x, pl.y, 90);
          this.shake(0.01, 220);
          playSfx('victory');
          continue;
        }
        pl.hp = 0; pl.dead = true;
      }
    }
    const allDead = this.players.every(pl => pl.dead);
    if (allDead) {
      this.over = true;
      stopMusic(); playSfx('gameover');
      this.emitRunStats();
      bus.emit('phase', 'dead');
      this.emitHud();
    } else if (this.elapsed >= GOAL_TIME && !this.victoryClaimed) {
      this.victoryClaimed = true;
      this.over = true;
      stopMusic(); playSfx('victory');
      this.emitRunStats();
      bus.emit('phase', 'victory');
      this.emitHud();
    }

    // ── Render
    this.drawBg();
    this.drawRadar();
    for (const t of this.trail) t.redraw();
    for (const tr of this.traps) tr.redraw();
    for (const n of this.nests) n.redraw();
    for (const o of this.obstacles) o.redraw();
    for (const tu of this.turrets) tu.redraw();
    for (const pl of this.players) pl.redraw();
    for (const it of this.items) it.redraw();
    for (const e of this.enemies) e.redraw();
    for (const m of this.minions) m.redraw();
    for (const g of this.gatherers) g.redraw();
    for (const proj of this.projectiles) proj.redraw();
    for (const m of this.missiles) m.redraw();
    for (const b of this.floating) b.redraw();
    for (const gr of this.grenades) gr.redraw();
    for (const c of this.clouds) c.redraw();
    for (const cb of this.chargedBolts) cb.redraw();
    for (const bm of this.boomerangs) bm.redraw();
    for (const ir of this.iceRings) ir.redraw();
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
    } else if (type === 'timeStop') {
      // Instant freeze of all enemies for 3 seconds (handled via buffs.timeStop in freezeMult)
      this.buffs.timeStop = 3;
      this.fxNova(p.x, p.y, Math.max(this.W, this.H) * 0.7);
      this.shake(0.008, 200);
      playSfx('lightning');
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

  updatePlayerMovement(dt, p, speedBoost, regenBuff, pads) {
    let mx = 0, my = 0;
    if (p.joystick && p.joystick.active) {
      mx += p.joystick.dx || 0;
      my += p.joystick.dy || 0;
    }
    const k = this.keys;
    for (const key of p.controller.keys.left) if (k[key]?.isDown) mx -= 1;
    for (const key of p.controller.keys.right) if (k[key]?.isDown) mx += 1;
    for (const key of p.controller.keys.up) if (k[key]?.isDown) my -= 1;
    for (const key of p.controller.keys.down) if (k[key]?.isDown) my += 1;
    // Gamepad: only the pad whose index matches this player's controller
    const pad = pads && pads[p.controller.gamepadIndex];
    if (pad) {
      const ax = pad.axes[0] || 0;
      const ay = pad.axes[1] || 0;
      if (Math.abs(ax) > 0.2) mx += ax;
      if (Math.abs(ay) > 0.2) my += ay;
      if (pad.buttons[14]?.pressed) mx -= 1;
      if (pad.buttons[15]?.pressed) mx += 1;
      if (pad.buttons[12]?.pressed) my -= 1;
      if (pad.buttons[13]?.pressed) my += 1;
      const a = pad.buttons[0]?.pressed;
      p.gpPrev = p.gpPrev || {};
      const prev = p.gpPrev[pad.index] || {};
      if (a && !prev.a) this.tryDashFor(p);
      p.gpPrev[pad.index] = { a };
    }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (this.confused) { mx = -mx; my = -my; }
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
  }

  tryDashFor(p) {
    if (this.over || this.paused || !p || p.dead) return;
    if (!p.canDash || p.dashCD > 0 || p.dashDur > 0) return;
    let dx = 0, dy = 0;
    if (p.joystick && p.joystick.active) { dx += p.joystick.dx; dy += p.joystick.dy; }
    const k = this.keys;
    for (const key of p.controller.keys.left) if (k[key]?.isDown) dx -= 1;
    for (const key of p.controller.keys.right) if (k[key]?.isDown) dx += 1;
    for (const key of p.controller.keys.up) if (k[key]?.isDown) dy -= 1;
    for (const key of p.controller.keys.down) if (k[key]?.isDown) dy += 1;
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
        const cover = this.coverPositionFor(e, p);
        if (cover) {
          const dx2 = cover.x - e.x, dy2 = cover.y - e.y;
          const d2 = Math.hypot(dx2, dy2) || 1;
          tvx = (dx2 / d2) * e.speed * 0.8 * sf;
          tvy = (dy2 / d2) * e.speed * 0.8 * sf;
        } else {
          tvx = ndx * e.speed * 0.6 * sf;
          tvy = ndy * e.speed * 0.6 * sf;
        }
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && dist < 280) {
          e.shootTimer = 2.5 + Math.random() * 1.5;
          this.eprojectiles.push(new EnemyProjectile(this, e.x, e.y, ndx * 140, ndy * 140, e.dmg, 0xc8c8b0, 5));
          playSfx('eprojshoot');
        }
        break;
      }
      case 'kite': {
        const cover = this.coverPositionFor(e, p);
        if (cover && dist < e.kiteDist + 60) {
          const dx2 = cover.x - e.x, dy2 = cover.y - e.y;
          const d2 = Math.hypot(dx2, dy2) || 1;
          tvx = (dx2 / d2) * e.speed * 0.9 * sf;
          tvy = (dy2 / d2) * e.speed * 0.9 * sf;
        } else {
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
        // Phase scaling — boss accelerates and becomes more aggressive at low HP.
        const hpFrac = Math.max(0, e.hp / e.maxHp);
        const phase = hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 3;
        const phaseSpeedMul = phase === 3 ? 0.5 : phase === 2 ? 0.75 : 1;
        if (e.shootTimer <= 0) {
          e.shootCount = (e.shootCount || 0) + 1;
          const pattern = e.shootCount % 6;
          const baseT = pattern === 1 || pattern === 4 ? 2.8 : pattern === 2 || pattern === 5 ? 1.7 : 2.5;
          e.shootTimer = baseT * phaseSpeedMul;
          this.fireBossPattern(e, p, pattern);
          // Phase 2+ : extra burst. Phase 3: also summon an add every other shoot.
          if (phase >= 2) {
            this.time.delayedCall(420, () => {
              if (e.hp <= 0) return;
              this.fireBossPattern(e, p, (pattern + 3) % 6);
            });
          }
          if (phase === 3 && (e.shootCount % 2) === 0) {
            // Summon a random support add (knight or witch) at boss position
            const addType = Math.random() < 0.5 ? 'skeleton' : 'witch';
            const add = new Enemy(this, e.x, e.y - 24, addType, 1.5, 1, 1);
            this.enemies.push(add);
          }
          playSfx('eprojshoot');
        }
        break;
      }
      case 'treasure': {
        // Streaks across the screen in a fixed direction at high speed
        e.x += (e.treasureDx ?? 0) * e.speed * dt;
        e.y += (e.treasureDy ?? 0) * e.speed * dt;
        directMove = true;
        e.lifetime = (e.lifetime ?? 9) - dt;
        if (e.lifetime <= 0) e.hp = -1;
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

  firePlayerWeapons(rawDt, p, dmgBoost) {
    // Attack speed multiplier accelerates every weapon cooldown by boosting the time delta.
    // Includes swiftness buff (×1.6) when active.
    const swiftMul = (this.buffs?.swiftness || 0) > 0 ? 1.6 : 1;
    const dt = rawDt * (p.atkSpdM || 1) * swiftMul;
    const dlv = slv(p, 'dagger');
    const evoDagger = p.evolved?.has('dagger');
    if (dlv > 0) {
      p.weaponT.dagger -= dt;
      if (p.weaponT.dagger <= 0 && this.enemies.length > 0) {
        p.weaponT.dagger = (dlv >= 3 ? 0.45 : 0.8) / (evoDagger ? 1.5 : 1);
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        if (near) {
          const baseCount = dlv >= 4 ? 3 : dlv >= 2 ? 2 : 1;
          const count = baseCount + (evoDagger ? 3 : 0);
          const base = Math.atan2(near.y - p.y, near.x - p.x);
          const dmg = (12 + dlv * 4) * p.dmgM * dmgBoost;
          const pierce = dlv >= 5 || evoDagger;
          for (let i = 0; i < count; i++) {
            const ang = base + (i - (count - 1) / 2) * 0.3;
            this.projectiles.push(new Projectile(this, p.x, p.y, Math.cos(ang) * 390, Math.sin(ang) * 390, dmg, pierce));
          }
          playSfx('dagger');
        }
      }
    }

    const olv = slv(p, 'orbit');
    const evoOrbit = p.evolved?.has('orbit');
    if (olv > 0) {
      const radius = (olv >= 4 ? 90 : 70) + (evoOrbit ? 25 : 0);
      const speed = (olv >= 5 ? 3.0 : 2.0) * (evoOrbit ? 1.3 : 1);
      const dmg = (10 + olv * 4) * p.dmgM * dmgBoost * (olv >= 5 ? 1.5 : olv >= 3 ? 1.2 : 1);
      const orbR = 12;
      const orbCount = olv + (evoOrbit ? 2 : 0);
      p.orbitAngle += speed * dt;
      // tick down per-enemy hit cooldowns
      for (const [k, v] of p.orbitHits) {
        const nv = v - dt;
        if (nv <= 0) p.orbitHits.delete(k);
        else p.orbitHits.set(k, nv);
      }
      for (let i = 0; i < orbCount; i++) {
        const a = p.orbitAngle + (i / orbCount) * Math.PI * 2;
        const ox = p.x + Math.cos(a) * radius;
        const oy = p.y + Math.sin(a) * radius;
        for (const e of this.enemies) {
          if (p.orbitHits.has(e)) continue;
          if (Math.hypot(e.x - ox, e.y - oy) < e.size + orbR) {
            this.dmgTo(e, dmg, 'dark', 'orbit', p);
            p.orbitHits.set(e, 0.5);
          }
        }
        for (const n of this.nests) {
          if (p.orbitHits.has(n)) continue;
          if (Math.hypot(n.x - ox, n.y - oy) < n.size + orbR) {
            n.hp -= dmg;
            this.fxDamage(n.x, n.y, dmg, false);
            this.damageStats.orbit = (this.damageStats.orbit || 0) + dmg;
            p.orbitHits.set(n, 0.5);
          }
        }
      }
    }

    const swlv = slv(p, 'sword');
    const evoSword = p.evolved?.has('sword');
    if (swlv > 0) {
      p.weaponT.sword -= dt;
      if (p.weaponT.sword <= 0) {
        p.weaponT.sword = (swlv >= 5 ? 0.5 : swlv >= 2 ? 0.85 : 1.1) / (evoSword ? 1.4 : 1);
        const radius = 70 + swlv * 8 + (evoSword ? 25 : 0);
        const dmg = (22 + swlv * 7) * p.dmgM * dmgBoost * (swlv >= 4 ? 1.5 : 1);
        const arcDeg = evoSword ? 360 : (swlv >= 4 ? 360 : swlv >= 3 ? 180 : swlv >= 2 ? 120 : 90);
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
      p.weaponT.charm -= dt;
      if (p.weaponT.charm <= 0) {
        p.weaponT.charm = cmlv >= 5 ? 5 : 8;
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
      p.flameCD = (p.flameCD || 0) - dt;
      if (p.flameActive) {
        p.flameDur -= dt;
        if (p.flameDur <= 0) {
          p.flameActive = false;
          p.flameCD = cd;
        } else {
          p.weaponT.flamethrower = (p.weaponT.flamethrower || 0) - dt;
          if (p.weaponT.flamethrower <= 0) {
            p.weaponT.flamethrower = 0.1;
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
            const baseAngle = near ? Math.atan2(near.y - p.y, near.x - p.x) : (p._lastFlameAngle ?? 0);
            p._lastFlameAngle = baseAngle;
            const angles = fllv >= 5 ? [baseAngle, baseAngle + Math.PI] : [baseAngle];
            for (const a of angles) {
              this.applyFlamethrower(p, a, arc, range, dmg);
              this.fxFlame(p.x, p.y, a, arc, range);
            }
          }
        }
      } else if (p.flameCD <= 0 && this.enemies.length > 0) {
        p.flameActive = true;
        p.flameDur = burstDur;
        playSfx('nova');
      }
    }

    const cllv = slv(p, 'cloud');
    const evoCloud = p.evolved?.has('cloud');
    if (cllv > 0) {
      const max = (cllv >= 5 ? 4 : cllv >= 4 ? 3 : cllv >= 2 ? 2 : 1) + (evoCloud ? 2 : 0);
      p.cloudT -= dt;
      if (p.cloudT <= 0 && this.clouds.length < max) {
        p.cloudT = 4;
        const c = new StormCloud(this, 0);
        c.x = p.x + (Math.random() - 0.5) * 200;
        c.y = p.y - 100 + (Math.random() - 0.5) * 80;
        this.clouds.push(c);
      }
    }

    const grlv = slv(p, 'grenade');
    if (grlv > 0) {
      p.weaponT.grenade -= dt;
      if (p.weaponT.grenade <= 0) {
        p.weaponT.grenade = 2;
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
    const evoMissile = p.evolved?.has('missile');
    if (milv > 0) {
      p.weaponT.missile -= dt;
      if (p.weaponT.missile <= 0 && this.enemies.length > 0) {
        p.weaponT.missile = (milv >= 5 ? 0.8 : 1.2) / (evoMissile ? 1.4 : 1);
        const count = milv + (evoMissile ? 3 : 0);
        const dmg = (25 + milv * 5) * p.dmgM * dmgBoost * (milv >= 4 ? 1.4 : 1);
        const aoe = (milv >= 5 ? 80 : milv >= 3 ? 50 : 30) * (evoMissile ? 1.5 : 1);
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
      p.weaponT.whip -= dt;
      if (p.weaponT.whip <= 0) {
        p.weaponT.whip = (wlv >= 5 ? 0.6 : wlv >= 3 ? 0.85 : 1.0) / (p.evolved?.has('whip') ? 1.3 : 1);
        const evoWhip = p.evolved?.has('whip');
        const length = (wlv >= 4 ? 200 : wlv >= 2 ? 165 : 130) * (evoWhip ? 1.5 : 1);
        const width = 38;
        const dmg = (18 + wlv * 5) * p.dmgM * dmgBoost * (wlv >= 4 ? 1.3 : 1);
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        const baseAngle = near ? Math.atan2(near.y - p.y, near.x - p.x) : 0;
        const angles = (evoWhip || wlv >= 5) ? [0, Math.PI / 2, Math.PI, -Math.PI / 2]
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
    const evoNova = p.evolved?.has('nova');
    if (nlv > 0) {
      p.weaponT.nova -= dt;
      if (p.weaponT.nova <= 0) {
        p.weaponT.nova = (nlv >= 4 ? 1.2 : 2) / (evoNova ? 1.5 : 1);
        const r = (80 + nlv * 25) * (nlv >= 5 ? 1.5 : 1) * (evoNova ? 1.7 : 1);
        const dmg = (18 + nlv * 10) * p.dmgM * (nlv >= 3 ? 1.5 : 1) * dmgBoost;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < r) {
            this.dmgTo(e, dmg, 'fire', 'nova', p);
            if (nlv >= 5) {
              const a = Math.atan2(e.y - p.y, e.x - p.x);
              e.vx += Math.cos(a) * 320;
              e.vy += Math.sin(a) * 320;
            }
          }
        }
        for (const n of this.nests) {
          if (Math.hypot(n.x - p.x, n.y - p.y) < r + n.size) {
            n.hp -= dmg;
            this.fxDamage(n.x, n.y, dmg, false);
            this.damageStats.nova = (this.damageStats.nova || 0) + dmg;
          }
        }
        this.fxNova(p.x, p.y, r);
        this.shake(0.005, 100);
        playSfx('nova');
      }
    }

    const llv = slv(p, 'lightning');
    if (llv > 0) {
      p.weaponT.lightning -= dt;
      const hasTargets = this.enemies.length > 0 || this.nests.length > 0;
      if (p.weaponT.lightning <= 0 && hasTargets) {
        p.weaponT.lightning = llv >= 5 ? 0.4 : llv >= 3 ? 0.8 : 1.5;
        const chains = llv >= 5 ? 99 : llv >= 4 ? 4 : llv >= 2 ? 2 : 1;
        const baseDmg = (20 + llv * 8) * p.dmgM * dmgBoost;
        const range = llv >= 5 ? 280 : llv >= 3 ? 240 : 200;
        const firstRange = 360;
        let prev = { x: p.x, y: p.y };
        const usedEnemies = new Set();
        const usedNests = new Set();
        let lastTarget = null;
        for (let c = 0; c < chains; c++) {
          const r = c === 0 ? firstRange : range;
          let near = null, nd = Infinity, nearKind = null;
          for (const e of this.enemies) {
            if (usedEnemies.has(e)) continue;
            const d = Math.hypot(e.x - prev.x, e.y - prev.y);
            if (d < nd && d < r) { nd = d; near = e; nearKind = 'enemy'; }
          }
          for (const n of this.nests) {
            if (usedNests.has(n)) continue;
            const d = Math.hypot(n.x - prev.x, n.y - prev.y);
            if (d < nd && d < r) { nd = d; near = n; nearKind = 'nest'; }
          }
          if (!near) break;
          // Damage falloff per jump (15% reduction)
          const dmg = baseDmg * Math.pow(0.85, c);
          if (nearKind === 'enemy') {
            this.dmgTo(near, dmg, 'lightning', 'lightning', p);
            usedEnemies.add(near);
          } else {
            near.hp -= dmg;
            this.fxDamage(near.x, near.y, dmg, false);
            this.damageStats.lightning = (this.damageStats.lightning || 0) + dmg;
            usedNests.add(near);
          }
          this.fxBolt(prev.x, prev.y, near.x, near.y, c === 0);
          // Branch sparks at each node (visual flair)
          this.fxSpark(near.x, near.y);
          prev = { x: near.x, y: near.y };
          lastTarget = near;
        }
        if (lastTarget) playSfx('lightning');
      }
    }

    // ── Charged Bolt — éventail de disques zigzagants
    const cblv = slv(p, 'chargedBolt');
    if (cblv > 0) {
      p.weaponT.chargedBolt = (p.weaponT.chargedBolt || 0) - dt;
      if (p.weaponT.chargedBolt <= 0) {
        p.weaponT.chargedBolt = cblv >= 2 ? 1.0 : 1.2;
        const count = cblv >= 5 ? 10 : cblv >= 4 ? 8 : cblv >= 3 ? 6 : cblv >= 2 ? 5 : 3;
        const spread = Math.PI * 0.55; // ~100°
        const speed = 240;
        const range = cblv >= 4 ? 460 : 350;
        const dmg = (10 + cblv * 4) * p.dmgM * dmgBoost * (cblv >= 3 ? 1.3 : 1) * (cblv >= 5 ? 1.5 : 1);
        const pierce = cblv >= 5 ? 99 : 1;
        // Aim at the closest enemy or nest if any, otherwise face the move dir.
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        for (const n of this.nests) {
          const d = Math.hypot(n.x - p.x, n.y - p.y);
          if (d < nd) { nd = d; near = n; }
        }
        const aim = near
          ? Math.atan2(near.y - p.y, near.x - p.x)
          : (p._aimAngle ?? 0);
        for (let i = 0; i < count; i++) {
          const t = count === 1 ? 0.5 : i / (count - 1);
          const a = aim - spread / 2 + spread * t;
          this.chargedBolts.push(new ChargedBolt(this, p.x, p.y, a, speed, dmg, pierce, range));
          // Tag the source player so damage attribution works
          this.chargedBolts[this.chargedBolts.length - 1].source = p;
        }
        playSfx('lightning');
      }
    }

    // ── Bow — high-damage piercing arrow toward farthest enemy
    const blv = slv(p, 'bow');
    const evoBow = p.evolved?.has('bow');
    if (blv > 0) {
      p.weaponT.bow = (p.weaponT.bow || 0) - dt;
      if (p.weaponT.bow <= 0 && this.enemies.length > 0) {
        p.weaponT.bow = (blv >= 4 ? 0.7 : blv >= 2 ? 1.0 : 1.5) / (evoBow ? 1.3 : 1);
        const count = (blv >= 5 ? 3 : blv >= 3 ? 2 : 1) + (evoBow ? 3 : 0);
        const dmg = (40 + blv * 15) * p.dmgM * dmgBoost * (blv >= 4 ? 1.3 : 1);
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        if (near) {
          const base = Math.atan2(near.y - p.y, near.x - p.x);
          for (let i = 0; i < count; i++) {
            const ang = base + (i - (count - 1) / 2) * 0.18;
            const proj = new Projectile(this, p.x, p.y, Math.cos(ang) * 540, Math.sin(ang) * 540, dmg, true);
            this.projectiles.push(proj);
          }
          playSfx('dagger');
        }
      }
    }

    // ── Boomerang — out-and-return spinning blade
    const bmlv = slv(p, 'boomerang');
    const evoBoomerang = p.evolved?.has('boomerang');
    if (bmlv > 0) {
      p.weaponT.boomerang = (p.weaponT.boomerang || 0) - dt;
      if (p.weaponT.boomerang <= 0) {
        p.weaponT.boomerang = (bmlv >= 3 ? 1.5 : 2.0) / (evoBoomerang ? 1.4 : 1);
        const count = (bmlv >= 5 ? 4 : bmlv >= 4 ? 3 : bmlv >= 2 ? 2 : 1) + (evoBoomerang ? 2 : 0);
        const range = (160 + bmlv * 25) * (bmlv >= 4 ? 1.3 : 1) * (evoBoomerang ? 1.2 : 1);
        const dmg = (18 + bmlv * 8) * p.dmgM * dmgBoost * (bmlv >= 3 ? 1.3 : 1);
        // Aim at nearest enemy; fan out for multi
        let near = null, nd = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; near = e; }
        }
        const base = near ? Math.atan2(near.y - p.y, near.x - p.x) : 0;
        for (let i = 0; i < count; i++) {
          const ang = base + (i / count) * Math.PI * 2;
          this.boomerangs.push(new Boomerang(this, p.x, p.y, ang, 320, dmg, range, p));
        }
        playSfx('dagger');
      }
    }

    // ── IceRing — expanding frost wave
    const ilv = slv(p, 'iceRing');
    const evoIceRing = p.evolved?.has('iceRing');
    if (ilv > 0) {
      p.weaponT.iceRing = (p.weaponT.iceRing || 0) - dt;
      if (p.weaponT.iceRing <= 0) {
        p.weaponT.iceRing = (ilv >= 3 ? 2.3 : 3.0) / (evoIceRing ? 1.2 : 1);
        const r = (90 + ilv * 22) * (ilv >= 2 ? 1.25 : 1) * (evoIceRing ? 2 : 1);
        const dmg = (15 + ilv * 8) * p.dmgM * dmgBoost * (ilv >= 5 ? 1.5 : 1);
        const freezeDur = (ilv >= 5 ? 2 : ilv >= 2 ? 1.4 : 1) + (evoIceRing ? 2 : 0);
        const pulses = ilv >= 5 ? 3 : ilv >= 4 ? 2 : 1;
        for (let k = 0; k < pulses; k++) {
          this.time.delayedCall(k * 220, () => {
            if (this.over) return;
            this.iceRings.push(new IceRing(this, p.x, p.y, r, dmg, freezeDur, p));
          });
        }
        playSfx('nova');
      }
    }
  }

  updateChargedBolts(dt) {
    if (!this.chargedBolts || this.chargedBolts.length === 0) return;
    for (const b of this.chargedBolts) {
      // Zigzag = base direction + perpendicular sinusoidal lateral drift.
      b.osc += b.oscSpeed * dt;
      const fx = Math.cos(b.baseAngle);
      const fy = Math.sin(b.baseAngle);
      const px = -fy, py = fx; // perp
      const lat = Math.sin(b.osc) * b.oscAmp;
      const vx = fx * b.speed + px * lat;
      const vy = fy * b.speed + py * lat;
      b.dx = vx; b.dy = vy;
      // record trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 6) b.trail.shift();
      b.x += vx * dt;
      b.y += vy * dt;
      b.life -= dt;
      // Bounds: kill off-screen
      if (b.x < -40 || b.x > this.W + 40 || b.y < -40 || b.y > this.H + 40) {
        b.alive = false;
      }
      if (b.life <= 0) b.alive = false;
      // Collisions: enemies
      for (const e of this.enemies) {
        if (b.hits.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + 8) {
          const dealt = this.dmgTo(e, b.dmg, 'lightning', 'chargedBolt', b.source);
          if (b.source && b.source.ls > 0 && dealt > 0) {
            b.source.hp = Math.min(b.source.maxHp, b.source.hp + dealt * b.source.ls);
          }
          b.hits.add(e);
          this.fxSpark(b.x, b.y);
          if (b.hits.size >= b.pierce) { b.alive = false; break; }
        }
      }
      // Collisions: nests
      if (b.alive) {
        for (const n of this.nests) {
          if (b.hits.has(n)) continue;
          if (Math.hypot(n.x - b.x, n.y - b.y) < n.size + 8) {
            n.hp -= b.dmg;
            this.fxDamage(n.x, n.y, b.dmg, false);
            if (this.damageStats) this.damageStats.chargedBolt = (this.damageStats.chargedBolt || 0) + b.dmg;
            b.hits.add(n);
            this.fxSpark(b.x, b.y);
            if (b.hits.size >= b.pierce) { b.alive = false; break; }
          }
        }
      }
      // Obstacles toujours bloquants (même pour projectiles perforants)
      if (b.alive) {
        for (const o of this.obstacles) {
          if (Math.hypot(o.x - b.x, o.y - b.y) < o.size + 8) {
            o.hp -= b.dmg;
            this.fxSpark(b.x, b.y);
            b.alive = false;
            break;
          }
        }
      }
    }
    this.chargedBolts = this.chargedBolts.filter(b => {
      if (!b.alive) { b.destroy(); return false; }
      return true;
    });
  }

  updateBoomerangs(dt) {
    if (!this.boomerangs || this.boomerangs.length === 0) return;
    for (const b of this.boomerangs) {
      // Switch to return phase once we've travelled past the range.
      if (b.phase === 'out') {
        const dToSrc = Math.hypot(b.x - b.source.x, b.y - b.source.y);
        if (dToSrc >= b.range) {
          b.phase = 'return';
          b.hits.clear(); // allow re-hitting on the way back
        }
      } else {
        // Steer toward source
        const dx = b.source.x - b.x, dy = b.source.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 18) { b.alive = false; continue; }
        const ang = Math.atan2(dy, dx);
        b.vx = Math.cos(ang) * b.speed;
        b.vy = Math.sin(ang) * b.speed;
      }
      // Slight deceleration on the way out for the throw arc feel
      if (b.phase === 'out') {
        b.vx *= 0.985;
        b.vy *= 0.985;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) b.alive = false;
      // Collisions: enemies (per-pass)
      for (const e of this.enemies) {
        if (b.hits.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + 10) {
          this.dmgTo(e, b.dmg, 'physical', 'boomerang', b.source);
          b.hits.add(e);
        }
      }
      // Nests
      for (const n of this.nests) {
        if (b.hits.has(n)) continue;
        if (Math.hypot(n.x - b.x, n.y - b.y) < n.size + 10) {
          n.hp -= b.dmg;
          this.fxDamage(n.x, n.y, b.dmg, false);
          if (this.damageStats) this.damageStats.boomerang = (this.damageStats.boomerang || 0) + b.dmg;
          b.hits.add(n);
        }
      }
    }
    this.boomerangs = this.boomerangs.filter(b => {
      if (!b.alive) { b.destroy(); return false; }
      return true;
    });
  }

  updateIceRings(dt) {
    if (!this.iceRings || this.iceRings.length === 0) return;
    for (const r of this.iceRings) {
      // Expand the radius linearly to maxRadius over its life
      const progress = 1 - (r.life / 0.55);
      r.r = 12 + (r.maxRadius - 12) * progress;
      r.life -= dt;
      if (r.life <= 0) r.alive = false;
      // Damage + freeze enemies inside the band [r.r-12, r.r+4]
      for (const e of this.enemies) {
        if (r.hits.has(e)) continue;
        const d = Math.hypot(e.x - r.x, e.y - r.y);
        if (d > r.r - 14 && d < r.r + 6) {
          this.dmgTo(e, r.dmg, 'ice', 'iceRing', r.source);
          if (e.statuses) e.statuses.frozen = { duration: r.freezeDur };
          r.hits.add(e);
        }
      }
      for (const n of this.nests) {
        if (r.hits.has(n)) continue;
        const d = Math.hypot(n.x - r.x, n.y - r.y);
        if (d > r.r - 14 && d < r.r + 6) {
          n.hp -= r.dmg;
          this.fxDamage(n.x, n.y, r.dmg, false);
          if (this.damageStats) this.damageStats.iceRing = (this.damageStats.iceRing || 0) + r.dmg;
          r.hits.add(n);
        }
      }
    }
    this.iceRings = this.iceRings.filter(r => {
      if (!r.alive) { r.destroy(); return false; }
      return true;
    });
  }

  updateTrail(dt, p, dmgBoost) {
    const tlv = slv(p, 'trail');
    if (tlv > 0) {
      const dropStep = tlv >= 2 ? 22 : 32;
      const radius = tlv >= 5 ? 40 : tlv >= 3 ? 28 : 22;
      const maxLife = tlv >= 5 ? 4 : tlv >= 3 ? 3 : 2.5;
      const dx = p.x - p.lastTrailX;
      const dy = p.y - p.lastTrailY;
      if (Math.hypot(dx, dy) >= dropStep) {
        this.trail.push(new TrailTile(this, p.x - dx * 0.3, p.y - dy * 0.3, radius, maxLife));
        p.lastTrailX = p.x;
        p.lastTrailY = p.y;
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
      for (const [k, v] of p.trailHits) {
        const nv = v - dt;
        if (nv <= 0) p.trailHits.delete(k);
        else p.trailHits.set(k, nv);
      }
      for (const e of this.enemies) {
        if (p.trailHits.has(e)) continue;
        for (const t of this.trail) {
          if (Math.hypot(e.x - t.x, e.y - t.y) < t.radius + e.size) {
            this.dmgTo(e, dmg, 'poison', 'trail', p);
            p.trailHits.set(e, 0.4);
            break;
          }
        }
      }
      for (const n of this.nests) {
        if (p.trailHits.has(n)) continue;
        for (const t of this.trail) {
          if (Math.hypot(n.x - t.x, n.y - t.y) < t.radius + n.size) {
            n.hp -= dmg;
            this.fxDamage(n.x, n.y, dmg, false);
            this.damageStats.trail = (this.damageStats.trail || 0) + dmg;
            p.trailHits.set(n, 0.4);
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
      p.trapT -= dt;
      if (p.trapT <= 0) {
        p.trapT = interval;
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
              this.dmgTo(e2, t.dmg, 'fire', 'traps', p);
              if (lvl >= 5) e2.statuses.frozen = { duration: 0.5 };
            }
          }
          for (const n of this.nests) {
            if (Math.hypot(n.x - t.x, n.y - t.y) < t.radius + n.size) {
              n.hp -= t.dmg;
              this.fxDamage(n.x, n.y, t.dmg, false);
              this.damageStats.traps = (this.damageStats.traps || 0) + t.dmg;
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
      p.minionT -= dt;
      if (p.minionT <= 0 && this.minions.length < maxMinions) {
        p.minionT = interval;
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
              this.dmgTo(e, 20 + lvl * 4, 'fire', 'summon', p);
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
          this.dmgTo(target, m.dmg, 'physical', 'summon', p);
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
      p.gathererT -= dt;
      if (p.gathererT <= 0 && this.gatherers.length < max) {
        p.gathererT = 8;
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
      p.turretT -= dt;
      if (p.turretT <= 0 && this.turrets.length < max) {
        p.turretT = interval;
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
          this.dmgTo(target, t.dmg * dmgBoost, t.dmgType, 'turret', p);
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
      let exploded = false;
      for (const e of this.enemies) {
        if (e.charmed) continue;
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.size + 5) { exploded = true; break; }
      }
      if (!exploded) {
        for (const n of this.nests) {
          if (Math.hypot(m.x - n.x, m.y - n.y) < n.size + 5) { exploded = true; break; }
        }
      }
      // Le missile explose aussi au contact d'un obstacle (ne passe plus à travers).
      if (!exploded) {
        for (const o of this.obstacles) {
          if (Math.hypot(m.x - o.x, m.y - o.y) < o.size + 5) { exploded = true; break; }
        }
      }
      if (exploded) {
        {
          for (const e2 of this.enemies) {
            if (e2.charmed) continue;
            if (Math.hypot(e2.x - m.x, e2.y - m.y) < m.aoe + e2.size) {
              this.dmgTo(e2, m.dmg, 'fire', 'missile', p);
            }
          }
          for (const nn of this.nests) {
            if (Math.hypot(nn.x - m.x, nn.y - m.y) < m.aoe + nn.size) {
              nn.hp -= m.dmg;
              this.fxDamage(nn.x, nn.y, m.dmg, false);
              this.damageStats.missile = (this.damageStats.missile || 0) + m.dmg;
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
      p.floatingT -= dt;
      if (p.floatingT <= 0 && idle < max) {
        p.floatingT = interval;
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
          this.dmgTo(e, b.dmg, 'physical', 'floating', p);
          if (lvl >= 5) {
            for (const e2 of this.enemies) {
              if (e2 === e || e2.charmed) continue;
              if (Math.hypot(e2.x - b.x, e2.y - b.y) < 50 + e2.size) {
                this.dmgTo(e2, b.dmg * 0.5, 'fire', 'floating', p);
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
      if (!triggered) {
        for (const n of this.nests) {
          if (Math.hypot(g.x - n.x, g.y - n.y) < n.size + 5) { triggered = true; break; }
        }
      }
      // La grenade explose aussi au contact d'un obstacle.
      if (!triggered) {
        for (const o of this.obstacles) {
          if (Math.hypot(g.x - o.x, g.y - o.y) < o.size + 5) { triggered = true; break; }
        }
      }
      if (triggered) {
        const explode = (cx, cy) => {
          for (const e of this.enemies) {
            if (e.charmed) continue;
            if (Math.hypot(e.x - cx, e.y - cy) < g.aoe + e.size) {
              this.dmgTo(e, g.dmg, 'fire', 'grenade', p);
            }
          }
          for (const n of this.nests) {
            if (Math.hypot(n.x - cx, n.y - cy) < g.aoe + n.size) {
              n.hp -= g.dmg;
              this.fxDamage(n.x, n.y, g.dmg, false);
              this.damageStats.grenade = (this.damageStats.grenade || 0) + g.dmg;
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
    // Spawn a new nest periodically (max 4 simultaneous, varied types)
    this.nestSpawnT -= dt;
    if (this.nestSpawnT <= 0 && this.nests.length < 4) {
      this.nestSpawnT = 30 + Math.random() * 18;
      // Find a position away from the player
      let nx = 0, ny = 0, tries = 0;
      do {
        nx = 80 + Math.random() * (this.W - 160);
        ny = 80 + Math.random() * (this.H - 160);
        tries++;
      } while (Math.hypot(nx - p.x, ny - p.y) < 220 && tries < 12);
      // Pick an enemy type unlocked by current elapsed time (per WAVES schedule).
      // Prefer types not already represented; fall back to any unlocked type.
      const unlocked = ['bat'];
      if (this.elapsed >= 30) unlocked.push('zombie');
      if (this.elapsed >= 60) unlocked.push('skeleton');
      if (this.elapsed >= 90) unlocked.push('ghost');
      if (this.elapsed >= 120) unlocked.push('knight');
      if (this.elapsed >= 150) unlocked.push('witch');
      const present = new Set(this.nests.map(n => n.enemyType));
      const candidates = unlocked.filter(t => !present.has(t));
      const pool = candidates.length > 0 ? candidates : unlocked;
      const enemyType = pool[Math.floor(Math.random() * pool.length)];
      this.nests.push(new Nest(this, nx, ny, enemyType));
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
        const tier = Math.floor(this.elapsed / 60);
        const hpMul = (1 + tier * 0.3) * (this.mode === 'horde' ? 0.6 : 1);
        const dmgMul = 1 + tier * 0.1;
        const ang = Math.random() * Math.PI * 2;
        const child = new Enemy(this, n.x + Math.cos(ang) * 24, n.y + Math.sin(ang) * 24, n.enemyType, hpMul, 1, dmgMul);
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
        this.fxXpPop(p.x, p.y, o.value);
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
    this.pendingLevelupPlayer = p;
    this.paused = true;
    this.shake(0.006, 200);
    stopMusic();
    const choices = getChoices(p);
    bus.emit('levelup', {
      lv: p.level, choices, playerId: p.id,
      rerollsLeft: p.rerollsLeft || 0,
      banishesLeft: p.banishesLeft || 0,
    });
    this.emitHud();
  }

  // Endless mode: resume after victory at higher difficulty.
  onEndlessContinue() {
    if (!this.victoryClaimed) return;
    this.over = false;
    this.endless = true;
    this.endlessTier = (this.endlessTier || 0) + 1;
    bus.emit('phase', 'playing');
    if (!this.bossMusicOn) startMusic('boss');
    this.emitHud();
  }

  onSkillReroll() {
    const p = this.pendingLevelupPlayer;
    if (!p || (p.rerollsLeft || 0) <= 0) return;
    p.rerollsLeft -= 1;
    const choices = getChoices(p);
    playSfx('uimove');
    bus.emit('levelup', {
      lv: p.level, choices, playerId: p.id,
      rerollsLeft: p.rerollsLeft, banishesLeft: p.banishesLeft,
    });
  }

  onSkillBanish(id) {
    const p = this.pendingLevelupPlayer;
    if (!p || (p.banishesLeft || 0) <= 0 || !id) return;
    if (!(p.banished instanceof Set)) p.banished = new Set();
    p.banished.add(id);
    p.banishesLeft -= 1;
    const choices = getChoices(p);
    playSfx('uipick');
    bus.emit('levelup', {
      lv: p.level, choices, playerId: p.id,
      rerollsLeft: p.rerollsLeft, banishesLeft: p.banishesLeft,
    });
  }

  onSkillPick(id) {
    const p = this.pendingLevelupPlayer || this.player;
    if (id.startsWith('evo:')) {
      const evoId = id.slice(4);
      if (!(p.evolved instanceof Set)) p.evolved = new Set();
      p.evolved.add(evoId);
      // Heal a bit on evolution as flavor
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.fxNova(p.x, p.y, 80);
      this.shake(0.008, 220);
      playSfx('evolution');
      this.fxBanner('✦ ÉVOLUTION ✦', '#ffd966', 32);
    } else {
      p.skills[id] = (p.skills[id] || 0) + 1;
      if (id === 'heart') {
        const lv = p.skills.heart;
        p.maxHp += lv <= 2 ? 50 : 80;
        if (lv === 3) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15);
      }
    }
    refreshStats(p);
    this.pendingLevelupPlayer = null;
    this.paused = false;
    if (!this.over) startMusic(this.bossMusicOn ? 'boss' : 'normal');
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
      this.dmgTo(e, dmg, 'physical', 'sword', p);
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      e.vx += Math.cos(a) * 80;
      e.vy += Math.sin(a) * 80;
    }
    for (const n of this.nests) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d > radius + n.size) continue;
      if (arcDeg < 360) {
        const ea = Math.atan2(n.y - p.y, n.x - p.x);
        let diff = ea - baseAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > arc / 2) continue;
      }
      n.hp -= dmg;
      this.damageStats.sword = (this.damageStats.sword || 0) + dmg;
      this.fxDamage(n.x, n.y, dmg, false);
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
        this.dmgTo(target, dmg, 'physical', 'charm', null);
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

  coverPositionFor(e, p) {
    let bestO = null, bestD = 200;
    for (const o of this.obstacles) {
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bestD) { bestD = d; bestO = o; }
    }
    if (!bestO) return null;
    // pick a point on the far side of the obstacle from the player
    const ax = bestO.x - p.x, ay = bestO.y - p.y;
    const al = Math.hypot(ax, ay) || 1;
    return {
      x: bestO.x + (ax / al) * (bestO.size + 8),
      y: bestO.y + (ay / al) * (bestO.size + 8),
    };
  }

  // Helper: apply damage to a single enemy via Enemy.takeDamage, then handle
  // lifesteal and damage-tracking in one place. Returns the dealt amount.
  dmgTo(target, amount, type, weaponId, sourcePlayer) {
    if (!target) return 0;
    // Apply evolution multiplier if the weapon has been evolved (1.6× by default; 1.8× for sword, 1.5× for whip/cloud, etc.)
    let evoMul = 1;
    if (sourcePlayer && weaponId && sourcePlayer.evolved instanceof Set && sourcePlayer.evolved.has(weaponId)) {
      const EVO_MUL = { sword: 1.8, dagger: 1.6, nova: 1.6, lightning: 1.5, whip: 1.5, cloud: 1.4, missile: 1.5, orbit: 1.5, bow: 1.5, boomerang: 1.5, iceRing: 1.5 };
      evoMul = EVO_MUL[weaponId] || 1.5;
    }
    let finalAmount = amount * evoMul;
    // Roll for crit (only when a source player is provided, since enemies → players use a different path)
    let isCrit = false;
    if (sourcePlayer && sourcePlayer.critChance > 0 && Math.random() < sourcePlayer.critChance) {
      isCrit = true;
      finalAmount *= (sourcePlayer.critMult || 2);
    }
    const dealt = target.takeDamage(finalAmount, type, this);
    if (dealt > 0 && isCrit) {
      this.fxDamage(target.x, target.y, dealt, true);
      playSfx('crit');
    }
    if (dealt > 0 && weaponId) {
      this.damageStats[weaponId] = (this.damageStats[weaponId] || 0) + dealt;
    }
    if (dealt > 0) this.recordDps(dealt);
    if (dealt > 0 && sourcePlayer?.ls > 0) {
      sourcePlayer.hp = Math.min(sourcePlayer.maxHp, sourcePlayer.hp + dealt * sourcePlayer.ls);
    }
    return dealt;
  }

  // Sliding-window DPS tracker — keeps events from the last DPS_WINDOW seconds.
  recordDps(amount) {
    if (!this._dpsEvents) this._dpsEvents = [];
    this._dpsEvents.push({ t: this.elapsed, a: amount });
  }
  computeDps() {
    const W = 5; // seconds
    if (!this._dpsEvents) return 0;
    const cutoff = this.elapsed - W;
    while (this._dpsEvents.length > 0 && this._dpsEvents[0].t < cutoff) {
      this._dpsEvents.shift();
    }
    let sum = 0;
    for (const ev of this._dpsEvents) sum += ev.a;
    return sum / W;
  }

  // Helper: deal damage to all enemies + nests in a radius around (x, y).
  // Returns total damage dealt (used for lifesteal).
  damageRadius(x, y, radius, dmg, type, includeNests = true, weaponId, sourcePlayer) {
    let total = 0;
    for (const e of this.enemies) {
      if (e.charmed) continue;
      if (Math.hypot(e.x - x, e.y - y) < radius + e.size) {
        const dealt = this.dmgTo(e, dmg, type, weaponId, sourcePlayer);
        total += dealt;
      }
    }
    if (includeNests) {
      for (const n of this.nests) {
        if (Math.hypot(n.x - x, n.y - y) < radius + n.size) {
          n.hp -= dmg;
          this.fxDamage(n.x, n.y, dmg, false);
          if (weaponId) this.damageStats[weaponId] = (this.damageStats[weaponId] || 0) + dmg;
          total += dmg;
        }
      }
    }
    return total;
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
      this.dmgTo(e, dmg, 'fire', 'flamethrower', p);
    }
    for (const n of this.nests) {
      const dx = n.x - p.x, dy = n.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + n.size) continue;
      if (dist < 1) continue;
      const ea = Math.atan2(dy, dx);
      let diff = ea - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > half) continue;
      n.hp -= dmg;
      this.fxDamage(n.x, n.y, dmg, false);
      this.damageStats.flamethrower = (this.damageStats.flamethrower || 0) + dmg;
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
            this.dmgTo(e, dmg, 'lightning', 'cloud', p);
            anyHit = true;
          }
        }
        for (const n of this.nests) {
          if (Math.hypot(n.x - c.x, n.y - c.y) < radius + n.size) {
            n.hp -= dmg;
            this.fxDamage(n.x, n.y, dmg, false);
            this.damageStats.cloud = (this.damageStats.cloud || 0) + dmg;
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
        this.dmgTo(e, dmg, 'physical', 'whip', p);
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        e.vx += Math.cos(a) * 110;
        e.vy += Math.sin(a) * 110;
      }
    }
    for (const n of this.nests) {
      const dx = n.x - p.x, dy = n.y - p.y;
      const fwd = cos * dx + sin * dy;
      const side = -sin * dx + cos * dy;
      if (fwd >= -n.size && fwd <= length + n.size && Math.abs(side) <= half + n.size) {
        n.hp -= dmg;
        this.fxDamage(n.x, n.y, dmg, false);
        this.damageStats.whip = (this.damageStats.whip || 0) + dmg;
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

  // Big celebratory banner shown at the player's position. Used for evolutions, elite kills, etc.
  // Throttled XP pickup popup. Aggregates multiple pickups within a 200 ms window
  // into a single floating "+N" text to avoid spam.
  fxXpPop(x, y, value) {
    if (!this._xpPopBuf) this._xpPopBuf = { sum: 0, x, y, scheduled: false };
    this._xpPopBuf.sum += value;
    this._xpPopBuf.x = x;
    this._xpPopBuf.y = y;
    if (!this._xpPopBuf.scheduled) {
      this._xpPopBuf.scheduled = true;
      this.time.delayedCall(180, () => {
        if (!this._xpPopBuf) return;
        const buf = this._xpPopBuf;
        this._xpPopBuf = null;
        const t = this.add.text(buf.x, buf.y - 20, `+${buf.sum} XP`, {
          fontFamily: "'Cinzel', serif",
          fontSize: '13px',
          color: '#9d4edd',
          stroke: '#1a0030',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(40);
        this.tweens.add({
          targets: t,
          y: buf.y - 50,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.out',
          onComplete: () => t.destroy(),
        });
      });
    }
  }

  fxGoldPop(x, y, amount) {
    const t = this.add.text(x, y - 6, `+${amount}💰`, {
      fontFamily: "'Cinzel', serif",
      fontSize: '12px',
      color: '#ffd966',
      stroke: '#1a0c00',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: t,
      y: y - 36,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }

  fxBanner(text, color = '#ffd966', size = 28) {
    const p = this.players?.find(pl => !pl.dead) || this.players?.[0];
    if (!p) return;
    const t = this.add.text(p.x, p.y - 40, text, {
      fontFamily: "'Cinzel Decorative', serif",
      fontSize: `${size}px`,
      color,
      stroke: '#1a0030',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(45);
    this.tweens.add({
      targets: t,
      y: p.y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1400,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }

  fxDamage(x, y, dmg, isCrit = false) {
    const value = Math.round(dmg);
    if (value <= 0) return;
    // Throttle: cap concurrent damage texts to avoid GC pressure on heavy AoE.
    // Crits always pass; regulars are dropped when the cap is reached.
    this._fxDmgActive = this._fxDmgActive || 0;
    const cap = isCrit ? 200 : 70;
    if (this._fxDmgActive >= cap) return;
    this._fxDmgActive += 1;
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
      onComplete: () => { t.destroy(); this._fxDmgActive = Math.max(0, this._fxDmgActive - 1); },
    });
  }

  fxBolt(x1, y1, x2, y2, primary = false) {
    // Multi-segment zigzag with perpendicular jitter (Diablo-style chain lightning).
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux; // perpendicular unit
    const segs = Math.max(4, Math.floor(len / 22));
    const amp = primary ? 14 : 11;
    const pts = [{ x: x1, y: y1 }];
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const j = (Math.random() - 0.5) * amp * 2;
      pts.push({ x: x1 + dx * t + nx * j, y: y1 + dy * t + ny * j });
    }
    pts.push({ x: x2, y: y2 });

    const drawPath = (g, pts) => {
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };

    // Glow halo (white-blue, thick)
    const halo = this.add.graphics().setDepth(11);
    halo.lineStyle(primary ? 9 : 7, 0xaaccff, 0.45);
    drawPath(halo, pts);

    // Main core (bright yellow-white)
    const core = this.add.graphics().setDepth(12);
    core.lineStyle(primary ? 3 : 2, 0xffffff, 1);
    drawPath(core, pts);

    // Yellow bolt (mid-layer)
    const bolt = this.add.graphics().setDepth(12);
    bolt.lineStyle(primary ? 5 : 4, 0xffe066, 0.85);
    drawPath(bolt, pts);

    // Random dead-end branches (1-3 small forks for primary)
    const branches = primary ? 2 : 1;
    const forkGfx = this.add.graphics().setDepth(11);
    forkGfx.lineStyle(2, 0xffe066, 0.6);
    for (let b = 0; b < branches; b++) {
      const start = pts[Math.floor(Math.random() * (pts.length - 1)) + 1];
      const ang = Math.random() * Math.PI * 2;
      const flen = 18 + Math.random() * 22;
      const fpts = [start];
      let cx = start.x, cy = start.y;
      const dirX = Math.cos(ang), dirY = Math.sin(ang);
      const fsegs = 3;
      for (let i = 1; i <= fsegs; i++) {
        const t = i / fsegs;
        cx = start.x + dirX * flen * t + (Math.random() - 0.5) * 6;
        cy = start.y + dirY * flen * t + (Math.random() - 0.5) * 6;
        fpts.push({ x: cx, y: cy });
      }
      forkGfx.beginPath();
      forkGfx.moveTo(fpts[0].x, fpts[0].y);
      for (let i = 1; i < fpts.length; i++) forkGfx.lineTo(fpts[i].x, fpts[i].y);
      forkGfx.strokePath();
    }

    this.tweens.add({
      targets: [halo, core, bolt, forkGfx],
      alpha: 0,
      duration: 220,
      onComplete: () => { halo.destroy(); core.destroy(); bolt.destroy(); forkGfx.destroy(); },
    });
  }

  fxSpark(x, y) {
    const ring = this.add.graphics().setDepth(12);
    ring.lineStyle(2, 0xffffff, 1);
    ring.strokeCircle(x, y, 6);
    this.tweens.add({
      targets: ring, alpha: 0, scale: 2.2,
      duration: 250,
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 80;
      const sg = this.add.graphics().setDepth(12);
      sg.fillStyle(0xffe066, 1);
      sg.fillCircle(0, 0, 1.5);
      sg.x = x; sg.y = y;
      this.tweens.add({
        targets: sg,
        x: x + Math.cos(a) * sp * 0.18,
        y: y + Math.sin(a) * sp * 0.18,
        alpha: 0,
        duration: 200,
        onComplete: () => sg.destroy(),
      });
    }
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

  // Mini-radar in the bottom-right corner showing nests, items and bosses
  // off-screen relative to the main player. Center = player position.
  drawRadar() {
    const g = this.radarGfx;
    g.clear();
    const p = this.players?.find(pl => !pl.dead) || this.players?.[0];
    if (!p) return;
    const radius = 64;
    const cx = this.W - radius - 14;
    const cy = this.H - radius - 14;
    const range = 900; // world distance shown in the radar
    // Background disc
    g.fillStyle(0x000000, 0.55);
    g.fillCircle(cx, cy, radius);
    g.lineStyle(1, 0x6a3a8a, 0.7);
    g.strokeCircle(cx, cy, radius);
    g.lineStyle(1, 0x6a3a8a, 0.25);
    g.strokeCircle(cx, cy, radius * 0.66);
    g.strokeCircle(cx, cy, radius * 0.33);
    // Cross
    g.lineStyle(1, 0x6a3a8a, 0.18);
    g.beginPath(); g.moveTo(cx - radius, cy); g.lineTo(cx + radius, cy); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy - radius); g.lineTo(cx, cy + radius); g.strokePath();

    const dot = (x, y, color, alpha = 1, r = 2.2) => {
      const dx = x - p.x, dy = y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) return;
      const clamped = Math.min(dist, range);
      const angle = Math.atan2(dy, dx);
      const nr = (clamped / range) * (radius - 4);
      g.fillStyle(color, alpha);
      g.fillCircle(cx + Math.cos(angle) * nr, cy + Math.sin(angle) * nr, r);
    };

    // Player at center
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 2.5);
    // Nests = orange dots (with HP-tinted alpha)
    for (const n of this.nests) {
      const a = 0.4 + 0.6 * (n.hp / Math.max(1, n.maxHp));
      dot(n.x, n.y, 0xff7733, a, 3);
    }
    // Items = green
    for (const it of this.items) dot(it.x, it.y, 0x88ddff, 0.85, 2);
    // Bosses = red, bigger, blinking
    const blink = (Math.floor(this.elapsed * 4) & 1) ? 0.95 : 0.55;
    for (const e of this.enemies) {
      if (e.type === 'boss') dot(e.x, e.y, 0xff2244, blink, 4);
      else if (e.type === 'treasure') dot(e.x, e.y, 0xffd966, 1, 3);
    }
    // Other players (multi-joueur) = their tint
    if (this.players && this.players.length > 1) {
      for (const pl of this.players) {
        if (pl === p) continue;
        if (pl.dead) continue;
        dot(pl.x, pl.y, pl.tint, 0.95, 3);
      }
    }
  }

  drawBg() {
    const g = this.bgGfx;
    g.clear();
    const t = this.elapsed;
    const biome = this.biome || BIOMES.cemetery;

    // Hex grid — biome-themed colour
    g.lineStyle(1, biome.gridColor, 0.10);
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
    for (const d of this.decorations) drawDecor(g, d.x, d.y, d.type, d.hash, this.biomeId);

    // Mist — animated (movement is intentional, slow ambient drift), biome-tinted
    g.fillStyle(biome.accent, 0.07);
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
      const a = p.orbitAngle + (i / olv) * Math.PI * 2;
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
