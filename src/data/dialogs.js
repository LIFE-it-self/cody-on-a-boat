// DIALOGS — registry of all dialog content. Each entry is { speaker, lines }.
// DialogScene types out `lines` one at a time and renders `speaker` in gold
// above the text body.
//
// Character setup (post character-swap session): the PLAYER is CODY.
// CAPTAIN CHOWDER JOHN is the stationary advisor on the main deck who
// guides Cody through the ritual. All second-person lines address Cody.

export const DIALOGS = {
  // Names both leads and states the stakes up front: you are CODY, the
  // Captain is your guide, and failure means HURRICANE CODY.
  'captain-intro': {
    speaker: 'Captain Chowder John',
    lines: [
      'Cody. There you are.',
      'You cannot leave this boat. Not yet.',
      'Stay too long and you become HURRICANE CODY.',
      'Florida sinks. Everyone becomes mermaids.',
      'There is a ritual. Pipe. Dinner. Shower. Nap.',
      'In that order. I will guide you.',
    ],
  },
  // Fallback hint if no state-aware captain-next-* entry matches.
  // OverworldScene.tryInteract swaps to a captain-next-* id when
  // registry.talkedToCaptain is true.
  'captain-hint-1': {
    speaker: 'Captain Chowder John',
    lines: [
      'The ritual waits, Cody.',
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
      'But first, the K-fish. The ritual needs the K-fish.',
    ],
  },
  'bar-bartender': {
    speaker: 'Ghost Bartender',
    lines: [
      'Coke first, Cody.',
      'Always Coke first.',
      'The pipe wants its smoke after the howl.',
    ],
  },
  // The horse guards the VYOOSFRUMTHA CRYHOLE (the only fuel the ritual
  // pipe will burn). Its riddle trigger tile sits beside it in the bar.
  'bar-horse': {
    speaker: 'Horse',
    lines: [
      'Neigh.',
      '(The horse eyes you. It guards the VYOOSFRUMTHA CRYHOLE.)',
      '(It will trade for a riddle. Step on the ! when ready.)',
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
      'Count the sheep first. Then the nap.',
      'You must be tired before you can sleep.',
    ],
  },

  // --- Soft-block lines -------------------------------------------------
  // Fired by OverworldScene.startMinigameForLevel when the player steps on
  // a ritual trigger they aren't ready for. No penalty — the ritual just
  // refuses to start. Keyed by the EXPECTED next ritual step (order), by
  // act (act minigame not yet cleared), or by the missing pipe fuel.
  'ritual-blocked-order-1': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'PIPE FIRST, CODY.', 'ALWAYS PIPE FIRST.'],
  },
  'ritual-blocked-order-2': {
    speaker: 'The Ritual',
    lines: ['The ritual resists.', 'You have not eaten.', 'Dinner comes second.'],
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
    lines: ['The pipe will not light.', 'You are thirsty.', 'A Coke first. The bar has them.'],
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
    lines: ['You are wide awake.', 'Count the sheep first.'],
  },
  // The pipe demands its one true fuel — obtained from the horse's riddle.
  'ritual-blocked-cryhole': {
    speaker: 'The Ritual',
    lines: [
      'The pipe refuses common flame.',
      'It burns only VYOOSFRUMTHA CRYHOLE.',
      'The horse at the bar keeps it.',
    ],
  },

  // --- State-aware Captain hints ------------------------------------------
  // OverworldScene.tryInteract picks `captain-next-<levelId>` from
  // Objective.getNextStep() on every chat after captain-intro, so
  // re-talking the Captain always reports the actual next move.
  'captain-next-coke-drink': {
    speaker: 'Captain Chowder John',
    lines: ['First, a Coke.', 'The bar serves them cold.', 'Do not ask why the ritual starts with Coke.'],
  },
  'captain-next-horse-riddle': {
    speaker: 'Captain Chowder John',
    lines: ['The pipe burns only one fuel.', 'VYOOSFRUMTHA CRYHOLE.', 'The horse at the bar keeps it. Answer its riddle.'],
  },
  'captain-next-pipe-smoke': {
    speaker: 'Captain Chowder John',
    lines: ['It is pipe time, Cody.', 'On the deck. Where it always was.', 'Puff steadily.'],
  },
  'captain-next-scuba-dive': {
    speaker: 'Captain Chowder John',
    lines: ['Dinner needs K-fish.', 'The hatch in the galley goes down.', 'Only the gold ones. Obviously.'],
  },
  'captain-next-dinner-service': {
    speaker: 'Captain Chowder John',
    lines: ['The dinner is ready. I can smell it from here.', 'The galley, Cody.', 'Michelin awaits.'],
  },
  'captain-next-motorboat': {
    speaker: 'Captain Chowder John',
    lines: ['The shower is cold until the boat is warm.', 'Take her out. Blow on the dashboard.', 'Trust me.'],
  },
  'captain-next-mermaid-shower': {
    speaker: 'Captain Chowder John',
    lines: ['Shower time.', 'The mermaids are waiting on the bridge.', 'Do not make it weird.'],
  },
  'captain-next-lullaby': {
    speaker: 'Captain Chowder John',
    lines: ['You are not sleepy yet.', 'Count the sheep in the cabin corridor.', 'Every last sheep.'],
  },
  'captain-next-mermaid-nap': {
    speaker: 'Captain Chowder John',
    lines: ['One nap and you are free.', 'The cabin at the end.', 'Sleep well, Cody.'],
  },

  // --- Pre-pipe galley variants -------------------------------------------
  // Spawned instead of galley-mermaid / galley-cook while ritual step 1 is
  // incomplete, so nobody claims you "smell like smoke" before you've smoked.
  'galley-mermaid-early': {
    speaker: 'Galley Mermaid',
    lines: [
      'You do not smell like smoke yet.',
      'The pipe comes before dinner. The Captain knows the order.',
      'But the K-fish... the K-fish wait for no one.',
    ],
  },
  'galley-cook-early': {
    speaker: 'Cooking Mermaid',
    lines: ['No smoke, no supper.', 'Puff the pipe first, Cody.'],
  },
};
