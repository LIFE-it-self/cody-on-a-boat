import Phaser from 'phaser';
import { playMusic } from '../systems/MusicManager.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Title art (boat on a starry sea) behind everything; text gets a dark
    // stroke so it stays readable over the illustration. Plain navy void
    // when the art hasn't landed yet.
    const hasArt = this.textures.exists('title');
    if (hasArt) {
      this.add.image(w / 2, h / 2, 'title').setDepth(-100);
    }
    const strokeStyle = hasArt ? { stroke: '#000000', strokeThickness: 4 } : {};

    // Title
    this.add.text(w / 2, 60, 'GALAXY BOAT', {
      font: 'bold 24px monospace',
      color: '#ffffff',
      ...strokeStyle,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, 95, 'Get Cody off the boat.', {
      font: '10px monospace',
      color: '#c0c0c0',
      ...strokeStyle,
    }).setOrigin(0.5);

    // Start button (rectangle background + text label)
    const btnBg = this.add.rectangle(w / 2, 150, 88, 24, 0x1f3a93);
    btnBg.setStrokeStyle(1, 0xffffff);
    this.add.text(w / 2, 150, 'START', {
      font: 'bold 12px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Mobile-first: support both pointer (click/touch) and Enter key
    btnBg.setInteractive({ useHandCursor: true });
    const onStart = () => {
      this.scene.start('OverworldScene', { roomId: 'main-deck' });
    };
    btnBg.on('pointerdown', onStart);
    this.input.keyboard.on('keydown-ENTER', onStart);

    // Overworld music starts here; continues into OverworldScene without restart.
    playMusic(this, 'bgm-overworld');
  }
}
