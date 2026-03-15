# Fresh Spread Removal And Import Limit Design

## Summary

Remove the duplicate `Fresh spread` action from the spotlight panel and add a `4MB` client-side limit for JSON imports. Oversized files should be rejected before reading and should surface a red error message.

## Goals

- Remove `Fresh spread` from the spotlight actions.
- Keep `Reshuffle` as the single reshuffle entry point.
- Reject import files larger than `4MB`.
- Show an error message instead of attempting to read or upload oversized files.

## Non-Goals

- No API changes.
- No changes to the import file format.
- No changes to export behavior.
- No changes to the remaining spotlight actions.

## Approved Direction

- Delete the `Fresh spread` button from the spotlight card.
- Keep the deck-level `Reshuffle` button and its current behavior unchanged.
- Check `file.size` at the start of import handling.
- If the selected file is larger than `4 * 1024 * 1024`, stop immediately, clear the file input value, and set error feedback.
- Update the nearby import note to mention the `4MB` limit so the constraint is visible before selection.

## Implementation Boundaries

- Update `components/word-manager.tsx` only.
- Keep `handleReshuffle()` because the deck toolbar still uses it.
- Add a single import size constant near the top-level helpers or component logic.
- Do not read `file.text()` or call `/api/words` for oversized files.
- Reset `fileInputRef.current.value` in the oversized-file branch so the same invalid file can be selected again and still trigger feedback.

## Validation

Implementation is complete when:

1. The spotlight card no longer shows `Fresh spread`.
2. The deck toolbar still shows a working `Reshuffle` button.
3. Selecting a JSON file larger than `4MB` shows an error message and does not trigger import.
4. Selecting a valid JSON file at or below `4MB` still imports normally.
5. Re-selecting the same oversized file triggers the same error flow again.
