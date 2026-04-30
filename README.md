# Nightfall Survivor

Mini-jeu de survie type *bullet-heaven* vibe-codé en React + Canvas.
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
| Mute / Unmute | bouton 🔊 dans le HUD | bouton 🔊 dans le HUD |

## État actuel — MVP Phaser 4

Le projet vient d'être migré sur **Phaser 4.1**. La version actuelle est un MVP :

- 🗡️ Dague Spectrale qui s'auto-tire vers l'ennemi le plus proche
- Ennemis : Chauve-souris, Zombie, Squelette, Chevalier (déblocage par paliers de temps)
- Scaling de difficulté par tier (toutes les minutes)
- Joystick tactile + clavier
- Audio procédural (Web Audio API)

### Roadmap (à brancher sur la base Phaser)
- Armes Nova de Feu, Foudre Maudite
- Passifs : Cœur, Bottes (dash), Amulette, Grimoire
- Système level up + choix de pouvoirs
- Ennemis Fantôme, Sorcière, Boss avec leurs comportements (charge, kite, phase, boss…)
- Items au sol + buffs (soin, rage, bouclier, gel, sprint, aimant XP)
- Sliders debug

## Développement local

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
npm run preview  # preview du build
```

Stack : **Vite + React 18 + Phaser 4** — Phaser pilote la scène de jeu, React gère les overlays (menu, HUD, fin de partie). Communication via un event bus interne.

## Déploiement

Le workflow `.github/workflows/deploy.yml` build et publie automatiquement sur GitHub Pages à chaque push sur `main`.

Pour activer : **Repo → Settings → Pages → Source : GitHub Actions**.

## Structure

```
src/
  main.jsx                     # entrée React
  App.jsx                      # racine, monte Phaser + overlays
  ui/
    Menu.jsx                   # écran de démarrage
    HUD.jsx                    # barre HP / timer / kills / mute
    EndScreen.jsx              # écran défaite/victoire
  game/
    config.js                  # W, H, GOAL_TIME
    data.js                    # SKILLS, ETYPES, WAVES, ITEMS, XP
    audio.js                   # SFX + musique procédurale
    bus.js                     # event bus scène ↔ React
    entities.js                # Player, Enemy, Projectile…
    PhaserGame.js              # factory Phaser.Game
    scenes/
      GameScene.js             # boucle principale
index.html
vite.config.js                 # base: './' pour GitHub Pages
```
