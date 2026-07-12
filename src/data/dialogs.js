// DIALOGS — registry of all dialog content. Each entry is { speaker, lines }.
// DialogScene reads `lines` and types them out one at a time. Speaker is
// not currently rendered (added in a later session if needed).

export const DIALOGS = {
  'cody-intro': {
    speaker: 'Cody',
    lines: [
      'Captain. We need to talk.',
      'I cannot leave this boat.',
      'There is a ritual. Pipe. Dinner. Shower. Nap.',
      'Help me. In that order.',
    ],
  },
  // Shown the SECOND time the player talks to Cody after cody-intro.
  // OverworldScene.tryInteract swaps to this id when registry.talkedToCody
  // is true. Pure narrative — no minigame fires from this dialog.
  'cody-hint-1': {
    speaker: 'Cody',
    lines: [
      'I keep thinking about the ritual.',
      'Pipe first. Always pipe first.',
      'You will know when it is time.',
    ],
  },
  // Galley mermaid — hints at the order of operations in the galley:
  // confirm pipe is done, push toward dinner, but mention K-fish first.
  'galley-mermaid': {
    speaker: 'Galley Mermaid',
    lines: [
      'You smell like smoke. Good.',
      'Now eat. The dinner is ready.',
      'But first, the K-fish. Cody needs the K-fish.',
    ],
  },
  'bar-bartender': {
    speaker: 'Ghost Bartender',
    lines: [
      'Coke first, captain. Always Coke first.',
      'The pipe wants its smoke after the howl.',
    ],
  },
  'bridge-parrot': {
    speaker: 'Parrot',
    lines: [
      'BLOW THE BOAT. *squawk* SHOWER.',
      'WET CODY. THEN SLEEPY CODY. *squawk*',
    ],
  },
  'galley-cook': {
    speaker: 'Cooking Mermaid',
    lines: [
      'Smell that pipe smoke? Good.',
      'Now find the K-fish before you eat. They are slippery.',
    ],
  },
  'cabin-ghost': {
    speaker: 'Cabin Ghost',
    lines: [
      'The lullaby first. Then the nap.',
      'Cody must be tired before he can sleep.',
    ],
  },

  // --- Soft-block lines -------------------------------------------------
  // Fired by OverworldScene.startMinigameForLevel when the player steps on
  // a ritual trigger they aren't ready for. No penalty — the ritual just
  // refuses to start. Keyed by the EXPECTED next ritual step (order) or by
  // act (act minigame not yet cleared).
  'ritual-blocked-order-1': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'PIPE FIRST, CAPTAIN.', 'ALWAYS PIPE FIRST.'],
  },
  'ritual-blocked-order-2': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'Cody has not eaten.', 'Dinner comes second.'],
  },
  'ritual-blocked-order-3': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'A dry Cody cannot nap.', 'Shower comes third.'],
  },
  'ritual-blocked-order-4': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'The nap comes last. It always comes last.'],
  },
  'ritual-blocked-minigame-1': {
    speaker: 'The Ritual',
    lines: ['The pipe will not light.', 'Cody is thirsty.', 'Get him a Coke at the bar.'],
  },
  'ritual-blocked-minigame-2': {
    speaker: 'The Ritual',
    lines: ['The galley is out of ingredients.', 'Dive the hatch. Bring back K-fish.'],
  },
  'ritual-blocked-minigame-3': {
    speaker: 'The Ritual',
    lines: ['The water is ice cold.', 'Motorboat the engine warm first.', 'You know what to do.'],
  },
  'ritual-blocked-minigame-4': {
    speaker: 'The Ritual',
    lines: ['Cody is wide awake.', 'Someone must sing the lullaby first.'],
  },

  // --- State-aware Cody hints --------------------------------------------
  // OverworldScene.tryInteract picks `cody-next-<levelId>` from
  // Objective.getNextStep() on every chat after cody-intro, so re-talking
  // Cody always reports the actual next move.
  'cody-next-coke-drink': {
    speaker: 'Cody',
    lines: ['I am so thirsty, captain.', 'One Coke at the bar.', 'Then the ritual begins.'],
  },
  'cody-next-pipe-smoke': {
    speaker: 'Cody',
    lines: ['It is pipe time.', 'On the deck. Where it always was.', 'Pipe first. Always pipe first.'],
  },
  'cody-next-scuba-dive': {
    speaker: 'Cody',
    lines: ['Dinner needs K-fish.', 'The hatch in the galley goes down.', 'Only the gold ones. Obviously.'],
  },
  'cody-next-dinner-service': {
    speaker: 'Cody',
    lines: ['The dinner is ready. I can smell it.', 'The galley, captain.', 'Michelin awaits.'],
  },
  'cody-next-motorboat': {
    speaker: 'Cody',
    lines: ['The shower is cold until the boat is warm.', 'Take her out. Blow on the dashboard.', 'Trust me.'],
  },
  'cody-next-mermaid-shower': {
    speaker: 'Cody',
    lines: ['Shower time.', 'The mermaids are waiting on the bridge.', 'Do not make it weird.'],
  },
  'cody-next-lullaby': {
    speaker: 'Cody',
    lines: ['I am not sleepy yet.', 'The mermaids know a song.', 'Cabin corridor. Follow the humming.'],
  },
  'cody-next-mermaid-nap': {
    speaker: 'Cody',
    lines: ['One nap and I am free.', 'The cabin at the end.', 'Keep it QUIET in there.'],
  },

  // --- Pre-pipe galley variants -------------------------------------------
  // Spawned instead of galley-mermaid / galley-cook while ritual step 1 is
  // incomplete, so nobody claims you "smell like smoke" before you've smoked.
  'galley-mermaid-early': {
    speaker: 'Galley Mermaid',
    lines: [
      'You do not smell like smoke yet.',
      'The pipe comes before dinner. Cody knows the order.',
      'But the K-fish... the K-fish wait for no one.',
    ],
  },
  'galley-cook-early': {
    speaker: 'Cooking Mermaid',
    lines: ['No smoke, no supper.', 'Puff the pipe first, captain.'],
  },
};
