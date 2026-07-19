// DialogScene — parallel scene that draws a dialog box at the bottom of
// the screen and types out lines one character at a time. The owning scene
// (OverworldScene) launches it via this.scene.launch('DialogScene', { lines })
// and listens on EventBus for 'dialog-complete' to know when to advance.
//
// Tap or any key advances. If the line is still typing, the first tap
// fast-forwards to the full line. The second tap moves to the next line.

import Phaser from 'phaser';
import { EventBus } from '../systems/EventBus.js';

const TYPEWRITER_DELAY = 30; // ms per character
const INPUT_GRACE = 50;       // ms before listening for advance, prevents the launching tap from immediately advancing

export default class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogScene' });
  }

  init(data) {
    this.lines = (data && data.lines) || [];
    this.speaker = (data && data.speaker) || '';
    this.currentLine = 0;
    this.charIndex = 0;
    this.lineFinished = false;
    this.inputReady = false;
  }

  create() {
    // Translucent dialog box across the bottom 64px of the 256x224 canvas.
    this.add.rectangle(128, 192, 256, 64, 0x000000, 0.75)
      .setDepth(500);

    // Speaker name in gold above the body, so it's always clear WHO is
    // talking (Cody, the Ghost Bartender, The Ritual...). The body shifts
    // down a line to make room; without a speaker it keeps the old layout.
    if (this.speaker) {
      this.add.text(8, 163, this.speaker.toUpperCase(), {
        font: 'bold 8px monospace',
        color: '#ffe066',
      }).setDepth(501);
    }

    // Text body inside the box. wordWrap so multi-line dialog wraps cleanly.
    this.text = this.add.text(8, this.speaker ? 175 : 168, '', {
      font: '8px monospace',
      color: '#ffffff',
      wordWrap: { width: 240 },
    }).setDepth(501);

    // Bound handlers so shutdown() can detach them.
    this.advanceHandler = () => this.advance();

    // Start typing the first line.
    this.startLine();

    // Defer attaching input listeners by INPUT_GRACE ms so the pointerdown
    // that launched this scene doesn't immediately advance us.
    this.time.delayedCall(INPUT_GRACE, () => {
      this.inputReady = true;
      this.input.on('pointerdown', this.advanceHandler);
      this.input.keyboard.on('keydown', this.advanceHandler);
    });

    this.events.once('shutdown', this.shutdown, this);
  }

  startLine() {
    this.charIndex = 0;
    this.lineFinished = false;
    this.text.setText('');
    this.typewriter = this.time.addEvent({
      delay: TYPEWRITER_DELAY,
      repeat: -1,
      callback: this.tickTypewriter,
      callbackScope: this,
    });
  }

  tickTypewriter() {
    const line = this.lines[this.currentLine] || '';
    this.charIndex += 1;
    this.text.setText(line.slice(0, this.charIndex));
    if (this.charIndex >= line.length) {
      this.lineFinished = true;
      if (this.typewriter) this.typewriter.remove(false);
      this.typewriter = null;
    }
  }

  advance() {
    if (!this.inputReady) return;

    // First press while typing = fast-forward to full line.
    if (!this.lineFinished) {
      const line = this.lines[this.currentLine] || '';
      this.charIndex = line.length;
      this.text.setText(line);
      this.lineFinished = true;
      if (this.typewriter) this.typewriter.remove(false);
      this.typewriter = null;
      return;
    }

    // Otherwise, move to the next line — or finish.
    if (this.currentLine < this.lines.length - 1) {
      this.currentLine += 1;
      this.startLine();
      return;
    }

    EventBus.emit('dialog-complete');
    this.scene.stop();
  }

  shutdown() {
    if (this.typewriter) {
      this.typewriter.remove(false);
      this.typewriter = null;
    }
    if (this.advanceHandler) {
      this.input.off('pointerdown', this.advanceHandler);
      this.input.keyboard.off('keydown', this.advanceHandler);
    }
  }
}
