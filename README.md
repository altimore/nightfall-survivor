# Nightfall Survivor

Mini-jeu de survie type *bullet-heaven* (Vampire Survivors-like), vibe-codé en React + Phaser.
Objectif : **survivre 5 minutes** dans la nuit éternelle, monter en niveau, choisir ses pouvoirs, terrasser les boss et faire évoluer ses armes.

## Jouer en ligne

**https://altimore.github.io/nightfall-survivor/**

Fonctionne sur desktop, mobile et tablette. Multi-joueur jusqu'à 4 (2 clavier + 2 manettes).

## Contrôles

| Action | Desktop | Mobile / Manette |
|---|---|---|
| Déplacement | `ZQSD` / `WASD` / Flèches | Joystick virtuel (1ᵉʳ doigt) ou stick gauche |
| Dash (si débloqué) | `Espace` | 2ᵉ doigt / bouton A |
| Choix de pouvoir | ← → puis `Entrée` / `Espace` (ou `1`-`3`) | clic / bouton A |
| Pause | `Échap` | bouton Start |
| Inventaire | `I` | bouton Select / Back |
| Mute | bouton 🔊 du HUD | — |

## Contenu

### Armes (17)
🗡️ Dague Spectrale · ⚔️ Épée Spectrale · 🪢 Fouet d'Ombre · 🚀 Missile Traqueur ·
✨ Lames Suspendues · 💣 Grenade Spectrale · 🌋 Lance-Flammes · ⛈️ Nuages Foudroyants ·
🔥 Nova de Feu · ⚡ Foudre Maudite · 💥 Décharge (Charged Bolt façon Diablo) ·
💫 Orbe Maudite · ☠️ Sentier Maudit · 🪤 Pièges Spectraux · 🗼 Tourelle Spectrale ·
💕 Charme Maudit · 👻 Esprits Fidèles · 🌟 Esprit Quêteur

### Passifs (4)
🖤 Cœur des Ténèbres (+HP, regen) · 👢 Bottes du Néant (vitesse, dash, atk speed) ·
🔮 Amulette du Sang (dégâts, vol de vie, **chance crit**) · 📜 Grimoire Interdit (XP, magnet, **mult crit**)

### Évolutions d'armes (8)
Chaque évolution requiert l'arme niveau MAX **+** son passif lié niveau MAX.
Apparait au level-up comme choix doré ✦ ÉVOLUTION ✦.

| Évolution | Recette | Effet |
|---|---|---|
| 🌌 Pluie Spectrale | Dague + Amulette | +3 projectiles, perforants, dégâts ×1.6 |
| ☀️ Solaris | Nova + Cœur | rayon ×1.7, dégâts ×1.6, cadence ×1.5 |
| ⚡ Fulgur Aeternum | Foudre + Grimoire | chaîne illimitée, dégâts ×1.5, paralyse |
| 🌀 Vortex Spectral | Épée + Bottes | 360° permanent, dégâts ×1.8 |
| 🌩️ Tempête Céleste | Nuages + Grimoire | +2 nuages, AoE ×1.5, dégâts ×1.4 |
| ⚜️ Lacération Mortelle | Fouet + Amulette | 4 directions, portée ×1.5, dégâts ×1.5 |
| 🔥 Salve Apocalyptique | Missile + Grimoire | +3 missiles, AoE ×1.5, cadence ×1.4 |
| ✴️ Couronne du Néant | Orbe + Amulette | +2 orbes, dégâts ×1.5, rayon étendu |

Une **synergie** est annoncée sur les cartes du level-up qui débloquent une évolution.

### Ennemis & nids
6 types d'ennemis (chauve-souris, zombie, squelette, fantôme, chevalier, sorcière) +
ennemi trésor (court vite, drop d'orbes en burst) + 4 types de boss (Carcassemort, Hiver Maudit, Brasier Éternel, Abime Sans Fond) avec patterns différents.

Chaque type d'ennemi a son propre **nid** (grotte, tombe fraîche, crypte, menhir hanté, forteresse, chaudron) qui spawn des ennemis du type associé. Les nids ont une barre de PV et sont attaquables par toutes les armes AoE.

### Items au sol
- **Soins** : Potion 🧪, Grand calice 🍷, Encens 🌿 (regen)
- **Buffs** : Rage 💢 (×2 dgt), Glyphe ⚡ (+50% dgt), Bouclier 🛡️ (invincible 5s), Hâte ⏩ (atk speed ×1.6), Bottes ailées 💨, Cristal ❄️ (gel ennemis)
- **Utilité** : Aimant 🌀, Aspiration 🌟 (toutes les orbes), Sceau du Néant ☢️ (nuke)
- **Élémentaire** : 🔥 ❄️ ⚡ 🧪 (convertit dégâts physiques en élément · 12s)
- **Malédictions** : 🩸 (dégâts -50%), 🐢 (vitesse -50%), 💀 (subis +100% dgt), 🌀 (contrôles inversés), 👁️ (ennemis +50% vitesse)

### Coffre du boss
À chaque kill de boss, un coffre dépose 3-4 items premium (mega heal, rage, bouclier, glyphe d'acuité) + un magnet garanti.

## Mécaniques de méta-progression

L'or se gagne en tuant des ennemis (proportionnel à `xpVal`) et **persiste entre runs** dans `localStorage`. Accessible depuis le bouton **💰 BOUTIQUE** du menu.

**9 améliorations permanentes** (chaque niveau coûte plus cher) :
- ❤ Vitalité — +10 PV max par niveau
- ⚔ Puissance — +5% dégâts par niveau
- 👢 Célérité — +3% vitesse par niveau
- 📜 Sagesse — +5% XP par niveau
- 💰 Cupidité — +10% or gagné par niveau
- 🎯 Précision — +2% chance critique par niveau
- 🔄 Lucidité — +1 reroll par run (max 3)
- 🚫 Anathème — +1 bannissement par run (max 2)
- ⚱ Seconde chance — Ressuscite 1 fois à 50% PV

## Mécaniques en jeu

- **Crits** — chance de base 5%, multiplicateur ×2. Boostable via amulette/tome/méta.
- **Combo / Killstreak** — chaque kill incrémente le combo, fenêtre de 4s. +0.5% dégâts par kill (max +50% à 100). Affiché dans le HUD.
- **DPS live** — `⚡ XX DPS` en temps réel à côté de la barre de vie.
- **Slot limits** — max 6 armes + 4 passifs → force l'upgrade.
- **Reroll / Banish** — 3 rerolls + 1 banish par run pour customiser le pool.
- **Difficulté dynamique** — le spawn s'adapte automatiquement (joueur trop confort → +spawn ; dépassé → -spawn).
- **Mode Endless** — bouton ♾ après victoire pour continuer, scaling +60% HP / +30% dégâts par tier.

## Modes de jeu

- **Normal** — vagues standards
- **Horde** — ×2 spawn, ennemis 0.6× HP
- **Boss Rush** — uniquement des boss, toutes les 15s
- **Mort instantanée** — 1 PV, dégâts ×100

## Multi-joueur

| Joueurs | Inputs |
|---|---|
| 1 | Tout (clavier + 1 manette) |
| 2 | P1 = WASD + Espace · P2 = Flèches + Entrée |
| 3 | + P3 = Manette 1 |
| 4 | + P4 = Manette 2 |

Chaque joueur a sa **barre de vie/XP/niveau séparée** et choisit ses propres pouvoirs au level-up. Un joueur tombé peut être **ressuscité** par un coéquipier qui reste 3s à proximité.

## Compendium (📖 GUIDE)

Encyclopédie avec 5 onglets : Armes, Passifs, **Évolutions** (recettes), Ennemis (avec leur nid associé), Items.

## Développement local

Le projet utilise **bun** partout (local + CI).

```bash
bun install
bun run dev      # serveur de développement
bun run build    # build de production dans dist/
bun run preview  # preview du build
```

Stack : **Vite + React 18 + Phaser 4** — Phaser pilote la scène de jeu, React gère les overlays (menu, HUD, level-up, boutique, fin de partie). Communication via un event bus interne (`src/game/bus.js`).

## Déploiement

Le workflow `.github/workflows/deploy.yml` build (avec bun) et publie automatiquement sur GitHub Pages à chaque push sur `main`.

## Structure

```
src/
  main.jsx                     # entrée React
  App.jsx                      # racine, monte Phaser + overlays
  i18n.js                      # FR / EN
  ui/
    Menu.jsx                   # écran de démarrage (mode, joueurs, arme)
    HUD.jsx                    # HP/XP/DPS/combo/cooldowns/buffs/bosses
    LevelUpScreen.jsx          # choix de pouvoir + reroll/banish + synergies
    EndScreen.jsx              # défaite/victoire + DamageReport + Continuer
    PauseMenu.jsx              # pause clavier+gamepad
    InventoryOverlay.jsx       # stats détaillées en jeu
    Compendium.jsx             # encyclopédie (5 onglets)
    Shop.jsx                   # boutique méta-progression
    BossTitle.jsx, SceneBg.jsx
    useGamepad.js              # hook gamepad edge-detected
  game/
    config.js                  # GOAL_TIME
    data.js                    # SKILLS, ETYPES, WAVES, ITEMS, EVOLUTIONS, ENEMY_DROPS, helpers
    audio.js                   # SFX + musique procédurale Web Audio (menu/normal/boss)
    bus.js                     # event bus scène ↔ React
    entities.js                # Player, Enemy, Projectile, ChargedBolt, Nest, Minion…
    meta.js                    # gold + permanent upgrades (localStorage)
    PhaserGame.js              # factory Phaser.Game
    scenes/
      GameScene.js             # boucle principale, IA, vagues, level-up, méta
index.html
vite.config.js                 # base: '/nightfall-survivor/' pour GitHub Pages
```
