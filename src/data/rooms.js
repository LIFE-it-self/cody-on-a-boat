// Boat overworld room definitions for Session 2.
//
// Each room is a 14-row by 16-column grid (matches the 256x224 internal
// resolution at 16px per tile).
//
//   layout[y][x]   y = row (0 = top), x = column (0 = left)
//   0 = floor      walkable
//   1 = wall       blocks the player
//   2 = door       walkable; OverworldScene fades the camera and switches
//                  scenes when the player lands on this tile
//
// `doors` lists every door tile in the layout along with the target room
// and the (tile) coordinates the player should spawn at in that target.
// `playerSpawn` is only used the very first time you enter a room from the
// main menu (door traversal supplies its own spawn coords).
// `triggers` lists tiles that launch a minigame when the player steps onto
// them. Each trigger is { x, y, levelId } and is matched against LEVELS in
// src/data/levels.js. Once a level is in `completedMinigames` the trigger
// becomes dormant and OverworldScene skips its `!` marker.
//
// Door graph:
//
//                  [BRIDGE]
//                     |
//                     | top door of MAIN-DECK
//                     |
//                  [MAIN-DECK] --- right door of MAIN-DECK --- [CABIN-CORRIDOR]
//                     |
//                     | bottom door of MAIN-DECK
//                     |
//                  [BAR] ----- right door of BAR ----- [GALLEY]
//

export const ROOMS = {
  // ─────────────────────────────────────────────────────────────────────
  // MAIN DECK — biggest room, two doors (bottom -> bar, top -> bridge)
  // ─────────────────────────────────────────────────────────────────────
  'main-deck': {
    id: 'main-deck',
    displayName: 'Main Deck',
    // 14 rows x 16 cols. Door at (8,  0)  top-center   -> bridge.
    //                    Door at (8,  13) bottom-center -> bar.
    //                    Door at (15, 7)  right-center  -> cabin-corridor.
    layout: [
      [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1], // row  0  (top wall, door col 8)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  2
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  3
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  6
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2], // row  7  (default spawn row, door col 15 -> cabin-corridor)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 12
      [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1], // row 13 (bottom wall, door col 8)
    ],
    doors: [
      // top door -> bridge. Player spawns just above bridge's bottom door.
      { x: 8,  y: 0,  targetRoom: 'bridge',         spawnX: 8, spawnY: 12 },
      // bottom door -> bar. Player spawns just below bar's top door.
      { x: 8,  y: 13, targetRoom: 'bar',            spawnX: 8, spawnY: 1  },
      // right door -> cabin-corridor. Spawn at floor tile (1,7), not (0,7).
      { x: 15, y: 7,  targetRoom: 'cabin-corridor', spawnX: 1, spawnY: 7  },
    ],
    triggers: [
      // Pipe-smoke ritual step. Quiet corner of the deck, away from Cody
      // (8,6), the doors (8,0)/(8,13), and the default spawn (8,7).
      { x: 4, y: 10, levelId: 'pipe-smoke' },
    ],
    playerSpawn: { x: 8, y: 7 },
  },

  // ─────────────────────────────────────────────────────────────────────
  // BAR — door at top back to main deck, door at right to galley
  // ─────────────────────────────────────────────────────────────────────
  'bar': {
    id: 'bar',
    displayName: 'Bar',
    // Door at (8, 0)  top-center  -> main-deck.
    // Door at (15, 7) right-center -> galley.
    layout: [
      [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1], // row  0  (top wall, door col 8)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  2
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  3
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  6
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2], // row  7  (door col 15 -> galley)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 12
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 13
    ],
    doors: [
      { x: 8,  y: 0, targetRoom: 'main-deck', spawnX: 8, spawnY: 12 },
      { x: 15, y: 7, targetRoom: 'galley',    spawnX: 1, spawnY: 7  },
    ],
    triggers: [
      // Coke-drink minigame. Right side of the bar, away from doors and
      // the default spawn at (8,7). Returns the player to (12,3).
      { x: 12, y: 4, levelId: 'coke-drink' },
      // The horse's riddle. Beside the horse NPC at (12,9); winning grants
      // the VYOOSFRUMTHA CRYHOLE the pipe ritual requires. Returns the
      // player to (11,8).
      { x: 11, y: 9, levelId: 'horse-riddle' },
    ],
    playerSpawn: { x: 8, y: 7 },
  },

  // ─────────────────────────────────────────────────────────────────────
  // GALLEY — single door at left back to bar
  // ─────────────────────────────────────────────────────────────────────
  'galley': {
    id: 'galley',
    displayName: 'Galley',
    // Door at (0, 7) left-center -> bar.
    layout: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row  0
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  2
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  3
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  6
      [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  7  (door col 0 -> bar)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 12
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 13
    ],
    doors: [
      { x: 0, y: 7, targetRoom: 'bar', spawnX: 14, spawnY: 7 },
    ],
    triggers: [
      // Scuba-dive (non-ritual) on the left half. Walkable, away from the
      // door (0,7), the default spawn (8,7), and the mermaid at (8,10).
      // Return spawn lands the player at (4,3).
      { x: 4,  y: 4, levelId: 'scuba-dive' },
      // Dinner-service (ritual step 2) on the right half. Same constraints.
      // Return spawn lands the player at (12,3).
      { x: 12, y: 4, levelId: 'dinner-service' },
    ],
    playerSpawn: { x: 8, y: 7 },
  },

  // ─────────────────────────────────────────────────────────────────────
  // BRIDGE — single door at bottom back to main deck
  // ─────────────────────────────────────────────────────────────────────
  'bridge': {
    id: 'bridge',
    displayName: 'Bridge',
    // Door at (8, 13) bottom-center -> main-deck.
    layout: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row  0
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  2
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  3
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  6
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  7
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 12
      [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1], // row 13 (door col 8 -> main-deck)
    ],
    doors: [
      { x: 8, y: 13, targetRoom: 'main-deck', spawnX: 8, spawnY: 1 },
    ],
    triggers: [
      // Motorboat (non-ritual) on the left half. Walkable, away from the
      // door (8,13) and the default spawn (8,7). Return spawn lands at (4,3).
      { x: 4,  y: 4, levelId: 'motorboat' },
      // Mermaid-shower (ritual step 3) on the right half. Same constraints.
      // Return spawn lands at (12,3). Mirrors the galley two-triggers pattern.
      { x: 12, y: 4, levelId: 'mermaid-shower' },
    ],
    playerSpawn: { x: 8, y: 7 },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CABIN CORRIDOR — 5th room, added in Session 7 to host Act 4. Single
  // door on the left back to the main deck. Topology is identical to
  // Galley (left door at row 7, two triggers on row 4).
  // ─────────────────────────────────────────────────────────────────────
  'cabin-corridor': {
    id: 'cabin-corridor',
    displayName: 'Cabin Corridor',
    // Door at (0, 7) left-center -> main-deck.
    layout: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row  0
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  2
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  3
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  6
      [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  7  (door col 0 -> main-deck)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row  9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 12
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 13
    ],
    doors: [
      // left door -> main-deck. Spawn at floor tile (14,7), not (15,7).
      { x: 0, y: 7, targetRoom: 'main-deck', spawnX: 14, spawnY: 7 },
    ],
    triggers: [
      // Lullaby (non-ritual) on the left half. Walkable, away from the
      // door (0,7) and the default spawn (8,7). Return spawn lands at (4,3).
      { x: 4,  y: 4, levelId: 'lullaby' },
      // Mermaid-nap (ritual step 4 — FINAL). Right half. Same constraints.
      // Winning this emits 'victory' -> CutsceneRouter -> CutsceneScene.
      { x: 12, y: 4, levelId: 'mermaid-nap' },
    ],
    playerSpawn: { x: 8, y: 7 },
  },
};
