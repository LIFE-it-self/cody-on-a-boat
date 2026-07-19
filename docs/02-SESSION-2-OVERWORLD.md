# Cody On A Boat — Session 2: Overworld + Rooms

> **For the human (you):** This is Session 2 of 10. Open a fresh Claude Code chat in your `cody-on-a-boat` directory (`cd ~/code/cody-on-a-boat && claude`). Copy everything below the `---` line and paste as your first message. Approve commands as Claude Code asks.

---

You are helping me build **Cody On A Boat**, a browser-based pixel-art mini-RPG in Phaser 3. This is **Session 2 of 10**. I am not a software engineer — please be explicit about every step, explain what each command and file does, and ask my permission before doing anything that touches my system, makes a commit, or pushes to GitHub.

## Goal of this session

By the end of this session:
- The player (Captain Chowder John, drawn as a blue 16×16 rectangle) walks around in 4-direction tile-snapped movement.
- **4 boat rooms** exist as plain JS arrays in `src/data/rooms.js`: Main Deck, Bar, Galley, Bridge.
- Each room renders correctly when entered, with walls and floors as colored tiles.
- The player can walk through **door tiles** to transition between rooms with a camera fade.
- The game works with keyboard arrows AND on-screen touch buttons (mobile-first from the start).

## Where we are

Session 1 is complete. The repo has:
- A working Phaser 3 + Vite project deployed to GitHub Pages.
- `src/index.js` with Phaser config (256×224, pixelArt true, scenes registered).
- `src/scenes/BootScene.js` (loading bar → MainMenuScene).
- `src/scenes/MainMenuScene.js` (title + Start button that currently does nothing).
- `CLAUDE.md` and `docs/PHASE_LOG.md` filled in for Session 1.

## Required reading before you start

Read these files first and confirm to me you've read them:
1. `CLAUDE.md` — project rules and stack
2. `docs/GAME-DESIGN.md` — full game design (especially section 4 "Boat overworld" and section 7 "Tech stack and architecture")
3. `docs/PHASE_LOG.md` — what's been built so far

## Hard constraints (do not violate)

- **No Tiled.** Rooms are JS arrays in code. Do NOT install or recommend Tiled.
- **No Grid Engine plugin.** Custom tile-snapped movement only. Do NOT install or recommend Grid Engine.
- **Mobile input from day one.** Every input should respond to BOTH keyboard and touch.
- Vanilla JS, no TypeScript.
- Stick to placeholder visuals (colored rectangles). Real sprites come in Session 8.

## Tasks for this session

Do these tasks in order. Pause and ask me before running terminal commands or making bulk file changes.

### Task 1: Quick sanity check

```bash
git status
git pull
npm run dev
```

Open the dev server URL in Chrome and confirm the Main Menu still works from Session 1. If it doesn't, stop and tell me. Once confirmed, kill the dev server (Ctrl+C) so we can make changes.

### Task 2: Create `src/constants.js`

This file holds magic numbers used across the project. Create it with:

- `TILE_SIZE = 16`
- `ROOM_WIDTH_TILES = 16` (16 tiles wide × 16 px = 256 px, matches our internal width)
- `ROOM_HEIGHT_TILES = 14` (14 tiles tall × 16 px = 224 px, matches our internal height)
- `PLAYER_SPEED = 4` (tiles per second; movement is tile-snapped, this controls move speed)
- `COLORS` — an object with placeholder color values (numbers, not strings, since Phaser uses 0xRRGGBB):
  - `FLOOR: 0x4a3a2a` (brown wood)
  - `WALL: 0x222222` (dark gray)
  - `DOOR: 0xc8a050` (gold-ish)
  - `PLAYER: 0x4080ff` (blue)
  - `CODY: 0x40c040` (green)
  - `INTERACT_ZONE: 0xffff00` (yellow, for "!" markers)
  - `BG: 0x0a0e27` (dark navy)
- `TILE_TYPES` — an object mapping symbols used in room arrays to tile metadata: `FLOOR: 0`, `WALL: 1`, `DOOR: 2`. Doors will be detailed in `rooms.js`.

Export everything as named exports.

### Task 3: Create `src/data/rooms.js`

This is the heart of the overworld. Create a single file that exports an object `ROOMS` with 4 room definitions. Each room is a plain JS object with:

```javascript
{
  id: 'main-deck',
  displayName: 'Main Deck',
  // 14 rows × 16 columns. 0 = floor, 1 = wall, 2 = door (door cells get extra metadata in `doors`)
  layout: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // ... 12 more rows, last one all walls
  ],
  doors: [
    // each door cell in the layout that should transition to another room
    { x: 8, y: 13, targetRoom: 'bar', spawnX: 8, spawnY: 1 },
    // x,y are tile coordinates (0-indexed). targetRoom is the room id.
    // spawnX, spawnY are the player's spawn tile in the destination room.
  ],
  playerSpawn: { x: 8, y: 7 },  // default spawn when entering this room (used if no door specifies otherwise)
}
```

The 4 rooms to create:

1. **`main-deck`** — biggest room. Floor most of the interior. Walls around the edge. One door at the bottom-center leading to `bar`. One door at the top-center leading to `bridge`.
2. **`bar`** — smaller room. Floor + walls. Door at the top going back to `main-deck`. Door at the right going to `galley`.
3. **`galley`** — medium room. Door at the left back to `bar`. (The galley has multiple uses in later sessions — minigame triggers and dinner ritual.)
4. **`bridge`** — small room. Door at the bottom back to `main-deck`.

For now, all rooms are simple rectangles (interior is all 0s, perimeter is all 1s, with door cells set to 2). Don't try to design fancy layouts — we just need playable connectivity. Use comments inside the file to label which row/column each door is on.

Export as a named export `ROOMS`.

### Task 4: Create `src/objects/Player.js`

The Player class wraps a Phaser game object with tile-snapped 4-direction movement. Make it a plain class (not a Phaser plugin) with this interface:

```javascript
import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants.js';

export class Player {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.isMoving = false;
    // create a 16×16 blue rectangle at the right pixel position
    this.sprite = scene.add.rectangle(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE,
      TILE_SIZE,
      COLORS.PLAYER
    );
    this.sprite.setDepth(10);
  }

  // Try to move one tile in a direction. Returns true if moved.
  // dir is one of 'up', 'down', 'left', 'right'.
  // canEnter(tileX, tileY) is a callback the OverworldScene provides for collision checks.
  tryMove(dir, canEnter) {
    if (this.isMoving) return false;
    let dx = 0, dy = 0;
    if (dir === 'up') dy = -1;
    else if (dir === 'down') dy = 1;
    else if (dir === 'left') dx = -1;
    else if (dir === 'right') dx = 1;
    const nextX = this.tileX + dx;
    const nextY = this.tileY + dy;
    if (!canEnter(nextX, nextY)) return false;
    this.isMoving = true;
    this.tileX = nextX;
    this.tileY = nextY;
    // tween to the new pixel position
    this.scene.tweens.add({
      targets: this.sprite,
      x: nextX * TILE_SIZE + TILE_SIZE / 2,
      y: nextY * TILE_SIZE + TILE_SIZE / 2,
      duration: 150,
      onComplete: () => { this.isMoving = false; },
    });
    return true;
  }
}
```

This is the core. Don't add walking animations or other features yet — just tile-snapped movement.

### Task 5: Create `src/scenes/OverworldScene.js`

This is the scene that renders a room and runs the player around. Key behaviors:

- Receives data on init: `{ roomId: string, spawnX?: number, spawnY?: number }`. If no spawn provided, uses the room's `playerSpawn`.
- In `create()`:
  1. Look up the room from `ROOMS[roomId]`. Stash it as `this.currentRoom`.
  2. Render every tile of `currentRoom.layout` as a `this.add.rectangle` at the correct position. Use `COLORS.FLOOR`, `COLORS.WALL`, or `COLORS.DOOR` based on the value. Set depth = 0 for floor, 1 for walls, 2 for doors.
  3. Create the Player at the spawn position.
  4. Set up keyboard input: `this.cursors = this.input.keyboard.createCursorKeys()`.
  5. Set up touch input: create 4 on-screen direction buttons in the bottom area of the screen using `this.add.rectangle` + `setInteractive()`. Each button stores a `dir` ('up', 'down', 'left', 'right') and on `pointerdown` calls `this.handleMove(dir)`. Tag them with depth 100 so they sit on top of the room. Make them small enough not to obscure the room (~20px each, in a cross pattern).
  6. Camera fade-in (`this.cameras.main.fadeIn(300, 0, 0, 0)`).
- In `update()`:
  - If `cursors.left.isDown`, `handleMove('left')`. Same for right/up/down.
- `handleMove(dir)`:
  - Calls `this.player.tryMove(dir, (x, y) => this.canEnter(x, y))`.
  - After movement, check if the new tile is a door → call `this.tryEnterDoor(x, y)`.
- `canEnter(tileX, tileY)`:
  - Returns false if out of bounds or if `currentRoom.layout[tileY][tileX] === 1` (wall).
  - Returns true otherwise.
- `tryEnterDoor(tileX, tileY)`:
  - Find a door in `currentRoom.doors` matching this tile.
  - If found, fade out the camera, then `this.scene.restart({ roomId: door.targetRoom, spawnX: door.spawnX, spawnY: door.spawnY })`.

Add this scene to the scene list in `src/index.js`. The Start button in MainMenuScene should NOW transition to OverworldScene with `{ roomId: 'main-deck' }` (replace the placeholder console log).

### Task 6: Touch input QA

Open Chrome dev tools (Cmd+Option+I), click the device toolbar icon (top-left of dev tools, looks like phone+tablet) to enter mobile emulation mode. Pick "iPhone 14 Pro" or similar. Reload.

You should see:
- The game scaled down to fit the phone screen.
- The 4 direction buttons visible at the bottom.
- Tapping the direction buttons moves the player one tile per tap.

If the buttons are too small, too big, or in the wrong place, adjust their size/position in OverworldScene.

### Task 7: Manual playtest

With the dev server running:

1. Open `http://localhost:5173` in Chrome (desktop mode).
2. Click Start.
3. Walk around Main Deck with arrow keys. Verify you can't walk through walls.
4. Walk to the door at the bottom of Main Deck. Verify you transition (with a fade) to the Bar.
5. From Bar, walk to the door on the right. Verify you transition to Galley.
6. From Galley, walk back to Bar. From Bar back to Main Deck. From Main Deck through the top door to Bridge.
7. Repeat in mobile emulation mode using touch buttons.

If any door doesn't lead where it should, fix the `targetRoom`/`spawnX`/`spawnY` fields in `rooms.js`.

## Verification

**All** of these must be true before we end the session:

- [ ] Starting the game from the Main Menu loads OverworldScene with Main Deck visible.
- [ ] The player (blue square) appears at the room's spawn point.
- [ ] Arrow keys move the player one tile at a time, smoothly tweened over ~150ms.
- [ ] The player cannot walk through walls.
- [ ] All 4 doors function correctly: Main Deck ↔ Bar ↔ Galley, Main Deck ↔ Bridge.
- [ ] After walking through a door, the camera fades out and back in, and the player spawns at the correct tile in the new room.
- [ ] The 4 on-screen touch buttons work in Chrome's mobile emulation mode.
- [ ] No console errors in the browser dev tools.
- [ ] `git status` shows only the new/modified files we created in this session.

## Before ending the session

### 1. Update `CLAUDE.md`

In the "Architecture" section, add a new bullet:

```
- Rooms are JS arrays in src/data/rooms.js. Each room has a layout (2D array), doors (with target room + spawn coords), and a default playerSpawn. Add new rooms by adding entries here, no other code changes needed for the room data itself.
```

In the "Current phase" section, replace with:

```
Session 2 complete. 4 boat rooms (Main Deck, Bar, Galley, Bridge) playable with keyboard + touch. Doors work with camera fade. Next: Session 3 — dialog system, NPC interaction, minigame shell with placeholder game.
```

### 2. Update `docs/PHASE_LOG.md`

Add a row to the table:

```
| 2 | YYYY-MM-DD | Overworld + Rooms | ✓ Complete | (note any deviations) | (note any open issues) |
```

In the notes section, add a `### Session 2` block with 2–3 sentences summarizing what was built.

### 3. Commit and push

```bash
git add .
git commit -m "Session 2: overworld with 4 rooms, player movement, touch input"
git push
```

Wait for my OK before committing or pushing.

### 4. Confirm we're done

Tell me: "Session 2 complete. Open `docs/03-SESSION-3-MINIGAME-SHELL.md` when you're ready for Session 3."

## Troubleshooting

**Player walks through walls.**
The `canEnter` check is wrong. Verify it's reading `currentRoom.layout[tileY][tileX]` (note: y first, then x — JS arrays are row-major).

**Player tweens past the destination tile.**
The `isMoving` flag isn't being respected. Confirm `tryMove` returns false when `isMoving` is true.

**Doors send player to wrong room or wrong tile.**
Open `src/data/rooms.js` and double-check the `targetRoom`, `spawnX`, `spawnY` values for the misbehaving door.

**Touch buttons don't respond.**
Phaser game objects need `setInteractive()` to receive pointer events. Also verify the buttons are at a higher depth than the player (depth 100 vs the player's depth 10).

**Camera fade looks wrong (white flash, too fast, etc.).**
`this.cameras.main.fadeOut(300, 0, 0, 0)` then in the camera fadeout-complete event call `scene.restart`. Don't call restart immediately or the fade won't render.

**The room is too small / too big on the canvas.**
Recheck `TILE_SIZE = 16`, `ROOM_WIDTH_TILES = 16`, `ROOM_HEIGHT_TILES = 14`. 16 × 16 = 256, 14 × 16 = 224. Matches our internal resolution.

## What's next

**Session 3 — Dialog + Minigame Shell.** We'll add a Cody NPC to the Main Deck, a typewriter dialog system that runs as a parallel scene, the persistent HUD scene (failure counter + objective), the BaseMinigame class that all real minigames will extend, and one placeholder minigame to verify the full overworld → minigame → overworld loop works end-to-end.

---

**End of Session 2 instructions. Start with Task 1: sanity check the dev server.**
