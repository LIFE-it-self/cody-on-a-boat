// MotorboatGame — Act 3, non-ritual. Cody shoves his face into the boat
// dashboard and blows. Player rapid-taps to keep a vertical PowerMeter
// above empty for the configured duration (see levels.js for the live
// numbers). First scene in the project to use the PowerMeter in vertical
// orientation.
//
// Tap inputs (derived from config tapPower / alternateBonus):
//   - Q / W           → alternating +(tapPower - alternateBonus),
//                       same-twice +(tapPower - 2*alternateBonus).
//                       Updates lastAltKey.
//   - Mobile L / R    → mirrors Q/W. Updates lastAltKey.
//   - SPACE           → weakest (+samePower). Does NOT touch lastAltKey —
//                       alternation is the mechanic; single-key mashing
//                       can't keep up with the decay.
//   - Mobile Center   → literal +6. Does NOT touch lastAltKey.
//
// Lose path uses a `stalled` flag: when the meter hits 0 we suspend motion
// and schedule a 1s delayed `this.lose()`. That lets the visual "stall"
// (dim overlay, frozen mermaids, paused wake timer) actually play before
// BaseMinigame's LOSE overlay fires and the scene returns to the bridge.

import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame.js';
import { PowerMeter } from '../../ui/PowerMeter.js';
import { playMusic } from '../../systems/MusicManager.js';

export default class MotorboatGame extends BaseMinigame {
  constructor() {
    super('MotorboatGame');
  }

  setupGame() {
    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.durationMs = cfg.durationMs || 20000;
    this.decayPerSec = cfg.decayPerSec || 50;
    this.tapPower = cfg.tapPower || 12;
    this.alternateBonus = cfg.alternateBonus || 4;
    this.altPower = this.tapPower - this.alternateBonus;          // 8
    this.samePower = this.tapPower - 2 * this.alternateBonus;     // 4
    this.centerPower = 6;                                          // literal per spec

    this.timeLeft = this.durationMs;
    this.lastAltKey = null;
    this.stalled = false;
    this.touchL = false;
    this.touchR = false;
    this.lastSplashTime = 0;

    playMusic(this, 'bgm-minigame');

    // Background — painted dashboard/windshield scene when the art exists;
    // otherwise sky (top half) + sea (bottom half) + dashboard rects.
    if (this.textures.exists('bg-motorboat')) {
      this.add.image(128, 112, 'bg-motorboat').setDepth(-100);
    } else {
      this.add.rectangle(128, 56, 256, 112, 0x4080ff);
      this.add.rectangle(128, 168, 256, 112, 0x204080);
      // Dashboard Cody's face is pressed against.
      this.add.rectangle(128, 140, 200, 16, 0x886844).setStrokeStyle(1, 0xffffff);
    }

    // Cody — pressed into the dashboard from behind.
    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 128, 'cody').setDisplaySize(16, 16);
    } else {
      this.cody = this.add.rectangle(128, 128, 16, 16, 0x40c040);
    }

    // Two mermaids on the dashboard. baseY anchors the sine bounce.
    if (this.textures.exists('mermaid-1')) {
      this.mermaidLeft = this.add.sprite(96, 128, 'mermaid-1').setDisplaySize(12, 16);
    } else {
      this.mermaidLeft = this.add.rectangle(96, 128, 12, 16, 0xff69b4);
    }
    this.mermaidLeft.baseY = 128;
    if (this.textures.exists('mermaid-2')) {
      this.mermaidRight = this.add.sprite(160, 128, 'mermaid-2').setDisplaySize(12, 16);
    } else {
      this.mermaidRight = this.add.rectangle(160, 128, 12, 16, 0xff69b4);
    }
    this.mermaidRight.baseY = 128;

    // Vertical PowerMeter on the right. Starts at 60 so the player has a
    // moment to read the scene before the decay starts biting. x=228 (not
    // 236) so the 25px-wide "POWER" label fits inside the 256px canvas —
    // PowerMeter positions its label at (x, y-10) with origin (0,0).
    this.powerMeter = new PowerMeter(this, 228, 60, 12, 120, {
      max: 100,
      initial: 60,
      decayPerSec: this.decayPerSec,
      orientation: 'vertical',
      label: 'POWER',
    });

    // Instruction label — names the actual desktop keys, since SPACE is the
    // trained tap key everywhere else but is deliberately weak here.
    this.add.text(8, 16, 'ALTERNATE Q/W or L/R!', {
      font: '8px monospace',
      color: '#aaaaaa',
    }).setDepth(100);

    // Countdown text (top-right, clear of the POWER label at ~y=50).
    this.timerText = this.add.text(220, 16, Math.ceil(this.durationMs / 1000).toString(), {
      font: '12px monospace',
      color: '#ffff80',
    }).setOrigin(1, 0).setDepth(100);

    // Wake spray — one looping timer whose delay is re-assigned every
    // frame based on power. Tweened circles, not ParticleEmitter.
    this.wakeTimer = this.time.addEvent({
      delay: 400,
      loop: true,
      callback: this.emitWake,
      callbackScope: this,
    });

    // Desktop input.
    this.input.keyboard.on('keydown-SPACE', () => this.spaceTap());
    this.input.keyboard.on('keydown-Q', () => this.altKeyTap('Q'));
    this.input.keyboard.on('keydown-W', () => this.altKeyTap('W'));

    // Mobile buttons. pointerdown-only (edge trigger) — we want rapid
    // tapping, not held-button behavior.
    this.createTouchButtons();

    // Cleanup on scene shutdown (scene.start on return fires shutdown).
    this.events.once('shutdown', this.shutdownGame, this);
  }

  createTouchButtons() {
    const defs = [
      { x: 34,  label: 'L',   onTap: () => this.altKeyTap('L') },
      { x: 128, label: 'TAP', onTap: () => this.centerTap() },
      { x: 222, label: 'R',   onTap: () => this.altKeyTap('R') },
    ];
    defs.forEach(def => {
      const bg = this.add.rectangle(def.x, 192, 44, 36, 0xffffff, 0.3);
      bg.setStrokeStyle(1, 0xffffff, 0.8);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', def.onTap);
      this.add.text(def.x, 192, def.label, {
        font: '12px monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(101);
    });
  }

  spaceTap() {
    if (this.state !== 'PLAY') return;
    if (this.stalled) return;
    // SPACE is deliberately the weakest input so desktop players have to
    // alternate Q/W like mobile players alternate L/R.
    this.powerMeter.add(this.samePower);
    this._playSplash();
  }

  altKeyTap(key) {
    if (this.state !== 'PLAY') return;
    if (this.stalled) return;
    const power = (this.lastAltKey === key) ? this.samePower : this.altPower;
    this.powerMeter.add(power);
    this.lastAltKey = key;
    this._playSplash();
  }

  centerTap() {
    if (this.state !== 'PLAY') return;
    if (this.stalled) return;
    this.powerMeter.add(this.centerPower);
    this._playSplash();
  }

  _playSplash() {
    if (this.time.now - this.lastSplashTime > 80 && this.cache.audio.exists('sfx-splash')) {
      this.sound.play('sfx-splash', { volume: 0.3 });
      this.lastSplashTime = this.time.now;
    }
  }

  emitWake() {
    if (this.state !== 'PLAY') return;
    if (this.stalled) return;
    // Behind the boat (left of Cody at x=128, offset randomly), at roughly
    // the dashboard level. Small, white, drifts left and fades.
    const spawnX = 96 + Phaser.Math.Between(-4, 4);
    const spawnY = 150 + Phaser.Math.Between(-3, 3);
    const size = Phaser.Math.Between(1, 3);
    const wake = this.add.circle(spawnX, spawnY, size, 0xffffff).setDepth(5);
    this.tweens.add({
      targets: wake,
      x: spawnX - 30,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        if (wake && wake.active) wake.destroy();
      },
    });
  }

  shutdownGame() {
    if (this.wakeTimer) {
      this.wakeTimer.remove(false);
      this.wakeTimer = null;
    }
    if (this.powerMeter) {
      this.powerMeter.destroy();
      this.powerMeter = null;
    }
  }

  update(time, delta) {
    if (this.state !== 'PLAY') return;
    if (!this.powerMeter) return;

    this.powerMeter.decay(delta);

    // Countdown.
    this.timeLeft -= delta;
    if (this.timerText && this.timerText.active) {
      this.timerText.setText(Math.max(0, Math.ceil(this.timeLeft / 1000)).toString());
    }

    // Mermaid bounce — frequency and amplitude scale with power. Use
    // abs(sin) so they only bounce upward and never clip into the dashboard.
    const powerRatio = this.powerMeter.value / 100;  // 0..1
    if (!this.stalled) {
      const bounceFreq = 1 + powerRatio * 4;   // 1..5 Hz
      const bounceAmp = 1 + powerRatio * 3;    // 1..4 px
      const phase = (time / 1000) * bounceFreq * Math.PI * 2;
      this.mermaidLeft.y = this.mermaidLeft.baseY - Math.abs(Math.sin(phase)) * bounceAmp;
      this.mermaidRight.y = this.mermaidRight.baseY - Math.abs(Math.sin(phase + Math.PI / 2)) * bounceAmp;
    }

    // Wake spawn rate: dense spray at high power, nearly none at low.
    if (this.wakeTimer) {
      this.wakeTimer.delay = 400 - powerRatio * 360;  // 40..400 ms
    }

    // Loss path — meter empty. Start the stall effect and wait 1s before
    // actually losing so the stall animation plays.
    if (this.powerMeter.value <= 0 && !this.stalled) {
      this.stalled = true;
      this.add.rectangle(128, 112, 256, 224, 0x000000, 0.4).setDepth(500);
      if (this.wakeTimer) this.wakeTimer.paused = true;
      this.time.delayedCall(1000, () => {
        if (this.state === 'PLAY') this.lose();
      });
      return;
    }

    // Win path — survived the full duration.
    if (this.timeLeft <= 0 && !this.stalled) {
      this.win();
      return;
    }
  }
}
