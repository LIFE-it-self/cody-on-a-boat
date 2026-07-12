// ScubaDiveGame — Cody (a green circle here, since he's swimming) navigates an
// underwater scene from a top-down view. Gold K-fish spawn from the screen
// edges and drift across; touching one collects it. Red K-fish are obstacles
// and cost a life. Win by collecting `targetFish` before the timer runs out
// or lives reach 0.
//
// First minigame to use Arcade Physics — physics is enabled globally in
// src/index.js. The player is a physics-enabled circle, K-fish are physics-
// enabled Containers (sized explicitly so the body has real dimensions),
// and collisions go through `this.physics.add.overlap`.
//
// Not a ritual step. Act 2 setup, gates DinnerService thematically (the
// galley mermaid hints "the K-fish first") but not enforced — DinnerService
// is the actual ritual step 2 and that's the only enforced gate.

import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame.js';
import { playMusic } from '../../systems/MusicManager.js';

const PLAYER_SPEED = 60;

export default class ScubaDiveGame extends BaseMinigame {
  constructor() {
    super('ScubaDiveGame');
  }

  setupGame() {
    playMusic(this, 'bgm-underwater');

    const cfg = (this.levelConfig && this.levelConfig.config) || {};
    this.targetFish = cfg.targetFish || 10;
    this.lives = cfg.lives || 3;
    this.durationMs = cfg.durationMs || 30000;
    this.fishSpawnIntervalMs = cfg.fishSpawnIntervalMs || 600;

    this.hits = 0;
    this.timeLeft = this.durationMs;

    // Touch d-pad state — set on pointerdown, cleared on pointerup/out.
    this.touchLeft = false;
    this.touchRight = false;
    this.touchUp = false;
    this.touchDown = false;

    // Physics world bounds = screen bounds. Player can't leave the visible
    // area; fish are free to drift past the edges (we destroy them in
    // update() when they go off-screen).
    this.physics.world.setBounds(0, 0, 256, 224);

    // ── Background ────────────────────────────────────────────────
    // Painted underwater scene when the art exists; flat deep-blue fallback.
    if (this.textures.exists('bg-scuba-dive')) {
      this.add.image(128, 112, 'bg-scuba-dive').setDepth(0);
    } else {
      this.add.rectangle(128, 112, 256, 224, 0x001a3a).setDepth(0);
    }

    // ── Kelp (decorative, swaying) ────────────────────────────────
    this.createKelp();

    // ── Player ────────────────────────────────────────────────────
    if (this.textures.exists('cody')) {
      this.player = this.add.sprite(128, 112, 'cody').setDisplaySize(16, 16).setDepth(10);
      this.physics.add.existing(this.player);
      this.player.body.setSize(16, 16);
    } else {
      this.player = this.add.circle(128, 112, 8, 0x40c040).setDepth(10);
      this.physics.add.existing(this.player);
      this.player.body.setCircle(8, 0, 0);
    }
    this.player.body.setCollideWorldBounds(true);

    // ── Fish groups + overlap callbacks ───────────────────────────
    // Use regular groups (not physics groups) because physics.add.group()
    // resets body velocity/depth when add() is called. Fish already get
    // individual physics bodies via this.physics.add.existing() in spawnFish().
    this.goldFish = this.add.group();
    this.redFish = this.add.group();
    this.physics.add.overlap(this.player, this.goldFish, this.onGoldHit, null, this);
    this.physics.add.overlap(this.player, this.redFish, this.onRedHit, null, this);

    // ── Spawn loop ────────────────────────────────────────────────
    this.fishTimer = this.time.addEvent({
      delay: this.fishSpawnIntervalMs,
      loop: true,
      callback: this.spawnFish,
      callbackScope: this,
    });

    // ── HUD text (in-scene, not HUDScene) ─────────────────────────
    // Placed at y=24 to sit below HUDScene's "Failures" / "Objective" text
    // which lives near y=4-12.
    this.fishText = this.add.text(8, 24, 'Fish: 0/' + this.targetFish, {
      font: '8px monospace',
      color: '#ffffff',
    }).setDepth(100);

    this.livesText = this.add.text(248, 24, 'Lives: ' + this.lives, {
      font: '8px monospace',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(100);

    this.timerText = this.add.text(128, 200, Math.ceil(this.durationMs / 1000).toString(), {
      font: '12px monospace',
      color: '#ffff80',
    }).setOrigin(0.5).setDepth(100);

    // ── Input ─────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.createTouchButtons();
  }

  // 4 vertical green rectangles at varied x positions, each with a gentle
  // angle yoyo to sway. Decorative only — no physics, no collision.
  createKelp() {
    const positions = [40, 90, 160, 220];
    positions.forEach((x, i) => {
      const kelp = this.add.rectangle(x, 200, 3, 50, 0x2a7a2a).setDepth(1);
      kelp.setOrigin(0.5, 1); // pivot at the base
      this.tweens.add({
        targets: kelp,
        angle: { from: -5, to: 5 },
        duration: 1500 + i * 200,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }

  // 4-button d-pad in the bottom-left corner, mirroring OverworldScene's
  // touch layout. Buttons set/clear touchDir flags; the actual velocity
  // application happens in update().
  createTouchButtons() {
    const defs = [
      { dir: 'up',    x: 38, y: 144, label: '\u2191' },
      { dir: 'down',  x: 38, y: 196, label: '\u2193' },
      { dir: 'left',  x: 12, y: 170, label: '\u2190' },
      { dir: 'right', x: 64, y: 170, label: '\u2192' },
    ];
    defs.forEach(def => {
      const bg = this.add.rectangle(def.x, def.y, 32, 32, 0xffffff, 0.3);
      bg.setStrokeStyle(1, 0xffffff, 0.8);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      const flagName = 'touch' + def.dir.charAt(0).toUpperCase() + def.dir.slice(1);
      bg.on('pointerdown', () => { this[flagName] = true; });
      bg.on('pointerup',   () => { this[flagName] = false; });
      bg.on('pointerout',  () => { this[flagName] = false; });

      const label = this.add.text(def.x, def.y, def.label, {
        font: '12px monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(101);
    });
  }

  spawnFish() {
    if (this.state !== 'PLAY') return;

    const isGold = Math.random() < 0.7;
    const texKey = isGold ? 'k-fish-gold' : 'k-fish-red';
    const color = isGold ? 0xffd040 : 0xff4040;

    const fromRight = Math.random() < 0.5;
    const x = fromRight ? 272 : -16;
    const y = Phaser.Math.Between(40, 180);
    const speed = Phaser.Math.Between(30, 60);
    const vx = fromRight ? -speed : speed;

    let fish;
    if (this.textures.exists(texKey)) {
      fish = this.add.sprite(x, y, texKey).setDisplaySize(20, 16);
      this.physics.add.existing(fish);
      fish.body.setSize(20, 16);
      if (fromRight) fish.setFlipX(true);
    } else {
      // Container fallback — K-shape from three rectangles.
      const verticalBar = this.add.rectangle(-3, 0, 3, 16, color);
      const upperArm = this.add.rectangle(3, -4, 8, 3, color);
      const lowerArm = this.add.rectangle(3, 4, 8, 3, color);
      fish = this.add.container(x, y, [verticalBar, upperArm, lowerArm]);
      fish.setSize(16, 16);
      this.physics.add.existing(fish);
    }
    if (isGold) this.goldFish.add(fish);
    else this.redFish.add(fish);
    fish.setDepth(5);
    fish.body.setVelocity(vx, 0);
  }

  onGoldHit(_player, fish) {
    if (this.state !== 'PLAY') return;
    if (!fish || !fish.active) return;
    fish.destroy();
    this.hits++;
    if (this.fishText && this.fishText.active) {
      this.fishText.setText('Fish: ' + this.hits + '/' + this.targetFish);
    }
    if (this.cache.audio.exists('sfx-splash')) {
      this.sound.play('sfx-splash', { volume: 0.7 });
    }
    if (this.player && this.player.active) {
      if (this.player.setTint) {
        this.player.setTint(0xffff00);
        this.time.delayedCall(100, () => {
          if (this.state === 'PLAY' && this.player && this.player.active) this.player.clearTint();
        });
      } else {
        this.player.setFillStyle(0xffff00);
        this.time.delayedCall(100, () => {
          if (this.state === 'PLAY' && this.player && this.player.active) this.player.setFillStyle(0x40c040);
        });
      }
    }
    if (this.hits >= this.targetFish) this.win();
  }

  onRedHit(_player, fish) {
    if (this.state !== 'PLAY') return;
    if (!fish || !fish.active) return;
    fish.destroy();
    this.lives--;
    if (this.livesText && this.livesText.active) {
      this.livesText.setText('Lives: ' + this.lives);
    }
    if (this.cache.audio.exists('sfx-buzz')) {
      this.sound.play('sfx-buzz', { volume: 0.7 });
    }
    if (this.player && this.player.active) {
      if (this.player.setTint) {
        this.player.setTint(0xff4040);
        this.time.delayedCall(150, () => {
          if (this.state === 'PLAY' && this.player && this.player.active) this.player.clearTint();
        });
      } else {
        this.player.setFillStyle(0xff4040);
        this.time.delayedCall(150, () => {
          if (this.state === 'PLAY' && this.player && this.player.active) this.player.setFillStyle(0x40c040);
        });
      }
    }
    this.cameras.main.shake(150, 0.005);
    if (this.lives <= 0) this.lose();
  }

  // Phaser auto-calls update() on Scene subclasses that define it.
  // BaseMinigame does not define update(), so this is the only update path.
  update(time, delta) {
    if (this.state !== 'PLAY') return;
    if (!this.player || !this.player.body) return;

    // Movement: keyboard + touch flags. Opposite directions cancel.
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown    || this.touchUp;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown  || this.touchDown;

    let vx = 0, vy = 0;
    if (left && !right) vx = -PLAYER_SPEED;
    else if (right && !left) vx = PLAYER_SPEED;
    if (up && !down) vy = -PLAYER_SPEED;
    else if (down && !up) vy = PLAYER_SPEED;
    this.player.body.setVelocity(vx, vy);

    // Timer countdown.
    this.timeLeft -= delta;
    if (this.timerText && this.timerText.active) {
      this.timerText.setText(Math.max(0, Math.ceil(this.timeLeft / 1000)).toString());
    }
    if (this.timeLeft <= 0 && this.hits < this.targetFish) {
      this.lose();
      return;
    }

    // Off-screen fish cleanup. slice() so destroy() during iteration is safe.
    this.goldFish.getChildren().slice().forEach(f => {
      if (f && (f.x < -20 || f.x > 276)) f.destroy();
    });
    this.redFish.getChildren().slice().forEach(f => {
      if (f && (f.x < -20 || f.x > 276)) f.destroy();
    });
  }
}
