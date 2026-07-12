// LullabyGame — Act 4 NON-ritual rhythm minigame. Cody is curled up in bed;
// two mermaids hum around him and the player taps in rhythm to sing him a
// lullaby. Reuses the same RhythmBar as CokeDrinkGame, but drops that
// scene's three-phase drink/transform/rhythm intro — the rhythm starts
// almost immediately.
//
// Win: hit at least `requiredHits` of the `beats` notes.
// Lose: anything less than that.
//
// Not a ritual step. Does NOT call markRitualStep or assertCanStartRitual.
// The real ritual finale is MermaidNap, which fires in the same room.
//
// Pattern lifted from CokeDrinkGame.js (RhythmBar usage, pointerdown +
// keydown-SPACE input, delayedCall eval window).

import { BaseMinigame } from './BaseMinigame.js';
import { RhythmBar } from '../../ui/RhythmBar.js';
import { playMusic } from '../../systems/MusicManager.js';

export default class LullabyGame extends BaseMinigame {
  constructor() {
    super('LullabyGame');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.beats = cfg.beats || 8;
    this.required = cfg.requiredHits || 6;
    this.spacing = cfg.noteSpacingMs || 800;
    this.hits = 0;

    // Painted bedroom background (bedframe is part of the art).
    // Falls back to a dark blue solid color + gray bed rect if the image is missing.
    if (this.textures.exists('bg-lullaby')) {
      this.add.image(128, 112, 'bg-lullaby').setDepth(-100);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x101830);
      this.add.rectangle(128, 130, 80, 20, 0x606060)
        .setStrokeStyle(1, 0x909090);
    }

    // Cody on the bed.
    if (this.textures.exists('cody')) {
      this.cody = this.add.sprite(128, 118, 'cody').setDisplaySize(16, 16).setDepth(10);
    } else {
      this.cody = this.add.rectangle(128, 118, 16, 16, 0x40c040).setDepth(10);
    }

    // Two mermaids humming alongside — gentle yoyo to feel alive.
    let mermaidLeft, mermaidRight;
    if (this.textures.exists('mermaid-1')) {
      mermaidLeft = this.add.sprite(96, 142, 'mermaid-1').setDisplaySize(14, 18).setDepth(9);
    } else {
      mermaidLeft = this.add.rectangle(96, 142, 14, 18, 0xff69b4).setDepth(9);
    }
    if (this.textures.exists('mermaid-2')) {
      mermaidRight = this.add.sprite(160, 142, 'mermaid-2').setDisplaySize(14, 18).setDepth(9);
    } else {
      mermaidRight = this.add.rectangle(160, 142, 14, 18, 0xff69b4).setDepth(9);
    }
    this.tweens.add({
      targets: [mermaidLeft, mermaidRight],
      y: '-=3',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Small musical note cues over each mermaid — decorative text only.
    this.add.text(96, 122, '\u266A', {
      font: '10px monospace',
      color: '#ff69b4',
    }).setOrigin(0.5).setDepth(9);
    this.add.text(160, 122, '\u266A', {
      font: '10px monospace',
      color: '#ff69b4',
    }).setOrigin(0.5).setDepth(9);

    // HUD labels.
    this.add.text(8, 16, 'TAP LULLABY', {
      font: '8px monospace',
      color: '#aaaaaa',
    }).setDepth(100);

    this.hitText = this.add.text(248, 16, '0/' + this.beats, {
      font: '8px monospace',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(100);

    // RhythmBar — same geometry and call shape as CokeDrinkGame:77.
    this.rhythmBar = new RhythmBar(this, 16, 188, 224, 20);
    for (let i = 0; i < this.beats; i++) {
      this.rhythmBar.addNote(1000 + i * this.spacing);
    }
    this.rhythmBar.start();

    // Tap OR SPACE both count as a hit attempt.
    this.input.on('pointerdown', () => this.tryHit());
    this.input.keyboard.on('keydown-SPACE', () => this.tryHit());

    // Eval after the last note's hit window closes (~300ms buffer).
    const lastNoteAt = 1000 + (this.beats - 1) * this.spacing;
    this.time.delayedCall(lastNoteAt + 300, () => {
      if (this.state !== 'PLAY') return;
      if (this.hits >= this.required) this.win();
      else this.lose();
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
      if (this.cache.audio.exists('sfx-ding')) {
        this.sound.play('sfx-ding', { volume: 0.7 });
      }
      if (this.cody && this.cody.active) {
        if (this.cody.setTint) {
          this.cody.setTint(0x208020);
          this.time.delayedCall(120, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.clearTint();
          });
        } else {
          this.cody.setFillStyle(0x208020);
          this.time.delayedCall(120, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.setFillStyle(0x40c040);
          });
        }
      }
    } else {
      // Wrong-timing tap — dock a hit so mashing can't clear the game,
      // and flash Cody red briefly (CokeDrinkGame pattern).
      if (this.hits > 0) {
        this.hits--;
        if (this.hitText && this.hitText.active) {
          this.hitText.setText(this.hits + '/' + this.beats);
        }
      }
      if (this.cody && this.cody.active) {
        if (this.cody.setTint) {
          this.cody.setTint(0xff4040);
          this.time.delayedCall(100, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.clearTint();
          });
        } else {
          this.cody.setFillStyle(0xff4040);
          this.time.delayedCall(100, () => {
            if (this.state === 'PLAY' && this.cody && this.cody.active) this.cody.setFillStyle(0x40c040);
          });
        }
      }
    }
  }
}
