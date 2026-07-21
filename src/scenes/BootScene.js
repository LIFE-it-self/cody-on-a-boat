import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Loading bar — real progress now driven by asset loads.
    const box = this.add.graphics();
    box.fillStyle(0x222222, 0.8);
    box.fillRect(w / 2 - 80, h / 2 - 8, 160, 16);

    const bar = this.add.graphics();
    this.add.text(w / 2, h / 2 - 24, 'Loading...', {
      font: '10px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xffffff, 1);
      bar.fillRect(w / 2 - 78, h / 2 - 6, 156 * value, 12);
    });

    // Log warnings for missing assets instead of crashing.
    this.load.on('loaderror', (file) => {
      console.warn('[BootScene] Failed to load:', file.key, file.url);
    });

    // --- Sprites ---
    this.load.image('captain', 'assets/sprites/captain.png');
    this.load.image('cody', 'assets/sprites/cody.png');
    this.load.image('cody-werewolf', 'assets/sprites/cody-werewolf.png');
    this.load.image('cody-aquaman', 'assets/sprites/cody-aquaman.png');
    this.load.image('mermaid-1', 'assets/sprites/mermaid-1.png');
    this.load.image('mermaid-2', 'assets/sprites/mermaid-2.png');
    this.load.image('k-fish-gold', 'assets/sprites/k-fish-gold.png');
    this.load.image('k-fish-red', 'assets/sprites/k-fish-red.png');
    this.load.image('cabin-ghost', 'assets/sprites/cabin-ghost.png');
    this.load.image('bridge-parrot', 'assets/sprites/bridge-parrot.png');
    this.load.image('bartender', 'assets/sprites/bartender.png');
    // Playtest-notes session additions — files may not exist until the next
    // Claude Design drop; every use site falls back to drawn shapes.
    this.load.image('horse', 'assets/sprites/horse.png');
    this.load.image('sheep', 'assets/sprites/sheep.png');
    this.load.image('cryhole-juice', 'assets/sprites/cryhole-juice.png');

    // --- Tilesets ---
    this.load.image('tile-floor', 'assets/tilesets/floor.png');
    this.load.image('tile-wall', 'assets/tilesets/wall.png');
    this.load.image('tile-door', 'assets/tilesets/door.png');

    // Per-room tileset variants. Keys take the form `tile-<roomId>-<kind>`.
    // OverworldScene.renderRoomTiles() prefers these over the generic
    // keys when available, and the BootScene `loaderror` handler covers
    // any missing file with a console warning.
    const ROOM_IDS = ['main-deck', 'bar', 'galley', 'bridge', 'cabin-corridor'];
    ['floor', 'wall', 'door'].forEach(kind => {
      ROOM_IDS.forEach(rid => {
        this.load.image(`tile-${rid}-${kind}`, `assets/tilesets/${rid}_${kind}.png`);
      });
    });

    // --- Cutscene illustrations ---
    this.load.image('cutscene-hurricane', 'assets/cutscenes/hurricane.png');
    this.load.image('cutscene-aquaman', 'assets/cutscenes/aquaman.png');
    this.load.image('cutscene-victory', 'assets/cutscenes/victory.png');

    // --- Title screen art (256x224) ---
    this.load.image('title', 'assets/backgrounds/title.png');

    // --- Minigame backgrounds (256x224, painted scenes) ---
    // Some of these files may not exist yet (art lands incrementally); the
    // loaderror handler above logs a warning and every use site falls back
    // to the original Phaser-graphics look.
    this.load.image('bg-coke-drink', 'assets/backgrounds/bg-coke-drink.png');
    this.load.image('bg-lullaby', 'assets/backgrounds/bg-lullaby.png');
    this.load.image('bg-pipe-smoke', 'assets/backgrounds/bg-pipe-smoke.png');
    this.load.image('bg-scuba-dive', 'assets/backgrounds/bg-scuba-dive.png');
    this.load.image('bg-dinner-service', 'assets/backgrounds/bg-dinner-service.png');
    this.load.image('bg-motorboat', 'assets/backgrounds/bg-motorboat.png');
    this.load.image('bg-mermaid-shower', 'assets/backgrounds/bg-mermaid-shower.png');
    this.load.image('bg-mermaid-nap', 'assets/backgrounds/bg-mermaid-nap.png');
    this.load.image('bg-counting-sheep', 'assets/backgrounds/bg-counting-sheep.png');
    this.load.image('bg-horse-riddle', 'assets/backgrounds/bg-horse-riddle.png');

    // --- Background music ---
    this.load.audio('bgm-overworld', 'assets/audio/bgm-overworld.mp3');
    this.load.audio('bgm-minigame', 'assets/audio/bgm-minigame.mp3');
    this.load.audio('bgm-underwater', 'assets/audio/bgm-underwater.mp3');
    this.load.audio('bgm-victory', 'assets/audio/bgm-victory.mp3');
    this.load.audio('bgm-fail', 'assets/audio/bgm-fail.mp3');

    // --- Sound effects (compressed to mono MP3 from the original WAVs) ---
    this.load.audio('sfx-howl', 'assets/audio/sfx-howl.mp3');
    this.load.audio('sfx-splash', 'assets/audio/sfx-splash.mp3');
    this.load.audio('sfx-puff', 'assets/audio/sfx-puff.mp3');
    this.load.audio('sfx-ding', 'assets/audio/sfx-ding.mp3');
    this.load.audio('sfx-buzz', 'assets/audio/sfx-buzz.mp3');
    this.load.audio('sfx-hurricane', 'assets/audio/sfx-hurricane.mp3');
  }

  create() {
    // Seed the registry with default game state before any other scene runs.
    GameStateManager.init(this.game);
    this.scene.start('MainMenuScene');
  }
}
