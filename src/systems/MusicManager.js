// MusicManager — thin helper for per-scene BGM switching.
// Tracks the currently playing track via game.registry so scenes that share
// the same track (e.g. MainMenu → OverworldScene both use bgm-overworld)
// don't restart it on every scene transition.
//
// Usage:
//   import { playMusic, stopMusic } from '../systems/MusicManager.js';
//   playMusic(this, 'bgm-overworld');   // in scene.create()
//   stopMusic(this);                     // when you need silence

// Pending-unlock state. While scene.sound.locked, playMusic queues at most ONE
// track here instead of stacking anonymous 'unlocked' listeners — otherwise
// MainMenu and Overworld both queueing bgm-overworld before the first tap
// resolves starts two overlapping loops, and the first one leaks untracked.
let pendingKey = null;
let pendingHandler = null;

export function playMusic(scene, key, volume = 0.4) {
  const game = scene.game || scene.sys.game;
  const currentKey = game.registry.get('currentMusicKey');

  // Same track already playing — do nothing.
  if (currentKey === key) {
    const existing = game.registry.get('currentMusicInstance');
    if (existing && existing.isPlaying) return;
  }

  // Same track already queued behind the autoplay lock — do nothing.
  if (scene.sound.locked && pendingKey === key) return;

  // Stop whatever is playing now.
  stopMusic(scene);

  // If the audio key was never loaded (asset missing), bail silently.
  if (!scene.cache.audio.exists(key)) {
    console.warn('[MusicManager] Audio key not loaded:', key);
    return;
  }

  // Handle browser autoplay lock: defer until the first user interaction.
  // scene.sound is the game-wide sound manager, so the listener survives the
  // originating scene; a newer queued track replaces an older pending one.
  if (scene.sound.locked) {
    if (pendingHandler) scene.sound.off('unlocked', pendingHandler);
    pendingKey = key;
    pendingHandler = () => {
      const queuedKey = pendingKey;
      pendingKey = null;
      pendingHandler = null;
      const cur = game.registry.get('currentMusicKey');
      const inst = game.registry.get('currentMusicInstance');
      if (cur === queuedKey && inst && inst.isPlaying) return;
      _startTrack(scene, queuedKey, volume);
    };
    scene.sound.once('unlocked', pendingHandler);
  } else {
    _startTrack(scene, key, volume);
  }
}

function _startTrack(scene, key, volume) {
  const music = scene.sound.add(key, { loop: true, volume });
  music.play();
  const game = scene.game || scene.sys.game;
  game.registry.set('currentMusicKey', key);
  game.registry.set('currentMusicInstance', music);
}

export function stopMusic(scene) {
  const game = scene.game || scene.sys.game;
  // Cancel any track still queued behind the autoplay lock.
  if (pendingHandler) {
    scene.sound.off('unlocked', pendingHandler);
    pendingHandler = null;
    pendingKey = null;
  }
  const instance = game.registry.get('currentMusicInstance');
  if (instance) {
    if (instance.isPlaying) instance.stop();
    instance.destroy();
  }
  game.registry.set('currentMusicKey', null);
  game.registry.set('currentMusicInstance', null);
}
