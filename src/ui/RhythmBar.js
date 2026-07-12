// RhythmBar — reusable note-and-hit-zone UI for rhythm minigames.
//
// Not a Phaser scene. A plain JS class that adds graphics into an existing
// scene and exposes start() / hit() / addNote() / destroy().
//
// Notes travel right-to-left over a fixed travelMs and the player has a
// ±HIT_WINDOW_MS window around the moment a note crosses the hit zone.
// Used by CokeDrinkGame in Session 4 and reused by LullabyGame in Session 7.

const HIT_WINDOW_MS = 150;
const NOTE_TRAVEL_MS = 1500;

export class RhythmBar {
  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Geometry. The hit zone sits a few pixels in from the left edge so the
    // note is visually on top of the zone (not slammed against the wall).
    this.hitZoneX = x + 8;
    this.rightEdgeX = x + width - 4;
    this.barSpan = this.rightEdgeX - this.hitZoneX;
    this.centerY = y + height / 2;

    // Visuals: dark gray background, translucent green hit window, then a
    // thin bright green vertical bar marking the exact target.
    this.bg = scene.add.rectangle(x + width / 2, this.centerY, width, height, 0x222222)
      .setStrokeStyle(1, 0x444444)
      .setDepth(4);

    // Hit window cue: the pixel width matches how much travel happens
    // during HIT_WINDOW_MS. Notes approach from the right and stop AT the
    // hit zone, so the cue extends right of the zone (the approach side)
    // instead of straddling it and clipping off the bar's left edge.
    const windowPixels = (HIT_WINDOW_MS / NOTE_TRAVEL_MS) * this.barSpan;
    this.hitWindow = scene.add.rectangle(
      this.hitZoneX + windowPixels / 2, this.centerY,
      windowPixels, height - 2, 0x40c040, 0.2
    ).setDepth(5);

    this.hitZone = scene.add.rectangle(this.hitZoneX, this.centerY, 4, height - 2, 0x40c040)
      .setDepth(6);

    this.notes = [];
    this.startTime = null;
    this._scheduled = []; // delayedCall handles for cleanup
  }

  // Schedule a note to arrive at the hit zone tMs after start() is called.
  // The lane parameter is reserved for future multi-lane variants — single
  // lane is enough for Session 4's werewolf rhythm.
  addNote(tMs, lane = 0) {
    this.notes.push({ tMs, lane, rect: null, hit: false, missed: false });
  }

  // Begin playback. Spawns each note via tween at the right offset so it
  // crosses the hit zone exactly tMs later. If tMs < travelMs, the note
  // spawns immediately partway across the bar (covered by the partial-
  // travel branch below) so the timing still lands correctly.
  start() {
    this.startTime = this.scene.time.now;

    this.notes.forEach((n) => {
      const spawnOffsetMs = n.tMs - NOTE_TRAVEL_MS;

      if (spawnOffsetMs >= 0) {
        // Full travel.
        const handle = this.scene.time.delayedCall(spawnOffsetMs, () => {
          this._spawnAndTween(n, this.rightEdgeX, NOTE_TRAVEL_MS);
        });
        this._scheduled.push(handle);
      } else {
        // Partial travel: note has effectively been "in flight" for
        // (-spawnOffsetMs) ms already. Drop it in mid-bar and let it
        // finish the remaining tMs ms of travel.
        const fraction = (-spawnOffsetMs) / NOTE_TRAVEL_MS;
        const startX = this.rightEdgeX - fraction * this.barSpan;
        this._spawnAndTween(n, startX, n.tMs);
      }

      // Post-window cleanup: if the note wasn't tapped within the hit
      // window after it crossed the hit zone, mark it dark red.
      const handle = this.scene.time.delayedCall(n.tMs + HIT_WINDOW_MS, () => {
        if (!n.hit && !n.missed && n.rect && n.rect.active) {
          n.missed = true;
          n.rect.setFillStyle(0x660000);
        }
      });
      this._scheduled.push(handle);
    });
  }

  // Player tapped. Returns true if a pending note was inside the hit window
  // (and consumes that note). Returns false otherwise — the caller decides
  // what a wrong-timing tap looks like.
  hit() {
    if (this.startTime == null) return false;
    const now = this.scene.time.now;

    for (const n of this.notes) {
      if (n.hit || n.missed) continue;
      const expectedHitTime = this.startTime + n.tMs;
      if (Math.abs(now - expectedHitTime) <= HIT_WINDOW_MS) {
        n.hit = true;
        if (n.rect && n.rect.active) {
          n.rect.setFillStyle(0xffffff);
          this.scene.time.delayedCall(100, () => {
            if (n.rect && n.rect.active) n.rect.setFillStyle(0x88ff88);
          });
        }
        return true;
      }
    }
    return false;
  }

  destroy() {
    this._scheduled.forEach((h) => h && h.remove && h.remove(false));
    this._scheduled = [];
    this.notes.forEach((n) => {
      if (n.rect && n.rect.active) n.rect.destroy();
    });
    this.notes = [];
    if (this.bg) this.bg.destroy();
    if (this.hitWindow) this.hitWindow.destroy();
    if (this.hitZone) this.hitZone.destroy();
  }

  _spawnAndTween(n, fromX, durationMs) {
    n.rect = this.scene.add.rectangle(fromX, this.centerY, 8, 8, 0xff0000).setDepth(7);
    this.scene.tweens.add({
      targets: n.rect,
      x: this.hitZoneX,
      duration: durationMs,
      ease: 'Linear',
    });
  }
}
