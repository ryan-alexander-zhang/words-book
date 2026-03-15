# Focus Pin, Pronounce, and Reference Shelf Design

## Summary

Refine the workspace so card focus is represented by a single pinned word instead of a multi-select delete state. Slim the pronunciation area around the existing YouGlish embed and strengthen the reference shelf with a direct YouGlish jump link.

## Goals

- Replace `Pick/Picked` with a single visual pin that marks the current focus word.
- Remove bulk delete and all multi-select messaging from the interface.
- Make the pronunciation module feel lighter and more playback-focused.
- Add a YouGlish link to the reference shelf that follows the active word and accent.

## Non-Goals

- No API changes.
- No schema changes.
- No sign-in or settings changes.
- No replacement of the existing YouGlish embed with another provider.

## Approved Direction

- Use `activeWordId` as the sole focus model.
- Clicking a card makes it the only pinned card.
- Remove `Delete selected` and all selected-state copy.
- Keep Reference shelf above Pronounce.
- Keep accent switching in the local UI.
- Trim the YouGlish widget to a smaller component set instead of showing extra chrome.

## Validation

Implementation is complete when:

1. Only one card can show the pin at a time.
2. No `Pick/Picked` language remains in the workspace.
3. The right rail keeps Reference shelf above Pronounce.
4. The reference shelf includes a working YouGlish link for the active word.
5. The pronunciation area is visibly smaller and less text-heavy than before.
