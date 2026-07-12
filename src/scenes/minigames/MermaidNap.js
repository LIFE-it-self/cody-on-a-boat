// MermaidNap — Act 4, RITUAL STEP 4 (the final step). Cody is trying to
// sleep in the cabin. Every so often a noise fires (seagull, foghorn, wave
// crash, parrot). The player has `shushWindowMs` milliseconds to tap or
// press SPACE before the noise wakes Cody up. Each missed shush drops
// Cody's sleep level. If sleep hits 0 before the clock runs out, lose.
// Otherwise, once `totalDurationMs` elapses, win.
//
// Ritual bookkeeping: because levels.js marks this as isRitual: true,
// BaseMinigame.win() automatically calls GameStateManager.markRitualStep,
// which emits 'victory' on the EventBus once ritualProgress reaches
// length 4. CutsceneRouter catches that and starts CutsceneScene.
//
// Sequence guard: OverworldScene.startMinigameForLevel calls
// SequenceGuard.assertCanStartRitual externally BEFORE this scene starts.
// Do NOT call it from in here — that would double-check and double-fail.
// (Same pattern as MermaidShower, PipeSmoke, DinnerService.)
//
// Noise timing is deterministic (hard-coded times) for Session 7. Random
// jitter is a Session 8 polish task.
//
// Sleep meter semantics:
//   The plan originally described tracking "wakefulness" 0 -> 100. But
//   PowerMeter colors HIGH values green and LOW values red (intentional
//   from PipeSmoke). Storing raw wakefulness would make the bar read
//   green when Cody is AWAKE (visually wrong). Instead we track
//   "sleepLevel" starting at 100 and calling meter.add(-wakeOnMiss) on
//   each miss. With wakeOnMiss 50, two misses floor the meter at 0 =
//   lose — the finale demands 3 of 4 shushes. Visually correct
//   (green = asleep, red = awake). The label is "CODY ASLEEP" for the
//   same clarity reason.

import { BaseMinigame } from './BaseMinigame.js';
import { PowerMeter } from '../../ui/PowerMeter.js';
import { playMusic } from '../../systems/MusicManager.js';

const NOISE_LABELS = ['SEAGULL!', 'FOGHORN!', 'WAVE CRASH!', 'PARROT!'];
const NOISE_TIMES = [3000, 7500, 12000, 16500];

export default class MermaidNap extends BaseMinigame {
  constructor() {
    super('MermaidNap');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.numNoises = cfg.numNoises || 4;
    this.totalMs = cfg.totalDurationMs || 20000;
    this.shushWindowMs = cfg.shushWindowMs || 2000;
    this.wakeOnMiss = cfg.wakeOnMiss || 25;

    this.elapsedMs = 0;
    this.shushOpen = false;
    this.currentLabel = null;
    this.shushTimer = null;
    this.noiseTimers = [];
    // Noises that have fully resolved (shushed or missed). Once all of them
    // are in, the game ends immediately — no dead air waiting for the clock.
    this.noisesResolved = 0;

    // Nighttime cabin background — the painted scene includes its own
    // moonlit porthole and bunk, so the rect/moon/bed fallbacks are skipped
    // when the art exists. The sleepers below are live actors either way.
    if (this.textures.exists('bg-mermaid-nap')) {
      this.add.image(128, 112, 'bg-mermaid-nap').setDepth(-100);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x001030);

      // Small moon in the corner — atmospheric only.
      this.add.circle(224, 28, 10, 0xfff080).setDepth(1);

      // Bed.
      this.add.rectangle(128, 140, 80, 20, 0x606060)
        .setStrokeStyle(1, 0x909090);
    }

    // Sleeping Cody on the bed.
    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 128, 'cody').setDisplaySize(16, 16).setDepth(10);
    } else {
      this.cody = this.add.rectangle(128, 128, 16, 16, 0x40c040).setDepth(10);
    }

    // Two mermaids flanking the bed, also sleeping.
    if (this.textures.exists('mermaid-1')) {
      this.add.sprite(96, 152, 'mermaid-1').setDisplaySize(14, 18).setDepth(10);
    } else {
      this.add.rectangle(96, 152, 14, 18, 0xff69b4).setDepth(10);
    }
    if (this.textures.exists('mermaid-2')) {
      this.add.sprite(160, 152, 'mermaid-2').setDisplaySize(14, 18).setDepth(10);
    } else {
      this.add.rectangle(160, 152, 14, 18, 0xff69b4).setDepth(10);
    }

    // Small "z" markers over each sleeper as a visual cue.
    this.add.text(96, 134, 'z', {
      font: '10px monospace',
      color: '#aaaaff',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(128, 112, 'z', {
      font: '10px monospace',
      color: '#aaaaff',
    }).setOrigin(0.5).setDepth(11);
    this.add.text(160, 134, 'z', {
      font: '10px monospace',
      color: '#aaaaff',
    }).setOrigin(0.5).setDepth(11);

    // HUD labels.
    this.add.text(8, 16, 'SHUSH THE NOISES', {
      font: '8px monospace',
      color: '#aaaaaa',
    }).setDepth(100);

    this.timerText = this.add.text(248, 16, Math.ceil(this.totalMs / 1000).toString(), {
      font: '8px monospace',
      color: '#ffff80',
    }).setOrigin(1, 0).setDepth(100);

    // Sleep meter — see semantics note at the top of this file.
    // decayPerSec: 0 means we never drain from time; we only subtract
    // on a missed shush via meter.add(-this.wakeOnMiss).
    this.meter = new PowerMeter(this, 16, 188, 224, 12, {
      max: 100,
      initial: 100,
      decayPerSec: 0,
      label: 'CODY ASLEEP',
    });

    // Schedule all noises deterministically.
    for (let i = 0; i < this.numNoises; i++) {
      const at = NOISE_TIMES[i] != null ? NOISE_TIMES[i] : (3000 + i * 4500);
      this.noiseTimers.push(
        this.time.delayedCall(at, () => this.fireNoise(i))
      );
    }

    // Input — tap or SPACE shushes the active noise.
    this.input.on('pointerdown', () => this.tryShush());
    this.input.keyboard.on('keydown-SPACE', () => this.tryShush());

    this.events.once('shutdown', this.shutdownGame, this);
  }

  fireNoise(i) {
    if (this.state !== 'PLAY') return;

    this.shushOpen = true;
    const label = NOISE_LABELS[i] || 'NOISE!';
    this.currentLabel = this.add.text(128, 56, label, {
      font: '16px monospace',
      color: '#ff8040',
    }).setOrigin(0.5).setDepth(200);

    // Small wiggle so the label jumps to catch the eye.
    this.tweens.add({
      targets: this.currentLabel,
      scale: { from: 1.3, to: 1 },
      duration: 150,
    });

    // Close the window after shushWindowMs — counts as a miss if still open.
    this.shushTimer = this.time.delayedCall(this.shushWindowMs, () => {
      if (this.state !== 'PLAY' || !this.shushOpen) return;
      this.shushOpen = false;
      if (this.currentLabel && this.currentLabel.active) {
        this.currentLabel.destroy();
        this.currentLabel = null;
      }

      // Miss penalty — drain the sleep meter. Cody flashes red briefly.
      this.meter.add(-this.wakeOnMiss);
      if (this.cache.audio.exists('sfx-buzz')) {
        this.sound.play('sfx-buzz', { volume: 0.7 });
      }
      if (this.cody && this.cody.active) {
        if (this.cody.setTint) {
          this.cody.setTint(0xff6040);
          this.time.delayedCall(150, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.clearTint();
          });
        } else {
          this.cody.setFillStyle(0xff6040);
          this.time.delayedCall(150, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.setFillStyle(0x40c040);
          });
        }
      }

      if (this.meter.value <= 0) {
        this.lose();
        return;
      }
      this.resolveNoise();
    });
  }

  // A noise finished (shushed or missed). When the last one resolves and
  // Cody is still asleep, win right away after a short beat so the final
  // flash reads before the overlay.
  resolveNoise() {
    this.noisesResolved++;
    if (this.noisesResolved < this.numNoises) return;
    this.time.delayedCall(500, () => {
      if (this.state !== 'PLAY') return;
      if (this.meter.value > 0) this.win();
      else this.lose();
    });
  }

  tryShush() {
    if (this.state !== 'PLAY' || !this.shushOpen) return;

    this.shushOpen = false;
    if (this.cache.audio.exists('sfx-ding')) {
      this.sound.play('sfx-ding', { volume: 0.7 });
    }

    // Cancel the pending miss timer — this shush counts as a hit.
    if (this.shushTimer) {
      this.shushTimer.remove(false);
      this.shushTimer = null;
    }

    // Clear the noise label.
    if (this.currentLabel && this.currentLabel.active) {
      this.currentLabel.destroy();
      this.currentLabel = null;
    }

    // Green success flash — a brief overlay rectangle that fades out.
    const flash = this.add.rectangle(128, 112, 256, 224, 0x40c040, 0.25)
      .setDepth(150);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (flash && flash.active) flash.destroy();
      },
    });

    this.resolveNoise();
  }

  update(time, delta) {
    if (this.state !== 'PLAY') return;

    this.elapsedMs += delta;

    if (this.timerText && this.timerText.active) {
      const remaining = Math.max(0, this.totalMs - this.elapsedMs);
      this.timerText.setText(Math.ceil(remaining / 1000).toString());
    }

    // Win-before-lose ordering (MermaidShower pattern). If the clock
    // runs out on the exact frame that a miss drops meter to 0, the
    // player earned the win — they survived until the end.
    if (this.elapsedMs >= this.totalMs) {
      if (this.meter.value > 0) this.win();
      else this.lose();
      return;
    }
  }

  shutdownGame() {
    this.noiseTimers.forEach((t) => { if (t) t.remove(false); });
    this.noiseTimers = [];
    if (this.shushTimer) {
      this.shushTimer.remove(false);
      this.shushTimer = null;
    }
    if (this.meter) {
      this.meter.destroy();
      this.meter = null;
    }
  }
}
