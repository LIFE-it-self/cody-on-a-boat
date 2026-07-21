// LullabyGame — COUNTING SHEEP. Cody (the player) gets sleepy by counting
// sheep: every tap hops the sheep to the next cloud; hopping off the last
// cloud counts one sheep. Count `sheepToCount` sheep before the (generous)
// timer runs out.
//
// Replaced the scrolling-note RhythmBar lullaby in the playtest-notes
// session — the tap-timing mechanic didn't work reliably on phones, so
// this has zero timing pressure: every tap hops, hops always land.
//
// THE TWIST: on winning, the counted sheep line up, flash, and reveal
// themselves to have been HORSES all along. (See also: the horse at the
// bar. The horses know something.)

import { BaseMinigame } from './BaseMinigame.js';
import { playMusic } from '../../systems/MusicManager.js';

// Cloud platform positions, left to right. The sheep enters at cloud 0 and
// exits off-screen right after the last cloud.
const CLOUDS = [
  { x: 40, y: 150 },
  { x: 100, y: 138 },
  { x: 160, y: 150 },
  { x: 220, y: 136 },
];
const HOP_MS = 380;

export default class LullabyGame extends BaseMinigame {
  constructor() {
    super('LullabyGame');
  }

  setupGame() {
    playMusic(this, 'bgm-minigame');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.sheepToCount = cfg.sheepToCount || 3;
    this.totalMs = cfg.totalDurationMs || 30000;
    this.elapsedMs = 0;
    this.counted = 0;
    this.hopping = false;
    this.cloudIndex = 0;
    this.revealing = false;
    this.timers = [];

    // Dreamy night-sky backdrop — painted art when it exists.
    if (this.textures.exists('bg-counting-sheep')) {
      this.add.image(128, 112, 'bg-counting-sheep').setDepth(-100);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x0a1030);
      this.add.circle(224, 32, 12, 0xfff0a0).setDepth(1);
      for (let i = 0; i < 24; i++) {
        this.add.circle((i * 53) % 256, (i * 37) % 120, 1, 0xffffff, 0.8);
      }
    }

    // Cloud platforms — puffs of overlapping circles.
    CLOUDS.forEach(c => {
      this.add.ellipse(c.x, c.y + 8, 46, 16, 0xffffff, 0.95).setDepth(5);
      this.add.circle(c.x - 12, c.y + 4, 8, 0xffffff, 0.95).setDepth(5);
      this.add.circle(c.x + 4, c.y + 1, 10, 0xffffff, 0.95).setDepth(5);
      this.add.circle(c.x + 16, c.y + 5, 7, 0xffffff, 0.95).setDepth(5);
    });

    // HUD.
    this.add.text(8, 16, 'COUNT THE SHEEP', {
      font: '8px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100);

    this.countText = this.add.text(248, 16, `0/${this.sheepToCount} sheep`, {
      font: '8px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    this.timerText = this.add.text(128, 16, Math.ceil(this.totalMs / 1000).toString(), {
      font: 'bold 10px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100);

    const isTouch = this.sys.game.device.input.touch;
    this.add.text(128, 208, isTouch ? 'TAP to hop the sheep' : 'TAP / SPACE to hop the sheep', {
      font: '8px monospace',
      color: '#aaaaff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.spawnSheep();

    this.input.on('pointerdown', () => this.tryHop());
    this.input.keyboard.on('keydown-SPACE', () => this.tryHop());

    this.events.once('shutdown', this.shutdownGame, this);
  }

  pushTimer(t) {
    this.timers.push(t);
    return t;
  }

  makeSheepVisual(x, y) {
    if (this.textures.exists('sheep')) {
      return this.add.sprite(x, y, 'sheep').setDisplaySize(18, 18).setDepth(10);
    }
    // Drawn fallback: fluffy white body + dark head.
    const body = this.add.container(x, y, [
      this.add.ellipse(0, 0, 18, 12, 0xf8f8f8),
      this.add.circle(-8, -2, 5, 0x303030),
      this.add.rectangle(-4, 7, 2, 5, 0x303030),
      this.add.rectangle(4, 7, 2, 5, 0x303030),
    ]).setDepth(10);
    return body;
  }

  spawnSheep() {
    this.cloudIndex = 0;
    const c = CLOUDS[0];
    this.sheep = this.makeSheepVisual(-20, c.y - 10);
    // Drift in from the left onto the first cloud.
    this.hopping = true;
    this.tweens.add({
      targets: this.sheep,
      x: c.x,
      duration: 350,
      ease: 'Sine.Out',
      onComplete: () => { this.hopping = false; },
    });
  }

  tryHop() {
    if (this.state !== 'PLAY' || this.hopping || this.revealing || !this.sheep) return;
    this.hopping = true;

    const lastCloud = this.cloudIndex >= CLOUDS.length - 1;
    const targetX = lastCloud ? 290 : CLOUDS[this.cloudIndex + 1].x;
    const targetY = lastCloud ? CLOUDS[this.cloudIndex].y - 10 : CLOUDS[this.cloudIndex + 1].y - 10;
    const startY = this.sheep.y;

    if (this.cache.audio.exists('sfx-ding')) {
      const s = this.sound.add('sfx-ding');
      s.play({ rate: 1.3, volume: 0.35 });
      this.pushTimer(this.time.delayedCall(220, () => { s.stop(); s.destroy(); }));
    }

    // Arc: linear x, up-and-over y.
    this.tweens.add({ targets: this.sheep, x: targetX, duration: HOP_MS, ease: 'Linear' });
    this.tweens.add({
      targets: this.sheep,
      y: Math.min(startY, targetY) - 26,
      duration: HOP_MS / 2,
      ease: 'Quad.Out',
      yoyo: true,
      onYoyo: () => { if (this.sheep) this.sheep.y = Math.min(startY, targetY) - 26; },
      onComplete: () => {
        if (this.state !== 'PLAY' || !this.sheep) return;
        this.sheep.y = targetY;
        if (lastCloud) {
          this.countSheep();
        } else {
          this.cloudIndex++;
          this.hopping = false;
        }
      },
    });
  }

  countSheep() {
    this.counted++;
    if (this.countText && this.countText.active) {
      this.countText.setText(`${this.counted}/${this.sheepToCount} sheep`);
    }
    // Big dreamy count number floats up.
    const big = this.add.text(128, 100, `${this.counted}`, {
      font: 'bold 28px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(120);
    this.tweens.add({
      targets: big,
      y: 70,
      alpha: 0,
      duration: 800,
      onComplete: () => { if (big.active) big.destroy(); },
    });

    if (this.sheep) { this.sheep.destroy(); this.sheep = null; }

    if (this.counted >= this.sheepToCount) {
      this.revealHorses();
    } else {
      // spawnSheep manages the hopping lock itself (locked until the new
      // sheep's drift-in lands).
      this.pushTimer(this.time.delayedCall(300, () => {
        if (this.state === 'PLAY') this.spawnSheep();
      }));
    }
  }

  // THE TWIST. The counted sheep line up center-stage, flash, and turn out
  // to have been horses all along. Then the win overlay fires.
  revealHorses() {
    this.revealing = true;
    const xs = [80, 128, 176];
    const actors = xs.map(x => this.makeSheepVisual(x, 112));

    this.pushTimer(this.time.delayedCall(700, () => {
      if (this.state !== 'PLAY') return;
      const flash = this.add.rectangle(128, 112, 256, 224, 0xffffff, 0.8).setDepth(150);
      this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

      actors.forEach((a, i) => {
        a.destroy();
        if (this.textures.exists('horse')) {
          this.add.sprite(xs[i], 112, 'horse').setDisplaySize(22, 22).setDepth(151);
        } else {
          this.add.rectangle(xs[i], 112, 18, 16, 0x8b5a2b).setStrokeStyle(1, 0xffffff).setDepth(151);
        }
      });

      this.add.text(128, 84, 'WAIT.', {
        font: 'bold 12px monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(152);
      this.add.text(128, 140, 'THOSE ARE HORSES.', {
        font: 'bold 12px monospace',
        color: '#ffe066',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(152);

      this.pushTimer(this.time.delayedCall(1600, () => {
        if (this.state === 'PLAY') this.win();
      }));
    }));
  }

  update(time, delta) {
    if (this.state !== 'PLAY' || this.revealing) return;
    this.elapsedMs += delta;
    if (this.timerText && this.timerText.active) {
      const remaining = Math.max(0, this.totalMs - this.elapsedMs);
      this.timerText.setText(Math.ceil(remaining / 1000).toString());
    }
    if (this.elapsedMs >= this.totalMs) {
      this.lose();
    }
  }

  shutdownGame() {
    this.timers.forEach((t) => { if (t) t.remove(false); });
    this.timers = [];
  }
}
