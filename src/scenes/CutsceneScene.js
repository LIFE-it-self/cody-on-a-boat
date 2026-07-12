// CutsceneScene — data-driven cutscene player with two modes: 'fail' and
// 'victory'. 'intro' is accepted in the signature as a no-op so Session 8+
// can extend this without changing init().
//
// All art is Phaser graphics primitives (rectangles, circles, triangles,
// text). No PNG preloads. Session 8 will swap in real sprites.
//
// Entry points:
//   - CutsceneRouter starts this scene in response to 'hurricane-fail'
//     (mode='fail') or 'victory' (mode='victory') on the EventBus.
//
// Exit: returnToMenu() resets the registry via GameStateManager.reset()
// and starts MainMenuScene. All other active scenes are stopped first.
//
// Timer hygiene: every this.time.delayedCall handle is tracked in
// this.timers[] via pushTimer(). shutdown() iterates the array and calls
// .remove(false) on each so nothing fires on a dead scene after
// returnToMenu is invoked early.

import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager.js';
import { playMusic, stopMusic } from '../systems/MusicManager.js';

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CutsceneScene' });
  }

  init(data) {
    this.mode = (data && data.mode) || 'fail';
    this.context = (data && data.context) || {};
    this.timers = [];
    this.returning = false;
    this.inputReady = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x000000);

    if (this.mode === 'fail') {
      this.playFail();
    } else if (this.mode === 'victory') {
      this.playVictory();
    } else {
      // 'intro' or anything unknown — just bounce back to the menu.
      this.returnToMenu();
      return;
    }

    this.events.once('shutdown', this.shutdown, this);
  }

  // ─────────────────────────────────────────────────────────────────────
  // FAIL cutscene:
  //   0ms     — screen shake + Cody spins out
  //   1500ms  — hurricane overlay + "FLORIDA SINKS"
  //   4000ms  — Aquaman throne + "CODY RULES THE DEEP"
  //   7000ms  — RETRY button (also arms SPACE/ENTER skip)
  // ─────────────────────────────────────────────────────────────────────
  playFail() {
    playMusic(this, 'bgm-fail');
    if (this.cache.audio.exists('sfx-hurricane')) {
      this.sound.play('sfx-hurricane', { volume: 0.7 });
    }
    this.cameras.main.shake(1000, 0.01);

    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 112, 'cody').setDisplaySize(16, 16).setDepth(10);
    } else {
      this.cody = this.add.rectangle(128, 112, 16, 16, 0x40c040).setDepth(10);
    }
    this.tweens.add({
      targets: this.cody,
      angle: 720,
      scaleX: 6,
      scaleY: 6,
      duration: 1500,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.cody && this.cody.active) this.cody.destroy();
      },
    });

    this.pushTimer(this.time.delayedCall(1500, () => this.showHurricane()));
    this.pushTimer(this.time.delayedCall(4000, () => this.showAquaman()));
    this.pushTimer(this.time.delayedCall(7000, () => this.showRetryButton()));
  }

  showHurricane() {
    if (this.state === 'DEAD') return;
    if (this.textures.exists('cutscene-hurricane')) {
      const img = this.add.image(128, 112, 'cutscene-hurricane');
      img.setDisplaySize(256, 224).setDepth(50);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x203040);
      this.hurricane = this.add.circle(128, 112, 80, 0x606060);
      this.tweens.add({
        targets: this.hurricane,
        angle: 360,
        duration: 2000,
        repeat: -1,
      });
    }
    this.add.text(128, 100, 'HURRICANE', {
      font: '16px monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(100);
    this.add.text(128, 124, 'FLORIDA SINKS', {
      font: '10px monospace',
      color: '#ffcccc',
    }).setOrigin(0.5).setDepth(100);
  }

  showAquaman() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.add.rectangle(128, 112, 256, 224, 0x000000).setDepth(500);

    if (this.textures.exists('cutscene-aquaman')) {
      const img = this.add.image(128, 112, 'cutscene-aquaman');
      img.setDisplaySize(256, 224).setDepth(501);
    } else {
      // Fallback: teal throne + Aquaman Cody + trident.
      this.add.rectangle(128, 108, 64, 64, 0x40a0a0)
        .setStrokeStyle(1, 0xffff80).setDepth(501);
      this.add.rectangle(128, 96, 16, 16, 0x40a0a0)
        .setStrokeStyle(1, 0xffff80).setDepth(502);
      this.add.rectangle(128, 76, 4, 20, 0xffff80).setDepth(502);
    }

    this.add.text(128, 152, 'CODY RULES THE DEEP', {
      font: '12px monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(503);

    this.add.text(128, 170, 'FLORIDA IS NO MORE.', {
      font: '10px monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(503);
  }

  showRetryButton() {
    const btn = this.add.rectangle(128, 200, 88, 20, 0x000000)
      .setStrokeStyle(1, 0xffffff)
      .setDepth(510);
    this.add.text(128, 200, 'RETRY', {
      font: '12px monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(511);

    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.returnToMenu());

    // Keyboard wiring happens here (not in create) so SPACE/ENTER can't
    // skip the entire spin/hurricane/aquaman sequence before it plays.
    this.input.keyboard.on('keydown-SPACE', () => this.returnToMenu());
    this.input.keyboard.on('keydown-ENTER', () => this.returnToMenu());
  }

  // ─────────────────────────────────────────────────────────────────────
  // VICTORY cutscene:
  //   fade in 1s on beach + sun + Cody
  //   credits scroll bottom -> top over 12s
  //   skip armed after 400ms (last MermaidNap tap grace)
  // ─────────────────────────────────────────────────────────────────────
  playVictory() {
    playMusic(this, 'bgm-victory');

    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Beach scene. Prefers the painted victory illustration (Cody waking on
    // the morning shore); falls back to the Session 7 sky/sun/beach rects.
    const hasArt = this.textures.exists('cutscene-victory');
    if (hasArt) {
      this.add.image(128, 112, 'cutscene-victory').setDisplaySize(256, 224);
    } else {
      this.add.rectangle(128, 60, 256, 120, 0x60a0ff);
      this.add.circle(200, 40, 20, 0xfff080);
      this.add.rectangle(128, 172, 256, 104, 0xf0d080);
      if (this.textures.exists('cody')) {
        this.add.sprite(128, 160, 'cody').setDisplaySize(16, 16);
      } else {
        this.add.rectangle(128, 160, 16, 16, 0x40c040);
      }
    }

    // Title is baked into the scrolling credits block so it can't collide
    // with the credit lines as they pass through the same y-coordinates.
    const creditsString = [
      'CODY GOT OFF THE BOAT.',
      '',
      '',
      'A GALAXY BOAT PRODUCTION',
      '',
      'Captain Chowder John ... You',
      'Cody ... Cody',
      'The Mermaids ... Local Mermaids',
      '',
      'No hurricanes were summoned.',
      'Florida is safe.',
      '',
      'THE END',
    ].join('\n');

    const credits = this.add.text(128, 240, creditsString, {
      font: '10px monospace',
      color: '#ffffff',
      align: 'center',
      // Dark stroke keeps the credits legible over the bright beach art.
      stroke: '#000000',
      strokeThickness: hasArt ? 3 : 0,
    }).setOrigin(0.5, 0).setDepth(100);

    this.tweens.add({
      targets: credits,
      y: -200,
      duration: 12000,
      ease: 'Linear',
      onComplete: () => this.returnToMenu(),
    });

    // Skip handler — deferred so the pointerdown that won MermaidNap
    // doesn't instantly skip the cutscene.
    const skip = () => { if (this.inputReady) this.returnToMenu(); };
    this.pushTimer(this.time.delayedCall(400, () => {
      this.inputReady = true;
      this.input.on('pointerdown', skip);
      this.input.keyboard.on('keydown-SPACE', skip);
      this.input.keyboard.on('keydown-ENTER', skip);
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  // Shared helpers
  // ─────────────────────────────────────────────────────────────────────
  returnToMenu() {
    if (this.returning) return;
    this.returning = true;

    stopMusic(this);

    // Zero out registry so the next run starts clean (failureCount=0,
    // ritualProgress=[], completedMinigames=[], talkedToCody=false, ...).
    GameStateManager.reset(this.game);

    // Stop every other active/paused scene before starting MainMenu so
    // no stale HUD/Overworld rect leaks through.
    this.scene.manager.scenes.forEach((s) => {
      const key = s.scene.key;
      if (key === 'CutsceneScene' || key === 'MainMenuScene') return;
      if (this.scene.isActive(key) || this.scene.isPaused(key)) {
        this.scene.stop(key);
      }
    });

    this.scene.start('MainMenuScene');
  }

  pushTimer(handle) {
    this.timers.push(handle);
    return handle;
  }

  shutdown() {
    this.timers.forEach((t) => { if (t) t.remove(false); });
    this.timers = [];
  }
}
