import Phaser from 'phaser';
import { W, H } from './config.js';
import GameScene from './scenes/GameScene.js';

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    backgroundColor: '#060011',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
    fps: { target: 60, forceSetTimeOut: false },
    input: { activePointers: 3 },
  });
}
