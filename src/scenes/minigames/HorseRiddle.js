// HorseRiddle — the horse at the bar guards VYOOSFRUMTHA CRYHOLE, the only
// fuel the ritual pipe will burn. Answer its riddle correctly to receive
// the substance (recorded simply as 'horse-riddle' in completedMinigames —
// OverworldScene's pipe gate and Objective's routing both check for it).
//
// DinnerService pattern: big tappable answer buttons, no timers, no timing
// windows — phone-safe. A wrong answer is a normal minigame loss (+1 toward
// the hurricane) and the trigger stays live for a retry.

import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame.js';
import { playMusic } from '../../systems/MusicManager.js';

const RIDDLE = {
  question: 'I have four legs.\nI say neigh.\nI am standing in this bar.\nWhat am I?',
  options: [
    { text: 'A horse', correct: true },
    { text: 'A mermaid', correct: false },
    { text: 'Florida', correct: false },
  ],
};

export default class HorseRiddle extends BaseMinigame {
  constructor() {
    super('HorseRiddle');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');
    this.choosing = false;

    // Painted horse close-up when the art exists; otherwise a plain bar-ish
    // backdrop with a drawn horse.
    if (this.textures.exists('bg-horse-riddle')) {
      this.add.image(128, 112, 'bg-horse-riddle').setDepth(-100);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x201418);
    }

    // The horse itself — sprite if loaded, brown rectangle head otherwise.
    if (this.textures.exists('horse')) {
      this.add.sprite(128, 52, 'horse').setDisplaySize(48, 48).setDepth(10);
    } else {
      this.add.rectangle(128, 52, 40, 32, 0x8b5a2b).setStrokeStyle(1, 0xffffff).setDepth(10);
      this.add.text(128, 52, 'HORSE', {
        font: '8px monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(11);
    }

    this.add.text(8, 16, 'THE HORSE SPEAKS', {
      font: '8px monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100);

    // The riddle, center screen.
    this.add.text(128, 100, RIDDLE.question, {
      font: '9px monospace',
      color: '#ffe066',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    // Answer buttons — big touch targets, DinnerService style.
    const shuffled = Phaser.Utils.Array.Shuffle([...RIDDLE.options]);
    shuffled.forEach((opt, i) => {
      const y = 140 + i * 28;
      const bg = this.add.rectangle(128, y, 200, 24, 0x222244);
      bg.setStrokeStyle(1, 0xffffff, 0.8);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onChoose(opt));

      this.add.text(128, y, opt.text, {
        font: '9px monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(101);
    });
  }

  onChoose(option) {
    if (this.state !== 'PLAY' || this.choosing) return;
    this.choosing = true;

    if (option.correct) {
      if (this.cache.audio.exists('sfx-ding')) {
        this.sound.play('sfx-ding', { volume: 0.7 });
      }
      // The horse dispenses the substance: bottle rises from the horse with
      // a slow reveal before BaseMinigame's WIN overlay takes over.
      let bottle;
      if (this.textures.exists('cryhole-juice')) {
        bottle = this.add.sprite(128, 60, 'cryhole-juice').setDisplaySize(16, 24).setDepth(200);
      } else {
        bottle = this.add.rectangle(128, 60, 10, 16, 0x80ffb0).setStrokeStyle(1, 0xffffff).setDepth(200);
      }
      this.tweens.add({
        targets: bottle,
        y: 100,
        scale: bottle.scale * 2,
        duration: 900,
        ease: 'Sine.Out',
      });
      this.add.text(128, 126, 'THE HORSE DISPENSES:', {
        font: '8px monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(200);
      this.add.text(128, 138, 'VYOOSFRUMTHA CRYHOLE', {
        font: 'bold 10px monospace',
        color: '#80ffb0',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(200);

      this.time.delayedCall(1400, () => {
        if (this.state === 'PLAY') this.win();
      });
    } else {
      if (this.cache.audio.exists('sfx-buzz')) {
        this.sound.play('sfx-buzz', { volume: 0.7 });
      }
      this.add.text(128, 126, 'THE HORSE IS DISAPPOINTED.', {
        font: '9px monospace',
        color: '#ff8080',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(200);
      this.time.delayedCall(900, () => {
        if (this.state === 'PLAY') this.lose();
      });
    }
  }
}
