// CokeDrinkGame — Cody (the player!) drinks a Coke, transforms into a
// werewolf under the rising moon, and must then howl back what he hears:
// a Simon-style MEMORY game on three big note buttons.
//
//   Round 1 — a 2-note pattern, repeated back TWICE.
//   Round 2 — a 4-note pattern, repeated back once.
//
// This replaced the scrolling-note RhythmBar in the playtest-notes
// session — timing windows were unreliable on phones, so the game now has
// zero timing pressure: watch the pattern, tap it back. Wrong taps buzz;
// `mistakesAllowed` total mistakes lose. Big buttons = thumb-friendly.
//
// Three phases via delayedCall:
//   t=0     Phase A — drink (coke tilts down onto Cody, Cody flashes white)
//   t=1000  Phase B — transform (werewolf texture, moon rises)
//   t=2200  Phase C — memory game

import { BaseMinigame } from './BaseMinigame.js';
import { playMusic } from '../../systems/MusicManager.js';

// Note buttons: x position, fill color, and a playback rate that pitches
// the shared ding sample into low / mid / high "howl notes".
const NOTES = [
  { x: 56,  color: 0x4060ff, rate: 0.6 },
  { x: 128, color: 0xffd040, rate: 1.0 },
  { x: 200, color: 0xff5050, rate: 1.5 },
];
const ROUNDS = [
  { length: 2, repeats: 2 },
  { length: 4, repeats: 1 },
];
const FLASH_MS = 350;
const GAP_MS = 150;

export default class CokeDrinkGame extends BaseMinigame {
  constructor() {
    super('CokeDrinkGame');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.mistakesAllowed = cfg.mistakesAllowed || 3;
    this.mistakes = 0;
    this.timers = [];

    // Painted background — falls back to default navy if image is missing.
    if (this.textures.exists('bg-coke-drink')) {
      this.add.image(128, 112, 'bg-coke-drink').setDepth(-100);
    }

    // Phase A: drink ─────────────────────────────────────────────
    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 96, 'cody').setDisplaySize(24, 24).setDepth(10);
    } else {
      this.cody = this.add.rectangle(128, 96, 24, 24, 0x40c040).setDepth(10);
    }
    this.coke = this.add.rectangle(128, 72, 8, 12, 0xff0000).setDepth(11);

    this.tweens.add({
      targets: this.coke,
      y: 90,
      duration: 400,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.state !== 'PLAY' || !this.cody.active) return;
        if (this.cody.setTint) this.cody.setTint(0xffffff);
        else this.cody.setFillStyle(0xffffff);
        this.pushTimer(this.time.delayedCall(150, () => {
          if (this.state === 'PLAY' && this.cody.active) {
            if (this.cody.clearTint) this.cody.clearTint();
            else this.cody.setFillStyle(0x40c040);
          }
        }));
      },
    });

    // Phase B: transform ─────────────────────────────────────────
    this.pushTimer(this.time.delayedCall(1000, () => {
      if (this.state !== 'PLAY') return;
      if (this.coke && this.coke.active) this.coke.destroy();
      if (this.textures.exists('cody-werewolf')) {
        this.cody.setTexture('cody-werewolf');
        this.cody.setDisplaySize(24, 24);
      } else {
        if (this.cody.setFillStyle) this.cody.setFillStyle(0x808080);
        else if (this.cody.setTint) this.cody.setTint(0x808080);
      }
      this.moon = this.add.circle(220, 230, 10, 0xffffff).setDepth(5);
      this.tweens.add({
        targets: this.moon,
        y: 30,
        duration: 900,
        ease: 'Sine.Out',
      });
    }));

    // Phase C: memory game ───────────────────────────────────────
    this.pushTimer(this.time.delayedCall(2200, () => {
      if (this.state !== 'PLAY') return;
      this.startMemoryGame();
    }));

    this.events.once('shutdown', this.shutdownGame, this);
  }

  pushTimer(t) {
    this.timers.push(t);
    return t;
  }

  startMemoryGame() {
    this.add.text(8, 16, 'REPEAT THE HOWL', {
      font: '8px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100);

    this.mistakeText = this.add.text(248, 16, `misses 0/${this.mistakesAllowed}`, {
      font: '8px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    this.statusText = this.add.text(128, 148, '', {
      font: 'bold 10px monospace',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    // The three note buttons — big touch targets across the bottom.
    this.noteButtons = NOTES.map((n, i) => {
      const bg = this.add.rectangle(n.x, 188, 64, 44, n.color, 0.85);
      bg.setStrokeStyle(2, 0xffffff, 0.9);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onNoteTap(i));
      this.add.text(n.x, 188, '♪', {
        font: 'bold 16px monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(101);
      return bg;
    });

    // Desktop can also use keys 1/2/3.
    this.input.keyboard.on('keydown-ONE', () => this.onNoteTap(0));
    this.input.keyboard.on('keydown-TWO', () => this.onNoteTap(1));
    this.input.keyboard.on('keydown-THREE', () => this.onNoteTap(2));

    this.roundIndex = 0;
    this.beginRound();
  }

  beginRound() {
    const round = ROUNDS[this.roundIndex];
    this.pattern = Array.from({ length: round.length }, () =>
      Math.floor(Math.random() * NOTES.length));
    this.repeatsDone = 0;
    this.inputIndex = 0;
    this.showPattern();
  }

  // Werewolf Cody howls the pattern: buttons flash in order, input locked.
  showPattern() {
    this.accepting = false;
    this.setStatus('WATCH...');
    this.pattern.forEach((noteIdx, i) => {
      this.pushTimer(this.time.delayedCall(500 + i * (FLASH_MS + GAP_MS), () => {
        if (this.state !== 'PLAY') return;
        this.flashNote(noteIdx);
        if (this.cody && this.cody.active) {
          this.tweens.add({ targets: this.cody, scale: this.cody.scale * 1.15, duration: 120, yoyo: true });
        }
      }));
    });
    const doneAt = 500 + this.pattern.length * (FLASH_MS + GAP_MS) + 200;
    this.pushTimer(this.time.delayedCall(doneAt, () => {
      if (this.state !== 'PLAY') return;
      this.accepting = true;
      this.updateTurnStatus();
    }));
  }

  updateTurnStatus() {
    const round = ROUNDS[this.roundIndex];
    const suffix = round.repeats > 1 ? `  (${this.repeatsDone + 1} of ${round.repeats})` : '';
    this.setStatus('YOUR TURN' + suffix);
  }

  setStatus(text) {
    if (this.statusText && this.statusText.active) this.statusText.setText(text);
  }

  flashNote(i) {
    const btn = this.noteButtons && this.noteButtons[i];
    if (btn && btn.active) {
      btn.setFillStyle(0xffffff, 1);
      this.pushTimer(this.time.delayedCall(FLASH_MS, () => {
        if (btn.active) btn.setFillStyle(NOTES[i].color, 0.85);
      }));
    }
    this.playNote(i);
  }

  // The shared ding sample pitched into three distinct notes, clipped
  // short so rapid playback doesn't smear.
  playNote(i) {
    if (!this.cache.audio.exists('sfx-ding')) return;
    const s = this.sound.add('sfx-ding');
    s.play({ rate: NOTES[i].rate, volume: 0.6 });
    this.pushTimer(this.time.delayedCall(300, () => {
      if (s) { s.stop(); s.destroy(); }
    }));
  }

  onNoteTap(i) {
    if (this.state !== 'PLAY' || !this.accepting) return;

    if (i === this.pattern[this.inputIndex]) {
      this.flashNote(i);
      this.inputIndex++;
      if (this.inputIndex < this.pattern.length) return;

      // Pattern completed once.
      this.repeatsDone++;
      this.inputIndex = 0;
      const round = ROUNDS[this.roundIndex];
      if (this.repeatsDone < round.repeats) {
        // Lock input over the AGAIN! beat — without this, a touch-bounce
        // double tap on the final note lands on the NEXT repeat's first
        // slot and charges an unfair miss (review finding).
        this.accepting = false;
        this.setStatus('AGAIN!');
        this.pushTimer(this.time.delayedCall(600, () => {
          if (this.state !== 'PLAY') return;
          this.accepting = true;
          this.updateTurnStatus();
        }));
        return;
      }

      // Round cleared.
      this.accepting = false;
      this.roundIndex++;
      if (this.roundIndex >= ROUNDS.length) {
        this.setStatus('AWOOOO!');
        if (this.cache.audio.exists('sfx-howl')) {
          this.sound.play('sfx-howl', { volume: 0.7 });
        }
        this.pushTimer(this.time.delayedCall(1000, () => {
          if (this.state === 'PLAY') this.win();
        }));
      } else {
        this.setStatus('NOW A LONGER ONE...');
        this.pushTimer(this.time.delayedCall(900, () => {
          if (this.state === 'PLAY') this.beginRound();
        }));
      }
      return;
    }

    // Wrong note.
    this.accepting = false;
    this.mistakes++;
    if (this.mistakeText && this.mistakeText.active) {
      this.mistakeText.setText(`misses ${this.mistakes}/${this.mistakesAllowed}`);
    }
    if (this.cache.audio.exists('sfx-buzz')) {
      this.sound.play('sfx-buzz', { volume: 0.6 });
    }
    if (this.cody && this.cody.active) {
      if (this.cody.setTint) this.cody.setTint(0xff4040);
      else this.cody.setFillStyle(0xff4040);
      this.pushTimer(this.time.delayedCall(200, () => {
        if (this.state === 'PLAY' && this.cody && this.cody.active) {
          if (this.cody.clearTint) this.cody.clearTint();
          else this.cody.setFillStyle(0x808080);
        }
      }));
    }

    if (this.mistakes >= this.mistakesAllowed) {
      this.setStatus('THE HOWL IS LOST.');
      this.pushTimer(this.time.delayedCall(800, () => {
        if (this.state === 'PLAY') this.lose();
      }));
      return;
    }

    // Replay the pattern; the current repeat restarts (progress on
    // completed repeats is kept).
    this.setStatus('LISTEN AGAIN...');
    this.inputIndex = 0;
    this.pushTimer(this.time.delayedCall(800, () => {
      if (this.state === 'PLAY') this.showPattern();
    }));
  }

  shutdownGame() {
    this.timers.forEach((t) => { if (t) t.remove(false); });
    this.timers = [];
  }
}
