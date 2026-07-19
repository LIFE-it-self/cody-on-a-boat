// OverworldScene — renders one boat room at a time and runs the player
// around inside it. Door tiles transition (with a camera fade) to another
// room by restarting this same scene with new init data.

import Phaser from 'phaser';
import { TILE_SIZE, COLORS, TILE_TYPES } from '../constants.js';
import { ROOMS } from '../data/rooms.js';
import { Player } from '../objects/Player.js';
import { Cody } from '../objects/Cody.js';
import { Mermaid } from '../objects/Mermaid.js';
import { GenericNPC } from '../objects/GenericNPC.js';
import { DIALOGS } from '../data/dialogs.js';
import { LEVELS } from '../data/levels.js';
import { EventBus } from '../systems/EventBus.js';
import { assertCanStartRitual } from '../systems/SequenceGuard.js';
import { getNextStep, actMinigameDone } from '../systems/Objective.js';
import { playMusic } from '../systems/MusicManager.js';

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' });
  }

  // Phaser calls init() before create(). It receives the data object passed
  // to scene.start() / scene.restart().
  init(data) {
    this.roomId = (data && data.roomId) || 'main-deck';
    this.spawnOverrideX = data && data.spawnX;
    this.spawnOverrideY = data && data.spawnY;
    this.isTransitioning = false;
    this.dialogActive = false;
    this.npcs = [];
    // Tile of the last soft-blocked ritual trigger. While the player stands
    // on it, update() won't re-fire the blocking dialog every frame; cleared
    // as soon as they step off.
    this.softBlockedAt = null;
  }

  create() {
    this.currentRoom = ROOMS[this.roomId];

    // 1. Render every tile of the room layout. We use simple rectangles
    //    for now (real sprites land in Session 8). Depth ordering: floor
    //    underneath, walls above floor, doors above walls.
    this.renderRoomTiles();

    // 1b. Trigger zones — tiles that launch a minigame on touch. Stored
    //     on `this.triggers` for fast lookup in update(). Yellow `!`
    //     markers are skipped for already-completed levels.
    this.triggers = this.currentRoom.triggers || [];
    this.renderTriggerMarkers();

    // 2. Spawn the player. If the scene was started by a door (override
    //    coords supplied), use those — otherwise use the room's default.
    const spawnX = this.spawnOverrideX != null ? this.spawnOverrideX : this.currentRoom.playerSpawn.x;
    const spawnY = this.spawnOverrideY != null ? this.spawnOverrideY : this.currentRoom.playerSpawn.y;
    this.player = new Player(this, spawnX, spawnY);

    // 3. Keyboard input: arrow keys, polled in update().
    this.cursors = this.input.keyboard.createCursorKeys();

    // 4. On-screen touch buttons — touch devices only. On desktop they just
    //    crowd the map while duplicating the keyboard, so a one-line key
    //    hint replaces them.
    if (this.sys.game.device.input.touch) {
      this.createTouchButtons();
      this.createTalkButton();
    } else {
      this.add.text(4, 214, 'ARROWS move · Z/ENTER talk', {
        font: '8px monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setDepth(100);
    }

    // 5. NPCs. Each room has its own cast of characters.
    if (this.roomId === 'main-deck') {
      this.npcs.push(new Cody(this, 8, 6, 'cody-intro'));
    } else if (this.roomId === 'bar') {
      this.npcs.push(new GenericNPC(this, 4, 6, 'bar-bartender', 'bartender', 0x8080c0));
    } else if (this.roomId === 'galley') {
      // Pre-pipe, the galley crew shouldn't claim you "smell like smoke".
      // Dialog is picked at room entry; the scene restarts on every door
      // traversal so the state is always fresh.
      const pipeDone = (this.game.registry.get('ritualProgress') || []).length >= 1;
      this.npcs.push(new Mermaid(this, 8, 10, pipeDone ? 'galley-mermaid' : 'galley-mermaid-early'));
      this.npcs.push(new GenericNPC(this, 12, 8, pipeDone ? 'galley-cook' : 'galley-cook-early', 'mermaid-2', 0xff69b4));
    } else if (this.roomId === 'bridge') {
      this.npcs.push(new GenericNPC(this, 8, 4, 'bridge-parrot', 'bridge-parrot', 0x40c040));
    } else if (this.roomId === 'cabin-corridor') {
      this.npcs.push(new GenericNPC(this, 8, 10, 'cabin-ghost', 'cabin-ghost', 0x606080));
    }

    // 6. Interact keys: Z and Enter both trigger talk.
    this.input.keyboard.on('keydown-Z', () => this.tryInteract());
    this.input.keyboard.on('keydown-ENTER', () => this.tryInteract());

    // 7. Launch the HUD as a parallel scene if it isn't already running.
    //    The guard is required because OverworldScene restarts on every
    //    door traversal, which would otherwise stack HUDScene instances.
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }

    // 8. Camera fade-in so room transitions feel intentional.
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // 9. Overworld music — continues across room transitions without restart.
    playMusic(this, 'bgm-overworld');
  }

  update() {
    if (this.isTransitioning) return;
    if (this.dialogActive) return;
    if (this.player.isMoving) return;

    // If we just finished tweening onto a door tile, trigger the
    // transition before accepting any more input.
    const tile = this.currentRoom.layout[this.player.tileY][this.player.tileX];
    if (tile === TILE_TYPES.DOOR) {
      this.tryEnterDoor(this.player.tileX, this.player.tileY);
      return;
    }

    // Trigger zones fire once the player lands on their tile, same pattern
    // as doors. Ritual gating lives inside startMinigameForLevel; a
    // soft-blocked trigger stays inert until the player steps off it.
    const trigger = this.triggers.find(t => t.x === this.player.tileX && t.y === this.player.tileY);
    const standingOnBlocked = this.softBlockedAt
      && this.softBlockedAt.x === this.player.tileX
      && this.softBlockedAt.y === this.player.tileY;
    if (trigger && !standingOnBlocked) {
      this.startMinigameForLevel(trigger.levelId);
      return;
    }
    if (!standingOnBlocked) this.softBlockedAt = null;

    // Held-key movement. The if/else chain prevents diagonal moves: only
    // one direction can fire per frame.
    if (this.cursors.left.isDown)       this.handleMove('left');
    else if (this.cursors.right.isDown) this.handleMove('right');
    else if (this.cursors.up.isDown)    this.handleMove('up');
    else if (this.cursors.down.isDown)  this.handleMove('down');
  }

  // Draw a marker at every active trigger tile. Triggers whose level is
  // already in completedMinigames are dormant — no marker, the player walks
  // right over them. Marker language:
  //   yellow `!`          — safe minigame, step on it any time
  //   pulsing red `!`     — ritual step that is READY (right order, act
  //                         minigame cleared)
  //   gray `?`            — ritual step that would refuse to start; stepping
  //                         on it soft-blocks with a hint dialog, no penalty
  renderTriggerMarkers() {
    const done = this.game.registry.get('completedMinigames') || [];
    const nextStep = (this.game.registry.get('ritualProgress') || []).length + 1;
    this.triggers.forEach(t => {
      if (done.includes(t.levelId)) return;
      const level = LEVELS[t.levelId];
      const px = t.x * TILE_SIZE + TILE_SIZE / 2;
      const py = t.y * TILE_SIZE + TILE_SIZE / 2;

      if (level && level.isRitual) {
        const ready = level.ritualStep === nextStep && actMinigameDone(this.game, level);
        if (ready) {
          const marker = this.add.text(px, py, '!', {
            font: '12px monospace',
            color: '#ff4040',
          }).setOrigin(0.5).setDepth(5);
          this.tweens.add({
            targets: marker,
            scale: 1.4,
            duration: 400,
            yoyo: true,
            repeat: -1,
          });
        } else {
          this.add.text(px, py, '?', {
            font: '12px monospace',
            color: '#9090a0',
          }).setOrigin(0.5).setDepth(5);
        }
        return;
      }

      this.add.text(px, py, '!', {
        font: '12px monospace',
        color: '#ffff00',
      }).setOrigin(0.5).setDepth(5);
    });
  }

  // Render every tile in this.currentRoom.layout. Prefers a per-room
  // texture (`tile-<roomId>-<kind>`), falls back to the generic texture
  // (`tile-<kind>`), falls back to a colored rectangle if neither loaded.
  renderRoomTiles() {
    const layout = this.currentRoom.layout;
    const rid = this.currentRoom.id;
    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y].length; x++) {
        const t = layout[y][x];
        let kind, color, depth;
        if (t === TILE_TYPES.WALL)      { kind = 'wall';  color = COLORS.WALL;  depth = 1; }
        else if (t === TILE_TYPES.DOOR) { kind = 'door';  color = COLORS.DOOR;  depth = 2; }
        else                            { kind = 'floor'; color = COLORS.FLOOR; depth = 0; }

        const perRoomKey = `tile-${rid}-${kind}`;
        const genericKey = `tile-${kind}`;
        const texKey = this.textures.exists(perRoomKey) ? perRoomKey
                     : this.textures.exists(genericKey) ? genericKey
                     : null;

        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        if (texKey) {
          const img = this.add.image(px, py, texKey);
          img.setDisplaySize(TILE_SIZE, TILE_SIZE);
          img.setDepth(depth);
        } else {
          this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, color).setDepth(depth);
        }
      }
    }
  }

  // Build a 4-button cross in the bottom-left corner. Buttons sit at
  // depth 100, well above the player (10) and tiles (0-2). Each button is
  // a semi-transparent rectangle with a small arrow text label.
  createTouchButtons() {
    const buttonDefs = [
      { dir: 'up',    x: 38, y: 144, label: '\u2191' }, // ↑
      { dir: 'down',  x: 38, y: 196, label: '\u2193' }, // ↓
      { dir: 'left',  x: 12, y: 170, label: '\u2190' }, // ←
      { dir: 'right', x: 64, y: 170, label: '\u2192' }, // →
    ];

    buttonDefs.forEach(def => {
      // Slightly translucent so the buttons crowd the map art less; the
      // interactive hit area is the full rectangle regardless of alpha.
      const bg = this.add.rectangle(def.x, def.y, 32, 32, 0xffffff, 0.2);
      bg.setStrokeStyle(1, 0xffffff, 0.55);
      bg.setDepth(100);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.handleMove(def.dir));

      const label = this.add.text(def.x, def.y, def.label, {
        font: '12px monospace',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      label.setDepth(101);
    });
  }

  // Try to step the player one tile. The door check happens later, in
  // update(), once the tween has actually arrived at the destination tile.
  handleMove(dir) {
    if (this.isTransitioning) return;
    if (this.dialogActive) return;
    this.player.tryMove(dir, (x, y) => this.canEnter(x, y));
  }

  // Add a TALK button next to the d-pad. Same visual style as the
  // direction buttons. Slightly wider to fit the label.
  createTalkButton() {
    const x = 112;
    const y = 170;
    const bg = this.add.rectangle(x, y, 44, 28, 0xffffff, 0.2);
    bg.setStrokeStyle(1, 0xffffff, 0.55);
    bg.setDepth(100);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.tryInteract());

    const label = this.add.text(x, y, 'TALK', {
      font: '10px monospace',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    label.setDepth(101);
  }

  // Look for any NPC adjacent to the player. If found, launch DialogScene
  // and stage the once-fire 'dialog-complete' subscription. Cody swaps to
  // a hint dialog after the first conversation.
  tryInteract() {
    if (this.dialogActive || this.isTransitioning || this.player.isMoving) return;
    const npc = this.npcs.find(n => n.isAdjacentTo(this.player.tileX, this.player.tileY));
    if (!npc) return;

    let dialogId = npc.dialogId;
    if (dialogId === 'cody-intro' && this.game.registry.get('talkedToCody')) {
      // Re-talking Cody always reports the actual next move so the ritual
      // order is recoverable at any point, not one-shot memory.
      const next = getNextStep(this.game);
      dialogId = next ? `cody-next-${next.level.id}` : 'cody-hint-1';
      if (!DIALOGS[dialogId]) dialogId = 'cody-hint-1';
    }
    const dialog = DIALOGS[dialogId];
    if (!dialog) return;

    this.dialogActive = true;
    if (npc.dialogId === 'cody-intro') {
      this.game.registry.set('talkedToCody', true);
    }
    EventBus.once('dialog-complete', () => this.onDialogComplete(npc));
    this.scene.launch('DialogScene', { lines: dialog.lines, speaker: dialog.speaker });
  }

  // Session 3 used to hard-launch PlaceholderGame here. Session 4 moves
  // minigame entry to spatial trigger tiles in rooms.js, so dialog is now
  // pure narrative — we just clear the input gate and return control.
  onDialogComplete(_npc) {
    this.dialogActive = false;
  }

  // A ritual trigger refused to start. Show the explanatory dialog and mark
  // the tile so update() doesn't re-fire it while the player stands there.
  showBlockedDialog(dialogId) {
    const dialog = DIALOGS[dialogId];
    if (!dialog) return;
    this.softBlockedAt = { x: this.player.tileX, y: this.player.tileY };
    this.dialogActive = true;
    EventBus.once('dialog-complete', () => this.onDialogComplete(null));
    this.scene.launch('DialogScene', { lines: dialog.lines, speaker: dialog.speaker });
  }

  // Trigger-zone landing handler. Validates the level, runs the ritual
  // sequence guard if applicable, then hands off to TransitionScene which
  // shows the title card and launches the actual minigame scene.
  startMinigameForLevel(levelId) {
    if (this.isTransitioning) return;
    const level = LEVELS[levelId];
    if (!level) return;

    // Already cleared? Trigger is dormant — walk right over it.
    const done = this.game.registry.get('completedMinigames') || [];
    if (done.includes(levelId)) return;

    // Ritual gating. A ritual that isn't ready SOFT-BLOCKS: an in-character
    // dialog explains what to do instead, no failure, no hurricane. Two
    // gates: order first (so probing a far-ahead ritual names the expected
    // next STEP rather than that far act's minigame), then the act gate
    // (GAME-DESIGN.md §2) — which by then always names the correct act.
    if (level.isRitual) {
      const expected = (this.game.registry.get('ritualProgress') || []).length + 1;
      if (level.ritualStep !== expected) {
        this.showBlockedDialog(`ritual-blocked-order-${Math.min(expected, 4)}`);
        return;
      }
      if (!actMinigameDone(this.game, level)) {
        this.showBlockedDialog(`ritual-blocked-minigame-${level.act}`);
        return;
      }
      // Safety net — with the gates above this always passes; if it ever
      // doesn't, it emits 'hurricane-fail' and CutsceneRouter takes over.
      if (!assertCanStartRitual(this.game, level.ritualStep)) {
        this.isTransitioning = true;
        return;
      }
    }

    this.isTransitioning = true;
    this.scene.start('TransitionScene', {
      instruction: level.instruction,
      location: level.location,
      hint: level.hint || '',
      nextSceneKey: level.sceneKey,
      nextSceneData: {
        levelConfig: level,
        returnSceneKey: 'OverworldScene',
        returnSceneData: {
          roomId: this.currentRoom.id,
          spawnX: this.player.tileX,
          // Spawn one tile up so the player isn't standing on the trigger
          // when they return — otherwise it would re-fire immediately.
          spawnY: this.player.tileY - 1,
        },
      },
    });
  }

  // Walls block. Out-of-bounds blocks. Floor and door tiles are walkable.
  canEnter(tileX, tileY) {
    const layout = this.currentRoom.layout;
    if (tileY < 0 || tileY >= layout.length) return false;
    if (tileX < 0 || tileX >= layout[0].length) return false;
    return layout[tileY][tileX] !== TILE_TYPES.WALL;
  }

  // The player has just landed on a door tile. Look it up, fade out, and
  // restart the scene with the target room and spawn coords. We use the
  // camerafadeoutcomplete event so the fade actually plays before the
  // restart blows the scene away.
  tryEnterDoor(tileX, tileY) {
    const door = this.currentRoom.doors.find(d => d.x === tileX && d.y === tileY);
    if (!door) return;

    this.isTransitioning = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        roomId: door.targetRoom,
        spawnX: door.spawnX,
        spawnY: door.spawnY,
      });
    });
  }
}
