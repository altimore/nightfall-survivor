import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

let runOptions = { startWeapon: 'dagger' };
export function setOptions(o) { runOptions = { ...runOptions, ...o }; }
export function getOptions() { return runOptions; }

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#060011',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    scene: [GameScene],
    fps: { target: 60, forceSetTimeOut: false },
    input: { activePointers: 3 },
  });
}
