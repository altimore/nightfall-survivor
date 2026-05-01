# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Le projet est piloté avec **bun** partout — local et CI. Pas de `npm`/`pnpm`/`yarn`.

```bash
bun install                   # installer les dépendances
bun install --frozen-lockfile # ce que la CI lance (échoue si bun.lock désync)
bun run dev                   # serveur de développement Vite (HMR)
bun run build                 # build de prod dans dist/
bun run preview               # servir le build pour smoke-test
```

`bun.lock` doit être committé. Pas de suite de tests, pas de linter configurés. Le seul gate de qualité automatique est `bun run build`.

## Déploiement

Push sur `main` → `.github/workflows/deploy.yml` build et publie sur GitHub Pages (`https://altimore.github.io/nightfall-survivor/`). `vite.config.js` fixe `base: '/nightfall-survivor/'` — toute migration vers un autre repo/host nécessite de modifier ce champ, sinon les assets sont 404.

## Architecture

Stack : **Vite + React 18 + Phaser 4** — le moteur de jeu (Phaser) tourne dans un canvas, React gère uniquement les overlays UI (menu, HUD, écran de fin). Le couplage est volontairement minimal :

- `src/App.jsx` monte le `<div>` parent, instancie `Phaser.Game` une fois (`createGame` dans `src/game/PhaserGame.js`), et conserve une `ref` sur l'instance pour gérer les transitions menu ↔ partie ↔ fin.
- `src/game/bus.js` est un **event bus minimaliste** (`Map<event, Set<fn>>`) qui est l'unique canal entre la scène Phaser et React. Tout passe par là :
  - Phaser → React : `bus.emit('phase', 'dead'|'victory')`, `bus.emit('hud:update', {...})`
  - React → Phaser : `bus.emit('game:restart')`, `bus.emit('game:mute', bool)`
  - **Ne jamais importer la scène depuis React (ou inversement) — passer par le bus.**
- `src/game/scenes/GameScene.js` est une scène Phaser unique qui gère toute la boucle (`create`, `update`). Elle utilise `Phaser.Scale.RESIZE` donc `this.W`/`this.H` (getters sur `this.scale.width/height`) doivent être lus à chaque frame, pas mis en cache.
- `src/game/entities.js` — Player, Enemy, Projectile, EnemyProjectile, Item, XpOrb. Ce sont des **POJOs** (pas `Phaser.GameObjects.Sprite`) qui possèdent un `Phaser.GameObjects.Graphics` interne (`gfx`) redessiné chaque frame via `redraw()`. La scène itère ses tableaux (`this.enemies`, `this.projectiles`, …) — pas de groupe Phaser, pas de système d'arcade physics. Les collisions sont des `Math.hypot` manuels dans `update()`. Cleanup : filtrer les tableaux et appeler `entity.destroy()` (qui détruit le `gfx`).
- `src/game/data.js` — toute la **datafication** du gameplay : `SKILLS` (armes + passifs), `ETYPES` (stats par ennemi), `WAVES` (planning du spawn), `ITEMS`, courbe d'XP, plus les helpers `slv`, `refreshStats`, `getChoices`. Pour ajouter une arme/passif/ennemi, étendre ces tables d'abord, brancher la logique dans `GameScene.update()` ensuite.
- `src/game/audio.js` — SFX et musique **procéduraux Web Audio** (oscillateurs + bursts de bruit, séquenceur en `setTimeout`). Pas de fichiers audio. `initAudio()` doit être appelé après une interaction utilisateur (politique autoplay).

### État vs aspirations

`README.md` décrit la roadmap complète (level-up, choix de pouvoirs, 7 types d'ennemis, boss, items, dash, sliders debug). **Le code livré aujourd'hui (`GameScene.js`) est un MVP** : seules la dague auto, les 4 ennemis basiques (`bat`, `zombie`, `skeleton`, `knight`) et le scaling par tier de minute sont implémentés. `data.js` contient déjà les tables (`SKILLS`, `ITEMS`, `WAVES`, ghost/witch/boss, `refreshStats`, `getChoices`) mais **rien dans la scène ne les consomme encore** — c'est l'amorce à brancher pour faire avancer la roadmap.

### Conventions de gameplay

- `dt` est clampé à 50 ms dans `update()` pour éviter les sauts de tunnel ; toute nouvelle physique doit utiliser ce `dt` partagé.
- Joystick virtuel : le **premier doigt** posé devient le joystick (`onPointerDown` mémorise son `id`) ; le 2ᵉ doigt est réservé au dash (futur). Ne pas réutiliser l'id du joystick pour autre chose.
- Spawn : les ennemis apparaissent sur un cercle hors écran (`dist = max(W,H) * 0.58`), pas dans un viewport fixe — c'est volontaire pour le mode plein écran.
- L'event bus n'est pas typé. Quand on ajoute un nouvel événement, le documenter ici en haut, sinon le couplage devient invisible.
