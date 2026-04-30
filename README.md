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

## Pouvoirs

À chaque niveau, choisissez parmi 3 pouvoirs (5 niveaux max chacun).

**Armes**
- 🗡️ **Dague Spectrale** — projectile auto-ciblé, multi-tirs, perçant au max
- 🔥 **Nova de Feu** — explosion en zone autour du joueur
- ⚡ **Foudre Maudite** — chaîne en rebondissant entre les ennemis

**Passifs**
- 🖤 **Cœur des Ténèbres** — PV max + régénération
- 👢 **Bottes du Néant** — vitesse + déblocage du dash
- 🔮 **Amulette du Sang** — dégâts + vol de vie
- 📜 **Grimoire Interdit** — XP + aimant à orbes

## Ennemis

Chauves-souris, zombies, squelettes, fantômes, chevaliers, sorcières… et des **boss** qui apparaissent toutes les vagues, avec un tir en étoile.

## Objets au sol

🧪 soin · 💢 rage · 🛡️ bouclier · ❄️ gel · 💨 sprint · 🌀 aimant XP

## Développement local

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
npm run preview  # preview du build
```

Stack : **Vite + React 18**, rendu sur `<canvas>`, audio via Web Audio API, vibrations via `navigator.vibrate`.

## Déploiement

Le workflow `.github/workflows/deploy.yml` build et publie automatiquement sur GitHub Pages à chaque push sur `main`.

Pour activer : **Repo → Settings → Pages → Source : GitHub Actions**.

## Structure

```
src/
  Nightfall.jsx   # composant principal du jeu (~930 lignes)
  main.jsx        # entrée React
index.html        # template Vite
vite.config.js    # base: './' pour GitHub Pages
```
