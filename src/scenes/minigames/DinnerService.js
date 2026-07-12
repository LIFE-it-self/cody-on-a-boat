// DinnerService — Ritual Step 2. Three courses, each with three menu options.
// One option is the "most Michelin-worthy" (the most absurd-sounding choice).
// Pick all three correctly to win and advance ritualProgress to [1, 2].
//
// No timer; pure menu-picking. The sequence guard for ritual ordering runs
// in OverworldScene.startMinigameForLevel BEFORE this scene starts, so by
// the time setupGame() runs we know step 1 (pipe) was already done.
// BaseMinigame.win() automatically records ritual step 2 because the level
// config has isRitual: true.
//
// Wrong answers do NOT end the game — they just bump a counter. After all
// three courses, win if wrongCount === 0, else lose.

import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame.js';
import { playMusic } from '../../systems/MusicManager.js';

const COURSES = [
  {
    label: 'Course 1 of 3: APPETIZER',
    options: [
      { text: 'Deconstructed Ocean Foam with Truffle Mist', correct: true },
      { text: 'Fish Sticks', correct: false },
      { text: 'A Single Shoe', correct: false },
    ],
  },
  {
    label: 'Course 2 of 3: ENTREE',
    options: [
      { text: 'Atlantic Lobster on a Cloud of Caviar Smoke', correct: true },
      { text: 'Hot Pocket', correct: false },
      { text: 'Boat Wood', correct: false },
    ],
  },
  {
    label: 'Course 3 of 3: DESSERT',
    options: [
      { text: 'Liquid Nitrogen Sea Urchin Sorbet', correct: true },
      { text: 'A Banana, Unpeeled', correct: false },
      { text: 'Toothpaste', correct: false },
    ],
  },
];

export default class DinnerService extends BaseMinigame {
  constructor() {
    super('DinnerService');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    // Painted dining-room background — default navy when the art is missing.
    if (this.textures.exists('bg-dinner-service')) {
      this.add.image(128, 112, 'bg-dinner-service').setDepth(-100);
    }

    // Header instruction (mirrors CokeDrink/PipeSmoke top-left label).
    this.add.text(8, 16, 'TAP THE MOST MICHELIN CHOICE', {
      font: '8px monospace',
      color: '#aaaaaa',
    }).setDepth(100);

    this.courseIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.choosing = false;
    this.courseUI = [];

    this.showCourse();
  }

  showCourse() {
    if (this.state !== 'PLAY') return;

    // All courses done — evaluate.
    if (this.courseIndex >= COURSES.length) {
      this.clearCourseUI();
      if (this.wrongCount === 0) this.win();
      else this.lose();
      return;
    }

    this.clearCourseUI();
    this.choosing = false;

    const course = COURSES[this.courseIndex];

    // Course label, top-center.
    const label = this.add.text(128, 40, course.label, {
      font: '10px monospace',
      color: '#ffff80',
    }).setOrigin(0.5).setDepth(100);
    this.courseUI.push(label);

    // Defensive copy before shuffling — Phaser.Utils.Array.Shuffle mutates
    // the array in place, so without the spread we'd be permanently
    // reordering the COURSES constant.
    const shuffled = Phaser.Utils.Array.Shuffle([...course.options]);

    shuffled.forEach((opt, i) => {
      const y = 80 + i * 40;

      const bg = this.add.rectangle(128, y, 220, 32, 0x222244);
      bg.setStrokeStyle(1, 0xffffff, 0.8);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onChoose(opt));

      const text = this.add.text(128, y, opt.text, {
        font: '8px monospace',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 210 },
      }).setOrigin(0.5).setDepth(101);

      this.courseUI.push(bg, text);
    });
  }

  onChoose(option) {
    if (this.state !== 'PLAY') return;
    if (this.choosing) return;
    this.choosing = true;

    const isCorrect = !!option.correct;

    const sfxKey = isCorrect ? 'sfx-ding' : 'sfx-buzz';
    if (this.cache.audio.exists(sfxKey)) {
      this.sound.play(sfxKey, { volume: 0.7 });
    }

    // Full-screen flash.
    const flashColor = isCorrect ? 0x40c040 : 0xc04040;
    const flash = this.add.rectangle(128, 112, 256, 224, flashColor, 0.5).setDepth(500);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => { if (flash && flash.active) flash.destroy(); },
    });

    // Rising feedback text.
    const feedbackLabel = isCorrect ? '+1 STAR' : 'WRONG';
    const feedbackColor = isCorrect ? '#ffff80' : '#ff8080';
    const feedback = this.add.text(128, 112, feedbackLabel, {
      font: '16px monospace',
      color: feedbackColor,
    }).setOrigin(0.5).setDepth(600);
    this.tweens.add({
      targets: feedback,
      y: 92,
      alpha: 0,
      duration: 600,
      ease: 'Quad.Out',
      onComplete: () => { if (feedback && feedback.active) feedback.destroy(); },
    });

    if (isCorrect) this.correctCount++;
    else this.wrongCount++;

    this.courseIndex++;
    this.time.delayedCall(800, () => this.showCourse());
  }

  clearCourseUI() {
    if (!this.courseUI) return;
    this.courseUI.forEach(el => {
      if (el && el.active) el.destroy();
    });
    this.courseUI = [];
  }
}
