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
  // Stored so the keep-alive watchdog can rebuild the track at the right
  // volume if it ever dies silently.
  game.registry.set('currentMusicVolume', volume);
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

// ─── Keep-alive ─────────────────────────────────────────────────────────
// "Eventually the music stops playing" has two independent causes:
//   1. Mobile Safari suspends/interrupts the WebAudio context on screen
//      lock, phone calls, or app switches — and does not reliably resume
//      it, which silently kills ALL audio until the page reloads.
//   2. Phaser pauses sounds on window blur and resumes them on focus, but
//      the focus event can be missed (again mostly iOS), leaving the track
//      paused forever while the game is visible.
// registerMusicKeepAlive() — called once from index.js — resumes the audio
// context on any user gesture or visibility gain, and runs a light 4s
// watchdog that un-sticks a wrongly-paused track or rebuilds one that died
// outright. Net effect: the BGM always keeps looping.
let keepAliveRegistered = false;

export function registerMusicKeepAlive(game) {
  // Guards double-registration within one module instance. (Edits to this
  // file trigger a full page reload in this project — no HMR boundary — so
  // the interval/listeners can't stack in practice.)
  if (keepAliveRegistered) return;
  keepAliveRegistered = true;

  const resumeContext = () => {
    const ctx = game.sound && game.sound.context;
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }
  };

  // iOS SILENT-SWITCH FIX ("the music is not playing on my iPhone"):
  // Safari mutes ALL WebAudio output while the phone is in silent/Ring-off
  // mode. Playing any HTML5 <audio> element — even a silent one — flips
  // Safari's audio session to "playback" mode, which ignores the silent
  // switch. So on the first user gesture we start a tiny looping silent
  // wav via an <audio> tag; from then on the game's WebAudio is audible
  // regardless of the switch. (The standard "unmute" technique used by
  // web games; a no-op on every other platform.)
  const SILENT_WAV =
    'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  let unmuteEl = null;
  const ensureUnmute = () => {
    if (unmuteEl) return;
    try {
      unmuteEl = document.createElement('audio');
      unmuteEl.setAttribute('playsinline', '');
      unmuteEl.setAttribute('preload', 'auto');
      unmuteEl.src = SILENT_WAV;
      unmuteEl.loop = true;
      const p = unmuteEl.play();
      if (p && p.catch) p.catch(() => { unmuteEl = null; });
    } catch {
      unmuteEl = null;
    }
  };

  // Any tap/click is a valid user gesture to revive a suspended context
  // and to arm the silent-switch workaround.
  document.addEventListener('pointerdown', () => {
    ensureUnmute();
    resumeContext();
  }, true);
  window.addEventListener('focus', resumeContext);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeContext();
  });

  setInterval(() => {
    if (document.hidden) return; // hidden tab: let pause-on-blur do its job
    resumeContext();
    const key = game.registry.get('currentMusicKey');
    const inst = game.registry.get('currentMusicInstance');
    if (!key || !inst) return;
    if (inst.isPlaying) return;
    // Visible but not playing. The only pause source is Phaser's
    // pause-on-blur; while the game is VISIBLE we deliberately override it
    // (music resumes even if the window itself lost focus) — "the music
    // must always keep looping" wins. A hidden tab still stays quiet via
    // the document.hidden gate above.
    if (inst.isPaused) {
      inst.resume();
      return;
    }
    // Neither playing nor paused: the track died. Tear the corpse down so
    // instances can't accumulate (or ever overlap), then rebuild it.
    const volume = game.registry.get('currentMusicVolume') || 0.4;
    if (inst.stop) inst.stop();
    if (inst.destroy) inst.destroy();
    const music = game.sound.add(key, { loop: true, volume });
    music.play();
    game.registry.set('currentMusicInstance', music);
  }, 4000);
}
