# Nightfall Survivor

Mini-jeu de survie type *bullet-heaven* vibe-codé en React + Phaser.
Objectif : **survivre 5 minutes** dans la nuit éternelle, monter en niveau, choisir ses pouvoirs et terrasser les boss.

## Jouer en ligne

Une fois le déploiement GitHub Pages activé, le jeu est accessible directement depuis le navigateur :

**https://altimore.github.io/nightfall-survivor/**

Aucune installation, fonctionne sur desktop et mobile.

## Contrôles

| Action | Desktop | Mobile |
|---|---|---|
| Déplacement | `ZQSD` / `WASD` / Flèches | Joystick virtuel (1ᵉʳ doigt) |
| Dash (si débloqué) | `Espace` | 2ᵉ doigt sur l'écran |
| Choix de pouvoir | ← → puis `Entrée` / `Espace` (ou `1`-`3`) | toucher la carte |
| Mute / Unmute | bouton 🔊 dans le HUD | bouton 🔊 dans le HUD |

## Contenu

### Pouvoirs (proposés au level-up)
- 🗡️ **Dague Spectrale** — auto-tir (1→3 dagues, perçantes au lvl 5)
- 🔥 **Nova de Feu** — explosion AoE périodique, repousse au lvl 5
- ⚡ **Foudre Maudite** — chaîne d'éclair (1→4 ennemis)
- 🖤 **Cœur des Ténèbres** — +HP max, régénération
- 👢 **Bottes du Néant** — vitesse, dash (lvl 2+)
- 🔮 **Amulette du Sang** — dégâts, vol de vie, soin au kill
- 📜 **Grimoire Interdit** — XP, magnet d'orbes, zone géante

À chaque level-up, **3 cartes proposées au hasard**. Un timer de **10 s choisit automatiquement** une carte si tu hésites.

### Ennemis (déblocage progressif)
Chauve-souris (sinusoïdal), Zombie (direct), Squelette (tireur), Fantôme (phase), Chevalier (charge), Sorcière (kite + projectiles), **BOSS** (téléport + barrage 8 projectiles, sort à 60/120/180/240 s).

### Items au sol (toutes les 15-25 s)
🧪 Soin · 💢 Rage (×2 dégâts) · 🛡️ Bouclier (invincible) · ❄️ Cristal (gel ennemis) · 💨 Bottes ailées (×2 vitesse) · 🌀 Aimant XP.

## Développement local

Le projet utilise **bun** partout (local + CI).

```bash
bun install
bun run dev      # serveur de développement
bun run build    # build de production dans dist/
bun run preview  # preview du build
```

Stack : **Vite + React 18 + Phaser 4** — Phaser pilote la scène de jeu, React gère les overlays (menu, HUD, level-up, fin de partie). Communication via un event bus interne.

## Déploiement

Le workflow `.github/workflows/deploy.yml` build (avec bun) et publie automatiquement sur GitHub Pages à chaque push sur `main`.

Pour activer : **Repo → Settings → Pages → Source : GitHub Actions**.

## Structure

```
src/
  main.jsx                     # entrée React
  App.jsx                      # racine, monte Phaser + overlays
  ui/
    Menu.jsx                   # écran de démarrage
    HUD.jsx                    # HP / XP / niveau / pouvoirs / buffs / boss
    LevelUpScreen.jsx          # choix de pouvoir (3 cartes, auto-pick 10s)
    EndScreen.jsx              # écran défaite/victoire
  game/
    config.js                  # GOAL_TIME
    data.js                    # SKILLS, ETYPES, WAVES, ITEMS, XP
    audio.js                   # SFX + musique procédurale (Web Audio)
    bus.js                     # event bus scène ↔ React
    entities.js                # Player, Enemy, Projectile, XpOrb, Item…
    PhaserGame.js              # factory Phaser.Game
    scenes/
      GameScene.js             # boucle principale, IA, vagues, level-up
index.html
vite.config.js                 # base: '/nightfall-survivor/' pour GitHub Pages
```
