// CokeDrinkGame — Cody drinks a Coke, transforms into a werewolf under the
// rising moon, and the player has to tap in time with 8 howl notes. Hit at
// least requiredHits of them to win. Not a ritual step (Act 1 setup, not the
// ritual itself).
//
// Three phases handled with delayedCall:
//   t=0     Phase A — drink (coke tilts down onto Cody, Cody flashes white)
//   t=1000  Phase B — transform (gray tint, red eyes, moon rises)
//   t=2000  Phase C — rhythm (RhythmBar with 8 notes at 750ms intervals)
//
// Evaluation runs ~300ms after the last note's hit window closes.

import { BaseMinigame } from './BaseMinigame.js';
import { RhythmBar } from '../../ui/RhythmBar.js';
import { playMusic } from '../../systems/MusicManager.js';

export default class CokeDrinkGame extends BaseMinigame {
  constructor() {
    super('CokeDrinkGame');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.beats = cfg.beats || 8;
    this.required = cfg.requiredHits || 6;
    this.spacing = cfg.noteSpacingMs || 750;

    // Painted background — falls back to default navy if image is missing.
    if (this.textures.exists('bg-coke-drink')) {
      this.add.image(128, 112, 'bg-coke-drink').setDepth(-100);
    }

    // Phase A: drink ─────────────────────────────────────────────
    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 112, 'cody').setDisplaySize(16, 16);
    } else {
      this.cody = this.add.rectangle(128, 112, 16, 16, 0x40c040);
    }
    this.coke = this.add.rectangle(128, 90, 8, 12, 0xff0000);

    this.tweens.add({
      targets: this.coke,
      y: 106,
      duration: 400,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.state !== 'PLAY' || !this.cody.active) return;
        if (this.cody.setTint) this.cody.setTint(0xffffff);
        else this.cody.setFillStyle(0xffffff);
        this.time.delayedCall(150, () => {
          if (this.state === 'PLAY' && this.cody.active) {
            if (this.cody.clearTint) this.cody.clearTint();
            else this.cody.setFillStyle(0x40c040);
          }
        });
      },
    });

    // Phase B: transform ─────────────────────────────────────────
    this.time.delayedCall(1000, () => {
      if (this.state !== 'PLAY') return;
      if (this.coke && this.coke.active) this.coke.destroy();
      if (this.textures.exists('cody-werewolf')) {
        this.cody.setTexture('cody-werewolf');
        this.cody.setDisplaySize(16, 16);
      } else {
        if (this.cody.setFillStyle) this.cody.setFillStyle(0x808080);
        else if (this.cody.setTint) this.cody.setTint(0x808080);
        this.eye1 = this.add.rectangle(124, 108, 2, 2, 0xff0000);
        this.eye2 = this.add.rectangle(132, 108, 2, 2, 0xff0000);
      }
      this.moon = this.add.circle(220, 230, 10, 0xffffff);
      this.tweens.add({
        targets: this.moon,
        y: 30,
        duration: 900,
        ease: 'Sine.Out',
      });
    });

    // Phase C: rhythm ────────────────────────────────────────────
    this.time.delayedCall(2000, () => {
      if (this.state !== 'PLAY') return;

      this.hits = 0;
      this.hitText = this.add.text(248, 16, '0/' + this.beats, {
        font: '8px monospace',
        color: '#ffffff',
      }).setOrigin(1, 0).setDepth(100);

      this.add.text(8, 16, 'TAP IN RHYTHM', {
        font: '8px monospace',
        color: '#aaaaaa',
      }).setDepth(100);

      this.rhythmBar = new RhythmBar(this, 16, 188, 224, 20);
      for (let i = 0; i < this.beats; i++) {
        this.rhythmBar.addNote(1000 + i * this.spacing);
      }
      this.rhythmBar.start();

      this.input.on('pointerdown', () => this.tryHit());
      this.input.keyboard.on('keydown-SPACE', () => this.tryHit());

      const lastNoteAt = 1000 + (this.beats - 1) * this.spacing;
      this.time.delayedCall(lastNoteAt + 300, () => {
        if (this.state !== 'PLAY') return;
        if (this.hits >= this.required) this.win();
        else this.lose();
      });
    });
  }

  tryHit() {
    if (this.state !== 'PLAY' || !this.rhythmBar) return;
    const landed = this.rhythmBar.hit();
    if (landed) {
      this.hits++;
      if (this.hitText && this.hitText.active) {
        this.hitText.setText(this.hits + '/' + this.beats);
      }
      if (this.cache.audio.exists('sfx-howl')) {
        this.sound.play('sfx-howl', { volume: 0.7 });
      }
      // Moon "howl" — quick scale pulse since the moon is already white.
      if (this.moon && this.moon.active) {
        this.tweens.add({
          targets: this.moon,
          scale: { from: 1.3, to: 1 },
          duration: 150,
        });
      }
    } else {
      // Wrong-timing tap — dock a hit so mashing can't clear the game,
      // and flash Cody red briefly.
      if (this.hits > 0) {
        this.hits--;
        if (this.hitText && this.hitText.active) {
          this.hitText.setText(this.hits + '/' + this.beats);
        }
      }
      if (this.cody && this.cody.active) {
        if (this.cody.setTint) this.cody.setTint(0xff4040);
        else this.cody.setFillStyle(0xff4040);
        this.time.delayedCall(100, () => {
          if (this.state === 'PLAY' && this.cody && this.cody.active) {
            if (this.cody.clearTint) this.cody.clearTint();
            else this.cody.setFillStyle(0x808080);
          }
        });
      }
    }
  }
}
