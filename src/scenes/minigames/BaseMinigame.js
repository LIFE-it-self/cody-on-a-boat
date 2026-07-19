// BaseMinigame — abstract base class for every minigame and ritual step
// in Cody On A Boat. Subclasses override setupGame() and call this.win() or
// this.lose() from inside.
//
// IMPORTANT: This file is the contract. It is NOT modified again in any
// future session. Future minigames extend it. If you ever feel the urge
// to edit this file from a minigame file, that's a smell — find another
// way (subclass override, levelConfig flag, EventBus message, etc.).
//
// Lifecycle:
//   IDLE  -> set in constructor
//   PLAY  -> set in create() right before setupGame() runs
//   WIN   -> set in win()  (guarded against double-fire)
//   LOSE  -> set in lose() (guarded against double-fire)
//
// The TITLE_CARD / INSTRUCTION steps from the original lifecycle live in
// TransitionScene, which always runs before this scene starts.

import Phaser from 'phaser';
import { GameStateManager } from '../../systems/GameStateManager.js';

export class BaseMinigame extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.state = 'IDLE';
  }

  // ───────── Subclasses must override ─────────

  // Called once when the scene transitions into PLAY. Subclass creates
  // sprites, hooks up input, starts timers, etc.
  setupGame() {}

  // Optional. Called by the subclass when the game ends. Subclass should
  // call this.win() or this.lose() from inside.
  evaluate() {}

  // ───────── Standard lifecycle (do not override) ─────────

  init(data) {
    this.levelConfig = (data && data.levelConfig) || {};
    this.returnSceneKey = (data && data.returnSceneKey) || 'OverworldScene';
    this.returnSceneData = (data && data.returnSceneData) || {};
    this.state = 'IDLE';
  }

  create() {
    this.cameras.main.setBackgroundColor(0x000020);
    this.state = 'PLAY';
    this.setupGame();
  }

  win() {
    if (this.state === 'WIN' || this.state === 'LOSE') return;
    this.state = 'WIN';
    GameStateManager.markMinigameComplete(this.game, this.levelConfig.id);
    if (this.levelConfig.isRitual) {
      GameStateManager.markRitualStep(this.game, this.levelConfig.ritualStep);
    }
    this.showResultOverlay('WIN!', 0x40c040, () => {
      this.scene.start(this.returnSceneKey, this.returnSceneData);
    });
  }

  lose() {
    if (this.state === 'WIN' || this.state === 'LOSE') return;
    this.state = 'LOSE';
    GameStateManager.recordFailure(this.game);
    this.showResultOverlay('LOSE', 0xc04040, () => {
      // If recordFailure pushed us over the threshold, CutsceneRouter has
      // already caught 'hurricane-fail' and its microtask will stop this
      // scene and start CutsceneScene, overriding this scene.start().
      this.scene.start(this.returnSceneKey, this.returnSceneData);
    });
  }

  showResultOverlay(text, color, onComplete) {
    const overlay = this.add.rectangle(128, 112, 256, 224, color, 0.6).setDepth(900);
    const label = this.add.text(128, 112, text, {
      font: '24px monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(901);
    this.time.delayedCall(1200, () => {
      overlay.destroy();
      label.destroy();
      onComplete();
    });
  }
}
