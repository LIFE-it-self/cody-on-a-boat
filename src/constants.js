// Shared constants for Cody On A Boat. Tile sizes, colors, and tile-type symbols
// live here so other files can import them by name instead of duplicating
// magic numbers. Phaser uses 0xRRGGBB number literals for colors (not strings).

export const TILE_SIZE = 16;

// Internal resolution is 256 x 224. At 16px per tile that's a 16 x 14 grid.
export const ROOM_WIDTH_TILES = 16;
export const ROOM_HEIGHT_TILES = 14;

// Tiles per second the player walks. (Currently informational — Player.js
// uses a fixed 150ms tween per tile. We can wire this up later if we want
// to drive movement speed from the constant instead.)
export const PLAYER_SPEED = 4;

// Placeholder color palette. Real sprites land in Session 8.
export const COLORS = {
  FLOOR: 0x4a3a2a,         // brown wood
  WALL: 0x222222,          // dark gray
  DOOR: 0xc8a050,          // gold-ish
  CAPTAIN: 0x4080ff,       // Captain Chowder John — the advisor NPC's fallback
  CODY: 0x40c040,          // Cody — the PLAYER's fallback (characters swapped 9.9)
  INTERACT_ZONE: 0xffff00, // yellow "!" markers (later)
  BG: 0x0a0e27,            // dark navy background
};

// Numeric symbols used inside room layout arrays in src/data/rooms.js.
export const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
};
